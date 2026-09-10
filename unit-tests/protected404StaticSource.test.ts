import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("global 404 remains a protected static-source exception", async () => {
  const [globalNotFound, bridge, static404] = await Promise.all([
    source("app/global-not-found.tsx"),
    source("lib/htmlFromPublic.ts"),
    source("public/404.html"),
  ]);

  assert.match(
    globalNotFound,
    /loadPublicHtmlFragment\("404\.html", "body", "en"\)/,
  );
  assert.match(
    globalNotFound,
    /dangerouslySetInnerHTML=\{\{ __html: staticMarkup \}\}/,
  );

  // The distinctive presentation belongs to public/404.html. Keeping the
  // historical copy/classes out of JSX prevents a gradual full-React rewrite
  // from creating a second source of truth.
  assert.doesNotMatch(globalNotFound, /We can't find that page/);
  assert.doesNotMatch(globalNotFound, /cloak__wrapper/);
  assert.match(static404, /We can't find that page/);
  assert.match(static404, /class="cloak__wrapper"/);
  assert.match(static404, /@keyframes swing/);

  // The bridge is deliberately allow-listed to the single reviewed asset.
  assert.match(bridge, /const PUBLIC_404_FILE = "404\.html" as const/);
  assert.match(bridge, /"public", PUBLIC_404_FILE/);
  assert.match(bridge, /if \(file !== PUBLIC_404_FILE\)/);

  // The standalone 404 is self-contained and must not acquire the Bootstrap
  // dependency being retired from the native Next runtime.
  assert.doesNotMatch(static404, /bootstrap\/5\.2\.1/);
  assert.doesNotMatch(static404, /bootstrap-icons\/1\.9\.1/);
});
