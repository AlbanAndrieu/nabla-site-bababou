import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

test("legacy HTML fallback runs in Vercel's miss phase before dynamic Next routes", async () => {
  const [next, vercelSource, handler, browserSpec, static404] =
    await Promise.all([
      read("next.config.mjs"),
      read("vercel.json"),
      read("app/__legacy-html-not-found__/route.ts"),
      read("tests/next-not-found.spec.ts"),
      read("public/404.html"),
    ]);

  const vercel = JSON.parse(vercelSource) as {
    routes?: Array<{
      handle?: string;
      src?: string;
      dest?: string;
      check?: boolean;
      status?: number;
      headers?: Record<string, string>;
    }>;
  };
  const routes = vercel.routes ?? [];

  assert.deepEqual(routes[0], { handle: "miss" });
  assert.equal(routes[1]?.src, "/(.*)\\.html$");
  assert.equal(routes[1]?.dest, "/__legacy-html-not-found__");
  assert.equal(routes[1]?.check, true);
  assert.equal(routes[1]?.status, 404);
  assert.equal(routes[1]?.headers?.["cache-control"], "no-store, max-age=0");
  assert.equal(routes[1]?.headers?.["x-robots-tag"], "noindex, nofollow");
  assert.doesNotMatch(
    next,
    /source:\s*"\/:path\*\.html"/,
    "Next rewrites must not mutate the original legacy URL before Vercel's miss phase",
  );

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
