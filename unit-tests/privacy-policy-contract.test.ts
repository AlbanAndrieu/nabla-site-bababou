import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SKILL_URL = new URL(
  "../.agents/skills/protect-family-privacy/SKILL.md",
  import.meta.url,
);
const CURSOR_RULE_URL = new URL(
  "../.cursor/rules/200_anonymization-legal.mdc",
  import.meta.url,
);

test("canonical privacy policy uses the approved legal pseudonyms", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(source, /Prefer \*\*Mr A\*\*/);
  assert.match(source, /Prefer \*\*Ms B\*\*/);
  assert.match(source, /Child legal\/official-derived copy → \*\*the child\*\*/);
  assert.match(source, /`Mr AA`, `MR AA`[^\n]*→ \*\*Mr A\*\*/);
  assert.match(source, /`Ms RB`, `Mme RB`, `Mrs RB`[^\n]*→ \*\*Ms B\*\*/);
});

test("canonical policy revokes the homepage real-name exception", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(
    source,
    /previous `public\/index\.html` real-name\/display-name exception is \*\*revoked\*\*/i,
  );
  assert.match(source, /including the homepage/i);
  assert.match(source, /Do not recreate the revoked homepage real-name exception/);
});

test("essential protected information is caviarded rather than silently deleted", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(source, /Essential but protected/);
  assert.match(source, /essential information redacted; available on request/);
  assert.match(source, /information essentielle caviardée ; révélation sur demande/);
  assert.match(source, /original protected value has been removed from the source data/);
  assert.match(source, /Never keep the protected value in:/);
});

test("Cursor adapter points to the strict canonical policy", async () => {
  const source = await readFile(CURSOR_RULE_URL, "utf8");

  assert.match(source, /`Mr A` \/ `Ms B` legal aliases/);
  assert.match(
    source,
    /former `public\/index\.html` child real-name exception has been revoked/i,
  );
  assert.doesNotMatch(source, /narrow `public\/index\.html` child-name exception/);
});
