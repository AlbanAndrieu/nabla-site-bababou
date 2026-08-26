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
  assert.match(source, /`Mr AA` \/ `MR AA` → \*\*Mr A\*\*/);
  assert.match(source, /`Ms RB` \/ `Mme RB` \/ `Mrs RB` → \*\*Ms B\*\*/);
});

test("homepage and index stay owner-controlled privacy exceptions", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(source, /Owner-controlled homepage and index exception/);
  assert.match(source, /`public\/index\.html`/);
  assert.match(source, /public `\/` homepage/);
  assert.match(source, /Open Graph, Twitter\/X metadata, homepage JSON-LD/);
  assert.match(source, /ask the user for explicit approval before editing/i);
  assert.match(source, /Auditing and reporting the homepage\/index is allowed without approval; modifying it is not/);
  assert.doesNotMatch(source, /homepage real-name\/display-name exception is \*\*revoked\*\*/i);
});

test("essential protected information is caviarded rather than silently deleted", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(source, /Essential but protected/);
  assert.match(source, /essential information redacted; available on request/);
  assert.match(source, /information essentielle caviardée ; révélation sur demande/);
  assert.match(source, /original protected value has been removed from the source data/);
  assert.match(source, /Never keep the protected value in:/);
});

test("Cursor adapter preserves homepage approval boundary", async () => {
  const source = await readFile(CURSOR_RULE_URL, "utf8");

  assert.match(source, /`Mr A` \/ `Ms B` legal aliases/);
  assert.match(source, /homepage-specific Open Graph\/Twitter\/JSON-LD identity disclosures are \*\*owner-controlled exceptions\*\*/);
  assert.match(source, /unless the user explicitly approves the specific change in the current task/);
  assert.doesNotMatch(source, /former `public\/index\.html` child real-name exception has been revoked/i);
});
