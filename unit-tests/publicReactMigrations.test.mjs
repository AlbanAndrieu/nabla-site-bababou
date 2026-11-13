import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const strip = (s) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const EMAIL_ID = /id="(email-\d{4}-\d{2}-\d{2}-[a-z0-9]+)"/g;

test("React correspondence includes every previously published email without rewriting its text", () => {
  const original = read("public/ca/demande-explications-autorites-competentes-fr.html");
  const component = read("components/documents/PublishedAuthorityCorrespondence.tsx");
  const begin = original.indexOf('<main id="main-content"');
  const end = original.indexOf("</main>", begin);
  const oldMain = original.slice(begin, end + "</main>".length);
  const newBegin = component.indexOf('<div className="ca-archive-body">');
  const newEnd = component.lastIndexOf("\n    </div>\n  );");
  assert.ok(begin > 0 && end > begin && newBegin > 0 && newEnd > newBegin);
  const nativeMain = component.slice(newBegin, newEnd);
  assert.deepEqual([...nativeMain.matchAll(EMAIL_ID)].map(x => x[1]), [...oldMain.matchAll(EMAIL_ID)].map(x => x[1]));
  assert.equal([...nativeMain.matchAll(EMAIL_ID)].length, 13);
  assert.equal(strip(nativeMain), strip(oldMain), "Published correspondence text must remain identical");
  assert.doesNotMatch(component, /dangerouslySetInnerHTML|<script\b|\bfetche?\(/i);
});

test("people directory is native static React, using the existing public ARF dataset", () => {
  const source = read("app/[locale]/people-contacted/page.tsx");
  const model = read("lib/peopleContactedPublic.ts");
  const tree = JSON.parse(read("public/arf.json"));
  assert.equal(tree.children.length, 5);
  assert.deepEqual(tree.children.slice(0, 4).map(x => x.name), ["Norway", "France", "Germany", "International"]);
  assert.match(source, /export const dynamic = "force-static"/);
  assert.match(source, /listPublicContacts\(\)/);
  assert.match(source, /<details open=\{depth === 0\}/);
  assert.match(source, /data-testid="people-react-tree"/);
  assert.match(model, /publicContactUrl/);
  assert.match(model, /publicContactEmail/);
  assert.doesNotMatch(source + model, /dangerouslySetInnerHTML|d3\.layout|OpenRAG|fetch\(/i);
});

test("contact footer has exactly the three reviewed links in React and the historical authority page", () => {
  const footer = read("app/components/Footer.tsx");
  const legacy = read("public/ca/demande-explications-autorites-competentes-fr.html");
  const links = [
    "https://calendly.com/alban-andrieu",
    "https://github.com/AlbanAndrieu/nabla-site-bababou",
  ];
  for (const href of links) {
    assert.ok(footer.includes(`href="${href}"`));
    assert.ok(legacy.includes(`href="${href}"`));
  }
  assert.match(footer, /href=\{contactHref\}/);
  assert.match(legacy, /href="\/contact"/);
  assert.match(footer, /rel="noopener noreferrer"/);
  assert.doesNotMatch(footer, /href="\/(?:eleonore-)?feed\.xml"/);
});

test("legacy HTML and private document protections remain intact until exact-SHA cutover", () => {
  const config = read("next.config.mjs");
  const router = read("lib/mainContentRoute.mjs");
  const people = read("app/[locale]/people-contacted/page.tsx");
  const ca = read("app/[locale]/ca/demande-explications-autorites-competentes-fr/page.tsx");
  assert.doesNotMatch(config, /source: "\/people-contacted\.html"/);
  assert.doesNotMatch(config, /source: "\/ca\/demande-explications-autorites-competentes-fr\.html"/);
  assert.match(router, /"people-contacted"/);
  assert.match(router, /"demande-explications-autorites-competentes-fr"/);
  assert.match(ca, /robots: \{ index: false, follow: true \}/);
  assert.match(people, /localizedPageMetadata\("people-contacted"/);
});
