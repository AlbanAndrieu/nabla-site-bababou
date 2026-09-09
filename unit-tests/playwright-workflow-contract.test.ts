import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function section(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  assert.notEqual(startIndex, -1, `Missing workflow section: ${start}`);
  assert.notEqual(endIndex, -1, `Missing workflow section: ${end}`);

  return source.slice(startIndex, endIndex);
}

test("Playwright Preview runs use the Vercel repository dispatch path", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /repository_dispatch:/);
  assert.match(workflow, /vercel\.deployment\.success/);
  assert.doesNotMatch(workflow, /deployment_status:/);
  assert.doesNotMatch(workflow, /github\.event\.deployment/);
  assert.match(workflow, /github\.event\.client_payload\.git\.ref/);
  assert.match(workflow, /github\.event\.client_payload\.git\.sha/);
});

test("Playwright Preview runs reuse the Chromium browser cache", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  const cache = section(
    workflow,
    "- name: Cache Playwright Chromium",
    "- name: Install Playwright Chromium Browser",
  );
  const install = section(
    workflow,
    "- name: Install Playwright Chromium Browser",
    "- name: Install Chromium system dependencies",
  );

  assert.match(workflow, /id: playwright-version/);
  assert.ok(workflow.includes("actions/cache@caa296126883cff596d87d8935842f9db880ef25"));
  assert.match(
    cache,
    /playwright-chromium-\$\{\{ runner\.os \}\}-\$\{\{ runner\.arch \}\}-\$\{\{ steps\.playwright-version\.outputs\.version \}\}/,
  );
  assert.match(install, /steps\.playwright-cache\.outputs\.cache-hit != 'true'/);

  // System packages still need to be present on every fresh GitHub-hosted runner.
  assert.match(workflow, /npx playwright install-deps chromium/);
});

test("Playwright npm cache avoids bundled npm project config before pinning", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  const npmCache = section(
    workflow,
    "- name: Cache npm downloads",
    "- name: Pin npm",
  );
  const npmPin = section(
    workflow,
    "- name: Pin npm",
    "- name: Install dependencies",
  );

  assert.ok(npmCache.includes("actions/cache@caa296126883cff596d87d8935842f9db880ef25"));
  assert.match(npmCache, /path: ~\/\.npm/);
  assert.match(
    npmCache,
    /npm-\$\{\{ runner\.os \}\}-\$\{\{ runner\.arch \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/,
  );
  assert.doesNotMatch(workflow, /cache: npm/);
  assert.match(npmPin, /cd "\$\{RUNNER_TEMP\}"/);
  assert.match(
    npmPin,
    /npm install --global npm@11\.17\.0 --no-audit --no-fund/,
  );
});

test("Playwright Preview dependency install skips legacy lifecycle scripts", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  const dependencyInstall = section(
    workflow,
    "- name: Install dependencies",
    "- name: Resolve Playwright browser cache version",
  );

  assert.match(
    dependencyInstall,
    /npm ci --ignore-scripts --no-audit --no-fund/,
  );
  assert.doesNotMatch(dependencyInstall, /npm run postinstall/);
});

test("Playwright Preview helper actions run on the Node 24 generation", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  assert.ok(workflow.includes("actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd"));
  assert.doesNotMatch(workflow, /actions\/github-script@v[0-9]+/);
  assert.match(workflow, /persist-credentials: false/);
});

test("Playwright Preview rejects Vercel Security Checkpoint responses", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  const accessCheck = section(
    workflow,
    "- name: Verify protected Preview access",
    "- name: Run Playwright against deployed preview",
  );

  assert.match(accessCheck, /x-vercel-mitigated/);
  assert.match(accessCheck, /status\" == \"429\"/);
  assert.match(accessCheck, /Vercel Security Checkpoint/);
  assert.match(accessCheck, /return 1/);
});

test("Playwright production deployment smoke stays lightweight", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  const start = workflow.indexOf("  production-smoke:");
  assert.notEqual(start, -1);
  const productionSmoke = workflow.slice(start);

  assert.match(productionSmoke, /git\.ref == 'master'/);
  assert.match(productionSmoke, /environment == 'production'/);
  assert.match(productionSmoke, /DEPLOYMENT_BASE_URL/);
  assert.match(productionSmoke, /PUBLIC_BASE_URL: https:\/\/www\.bababou\.com/);
  assert.match(productionSmoke, /x-vercel-mitigated/);
  assert.match(productionSmoke, /Vercel Security Checkpoint/);
  assert.match(productionSmoke, /expected protected rewrite/);
  assert.ok(
    productionSmoke.includes(
      'request "$DEPLOYMENT_BASE_URL" "/" "deployment /" "" "/index.html"',
    ),
  );
  assert.match(productionSmoke, /status\" == \"307\"/);
  assert.match(productionSmoke, /redirect_path.*expected_redirect/s);
  assert.ok(
    productionSmoke.includes(
      "^location: https://vercel\\.com/(login|sso-api)",
    ),
  );
  for (const route of [
    "/",
    "/index.html",
    "/test",
    "/en/test",
    "/de/test",
    "/no/test",
    "/test.html",
    "/contact",
    "/policy",
  ]) {
    assert.ok(productionSmoke.includes(`"${route}"`), route);
  }
  assert.doesNotMatch(productionSmoke, /x-vercel-set-bypass-cookie/);
  assert.doesNotMatch(productionSmoke, /npm ci|playwright install|npm test/);
});
