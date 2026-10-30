import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { homeAudienceCopy, homeAudienceCards } from "../lib/homeAudienceCopy.mjs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const locales=["fr","en","de","no"];

test("P1: classic Dear Daughter letter and original love-quote layout are retained",()=>{
  const home=read("components/home/ChildHomeSections.tsx");
  const gallery=read("components/home/LegacyStoryGallerySection.module.css");
  const media=read("components/home/GalleryCardMedia.tsx");
  const letter=read("components/home/ChildHomeSections.module.css");
  assert.match(home,/homeStyles\.opening/);
  assert.match(letter,/\.opening h3::before/);
  assert.match(letter,/border-inline-start: 5px solid/);
  assert.match(media,/data-gallery-variant=\{variant\}/);
  assert.match(gallery,/data-gallery-variant="quote"/);
  assert.match(gallery,/data-gallery-variant="translator"/);
  assert.match(gallery,/object-fit: contain/);
  assert.match(gallery,/249 \/ 203/);
});

test("P2: picture ratios, keyboard focus, responsive grid and forced colors",()=>{
  const css=read("components/home/LegacyStoryGallerySection.module.css");
  const letter=read("components/home/ChildHomeSections.module.css");
  assert.match(css,/@media \(max-width: 40rem\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/forced-colors: active/);
  assert.match(letter,/forced-colors: active/);
  assert.doesNotMatch(letter,/outline:\s*none|transition:\s*all/);
});

test("P3: the restored journey and private notice have native FR EN DE NO copy",()=>{
  const home=read("components/home/ChildHomeSections.tsx");
  const parents=read("components/home/AbductionResources.tsx");
  assert.match(home,/id="preview-journey"/);
  assert.doesNotMatch(home,/id="preview-identity"/);
  assert.match(parents,/id="identity-notice"/);
  assert.match(parents,/childAudiencePath\(locale, !isHomeCutoverEnabled\(\)\)/);
  assert.match(read("app/[locale]/abduction/page.tsx"),/childAudiencePath\(locale, !isHomeCutoverEnabled\(\)\)/);
  for(const locale of locales){
    const {child,fathers}=homeAudienceCopy(locale);
    assert.ok(child.journeyTitle.length>8,locale);
    assert.ok(child.journeyText.length>45,locale);
    assert.ok(fathers.identityTitle.length>20,locale);
    assert.equal(homeAudienceCards(locale,"child")[2].href,"#preview-journey");
    assert.equal(homeAudienceCards(locale,"fathers").length,7);
  }
});

test("P4: public review avoids individual IDs and keeps outbound links safe",()=>{
  const data=read("lib/homeAudienceCopy.mjs");
  const parents=read("components/home/AbductionResources.tsx");
  const review=read("app/[locale]/home-preview/page.tsx");
  assert.doesNotMatch(data,/14CV[0-9]+|goo\.gl\/maps|passport-fr-bababou/i);
  assert.match(parents,/noopener noreferrer/);
  assert.match(review,/robots: \{ index: false, follow: false \}/);
  assert.match(read("app/[locale]/abduction/page.tsx"),/robots: \{ index: false, follow: false \}/);
});
