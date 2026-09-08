import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = resolve(projectRoot, "public");

async function collectHtml(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtml(absolute)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(absolute);
    }
  }
  return files;
}

test("legacy HTML does not own a direct Google loader", async () => {
  for (const path of await collectHtml(publicRoot)) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(
      source,
      /<script[^>]+translate\.google\.com\/translate_a\/element\.js/i,
    );
  }
});

test("site-google-translate owns the retained Google Translate fallback", async () => {
  const source = await readFile(
    resolve(publicRoot, "site-google-translate.js"),
    "utf8",
  );

  assert.match(
    source,
    /https:\/\/translate\.google\.com\/translate_a\/element\.js\?cb=googleTranslateElementInit/,
  );
  assert.match(source, /window\.googleTranslateElementInit/);
  assert.match(source, /__NABLA_GOOGLE_TRANSLATE_STARTED/);
  assert.match(source, /INCLUDED_LANGS/);
});

test("google-translate-config remains a compatibility shim, not a second loader", async () => {
  const source = await readFile(
    resolve(publicRoot, "google-translate-config.js"),
    "utf8",
  );

  assert.match(source, /site-google-translate\.js/);
  assert.match(source, /__NABLA_GOOGLE_TRANSLATE_STARTED/);
  assert.doesNotMatch(
    source,
    /translate\.google\.com\/translate_a\/element\.js/,
  );
});

test("site-widgets no longer owns Google Translate bootstrap", async () => {
  const [widgets, component] = await Promise.all([
    readFile(resolve(publicRoot, "site-widgets.js"), "utf8"),
    readFile(resolve(projectRoot, "components/SiteWidgetsScript.tsx"), "utf8"),
  ]);

  assert.doesNotMatch(widgets, /googleTranslateElementInit/);
  assert.doesNotMatch(widgets, /__NABLA_GOOGLE_TRANSLATE_STARTED/);
  assert.doesNotMatch(widgets, /data-no-google-translate/);
  assert.doesNotMatch(component, /noGoogleTranslate|data-no-google-translate/);
});

test("every translated legacy page keeps the Google Translate fallback explicitly", async () => {
  for (const path of await collectHtml(publicRoot)) {
    const source = await readFile(path, "utf8");
    const hasWidgets = /<script[^>]+site-widgets\.js/i.test(source);
    const hasTranslate = /<script[^>]+site-google-translate\.js/i.test(source);

    if (hasWidgets && !path.endsWith("/404.html")) {
      assert.equal(hasTranslate, true, path);
    }
  }
});
