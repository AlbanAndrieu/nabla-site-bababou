import assert from "node:assert/strict";
import test from "node:test";
import {
  auditPrerenderManifest,
  STATIC_LOCALES,
  STATIC_SLUGS,
} from "../scripts/verify-next-prerender.mjs";

function staticFixture() {
  const routes = {};
  for (const locale of STATIC_LOCALES) {
    for (const slug of STATIC_SLUGS) {
      const path = locale === "fr" ? "/" + slug : "/" + locale + "/" + slug;
      routes[path] = { initialRevalidateSeconds: false };
    }
  }
  return { version: 4, routes };
}

test("SSG audit accepts all localized build-time prerender routes", () => {
  const result = auditPrerenderManifest(staticFixture());
  assert.equal(result.passed, true);
  assert.equal(result.checked.length, STATIC_LOCALES.length * STATIC_SLUGS.length);
  assert.deepEqual(result.missing, []);
});

test("SSG audit accepts internal /fr prefix for default locale", () => {
  const manifest = staticFixture();
  manifest.routes["/fr/nre"] = manifest.routes["/nre"];
  delete manifest.routes["/nre"];
  assert.equal(auditPrerenderManifest(manifest).passed, true);
});

test("SSG audit fails closed for an SSR omission or an ISR route", () => {
  const manifest = staticFixture();
  delete manifest.routes["/en/nre"];
  manifest.routes["/de/policy/privacy_policy"].initialRevalidateSeconds = 60;
  const result = auditPrerenderManifest(manifest);
  assert.equal(result.passed, false);
  assert.deepEqual(result.missing, ["en:nre"]);
  assert.deepEqual(result.notStatic, ["/de/policy/privacy_policy"]);
});

test("SSG audit rejects a malformed manifest", () => {
  assert.throws(() => auditPrerenderManifest({}), /prerender-manifest/);
});
