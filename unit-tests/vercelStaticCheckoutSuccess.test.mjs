import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { STATIC_LOCALES, STATIC_SLUGS, auditPrerenderManifest } from "../scripts/verify-next-prerender.mjs";

const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("checkout success page is statically prerenderable with no request searchParams", async () => {
  const [layout, page] = await Promise.all([
    read("app/[locale]/layout.tsx"),
    read("app/[locale]/success/page.tsx"),
  ]);
  assert.match(layout, /generateStaticParams/);
  assert.match(layout, /routing\.locales\.map/);
  assert.match(page, /export const dynamic = "force-static"/);
  assert.doesNotMatch(page, /await searchParams|firstSearchParam/);
  assert.match(page, /<Suspense fallback=/);
  assert.match(page, /<CheckoutSessionReference/);
});

test("receipt reference is display-only, bounded and rendered as escaped React text", async () => {
  const client = await read("components/CheckoutSessionReference.tsx");
  assert.match(client, /^"use client";/);
  assert.match(client, /useSearchParams/);
  assert.match(client, /get\("session_id"\)\?\.trim\(\)\.slice\(0, 200\)/);
  assert.match(client, /<strong>\{label\}<\/strong> \{sessionId\}/);
  assert.match(client, /id="checkout-session-ref" hidden/);
  assert.doesNotMatch(client, /fetch\(|dangerouslySetInnerHTML|localStorage|sessionStorage/);
});

test("all four checkout confirmation routes are included in the SSG manifest gate", () => {
  assert.deepEqual([...STATIC_LOCALES], ["fr", "en", "de", "no"]);
  assert.ok(STATIC_SLUGS.includes("success"));
  const routes = Object.fromEntries(STATIC_LOCALES.map(locale => [
    locale === "fr" ? "/success" : `/${locale}/success`,
    { initialRevalidateSeconds: false },
  ]));
  const verified = auditPrerenderManifest({ routes }, { slugs: ["success"] });
  assert.equal(verified.passed, true);
  assert.equal(verified.checked.length, 4);
  const mutable = structuredClone(routes);
  mutable["/en/success"].initialRevalidateSeconds = 10;
  const unsafe = auditPrerenderManifest({ routes: mutable }, { slugs: ["success"] });
  assert.equal(unsafe.passed, false);
  assert.deepEqual(unsafe.notStatic, ["/en/success"]);
});

test("payment reference metadata forbids indexing and cross-site referer disclosure", async () => {
  const page = await read("app/[locale]/success/page.tsx");
  assert.match(page, /robots: NON_INDEXABLE_ROBOTS/);
  assert.match(page, /referrer: "no-referrer"/);
  assert.doesNotMatch(page, /cookies\(|headers\(|fetch\(|await searchParams/);
});
