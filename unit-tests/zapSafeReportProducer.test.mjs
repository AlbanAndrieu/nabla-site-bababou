import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  minimizeZapProducerReport,
  validateZapProducerInput,
} from "../scripts/security/zap-safe-report.mjs";

const script = new URL("../scripts/security/zap-safe-report.mjs", import.meta.url);
function sample(origin = "https://www.bababou.com") {
  return { site: [{
    "@name": origin,
    alerts: [
      { riskcode: "3", pluginid: "10020", alert: "PRIVATE SECRET",
        instances: [{ uri: "https://private.example/secret?token=PRIVATE" }] },
      { riskcode: "2", pluginid: "10038", evidence: "email private@example.org" },
      { riskcode: "1", pluginid: "10002", alert: "not uploaded" },
    ],
  }] };
}

test("ZAP producer retains MEDIUM and HIGH rule IDs without PII or raw HTTP", () => {
  const result = minimizeZapProducerReport(sample());
  assert.deepEqual(result.runs[0].results.map((r) => [r.ruleId, r.level]), [
    ["10020", "error"], ["10038", "warning"],
  ]);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|token=|instances|email|private\.example/);
});

test("ZAP producer rejects unexpected hosts, insecure scheme, credentials, paths and query strings", () => {
  for (const origin of [
    "https://private.example",
    "http://www.bababou.com",
    "https://user:pass@www.bababou.com",
    "https://www.bababou.com/private",
    "https://www.bababou.com/?token=secret",
    "https://www.bababou.com:8443/",
    "https://www.bababou.com.evil.example/",
  ]) {
    assert.throws(() => validateZapProducerInput(sample(origin)), /ZAP site/);
  }
  for (const origin of ["https://www.bababou.com", "https://bababou.com", "https://bababou.albandrieu.com"]) {
    assert.doesNotThrow(() => validateZapProducerInput(sample(origin)));
  }
});

test("invalid structures and unsafe medium/high finding identifiers fail closed", () => {
  for (const raw of [
    {}, { site: [] }, { site: "invalid" },
    { site: [{ "@name": "https://www.bababou.com", alerts: {} }] },
    { site: [{ "@name": "https://www.bababou.com", alerts: [{ riskcode: 3, pluginid: "10020<SECRET>" }] }] },
    { site: [{ "@name": "https://www.bababou.com", alerts: [null] }] },
    { site: Array.from({ length: 21 }, () => ({ "@name": "https://www.bababou.com", alerts: [] })) },
  ]) {
    assert.throws(() => validateZapProducerInput(raw));
  }
});

test("producer writes an exclusive owner-only artifact without printing sensitive findings", () => {
  const dir = mkdtempSync(join(tmpdir(), "zapsafe-"));
  try {
    const input = join(dir, "raw.json"), output = join(dir, "safe.sarif");
    writeFileSync(input, JSON.stringify(sample()), { mode: 0o600 });
    const run = spawnSync(process.execPath, [script.pathname, input, output], { encoding: "utf8" });
    assert.equal(run.status, 0);
    assert.match(run.stdout, /Minimized ZAP findings: 2/);
    assert.doesNotMatch(run.stdout + run.stderr, /PRIVATE|private\.example/);
    assert.equal(statSync(output).mode & 0o777, 0o600);
    const result = JSON.parse(readFileSync(output, "utf8"));
    assert.equal(result.runs[0].results.length, 2);
    const again = spawnSync(process.execPath, [script.pathname, input, output], { encoding: "utf8" });
    assert.equal(again.status, 1);
    assert.doesNotMatch(again.stderr, /EEXIST|private|token=/);
    assert.deepEqual(JSON.parse(readFileSync(output, "utf8")), result);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});

test("ZAP oversized input and rejected targets do not create a public artifact", () => {
  const dir = mkdtempSync(join(tmpdir(), "zapsafe-invalid-"));
  try {
    const input = join(dir, "raw.json"), output = join(dir, "safe.sarif");
    writeFileSync(input, JSON.stringify(sample("https://private.example/secret?token=PRIVATE")));
    const rejected = spawnSync(process.execPath, [script.pathname, input, output], { encoding: "utf8" });
    assert.equal(rejected.status, 1);
    assert.doesNotMatch(rejected.stderr, /private\.example|PRIVATE/);
    writeFileSync(input, "x".repeat(8_000_001));
    const oversized = spawnSync(process.execPath, [script.pathname, input, output], { encoding: "utf8" });
    assert.equal(oversized.status, 1);
    assert.doesNotMatch(oversized.stderr, /x{20}/);
    assert.throws(() => statSync(output), /ENOENT/);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
