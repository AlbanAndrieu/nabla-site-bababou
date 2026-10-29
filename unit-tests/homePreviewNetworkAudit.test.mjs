import assert from "node:assert/strict";
import test from "node:test";
import { isUnexpectedReviewRequest } from "../lib/homePreviewNetworkAudit.mjs";

const site = "https://bababou.com/home-preview";

test("allow only local assets and Next route requests for homepage review", () => {
  for (const candidate of [
    "https://bababou.com/home-preview",
    "https://bababou.com/site-analytics.js",
    "https://bababou.com/_next/static/chunks/home.js",
    "https://bababou.com/assets/local-image.svg",
    "data:image/svg+xml;base64,PHN2Zy8+",
  ]) {
    assert.equal(isUnexpectedReviewRequest(candidate, site), false, candidate);
  }
});

test("fail privacy audit for any third-party HTTP(S) host, not just listed trackers", () => {
  for (const candidate of [
    "https://www.google-analytics.com/g/collect",
    "https://static.cloudflareinsights.com/beacon.min.js",
    "https://new-unlisted-analytics.example/pixel",
    "https://bababou.com.evil.example/anything",
    "https://analytics.bababou.com/collect",
    "http://bababou.com/script.js",
  ]) {
    assert.equal(isUnexpectedReviewRequest(candidate, site), true, candidate);
  }
});

test("reject first-party analytics endpoints and malformed URLs", () => {
  for (const candidate of [
    "https://bababou.com/_vercel/insights/script.js",
    "https://bababou.com/_vercel/insights/view",
    "https://bababou.com/_vercel/speed-insights/vitals",
    "https://bababou.com/cdn-cgi/rum",
    "not a URL",
  ]) {
    assert.equal(isUnexpectedReviewRequest(candidate, site), true, candidate);
  }
});

test("block first-party POST/beacon traffic while allowing safe asset GETs", () => {
  const endpoint = "https://bababou.com/api/new-tracker";
  assert.equal(isUnexpectedReviewRequest(endpoint, site, "POST"), true);
  assert.equal(isUnexpectedReviewRequest(endpoint, site, "post"), true);
  assert.equal(isUnexpectedReviewRequest(endpoint, site, "PUT"), true);
  assert.equal(isUnexpectedReviewRequest(endpoint, site, "GET"), false);
  assert.equal(
    isUnexpectedReviewRequest("https://bababou.com/_next/static/app.js", site, "HEAD"),
    false,
  );
});
