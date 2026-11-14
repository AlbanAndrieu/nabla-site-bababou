import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { budget, choose } from "../scripts/agent/capability-plan.mjs";
const gib = 1024 ** 3;
test("CPU and free memory bound browser workers", () => {
  assert.equal(budget({ cpus: 16, freeBytes: 32 * gib }), 4);
  assert.equal(budget({ cpus: 4, freeBytes: 8 * gib }), 2);
  assert.equal(budget({ cpus: 1, freeBytes: 0 }), 1);
  assert.equal(budget({ cpus: 16, freeBytes: 2 * gib }), 1);
  assert.equal(budget({ cpus: 16, freeBytes: 32 * gib, overrideWorkers: 2 }), 2);
  assert.throws(() => budget({ cpus: 16, freeBytes: 32 * gib, overrideWorkers: 0 }), /AGENT_WORKERS_INVALID/);
});
test("isolated mode never escalates", () => {
  assert.deepEqual(choose({ requestedMode: "isolated", hasCheckout: true, hasJust: true, hasDependencies: true }), { mode: "isolated", canRun: false, canPublish: false });
  assert.deepEqual(choose({ requestedMode: "auto", hasCheckout: false, hasJust: true, hasDependencies: true }), { mode: "isolated", canRun: false, canPublish: false });
  assert.deepEqual(choose({ requestedMode: "workstation", hasCheckout: true, hasJust: true, hasDependencies: false }), { mode: "workstation", canRun: true, canPublish: false });
});
test("CLI plans without execution and isolated mode fails closed", () => {
  const file = fileURLToPath(new URL("../scripts/agent/capability-plan.mjs", import.meta.url));
  const plan = spawnSync(process.execPath, [file, "--mode", "isolated", "--json"], { encoding: "utf8" });
  assert.equal(plan.status, 0, plan.stderr);
  assert.equal(JSON.parse(plan.stdout).execution, "NOT_RUN");
  const run = spawnSync(process.execPath, [file, "--mode", "isolated", "--run"], { encoding: "utf8" });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /BLOCKED_ENVIRONMENT/);
});
