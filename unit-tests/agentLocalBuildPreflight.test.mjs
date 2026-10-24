import assert from "node:assert/strict";
import test from "node:test";
import { assessLocalBuild } from "../scripts/quality/agent-local-build-preflight.mjs";

const ready = {
  nodeVersion: "v26.12.1",
  npmVersion: "12.2.1",
  developmentNode: "v26.12.1",
  productionNode: "v24.22.1",
  miseConfig: '[tools]\nnode = "24"\nnpm = "12.2.1"\n',
  engineRange: ">=24.11.0 <27",
  dependenciesReady: true,
};

test("accepts the repository's separate development and production runtimes", () => {
  assert.deepEqual(assessLocalBuild(ready), []);
  assert.deepEqual(assessLocalBuild({ ...ready, nodeVersion: "v24.22.1" }), []);
});

test("refuses unsupported or unknown runtime versions", () => {
  for (const nodeVersion of ["v22.16.0", "v23.1.0", "v25.0.0", "broken"]) {
    assert.ok(assessLocalBuild({ ...ready, nodeVersion }).some((reason) => reason.startsWith("NODE_UNSUPPORTED")));
  }
});

test("requires exact npm pin and installed locked dependencies", () => {
  const failures = assessLocalBuild({ ...ready, npmVersion: "10.9.2", dependenciesReady: false });
  assert.ok(failures.some((reason) => reason.startsWith("NPM_UNPINNED")));
  assert.ok(failures.some((reason) => reason.startsWith("NODE_MODULES_MISSING")));
});

test("detects conflicting toolchain declarations without changing them", () => {
  const failures = assessLocalBuild({ ...ready, developmentNode: "v24.22.1", miseConfig: 'node = "26"\nnpm = "12.2.1"\n' });
  assert.ok(failures.some((reason) => reason.startsWith("RUNTIME_POLICY_DRIFT")));
});

test("build engine changes require explicit review", () => {
  assert.ok(assessLocalBuild({ ...ready, engineRange: ">=22" }).some((reason) => reason.startsWith("ENGINES_POLICY_DRIFT")));
});
