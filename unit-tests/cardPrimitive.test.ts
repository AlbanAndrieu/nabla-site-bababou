import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Card owns the shared tokenized surface and body contract", async () => {
  const [card, styles] = await Promise.all([
    source("components/ui/Card.tsx"),
    source("components/ui/Card.module.css"),
  ]);

  assert.match(card, /ComponentPropsWithoutRef<"div">/);
  assert.match(card, /borderless\?: boolean/);
  assert.match(card, /elevated\?: boolean/);
  assert.match(card, /export function CardBody/);
  assert.match(styles, /background: var\(--ui-surface-card\)/);
  assert.match(styles, /border: 1px solid var\(--ui-border\)/);
  assert.match(styles, /border-radius: var\(--ui-radius-card\)/);
  assert.match(styles, /box-shadow: var\(--ui-shadow-sm\)/);
  assert.match(styles, /padding: var\(--ui-space-md\)/);
});

test("Card remains content-agnostic and Bootstrap-free", async () => {
  const card = await source("components/ui/Card.tsx");

  assert.doesNotMatch(card, /className="card/);
  assert.doesNotMatch(card, /bootstrap/i);
  assert.doesNotMatch(card, /style=\{\{/);
});
