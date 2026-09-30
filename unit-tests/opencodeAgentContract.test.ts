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
  assert.match(config.command?.["quality-local"]?.template ?? "", /agent-p0-check\.sh/);
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
  assert.match(agents, /agent-p0-check\.sh/);
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

test("dependency-free P0 checkpoint stays canonical and maintenance-only", async () => {
  const [packageSource, p0, agents, primary, playbook, operations, skill] =
    await Promise.all([
      read("package.json"),
      read("scripts/agent-p0-check.sh"),
      read("AGENTS.md"),
      read(".opencode/agents/bababou.md"),
      read(".agents/skills/roadmap-local-first/references/opencode-playbook.md"),
      read("docs/operations.md"),
      read(".agents/skills/roadmap-local-first/SKILL.md"),
    ]);
  const packageJson = JSON.parse(packageSource) as {
    scripts?: Record<string, string>;
  };

  assert.equal(packageJson.scripts?.["test:p0"], undefined);
  assert.match(p0, /agent-quality-gate\.sh --preflight/);
  assert.match(p0, /node --experimental-strip-types --test/);
  for (const testFile of [
    "unit-tests/ciScopeBehavior.test.ts",
    "unit-tests/agentPreflightBehavior.test.ts",
    "unit-tests/opencodeAgentContract.test.ts",
    "unit-tests/dependencyAutomationContract.test.ts",
    "unit-tests/migration-structure.test.ts",
  ]) {
    assert.ok(p0.includes(testFile), `missing P0 contract: ${testFile}`);
  }

  for (const source of [agents, primary, playbook, operations, skill]) {
    assert.match(source, /agent-p0-check\.sh/);
  }
});

test("OpenCode defaults to the repository agent without pinning the workstation model", async () => {
  const config = JSON.parse(await read("opencode.json")) as {
    default_agent?: string;
    subagent_depth?: number;
    permission?: { task?: string };
    command?: Record<
      string,
      { agent?: string; subtask?: boolean; model?: string; template?: string }
    >;
  };

  assert.equal(config.default_agent, "bababou");
  assert.equal(config.subagent_depth, 1);
  assert.equal(config.permission?.task, "allow");
  assert.equal(config.command?.["roadmap-local"]?.agent, "bababou");
  assert.equal(config.command?.["roadmap-local"]?.subtask, false);
  assert.equal(config.command?.["quality-local"]?.agent, "bababou");
  assert.equal(config.command?.["review-local"]?.agent, "bababou-reviewer");
  assert.equal(config.command?.["review-local"]?.subtask, true);

  for (const command of Object.values(config.command ?? {})) {
    assert.equal(command.model, undefined);
  }
});

test("OpenCode primary and reviewer agents separate execution from review", async () => {
  const [primary, reviewer, playbook] = await Promise.all([
    read(".opencode/agents/bababou.md"),
    read(".opencode/agents/bababou-reviewer.md"),
    read(".agents/skills/roadmap-local-first/references/opencode-playbook.md"),
  ]);

  assert.match(primary, /mode: primary/);
  assert.doesNotMatch(primary, /^model:/m);
  assert.match(primary, /roadmap-local-first/);
  assert.match(primary, /bababou-reviewer/);
  assert.match(primary, /agent-publish\.sh/);
  assert.match(primary, /agent-p0-check\.sh/);

  assert.match(reviewer, /mode: subagent/);
  assert.match(reviewer, /edit: deny/);
  assert.match(reviewer, /task: deny/);
  assert.match(reviewer, /git diff\*/);
  assert.match(reviewer, /Do not edit files/i);

  assert.match(playbook, /Capability routing/);
  assert.match(playbook, /executed/);
  assert.match(playbook, /static contract/);
  assert.match(playbook, /steps=null/);
  assert.match(playbook, /protected visual 404 source/);
  assert.match(playbook, /Google Translate remains fallback/);
  assert.match(playbook, /agent-p0-check\.sh/);
  assert.match(playbook, /opencode agent list/);
  assert.match(playbook, /bababou-reviewer/);
});

test("OpenCode configuration stays on the maintenance-only CI path", async () => {
  const scope = await read("scripts/ci-scope.sh");

  const matches = scope.match(/opencode\.json/g) ?? [];
  assert.equal(matches.length, 2, "opencode.json must be maintenance-only and Preview-safe");
});
