import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSkill = () =>
  readFile(
    new URL(
      "../.agents/skills/next-migrate-locale-pages/SKILL.md",
      import.meta.url,
    ),
    "utf8",
  );

test("migration skill treats computed contrast as a parity contract", async () => {
  const skill = await readSkill();

  assert.match(skill, /WCAG 2\.2 AA/);
  assert.match(skill, /4\.5:1/);
  assert.match(skill, /3:1/);
  assert.match(skill, /`light`, `dark`, and `auto`/);
  assert.match(skill, /browser-computed foreground\/background ratios in Playwright/);
  assert.match(skill, /public\/legacy-contrast\.css/);
  assert.match(skill, /semantic `--ui-\*` design tokens/);
  assert.match(skill, /must not load Bootstrap or `legacy-contrast\.css`/);
  assert.match(skill, /do \*\*not\*\* by themselves claim site-wide WCAG conformance/);
});

test("migration skill rejects sleeps as a contrast-transition workaround", async () => {
  const skill = await readSkill();

  assert.match(skill, /Do not hide a transient contrast failure behind an arbitrary sleep/);
  assert.match(skill, /complete state change remains readable/);
});
