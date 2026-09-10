import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const skillUrl = new URL(
  "../.agents/skills/quality-follow-up/SKILL.md",
  import.meta.url,
);
const gateUrl = new URL("../scripts/agent-quality-gate.sh", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);

test("quality follow-up skill makes unfinished work a roadmap obligation", async () => {
  const skill = await readFile(skillUrl, "utf8");

  assert.match(skill, /Completion rule — mandatory/);
  assert.match(skill, /add an unchecked item to `docs\/roadmap\.md`/);
  assert.match(
    skill,
    /failed check on a PR that was merged anyway is itself a residual/i,
  );
  assert.match(skill, /do not say the work is "done", "complete", "finished"/i);
  assert.match(skill, /never leave the only durable record in chat/i);
});

test("quality follow-up distinguishes deterministic fixes from real failures", async () => {
  const skill = await readFile(skillUrl, "utf8");

  assert.match(skill, /deterministic mutation/);
  assert.match(skill, /deterministic validation/);
  assert.match(skill, /runtime\/deployment regression/);
  assert.match(skill, /transient infrastructure/);
  assert.match(skill, /exact diff emitted by the failed gate/);
  assert.match(skill, /current `master`/);
  assert.match(skill, /Do not weaken,/i);
});

test("agent fix mode converges formatter passes and publish mode uses publication gate", async () => {
  const gate = await readFile(gateUrl, "utf8");

  assert.match(gate, /QUALITY_FIX_MAX_PASSES/);
  assert.match(gate, /while \(\(pass <= FIX_MAX_PASSES\)\)/);
  assert.match(gate, /snapshot_changed_files/);
  assert.match(gate, /changed files; retrying/);
  assert.match(gate, /failed on pass %d without changing files/);
  assert.match(gate, /bash scripts\/quality-gate\.sh --publish/);
});

test("Bababou exposes the same agent quality command family as Site Alban", async () => {
  const manifest = JSON.parse(await readFile(packageUrl, "utf8")) as {
    scripts?: Record<string, string>;
  };

  assert.equal(
    manifest.scripts?.["quality:agent"],
    "bash scripts/agent-quality-gate.sh",
  );
  assert.equal(
    manifest.scripts?.["quality:agent:fix"],
    "bash scripts/agent-quality-gate.sh --fix",
  );
  assert.equal(
    manifest.scripts?.["quality:agent:publish"],
    "bash scripts/agent-quality-gate.sh --publish",
  );
});
