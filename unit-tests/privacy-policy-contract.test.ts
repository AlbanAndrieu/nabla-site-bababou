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

test("canonical privacy policy uses the approved contextual aliases", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(source, /use \*\*Mr A\*\* as the canonical legal alias/);
  assert.match(source, /French legal\/editorial alias: \*\*Mme B\*\*/);
  assert.match(source, /English legal\/editorial alias: \*\*Ms B\*\*/);
  assert.match(source, /French legal\/official wording: use \*\*l'enfant\*\*/);
  assert.match(
    source,
    /Do not use `Bababou` in legal, official, evidentiary or administrative documents\/pages/,
  );
  assert.match(source, /father's financial details are \*\*BLOCK\*\*/i);
  assert.match(
    source,
    /requires \*\*explicit owner approval for that specific content\*\*/i,
  );
});

test("homepage and index stay owner-controlled privacy exceptions", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(source, /Owner-controlled homepage and index exception/);
  assert.match(source, /`public\/index\.html`/);
  assert.match(source, /public `\/` homepage/);
  assert.match(source, /Open Graph, Twitter\/X metadata, homepage JSON-LD/);
  assert.match(source, /ask the user for explicit approval before editing/i);
  assert.match(
    source,
    /Auditing and reporting the homepage\/index is allowed without approval; modifying it is not/,
  );
  assert.doesNotMatch(
    source,
    /homepage real-name\/display-name exception is \*\*revoked\*\*/i,
  );
});

test("dedicated RSS identity exception stays narrow and explicit", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(source, /Owner-approved dedicated RSS contact exception/);
  assert.match(source, /`public\/eleonore-feed\.xml`/);
  assert.match(source, /exact accented given-name display `Éléonore`/);
  assert.match(
    source,
    /RSS discovery labels outside the dedicated XML artifact must remain generic/,
  );
  assert.match(source, /requires new explicit user approval/);
});

test("essential protected information is caviarded rather than silently deleted", async () => {
  const source = await readFile(SKILL_URL, "utf8");

  assert.match(source, /Essential but protected/);
  assert.match(source, /essential information redacted; available on request/);
  assert.match(
    source,
    /information essentielle caviardée ; révélation sur demande/,
  );
  assert.match(
    source,
    /original protected value has been removed from the source data/,
  );
  assert.match(source, /Never keep the protected value in:/);
});

test("Cursor adapter preserves homepage approval boundary", async () => {
  const source = await readFile(CURSOR_RULE_URL, "utf8");

  assert.match(
    source,
    /`Mr A` \/ `Mme B` \(or `Ms B` in English\) legal aliases/,
  );
  assert.match(
    source,
    /homepage-specific Open Graph\/Twitter\/JSON-LD identity disclosures are \*\*owner-controlled exceptions\*\*/,
  );
  assert.match(
    source,
    /unless the user explicitly approves the specific change in the current task/,
  );
  assert.doesNotMatch(
    source,
    /former `public\/index\.html` child real-name exception has been revoked/i,
  );
});
