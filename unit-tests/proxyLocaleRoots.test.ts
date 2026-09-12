import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("locale-only homepage roots redirect directly to the canonical legacy root", async () => {
  const proxy = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");

  assert.match(proxy, /const localeRootRedirects = new Set\(/);
  assert.match(proxy, /routing\.locales[\s\S]*locale !== routing\.defaultLocale/);
  assert.match(proxy, /localeRootRedirects\.has\(request\.nextUrl\.pathname\)/);
  assert.match(
    proxy,
    /NextResponse\.redirect\(new URL\("\/", request\.url\), 307\)/,
  );
  assert.match(
    proxy,
    /pathname === "\/"[\s\S]*NextResponse\.rewrite\(new URL\("\/index\.html"/,
  );
});
