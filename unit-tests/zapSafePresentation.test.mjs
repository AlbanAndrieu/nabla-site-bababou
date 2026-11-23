import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { renderSafeZapSarif } from "../scripts/security/render-zap-safe-report.mjs";
import { minimizeZapProducerReport } from "../scripts/security/zap-safe-report.mjs";

const script = fileURLToPath(new URL("../scripts/security/render-zap-safe-report.mjs", import.meta.url));
function safeSarif() {
  return minimizeZapProducerReport({
    site: [{ "@name": "https://www.bababou.com", alerts: [
      { pluginid: "10020", riskcode: "3", alert: "PRIVATE", instances: [{ uri: "https://private.example/" }] },
      { pluginid: "10038", riskcode: "2", alert: "CONFIDENTIAL" },
    ] }],
  });
}

test("ZAP HTML reflects safe HIGH and MEDIUM IDs, not URLs or free-form messages", () => {
  const report = renderSafeZapSarif(safeSarif());
  assert.equal(report.high, 1);
  assert.equal(report.medium, 1);
  assert.match(report.html, /10020/);
  assert.match(report.html, /10038/);
  assert.match(report.summary, /MEDIUM : \*\*1\*\*/);
  assert.doesNotMatch(report.html + report.summary, /PRIVATE|CONFIDENTIAL|private\.example|instances|Authorization/);
});

test("ZAP presentation rejects SARIF with unexpected URLs, messages and HTTP evidence", () => {
  const report = safeSarif();
  for (const alteration of [
    s => { s.runs[0].results[0].locations = [{ physicalLocation: { artifactLocation: { uri: "PRIVATE" } } }]; },
    s => { s.runs[0].results[0].message.text = "Private email@example.org"; },
    s => { s.runs[0].tool.driver.rules[0].shortDescription.text = "PRIVATE"; },
    s => { s.runs[0].tool.driver.metadata = { secret: "PRIVATE" }; },
    s => { s.runs.push(s.runs[0]); },
  ]) {
    const tampered = structuredClone(report);
    alteration(tampered);
    assert.throws(() => renderSafeZapSarif(tampered));
  }
});

test("ZAP CLI produces owner-only HTML and summary, with exclusive artifact writes", () => {
  const dir = mkdtempSync(join(tmpdir(), "zap-safe-html-"));
  try {
    const sarif = join(dir, "safe.sarif"), html = join(dir, "safe.html"), summary = join(dir, "summary.md");
    writeFileSync(sarif, JSON.stringify(safeSarif()), { mode: 0o600 });
    const run = spawnSync(process.execPath, [script, sarif, html, summary], { encoding: "utf8" });
    assert.equal(run.status, 0);
    assert.equal(statSync(html).mode & 0o777, 0o600);
    assert.equal(statSync(summary).mode & 0o777, 0o600);
    assert.match(readFileSync(html, "utf8"), /Bababou/);
    assert.equal(spawnSync(process.execPath, [script, sarif, html, summary]).status, 1);
    assert.doesNotMatch(run.stdout + run.stderr, /PRIVATE/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
