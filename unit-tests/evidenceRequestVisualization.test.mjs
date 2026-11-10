import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("copies public document locator only, never original or private URLs", () => {
  const code = source("app/[locale]/evidence-access/DocumentRequestSelection.tsx");
  assert.match(code, /navigator\.clipboard\.writeText\(reference\)/);
  assert.match(code, /aria-live="polite"/);
  assert.match(code, /setCopied\(false\)/);
  assert.doesNotMatch(code, /localStorage|sessionStorage|fetch\(|OPENRAG|VERCEL_TOKEN/);
});

test("clipboard labels cover FR EN DE NO", () => {
  const code = source("app/[locale]/evidence-access/DocumentRequestSelection.tsx");
  for (const locale of ["fr", "en", "de", "no"]) {
    assert.ok(code.includes(locale + ': { copy:'), locale);
  }
});

test("jurisdiction overview aggregates public static entries only", () => {
  const page = source("app/[locale]/evidence-access/page.tsx");
  assert.match(page, /export const dynamic = "force-static"/);
  assert.match(page, /evidence-jurisdiction-overview/);
  assert.match(page, /entry\.jurisdiction === jurisdiction/);
  assert.match(page, /entry\.evidenceStatus === "unlinked"/);
  assert.doesNotMatch(page, /OPENRAG_TOKEN|VERCEL_TOKEN/);
});
