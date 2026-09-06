import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const DOMAIN_CATALOGS = [
  ["site", "site"],
  ["contact", "contactPage"],
  ["email", "email"],
  ["link", "linkPage"],
] as const;

const MIGRATED_LEGACY_NAMESPACES = ["contactPage", "email", "linkPage"] as const;

test("root install stays free of the retired dist-copy postinstall", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.equal("postinstall" in (packageJson.scripts ?? {}), false);
  assert.equal("copyfiles" in (packageJson.devDependencies ?? {}), false);
  assert.equal("d3" in (packageJson.devDependencies ?? {}), false);
});

test("Git-integrated Vercel deployment does not require a local Vercel CLI", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  assert.equal("vercel" in (packageJson.dependencies ?? {}), false);
  for (const script of ["dev:v", "build:v", "start:v"]) {
    assert.equal(script in (packageJson.scripts ?? {}), false);
  }
  await assert.rejects(access(new URL("../build.sh", import.meta.url)));
});

test("analytics and devtools use external/platform integration instead of unused npm SDKs", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const retiredDirectDependencies = [
    "@datadog/browser-rum",
    "@opentelemetry/api",
    "@opentelemetry/api-logs",
    "@opentelemetry/instrumentation",
    "@opentelemetry/sdk-logs",
    "@vercel/analytics",
    "@vercel/otel",
    "@vercel/speed-insights",
    "@vercel/toolbar",
    "next-devtools-mcp",
  ];

  for (const dependency of retiredDirectDependencies) {
    assert.equal(dependency in (packageJson.dependencies ?? {}), false);
  }
  assert.equal("lodash-es" in (packageJson.dependencies ?? {}), false);
  assert.ok(packageJson.devDependencies?.["lodash-es"]);

  const [analytics, legacyTestScript, nextInstructions] = await Promise.all([
    readFile(new URL("../public/site-analytics.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.js", import.meta.url), "utf8"),
    readFile(
      new URL("../.github/copilot-instructions-nextjs.md", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(analytics, /\/_vercel\/insights\/script\.js/);
  assert.match(analytics, /\/_vercel\/speed-insights\/script\.js/);
  assert.match(analytics, /datadoghq-browser-agent\.com/);
  assert.doesNotMatch(
    legacyTestScript,
    /@vercel\/(?:analytics|speed-insights)/,
  );
  assert.match(nextInstructions, /Next\.js[^\n]*16\.3\.4/);
  assert.doesNotMatch(nextInstructions, /cd app|vercel deploy|app\/package\.json/);

  const mcpConfig = await readFile(new URL("../.mcp.json", import.meta.url), "utf8");
  assert.match(mcpConfig, /next-devtools-mcp@latest/);
  await assert.rejects(access(new URL("../instrumentation.ts", import.meta.url)));
});

test("deployment docs describe Git integration instead of the retired app-root CLI flow", async () => {
  const [vercelGuide, actionsGuide] = await Promise.all([
    readFile(
      new URL("../.github/vercel-deployment-instructions.md", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../docs/GITHUB_ACTIONS_SETUP.md", import.meta.url), "utf8"),
  ]);

  for (const guide of [vercelGuide, actionsGuide]) {
    assert.match(guide, /Vercel Git integration/i);
    assert.doesNotMatch(guide, /rootDirectory["`:\s]+app|cd app|VERCEL_TOKEN/);
  }
});

test("OpenCommit stays available as local commit tooling", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.ok(packageJson.devDependencies?.opencommit);
  assert.equal(packageJson.scripts?.oco, "node scripts/run-opencommit.mjs");
  assert.equal(packageJson.scripts?.opencommit, "node scripts/run-opencommit.mjs");
  await access(new URL("../scripts/run-opencommit.mjs", import.meta.url));
  await access(new URL("../.opencommit-commitlint", import.meta.url));
});

test("Wrangler stays retired from the root deployment graph", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.equal(packageJson.devDependencies?.wrangler, undefined);
  for (const script of ["dev:wrangler", "start:wrangler", "deploy:wrangler"]) {
    assert.equal(packageJson.scripts?.[script], undefined);
  }
  await assert.rejects(access(new URL("../wrangler.jsonc", import.meta.url)));
});


test("protected 404 loader does not retain the retired sanitize-html package", async () => {
  const [packageSource, loader] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../lib/htmlFromPublic.ts", import.meta.url), "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  assert.equal(packageJson.dependencies?.["sanitize-html"], undefined);
  assert.equal(packageJson.scripts?.["check:sanitize-html"], undefined);
  assert.doesNotMatch(loader, /sanitize-html|sanitizeHtml/);
});

test("public does not carry a second package/runtime manifest", async () => {
  await assert.rejects(access(new URL("../public/package.json", import.meta.url)));
});

test("hosted payment result routes do not require Stripe SDK packages", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as { dependencies?: Record<string, string> };

  for (const dependency of [
    "@stripe/react-stripe-js",
    "@stripe/stripe-js",
    "stripe",
  ]) {
    assert.equal(dependency in (packageJson.dependencies ?? {}), false);
  }
});

test("keeps legacy base catalogs versioned but does not load them at runtime", async () => {
  const [requestConfig, messageLoader, englishMessages, frenchMessages] =
    await Promise.all([
      readFile(new URL("../i18n/request.ts", import.meta.url), "utf8"),
      readFile(new URL("../i18n/messages.ts", import.meta.url), "utf8"),
      readFile(new URL("../messages/en.json", import.meta.url), "utf8"),
      readFile(new URL("../messages/fr.json", import.meta.url), "utf8"),
    ]);

  assert.match(requestConfig, /loadMessages/);
  assert.match(messageLoader, /SITE_LOADERS/);
  assert.match(messageLoader, /CONTACT_LOADERS/);
  assert.match(messageLoader, /EMAIL_LOADERS/);
  assert.match(messageLoader, /LINK_LOADERS/);
  assert.doesNotMatch(messageLoader, /BASE_LOADERS/);
  assert.doesNotMatch(messageLoader, /@\/messages\/(?:en|fr)\.json/);
  assert.doesNotMatch(`${requestConfig}\n${messageLoader}`, /messages\/migration/);
  assert.doesNotThrow(() => JSON.parse(englishMessages));
  assert.doesNotThrow(() => JSON.parse(frenchMessages));
});

test("legacy base catalogs do not duplicate migrated namespace ownership", async () => {
  const catalogs = await Promise.all(
    ["en", "fr"].map(async (locale) =>
      JSON.parse(
        await readFile(
          new URL(`../messages/${locale}.json`, import.meta.url),
          "utf8",
        ),
      ) as Record<string, unknown>,
    ),
  );

  for (const catalog of catalogs) {
    for (const namespace of MIGRATED_LEGACY_NAMESPACES) {
      assert.equal(namespace in catalog, false);
    }
  }
});

for (const [directory, namespace] of DOMAIN_CATALOGS) {
  test(`${directory} catalogs have matching top-level namespace ownership`, async () => {
    const [englishCatalog, frenchCatalog] = await Promise.all([
      readFile(
        new URL(`../messages/${directory}/en.json`, import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(`../messages/${directory}/fr.json`, import.meta.url),
        "utf8",
      ),
    ]);

    const en = JSON.parse(englishCatalog) as Record<string, unknown>;
    const fr = JSON.parse(frenchCatalog) as Record<string, unknown>;

    assert.deepEqual(Object.keys(en), [namespace]);
    assert.deepEqual(Object.keys(fr), [namespace]);
  });
}
