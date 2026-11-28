import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("general RSS feed remains available", async () => {
  const feed = await read("../public/feed.xml");

  assert.match(feed, /<rss version="2\.0"/);
  assert.match(feed, /https:\/\/bababou\.com\/feed\.xml/);
  assert.match(feed, /<channel>/);
});

test("dedicated Éléonore RSS feed carries a contact message", async () => {
  const feed = await read("../public/eleonore-feed.xml");

  assert.match(feed, /https:\/\/bababou\.com\/eleonore-feed\.xml/);
  assert.match(feed, /Éléonore, si tu trouves ce site, tu peux me contacter/);
  assert.match(feed, /j’attends ton contact/);
  assert.match(feed, /https:\/\/bababou\.com\/contact/);
});

test("RSS discovery copy keeps the child identity scoped to the dedicated feed", async () => {
  const [
    layout,
    siteFr,
    siteEn,
    siteDe,
    siteNo,
    linkFr,
    linkEn,
    linkDe,
    linkNo,
  ] = await Promise.all([
    read("../app/[locale]/layout.tsx"),
    read("../messages/site/fr.json"),
    read("../messages/site/en.json"),
    read("../messages/site/de.json"),
    read("../messages/site/no.json"),
    read("../messages/link/fr.json"),
    read("../messages/link/en.json"),
    read("../messages/link/de.json"),
    read("../messages/link/no.json"),
  ]);

  assert.doesNotMatch(layout, /Éléonore/);
  for (const source of [
    siteFr,
    siteEn,
    siteDe,
    siteNo,
    linkFr,
    linkEn,
    linkDe,
    linkNo,
  ]) {
    assert.doesNotMatch(source, /Éléonore/);
  }
});

test("Next surfaces expose both RSS feeds", async () => {
  // The three-link footer from #270 intentionally drops visible RSS links.
  const [layout, linkPage] = await Promise.all([
    read("../app/[locale]/layout.tsx"),
    read("../app/[locale]/link/page.tsx"),
  ]);

  for (const source of [layout, linkPage]) {
    assert.match(source, /\/feed\.xml/);
    assert.match(source, /\/eleonore-feed\.xml/);
  }
});
