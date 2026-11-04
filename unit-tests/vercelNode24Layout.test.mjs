import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), "utf8");

test("Next.js 16.4 has a root layout for its unprefixed homepage route", () => {
  assert.equal(existsSync(join(root, "app/page.tsx")), false);
  assert.equal(existsSync(join(root, "app/layout.tsx")), false);
  const layout = read("app/(legacy-home)/layout.tsx");
  assert.match(layout, /<html\s+lang="en">/);
  assert.match(layout, /<body>\{children\}<\/body>/);
  const placeholder = read("app/(legacy-home)/page.tsx");
  assert.match(placeholder, /return null;/);
});

test("localized routes retain independent HTML root and Next global 404", () => {
  const localized = read("app/[locale]/layout.tsx");
  assert.match(localized, /<html\s+lang=\{locale\}/);
  assert.match(localized, /<body>/);
  assert.match(read("app/global-not-found.tsx"), /<html/);
  assert.match(read("next.config.mjs"), /globalNotFound: true/);
});

test("unlisted locale segments never create dynamic SSR pages", () => {
  const layout = read("app/[locale]/layout.tsx");
  const policy = read("app/[locale]/policy/[policy]/page.tsx");
  const nre = read("app/[locale]/nre/page.tsx");
  assert.match(layout, /export const dynamicParams = false/);
  assert.match(layout, /return routing\\.locales\\.map\\(\\(locale\\) => \\(\\{ locale \\}\\)\\)/);
  assert.match(policy, /export const dynamicParams = false/);
  assert.match(nre, /export const dynamicParams = false/);
  // The IP allowlist and the fail-closed editorial cutover stay in the proxy.
  const proxy = read("proxy.ts");
  assert.match(proxy, /isTrustedHomelabIpv4/);
  assert.match(proxy, /!isHomeCutoverEnabled\\(\\)/);
});

test("legacy homepage remains a proxy rewrite rather than an unreviewed Next page", () => {
  const proxy = read("proxy.ts");
  assert.match(proxy, /request\.nextUrl\.pathname === "\/"/);
  assert.match(proxy, /NextResponse\.rewrite\(new URL\("\/index\.html"/);
  const vercel = JSON.parse(read("vercel.json"));
  assert.equal(vercel.framework, "nextjs");
  assert.equal(vercel.git.deploymentEnabled.master, true);
  assert.equal(vercel.git.deploymentEnabled["*"], false);
  assert.equal(vercel.git.deploymentEnabled["**"], false);
  const ignore = read(".vercelignore");
  assert.doesNotMatch(ignore, /^\s*\/?app\/?\s*$/m);
});

test("production is on Vercel-supported Node 24; local Node 26 remains separate", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(read(".nvmrc-production").trim(), /^v24\./);
  assert.match(read(".nvmrc").trim(), /^v26\./);
  assert.match(read("mise.toml"), /^node = "24"$/m);
  assert.match(pkg.engines.node, /24/);
  assert.match(pkg.engines.node, /27/);
});

test("Vercel installs the same pinned npm 12 as mise before npm ci", () => {
  const vercel = JSON.parse(read("vercel.json"));
  const pinnedNpm = read("mise.toml").match(/^npm = "([0-9.]+)"$/m)?.[1];
  assert.ok(pinnedNpm, "mise npm version required");
  assert.equal(
    vercel.installCommand,
    `npm install --global npm@${pinnedNpm} --no-audit --no-fund && npm --version && npm ci --no-audit --no-fund`,
  );
  assert.match(JSON.parse(read("package.json")).engines.npm, /^>=12\.2\.0 <13$/);
});
