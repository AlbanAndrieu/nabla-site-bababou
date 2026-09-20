import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("agent auto-fix scopes npm linters through the shared support library", async () => {
  const [gate, support, packageRaw] = await Promise.all([
    read("../scripts/agent-quality-gate.sh"),
    read("../scripts/lib/agent-quality-support.sh"),
    read("../package.json"),
  ]);
  const pkg = JSON.parse(packageRaw) as { scripts: Record<string, string> };

  assert.equal(pkg.scripts["lint:fix"], "eslint --fix --format ./scripts/eslint-github-formatter.mjs .");
  assert.equal(
    pkg.scripts["lint:css"],
    'stylelint "app/*.css" "app/**/*.module.css" "components/**/*.module.css" "public/*.css"',
  );
  assert.equal(
    pkg.scripts["lint:css:fix"],
    'stylelint --fix "app/*.css" "app/**/*.module.css" "components/**/*.module.css" "public/*.css"',
  );
  assert.ok(!pkg.scripts["lint:css"].includes('"app/**/*.css"'));

  assert.match(support, /eslint\.config\.js\)/);
  assert.match(support, /stylelint\.config\.cjs\)/);
  assert.match(gate, /JAVASCRIPT_LINT_FILES/);
  assert.match(gate, /STYLELINT_FILES/);
  assert.match(gate, /npm run lint:fix/);
  assert.match(gate, /npm run lint:css:fix/);
});

test("agent and canonical gates emit compact machine-actionable failures", async () => {
  const [agentGate, canonicalGate, support] = await Promise.all([
    read("../scripts/agent-quality-gate.sh"),
    read("../scripts/quality-gate.sh"),
    read("../scripts/lib/agent-quality-support.sh"),
  ]);

  assert.match(agentGate, /QUALITY_LOG_TAIL:-40/);
  assert.match(agentGate, /QUALITY_FIX_PASSES:-12/);
  assert.match(agentGate, /QG_PRECOMMIT_FAILED/);
  assert.match(agentGate, /QG_FIX_DID_NOT_CONVERGE/);
  assert.match(agentGate, /QG_NODE_FIX_SKIPPED/);
  assert.match(support, /tail -n "\$\{LOG_TAIL\}"/);

  assert.match(canonicalGate, /QG_AUTOFIX_REQUIRED/);
  assert.match(canonicalGate, /QG_PRECOMMIT_FAILED/);
  assert.match(canonicalGate, /--- exact formatter patch ---/);
  assert.match(canonicalGate, /git diff --no-ext-diff/);
  assert.match(canonicalGate, /--fail-fast/);
  assert.match(canonicalGate, /QUALITY_SHOW_DIFF/);
});

test("maintenance local validation avoids typegen, privacy and production build", async () => {
  const gate = await read("../scripts/agent-quality-gate.sh");

  assert.match(gate, /bash scripts\\/ci-quality-scope\\.sh/);
  assert.match(gate, /maintenance lint, CSS and unit gate/);
  assert.match(gate, /run_maintenance_project_checks/);
  assert.match(gate, /npm run lint\\n\\s+npm run lint:css\\n\\s+npm run test:unit/);
  assert.match(gate, /full pre-build lint, types, unit and privacy gate/);
  assert.match(gate, /npx next typegen/);
  assert.match(gate, /npm run privacy:check/);
});

test("publication builds only deploy-relevant changes", async () => {
  const [publish, scope] = await Promise.all([
    read("../scripts/agent-publish.sh"),
    read("../scripts/ci-quality-scope.sh"),
  ]);

  assert.match(publish, /bash scripts\/ci-quality-scope\.sh/);
  assert.match(publish, /case "\$\{full_project\}" in/);
  assert.match(publish, /false\)[\s\S]*Next build intentionally skipped/);
  assert.match(publish, /true\)[\s\S]*npm run build/);
  assert.ok(scope.includes("scripts/agent-publish.sh"));
  assert.ok(scope.includes("scripts/lib/agent-quality-support.sh"));
});
