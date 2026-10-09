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

test("unknown legacy HTML uses the reviewed 404 source only after Vercel resolves an error", async () => {
  const nextConfig = await read("next.config.mjs");
  const vercelConfig = JSON.parse(await read("vercel.json")) as {
    routes?: Array<{
      handle?: string;
      src?: string;
      dest?: string;
      status?: number;
      headers?: Record<string, string>;
    }>;
    rewrites?: unknown;
  };
  const routes = vercelConfig.routes ?? [];

  assert.match(
    nextConfig,
    /outputFileTracingIncludes:\s*\{[\s\S]*?["']\/__legacy-html-not-found__["']:\s*\[["']\.\/public\/404\.html["']\]/,
    "legacy 404 Route Handler must bundle the protected public/404.html source",
  );
  assert.doesNotMatch(nextConfig, /source:\s*"\/:path\*\.html"/);
  assert.deepEqual(routes[0], { handle: "error" });
  assert.equal(routes[1]?.src, "/(.*)\\.html$");
  assert.equal(routes[1]?.dest, "/__legacy-html-not-found__");
  assert.equal(routes[1]?.status, 404);
  assert.equal(routes[1]?.headers?.["cache-control"], "no-store, max-age=0");
  assert.equal(routes[1]?.headers?.["x-robots-tag"], "noindex, nofollow");
  assert.equal(
    vercelConfig.rewrites,
    undefined,
    "legacy fallback must not run as an unconditional Vercel rewrite",
  );

  const legacyNotFoundRoute = await read(
    "app/__legacy-html-not-found__/route.ts",
  );
  assert.match(legacyNotFoundRoute, /public\/404\.html/);
  assert.match(legacyNotFoundRoute, /status:\s*404/);
  assert.match(legacyNotFoundRoute, /data-nabla-app="next-global-not-found"/);
  assert.match(legacyNotFoundRoute, /X-Robots-Tag/);
  assert.match(legacyNotFoundRoute, /Cache-Control/);
  assert.match(legacyNotFoundRoute, /export function HEAD\(\)/);
  assert.match(legacyNotFoundRoute, /legacyNotFoundResponse\(null\)/);
  await assert.rejects(
    access(projectUrl("app/__legacy-html-not-found__/page.tsx")),
  );
});

test("technical test surface has only the localized App Router implementation", async () => {
  const localizedTestPage = await read("app/[locale]/test/page.tsx");

  assert.match(localizedTestPage, /NON_INDEXABLE_ROBOTS/);
  await assert.rejects(access(projectUrl("app/test/page.tsx")));
});
