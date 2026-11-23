import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { sanitizeNucleiJsonl } from "../scripts/security/nuclei-safe-report.mjs";

const script = fileURLToPath(new URL("../scripts/security/nuclei-safe-report.mjs", import.meta.url));
function finding(severity = "high", url = "https://www.bababou.com/sensitive?token=PRIVATE") {
  return {
    "template-id": "exposure-123",
    type: "http",
    info: { severity, name: "PRIVATE john@example.com" },
    "matched-at": url,
    request: "Authorization: Bearer PRIVATE",
    response: "Cookie: PRIVATE",
  };
}

test("Nuclei producer preserves Bababou medium/high/critical IDs, never findings or HTTP evidence", () => {
  const report = sanitizeNucleiJsonl(["medium", "high", "critical"].map(s => JSON.stringify(finding(s))).join("\n"));
  assert.deepEqual(report.runs[0].results.map(r => r.level), ["warning", "error", "error"]);
  assert.ok(report.runs[0].results.every(r => r.ruleId === "exposure-123" && r.message.text === "Nuclei template exposure-123"));
  assert.doesNotMatch(JSON.stringify(report), /PRIVATE|Authorization|Cookie|john@|sensitive|matched-at|request|response/);
  assert.equal(sanitizeNucleiJsonl("").runs[0].results.length, 0);
});

test("Nuclei producer fails closed on out-of-scope hosts, schemes, credentials, ports and template IDs", () => {
  for (const url of [
    "http://www.bababou.com/", "https://evil.example/", "https://www.bababou.com.evil.example/",
    "https://user:secret@www.bababou.com/", "https://www.bababou.com:8443/",
  ]) assert.throws(() => sanitizeNucleiJsonl(JSON.stringify(finding("high", url))));
  assert.throws(() => sanitizeNucleiJsonl(JSON.stringify({ ...finding(), type: "dns" })));
  assert.throws(() => sanitizeNucleiJsonl(JSON.stringify({ ...finding(), "template-id": "private/secret" })));
  assert.throws(() => sanitizeNucleiJsonl(JSON.stringify({ ...finding(), info: { severity: "high" }, "matched-at": null })));
});

test("Nuclei CLI writes 0600 SARIF exclusively and never echoes raw evidence", () => {
  const dir = mkdtempSync(join(tmpdir(), "nuclei-bababou-"));
  try {
    const input = join(dir, "raw.jsonl"), output = join(dir, "safe.sarif");
    writeFileSync(input, JSON.stringify(finding()), { mode: 0o600 });
    const run = spawnSync(process.execPath, [script, input, output], { encoding: "utf8" });
    assert.equal(run.status, 0);
    assert.equal(statSync(output).mode & 0o777, 0o600);
    assert.equal(JSON.parse(readFileSync(output, "utf8")).runs[0].results.length, 1);
    assert.doesNotMatch(run.stdout + run.stderr, /PRIVATE|john@/);
    assert.equal(spawnSync(process.execPath, [script, input, output]).status, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("Nuclei rejected or oversized input never creates an artifact", () => {
  const dir = mkdtempSync(join(tmpdir(), "nuclei-invalid-"));
  try {
    const input = join(dir, "raw.jsonl"), output = join(dir, "safe.sarif");
    writeFileSync(input, JSON.stringify(finding("high", "https://internal.example/?token=PRIVATE")));
    const rejected = spawnSync(process.execPath, [script, input, output], { encoding: "utf8" });
    assert.equal(rejected.status, 1);
    assert.doesNotMatch(rejected.stderr, /internal\.example|PRIVATE/);
    writeFileSync(input, "X".repeat(8_000_001));
    assert.equal(spawnSync(process.execPath, [script, input, output]).status, 1);
    assert.throws(() => statSync(output), /ENOENT/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
