import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const script = readFileSync(
  new URL("../public/site-analytics.js", import.meta.url),
  "utf8",
);
const beginning = script.indexOf("\tfunction isLikelyLocalHost() {");
const end = script.indexOf(
  "\n\tfunction skipRemoteAnalyticsOnLocalDev()",
  beginning,
);
assert.ok(
  beginning !== -1 && end > beginning,
  "Expected existing analytics local-host guard",
);
const isolatedGuard = script.slice(beginning, end);

function guard(hostname) {
  return runInNewContext(`${isolatedGuard}\nisLikelyLocalHost();`, {
    location: { hostname },
  });
}

test("loopback and .localhost environments do not load remote analytics by default", () => {
  for (const hostname of [
    "localhost",
    "LOCALHOST",
    "localhost.",
    "dev.localhost",
    "127.0.0.1",
    "127.9.8.7",
    "::1",
    "[::1]",
    "0.0.0.0",
  ]) {
    assert.equal(guard(hostname), true, hostname);
  }
});

test("ordinary public names and non-loopback addresses retain their behavior", () => {
  for (const hostname of [
    "bababou.com",
    "example.com",
    "localhost.evil.example",
    "some-localhost",
    "128.0.0.1",
    "127.999.1.1",
    "",
  ]) {
    assert.equal(guard(hostname), false, hostname);
  }
});

test("missing location fails closed to the previous guarded behavior", () => {
  assert.equal(
    runInNewContext(`${isolatedGuard}\nisLikelyLocalHost();`, {}),
    false,
  );
});

test("opt-in query parameter remains the only existing local test override", () => {
  assert.match(script, /nablaEnableThirdParty=1/);
  assert.match(
    script,
    /isLikelyLocalHost\(\) && !thirdPartyAnalyticsBypassLocal\(\)/,
  );
  assert.match(script, /disable_session_recording: true/);
  assert.match(script, /mask_all_text: true/);
  assert.match(script, /mask_all_element_attributes: true/);
});

test("public review pages never initialize tracking, even with full mode and local test override", () => {
  for (const pathname of [
    "/home-preview",
    "/en/home-preview",
    "/de/home-preview",
    "/no/home-preview",
    "/fr/home-preview",
    "/home-preview/",
    "/en/%68ome-preview",
    "/en/%2568ome-preview",
  ]) {
    let accessed = false;
    const forbidden = new Proxy(
      {},
      {
        get() {
          accessed = true;
          throw new Error(
            "Analytics touched the DOM or window on private review route",
          );
        },
      },
    );
    const context = {
      location: {
        pathname,
        search: "?nablaEnableThirdParty=1",
        hostname: "bababou.com",
      },
      document: forbidden,
      window: forbidden,
    };
    assert.doesNotThrow(
      () => runInNewContext(script, context, { timeout: 1000 }),
      pathname,
    );
    assert.equal(accessed, false, pathname);
  }
});

test("the private-review analytics guard is restricted to the four locale variants", () => {
  const start = script.indexOf("\tfunction isHomePreviewReview() {");
  const end = script.indexOf("\n\tif (isHomePreviewReview()) return;", start);
  assert.ok(start !== -1 && end > start);
  const guard = script.slice(start, end);
  const check = (pathname) =>
    runInNewContext(
      `${guard}\nisHomePreviewReview();`,
      { location: { pathname } },
      { timeout: 1000 },
    );
  for (const pathname of [
    "/",
    "/en/nre",
    "/policy",
    "/contact",
    "/de/central-authorities",
  ]) {
    assert.equal(check(pathname), false, pathname);
  }
  for (const pathname of [
    "/home-preview",
    "/fr/home-preview",
    "/en/home-preview",
  ]) {
    assert.equal(check(pathname), true, pathname);
  }
});
