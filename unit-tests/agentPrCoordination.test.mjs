import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const policy = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
const claude = readFileSync(new URL("../CLAUDE.md", import.meta.url), "utf8");
const skill = readFileSync(new URL("../.agents/skills/local-first-quality/SKILL.md", import.meta.url), "utf8");

test("PRs reuse existing scope and resolve base conflicts before editing", () => {
  for (const marker of ["PR existante en priorité", "Avant toute édition",
    "Une publication par lot cohérent", "SHA", "NOT_RUN"]) {
    assert.ok(policy.includes(marker), marker);
  }
  assert.match(claude, /rebaser et résoudre/);
  assert.match(skill, /lot local jusqu'au gate L3/);
});

test("publication exceptions never disable Bababou security gates", () => {
  assert.match(policy, /confidentialité familiale/);
  assert.match(policy, /Pas de `\[skip ci\]`/);
  assert.match(policy, /migration importante achevée/);
  assert.ok(policy.includes("pas de fusion ou cutover automatique"));
});
