import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseMasterRun,
  sanitizeNuclei,
  sanitizeTrivy,
  sanitizeZap,
} from "../scripts/security/defectdojo-pull-master.mjs";

const timestamp = Date.parse("2026-10-19T18:00:00Z");
const headSha = "a".repeat(40);
const ok = {
  databaseId: 123,
  headBranch: "master",
  headSha,
  createdAt: "2026-10-19T17:00:00Z",
  conclusion: "success",
  status: "completed",
};

test("DefectDojo selects the latest valid master run, not an older green one", () => {
  assert.deepEqual(chooseMasterRun([ok], "security-deep.yml", timestamp), ok);
  assert.throws(
    () =>
      chooseMasterRun(
        [{ ...ok, databaseId: 124, conclusion: "failure" }, ok],
        "security-deep.yml",
        timestamp,
      ),
    /NOT_READY/,
  );
  assert.throws(
    () =>
      chooseMasterRun(
        [{ ...ok, status: "in_progress", conclusion: "" }, ok],
        "security-deep.yml",
        timestamp,
      ),
    /NOT_READY/,
  );
  assert.throws(
    () =>
      chooseMasterRun(
        [{ ...ok, createdAt: "2026-09-01T00:00:00Z" }],
        "security-deep.yml",
        timestamp,
      ),
    /STALE/,
  );
  assert.throws(
    () =>
      chooseMasterRun(
        [{ ...ok, headSha: "invalid" }],
        "security-deep.yml",
        timestamp,
      ),
    /identity/,
  );
});

test("Trivy exports only verified HIGH/CRITICAL npm identifiers and versions", () => {
  const input = {
    Results: [
      {
        Target: "package-lock.json",
        Vulnerabilities: [
          {
            VulnerabilityID: "CVE-2026-12345",
            PkgName: "@scope/example",
            InstalledVersion: "1.0.0",
            FixedVersion: "1.2.3",
            Severity: "HIGH",
            Description: "SECRET: confidential",
          },
          { VulnerabilityID: "CVE-2026-2", PkgName: "ignore", Severity: "LOW" },
        ],
      },
      {
        Target: "secrets.json",
        Vulnerabilities: [
          {
            VulnerabilityID: "CVE-2026-333",
            PkgName: "secret",
            Severity: "HIGH",
          },
        ],
      },
    ],
  };
  const result = sanitizeTrivy(input);
  assert.equal(result.Results[0].Vulnerabilities.length, 1);
  assert.doesNotMatch(
    JSON.stringify(result),
    /SECRET|confidential|secrets.json/,
  );
  assert.equal(result.Results[0].Vulnerabilities[0].PkgName, "@scope/example");
  assert.throws(
    () =>
      sanitizeTrivy({
        Results: [
          {
            Target: "package-lock.json",
            Vulnerabilities: [
              {
                VulnerabilityID: "CVE-2026-333",
                PkgName: "name",
                InstalledVersion: "https://internal/private?token=abc",
                Severity: "CRITICAL",
              },
            ],
          },
        ],
      }),
    /Unapproved Trivy/,
  );
});

test("ZAP drops PII from all free-form HTTP and alert fields", () => {
  const raw = {
    site: [
      {
        "@name": "https://internal.example/private",
        alerts: [
          {
            riskcode: "3",
            pluginid: "10038",
            alert: "PRIVATE PERSON EMAIL name@example.org",
            instances: [{ uri: "https://localhost/?token=SECRET" }],
          },
        ],
      },
    ],
  };
  const result = sanitizeZap(raw);
  assert.equal(result.runs[0].results[0].ruleId, "10038");
  assert.equal(result.runs[0].results[0].message.text, "ZAP rule 10038");
  assert.doesNotMatch(
    JSON.stringify(result),
    /PRIVATE|EMAIL|SECRET|localhost|example.org/,
  );
});

test("Nuclei rebuilds SARIF without copying hidden metadata or URL-bearing messages", () => {
  const raw = {
    runs: [
      {
        tool: { driver: { name: "Nuclei", metadata: { secret: "SECRET" } } },
        results: [
          {
            ruleId: "http-exposure",
            level: "error",
            message: { text: "Private: john@example.org https://internal" },
            locations: [
              { physicalLocation: { artifactLocation: { uri: "private" } } },
            ],
          },
        ],
      },
    ],
  };
  const result = sanitizeNuclei(raw);
  assert.equal(
    result.runs[0].results[0].message.text,
    "Nuclei template http-exposure",
  );
  assert.doesNotMatch(
    JSON.stringify(result),
    /SECRET|Private|internal|example.org|locations/,
  );
  assert.throws(
    () =>
      sanitizeNuclei({
        runs: [
          {
            tool: { driver: { name: "Nuclei" } },
            results: [{ ruleId: "invalid/id", level: "error" }],
          },
        ],
      }),
    /rule ID/,
  );
});
