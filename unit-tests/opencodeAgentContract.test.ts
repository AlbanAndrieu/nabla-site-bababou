import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);

async function read(path: string) {
  return readFile(new URL(path, repositoryRoot), "utf8");
}

test("OpenCode keeps project skills and todo orchestration available", async () => {
  const config = JSON.parse(await read("opencode.json")) as {
    share?: string;
    permission?: {
      skill?: string;
      todowrite?: string;
      external_directory?: string;
      bash?: Record<string, string>;
    };
    command?: Record<string, { template?: string; model?: string }>;
    mcp?: Record<string, unknown>;
  };

  assert.equal(config.share, "disabled");
  assert.equal(config.permission?.skill, "allow");
  assert.equal(config.permission?.todowrite, "allow");
  assert.equal(config.permission?.external_directory, "ask");
  assert.equal(config.permission?.bash?.["git push*"], "ask");
  assert.equal(config.permission?.bash?.["git reset --hard*"], "ask");
  assert.equal(config.permission?.bash?.["rm -rf *"], "ask");
  assert.ok(config.mcp?.["next-devtools"]);

  assert.match(config.command?.["roadmap-local"]?.template ?? "", /roadmap-local-first/);
  assert.match(
    config.command?.["roadmap-local"]?.template ?? "",
    /agent-quality-gate\.sh --preflight/,
  );
  assert.match(config.command?.["quality-local"]?.template ?? "", /quality-follow-up/);
  assert.match(
    config.command?.["quality-local"]?.template ?? "",
    /agent-publish\.sh/,
  );

  for (const command of Object.values(config.command ?? {})) {
    assert.equal(command.model, undefined, "repository config must preserve the workstation-selected model");
  }
});

test("AGENTS gives small models an explicit deterministic workflow", async () => {
  const agents = await read("AGENTS.md");

  assert.match(agents, /OpenCode \/ small-model execution protocol/);
  assert.match(agents, /roadmap-local-first/);
  assert.match(agents, /agent-quality-gate\.sh --preflight/);
  assert.match(agents, /agent-quality-gate\.sh --fix/);
  assert.match(agents, /agent-publish\.sh/);
  assert.match(agents, /steps=null/);
  assert.match(agents, /Never claim.*passed unless it was actually executed/is);
  assert.match(agents, /Keep the PR draft/);
  assert.match(agents, /pull-request descriptions in French/i);
});

test("roadmap-local-first skill encodes local-first completion and failure routing", async () => {
  const skill = await read(".agents/skills/roadmap-local-first/SKILL.md");

  assert.match(skill, /^---\nname: roadmap-local-first\n/m);
  assert.match(skill, /quality-follow-up/);
  assert.match(skill, /protect-family-privacy/);
  assert.match(skill, /next-migrate-locale-pages/);
  assert.match(skill, /next-dev-loop/);
  assert.match(skill, /QG_AUTOFIX_REQUIRED/);
  assert.match(skill, /QG_BASE_STALE/);
  assert.match(skill, /steps=null/);
  assert.match(skill, /do not manually rerun hosted workflows/i);
  assert.match(skill, /Keep the PR description in French/i);
  assert.match(skill, /never merge unless the user explicitly asks/i);
});

test("OpenCode configuration stays on the maintenance-only CI path", async () => {
  const scope = await read("scripts/ci-scope.sh");

  const matches = scope.match(/opencode\.json/g) ?? [];
  assert.equal(matches.length, 2, "opencode.json must be maintenance-only and Preview-safe");
});
