import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const associations = [
  ["paternet", "http://paternet.fr/tag/combat-des-peres//", "auction-law-svgrepo-com.svg"],
  ["sos-papa", "http://www.sospapa.net/", "sos-warning-svgrepo-com.svg"],
  ["sos-parents-japan", "http://sos-parents-japan.org/", "japan-kanji-svgrepo-com.svg"],
];

test("associations keep the approved links and local art from public/index.html", () => {
  const source = read("public/index.html");
  const component = read("components/home/LegacyAssociationsSection.tsx");
  for (const [id, href, icon] of associations) {
    assert.ok(source.includes('href="' + href + '"'), id + " published link");
    assert.ok(source.includes('src="assets/' + icon + '"'), id + " published image");
    assert.ok(component.includes('id: "' + id + '"'), id + " stable id");
    assert.ok(component.includes('href: "' + href + '"'), id + " unchanged href");
    assert.ok(component.includes('iconSrc: "/assets/' + icon + '"'), id + " local image");
    assert.ok(existsSync(new URL("public/assets/" + icon, root)), id + " bundled asset");
  }
  assert.match(component, /id="preview-associations"/);
  assert.match(component, /lang=\{locale\}/);
  assert.match(component, /aria-labelledby="preview-associations-heading"/);
});

test("broken icon only falls back to text and never fetches from an external host", () => {
  const source = read("components/home/LegacyAssociationsSection.tsx");
  assert.match(source, /failedIcons\.has\(id\)/);
  assert.match(source, /onError=\{\(\) =>\s*setFailedIcons\(/);
  assert.match(source, /data-association-icon-fallback=\{id\}/);
  assert.match(source, /<Image\s+src=\{iconSrc\}\s+alt=""/);
  assert.match(source, /<span>\{name\}<\/span>/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(source, /src=\{"https?:\/\//);
});

test("association links have keyboard focus, hover and responsive layout", () => {
  const styles = read("components/home/LegacyAssociationsSection.module.css");
  assert.match(styles, /\.link:focus-visible/);
  assert.match(styles, /\.link:hover/);
  assert.match(styles, /grid-template-columns:/);
  assert.match(styles, /touch-action: manipulation/);
  assert.doesNotMatch(styles, /transition:\s*all\b|outline:\s*none\b/);
});
