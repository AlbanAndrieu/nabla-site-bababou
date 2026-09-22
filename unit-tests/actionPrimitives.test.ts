import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("link and button actions share one tokenized action contract", async () => {
  const [actionLink, button, styles, tokens] = await Promise.all([
    source("components/ui/ActionLink.tsx"),
    source("components/ui/Button.tsx"),
    source("components/ui/Action.module.css"),
    source("app/design-tokens.css"),
  ]);

  assert.match(actionLink, /export type ActionVariant/);
  for (const variant of [
    "primary",
    "secondary",
    "outline",
    "outlineSecondary",
    "outlineInfo",
    "inverted",
  ]) {
    assert.ok(actionLink.includes(`"${variant}"`), `missing action variant ${variant}`);
  }
  assert.match(actionLink, /export type ActionSize/);
  assert.match(actionLink, /actionClassName\(variant, size, className\)/);

  assert.match(button, /ComponentPropsWithoutRef<"button">/);
  assert.match(button, /type = "button"/);
  assert.match(button, /actionClassName\(variant, size, className\)/);

  for (const className of [
    "outlineSecondary",
    "outlineInfo",
    "inverted",
  ]) {
    assert.match(styles, new RegExp(`\\.${className} \\{`));
  }
  assert.match(styles, /min-height: var\(--ui-control-min-height\)/);
  assert.match(styles, /outline: 3px solid var\(--ui-focus-ring\)/);
  assert.match(styles, /\.action:disabled/);

  for (const token of [
    "--ui-inverted-text",
    "--ui-inverted-bg-hover",
    "--ui-inverted-text-hover",
    "--ui-info-text",
    "--ui-info-border",
    "--ui-info-surface",
  ]) {
    assert.ok(tokens.includes(token), `missing action token ${token}`);
  }
});

test("Button defaults to non-submit semantics and reuses ActionLink variants", async () => {
  const button = await source("components/ui/Button.tsx");

  assert.match(button, /variant = "primary"/);
  assert.match(button, /size = "default"/);
  assert.match(button, /type = "button"/);
  assert.match(button, /type ActionVariant/);
  assert.match(button, /type ActionSize/);
  assert.doesNotMatch(button, /className="btn/);
});
