import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

test("Semgrep does not depend on anonymous Docker Hub pulls", () => {
  const scan = workflow
    .split("      - name: Run Semgrep SAST on changed source")[1]
    ?.split("      - name: Upload Semgrep SARIF")[0];
  assert.ok(scan, "Semgrep CI step must exist");
  assert.match(
    scan,
    /"\$semgrep_venv[/]bin[/]python" -m pip install --disable-pip-version-check --quiet 'semgrep==1\.145\.0'/,
  );
  assert.match(
    scan,
    /SEMGREP_SEND_METRICS=off "\$semgrep_venv[/]bin[/]semgrep" scan/,
  );
  assert.match(scan, /python -m venv/);
  assert.match(scan, /pydantic==2\.12\.5/);
  assert.match(scan, /eval_type_backport/);
  assert.match(scan, /--config p\/ci/);
  assert.match(scan, /--error/);
  assert.match(scan, /--sarif/);
  assert.match(scan, /--output semgrep\.sarif/);
  assert.doesNotMatch(scan, /docker run|semgrep\/semgrep@sha256:/);
});

test("Semgrep failures remain blocking and SARIF diagnostics remain available", () => {
  assert.match(workflow, /Preserve failed Semgrep SAST report/);
  assert.match(
    workflow,
    /Enforce Semgrep SAST[\s\S]*?steps\.semgrep-sast\.outcome != 'success'[\s\S]*?run: exit 1/,
  );
});
