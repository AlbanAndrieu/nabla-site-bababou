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
