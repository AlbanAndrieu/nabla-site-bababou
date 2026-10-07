import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

test("legacy HTML fallback is filesystem-first through Next afterFiles", async () => {
  const [next, vercelSource, handler, browserSpec, static404] =
    await Promise.all([
      read("next.config.mjs"),
      read("vercel.json"),
      read("app/__legacy-html-not-found__/route.ts"),
      read("tests/next-not-found.spec.ts"),
      read("public/404.html"),
    ]);

  const vercel = JSON.parse(vercelSource) as {
    routes?: Array<{ handle?: string; src?: string; dest?: string }>;
  };

  assert.equal(
    vercel.routes,
    undefined,
    "Vercel routes must not bypass Next afterFiles/filesystem ordering",
  );
  assert.match(next, /async rewrites\(\)/);
  assert.match(next, /afterFiles:\s*\[/);
  assert.match(next, /source:\s*"\/:path\*\.html"/);
  assert.match(next, /destination:\s*"\/__legacy-html-not-found__"/);
  assert.doesNotMatch(next, /beforeFiles:\s*\[[^\]]*__legacy-html-not-found__/s);

  assert.match(handler, /status: 404/);
  assert.match(handler, /"Cache-Control": "no-store, max-age=0"/);
  assert.match(handler, /"X-Robots-Tag": "noindex, nofollow"/);
  assert.match(
    browserSpec,
    /existing legacy HTML stays ahead of the fallback rewrite/,
  );
  assert.match(browserSpec, /toHaveAttribute\("lang", "en"\)/);
  assert.match(static404, /cloak__wrapper/);
});
