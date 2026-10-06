import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

test("legacy HTML fallback is handled after Next public file resolution", async () => {
  const [next, vercelSource, handler, browserSpec, static404] =
    await Promise.all([
      read("next.config.mjs"),
      read("vercel.json"),
      read("app/__legacy-html-not-found__/route.ts"),
      read("tests/next-not-found.spec.ts"),
      read("public/404.html"),
    ]);

  assert.equal((JSON.parse(vercelSource) as { rewrites?: unknown }).rewrites, undefined);
  assert.match(next, /async rewrites\(\)[\s\S]*?afterFiles:/);
  assert.match(next, /source: "\/:path\*\.html"/);
  assert.match(next, /destination: "\/__legacy-html-not-found__"/);
  assert.match(handler, /status: 404/);
  assert.match(handler, /"Cache-Control": "no-store, max-age=0"/);
  assert.match(handler, /"X-Robots-Tag": "noindex, nofollow"/);
  assert.match(browserSpec, /existing legacy HTML stays ahead of the fallback rewrite/);
  assert.match(browserSpec, /toHaveAttribute\("lang", "en"\)/);
  assert.match(static404, /cloak__wrapper/);
});
