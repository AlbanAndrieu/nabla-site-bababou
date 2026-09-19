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

test("locale persistence keeps local development usable and deployed cookies Secure", async () => {
  const routing = await read("i18n/routing.ts");

  assert.match(
    routing,
    /localeCookie:\s*\{[\s\S]*secure:\s*process\.env\.NODE_ENV\s*===\s*["']production["']/,
  );
  assert.match(routing, /HttpOnly[\s\S]*unsupported/);
});

test("unknown localized routes fall through to the protected global 404", async () => {
  const globalNotFound = await read("app/global-not-found.tsx");

  assert.match(globalNotFound, /loadPublicHtmlFragment\(["']404\.html["']/);
  assert.match(globalNotFound, /data-nabla-app="next-global-not-found"/);

  await assert.rejects(access(projectUrl("app/[locale]/[...rest]/page.tsx")));
});

test("unknown legacy HTML routes fall through only after filesystem routing", async () => {
  const nextConfig = await read("next.config.mjs");

  assert.match(nextConfig, /source:\s*["']\/:path\*\.html["']/);
  assert.match(
    nextConfig,
    /destination:\s*["']\/__legacy-html-not-found__["']/,
  );
  const legacyNotFoundRoute = await read("app/__legacy-html-not-found__/route.ts");
  assert.match(legacyNotFoundRoute, /status:\s*404/);
  assert.match(legacyNotFoundRoute, /public\/404\.html/);
  assert.match(legacyNotFoundRoute, /data-nabla-app="next-global-not-found"/);
  assert.match(nextConfig, /fallback:\s*legacyHtmlNotFoundFallback/);
  assert.match(
    nextConfig,
    /Preserve every real public\/legacy file first[\s\S]*Only unmatched \*\.html/,
  );
});

test("technical test surface has only the localized App Router implementation", async () => {
  const localizedTestPage = await read("app/[locale]/test/page.tsx");

  assert.match(localizedTestPage, /NON_INDEXABLE_ROBOTS/);
  await assert.rejects(access(projectUrl("app/test/page.tsx")));
});
