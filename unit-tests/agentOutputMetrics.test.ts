import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../scripts/agent-output-metrics.sh", import.meta.url),
);

test("log metric summary is compact, numeric and privacy-safe", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "bababou-output-metrics-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const before = join(dir, "before.log");
  const after = join(dir, "after.log");
  await writeFile(before, "SECRET_A\nSECRET_B\nSECRET_C\nSECRET_D\n");
  await writeFile(after, "SECRET_A\nSECRET_B\n");

  const result = spawnSync("bash", [script, before, after], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /baseline_lines=4 current_lines=2 line_reduction_pct=50\.0/,
  );
  assert.match(result.stdout, /byte_reduction_pct=50\.0/);
  assert.match(result.stdout, /tokens=not_measured/);
  assert.doesNotMatch(result.stdout, /SECRET/);

  await writeFile(before, "");
  const invalid = spawnSync("bash", [script, before, after], {
    encoding: "utf8",
  });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /OUTPUT_METRICS_EMPTY_BASELINE/);
});

test("output percentages use a dot separator under French locale", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "bababou-output-metrics-fr-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const before = join(dir, "baseline.log");
  const after = join(dir, "current.log");
  await writeFile(before, "a\nb\nc\n");
  await writeFile(after, "a\nb\n");
  const result = spawnSync("bash", [script, before, after], {
    encoding: "utf8",
    env: { ...process.env, LC_ALL: "fr_FR.UTF-8", LANG: "fr_FR.UTF-8" },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /line_reduction_pct=33\.3/);
  assert.doesNotMatch(result.stdout, /33,3/);
});
