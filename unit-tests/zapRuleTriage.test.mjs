import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { summarizeZapRuleReferences } from "../scripts/security/zap-rule-triage.mjs";

const script = fileURLToPath(new URL("../scripts/security/zap-rule-triage.mjs", import.meta.url));

function example() {
  return {
    site: [{
      "@name": "https://www.bababou.com",
      alerts: [
        { pluginid: "10055", alertRef: "10055-13", riskcode: "2",
          alert: "PRIVATE FAMILY CONTENT",
          instances: [{ uri: "https://www.bababou.com/secret/private-person?token=SECRET" }] },
        { pluginid: "10055", alertRef: "10055-13", riskcode: 2,
          instances: [{ uri: "https://www.bababou.com/private" }] },
        { pluginid: "10055", alertRef: "10055-4", riskcode: "2",
          instances: [{ responseHeader: "Authorization: Bearer SECRET" }] },
        { pluginid: "90003", alertRef: "ALERT WITH PERSONAL DATA", riskcode: "2",
          instances: [{ uri: "https://external.example/PRIVATE" }] },
        { pluginid: "10038", riskcode: "1",
          instances: [{ uri: "https://private.example/" }] },
      ],
    }],
  };
}

test("ZAP triage retains CSP subalert codes and aggregate counts only", () => {
  const output = summarizeZapRuleReferences(example());
  assert.match(output, /\| 10055 \| 10055-13 \| 2 \| 2 \|/);
  assert.match(output, /\| 10055 \| 10055-4 \| 1 \| 1 \|/);
  assert.match(output, /\| 90003 \| unspecified \| 1 \| 1 \|/);
  assert.doesNotMatch(output, /10038|PRIVATE|SECRET|private-person|https:\/\/|responseHeader|\.example|token=/);
});

test("ZAP triage refuses noncanonical hosts, malformed reports and invalid rule IDs", () => {
  const wrongOrigin = example(); wrongOrigin.site[0]["@name"] = "https://attacker.invalid/";
  assert.throws(() => summarizeZapRuleReferences(wrongOrigin), /ZAP_TRIAGE_INVALID_ORIGIN/);
  const credentials = example(); credentials.site[0]["@name"] = "https://username@www.bababou.com/";
  assert.throws(() => summarizeZapRuleReferences(credentials), /ZAP_TRIAGE_INVALID_ORIGIN/);
  const invalid = example(); invalid.site[0].alerts[0].pluginid = "10055<script>";
  assert.throws(() => summarizeZapRuleReferences(invalid), /ZAP_TRIAGE_INVALID_RULE_ID/);
  assert.throws(() => summarizeZapRuleReferences({ site: [] }), /ZAP_TRIAGE_INVALID_INPUT/);
});

test("ZAP triage CLI never prints untrusted HTTP evidence and enforces input budget", () => {
  const dir = mkdtempSync(join(tmpdir(), "zap-triage-"));
  try {
    const input = join(dir, "raw.json");
    writeFileSync(input, JSON.stringify(example()), { mode: 0o600 });
    const pass = spawnSync(process.execPath, [script, input], { encoding: "utf8" });
    assert.equal(pass.status, 0, pass.stderr);
    assert.match(pass.stdout, /10055-13/);
    assert.doesNotMatch(pass.stdout + pass.stderr, /SECRET|PRIVATE|private-person|token=/);
    writeFileSync(input, "{ malformed and PRIVATE", { mode: 0o600 });
    const fail = spawnSync(process.execPath, [script, input], { encoding: "utf8" });
    assert.equal(fail.status, 1);
    assert.doesNotMatch(fail.stdout + fail.stderr, /PRIVATE/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
