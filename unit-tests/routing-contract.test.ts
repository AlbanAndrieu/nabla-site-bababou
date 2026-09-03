import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);
const read = (path: string) => readFile(projectUrl(path), "utf8");

test("unprefixed canonical Next routes are deterministically French", async () => {
  const routing = await read("i18n/routing.ts");

  assert.match(routing, /defaultLocale:\s*["']fr["']/);
  assert.match(routing, /localePrefix:\s*["']as-needed["']/);
  assert.match(routing, /localeDetection:\s*false/);
});

test("unknown localized routes fall through to the protected global 404", async () => {
  const globalNotFound = await read("app/global-not-found.tsx");

  assert.match(globalNotFound, /loadPublicHtmlFragment\(["']404\.html["']/);
  assert.match(globalNotFound, /data-nabla-app="next-global-not-found"/);

  await assert.rejects(access(projectUrl("app/[locale]/[...rest]/page.tsx")));
});

test("technical test surface has only the localized App Router implementation", async () => {
  const localizedTestPage = await read("app/[locale]/test/page.tsx");

  assert.match(localizedTestPage, /NON_INDEXABLE_ROBOTS/);
  await assert.rejects(access(projectUrl("app/test/page.tsx")));
});
