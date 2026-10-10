import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = new URL(
  "../scripts/lib/quality-log-excerpt.awk",
  import.meta.url,
);
const gate = new URL("../scripts/quality-gate.sh", import.meta.url);

test("pre-commit failure excerpt keeps the last actionable lines at a fixed budget", () => {
  const input = [
    "unrelated pre-commit setup",
    "Biome......................................Failed",
    ...Array.from({ length: 10000 }, (_, i) => "diagnostic " + i),
    "ERROR: real failure at the bottom",
  ].join("\n");
  const result = spawnSync(
    "awk",
    ["-v", "max=4", "-f", fileURLToPath(source)],
    {
    input,
    encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trimEnd().split("\n");
  assert.equal(lines.length, 4);
  assert.equal(lines.at(-1), "ERROR: real failure at the bottom");
  assert.doesNotMatch(
    result.stdout,
    /unrelated pre-commit setup|diagnostic 0\n/,
  );
});

test("missing failure marker requires caller fallback instead of false success", () => {
  const result = spawnSync(
    "awk",
    ["-v", "max=4", "-f", fileURLToPath(source)],
    {
    input: "All hooks passed\n",
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
});

test("canonical quality gate validates the log budget and executes the helper", async () => {
  const text = await readFile(gate, "utf8");
  assert.match(text, /QUALITY_ERROR_LINES must be a positive integer/);
  assert.match(text, /-f scripts\/lib\/quality-log-excerpt\.awk/);
  assert.doesNotMatch(text, /lines\[\+\+n\]/);
});

test("log excerpt helper is maintenance-only in all three scope policies", async () => {
  const [ciScope, preview, baseline] = await Promise.all([
    readFile(new URL("../scripts/ci-scope.sh", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/vercel-preview.yml", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../scripts/lib/production-baseline-classification.sh",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  for (const policy of [ciScope, preview, baseline]) {
    assert.ok(policy.includes("scripts/lib/quality-log-excerpt.awk"));
  }
  assert.match(ciScope, /is_maintenance_only_path/);
});
