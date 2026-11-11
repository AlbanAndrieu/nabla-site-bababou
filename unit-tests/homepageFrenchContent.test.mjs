import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { homeAudienceCopy, homeAudienceCards } from "../lib/homeAudienceCopy.mjs";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("French is now native in both child and father pages, without browser translation", () => {
  const { child, fathers } = homeAudienceCopy("fr");
  assert.match(child.title, /Ma chère fille/);
  assert.match(child.hopeTitle, /Patience et espoir/);
  assert.match(fathers.title, /papas/);
  assert.match(fathers.noticeTitle, /Documents sur ce site/);
  for (const src of ["app/[locale]/home-preview/page.tsx","app/[locale]/abduction/page.tsx"]) {
    assert.doesNotMatch(read(src), /translate\.google|<Script|googleTranslateElementInit/i);
  }
});

test("German, Norwegian and English audiences have native headings and letters", () => {
  const titles = {
    en: ["My dear daughter","For fathers"],
    de: ["Meine liebe Tochter","Für Väter"],
    no: ["Min kjære datter","For fedre"],
  };
  for (const [locale, [child, fathers]] of Object.entries(titles)) {
    assert.ok(homeAudienceCopy(locale).child.title.startsWith(child), locale);
    assert.ok(homeAudienceCopy(locale).fathers.title.startsWith(fathers), locale);
    assert.equal(homeAudienceCopy(locale).child.letter.length, 3);
  }
});

test("French child page keeps the journey and parents page carries private identity notice", () => {
  const child = homeAudienceCopy("fr").child;
  assert.match(homeAudienceCopy("fr").fathers.identityText, /vie privée/);
  assert.match(child.journeyTitle, /longue recherche/);
  assert.match(child.letter[2], /plus qu’hier et moins que demain/);
  assert.deepEqual(homeAudienceCards("fr", "child").map(c => c.href),[
    "#preview-opening","#preview-hope","#preview-journey","#preview-letter","/people-contacted.html","#preview-identity"
  ]);
  assert.doesNotMatch(JSON.stringify(child), /14CV[0-9]+/);
});

test("native support copy, disclosure and translator headings exist in four languages", () => {
  for (const locale of ["fr","en","de","no"]) {
    const c = homeAudienceCopy(locale).fathers;
    for (const key of ["abductionTitle","translatorsTitle","norwegianTitle","germanTitle","associationsTitle","noticeTitle","fathersTitle","contactTitle"]) {
      assert.ok(typeof c[key] === "string" && c[key].length >= 3, locale+" "+key);
    }
  }
});
