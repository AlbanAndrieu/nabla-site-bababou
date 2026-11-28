import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), "utf8");
const hrefCount = (source, href) =>
  [...source.matchAll(/\bhref\s*(?:=|:)\s*"([^"]+)"/g)].filter(
    (match) => match[1] === href,
  ).length;

test("preview keeps one owner for each legacy navigation link", () => {
  const preview = read("app/[locale]/home-preview/page.tsx");
  const people = read("components/home/LegacyPeopleSection.tsx");
  const legal = read("components/home/LegacyLegalResourcesSection.tsx");

  for (const [href, owner] of [
    ["/people-contacted.html", people],
    ["/central-authorities.html", people],
    ["/for-fathers.html", legal],
  ]) {
    assert.equal(
      hrefCount(owner, href),
      1,
      href + " must remain in its approved section",
    );
    assert.equal(
      hrefCount(preview, href),
      0,
      href + " must not be duplicated in resources",
    );
  }
});

test("preview keeps RSS feeds discoverable without visible duplicate links (#270)", () => {
  const preview = read("app/[locale]/home-preview/page.tsx");
  const layout = read("app/[locale]/layout.tsx");
  for (const href of ["/feed.xml", "/eleonore-feed.xml"]) {
    assert.equal(hrefCount(preview, href), 0, href);
    assert.equal(hrefCount(layout, href), 1, href);
  }
  assert.match(layout, /type="application\/rss\+xml"/);
});
