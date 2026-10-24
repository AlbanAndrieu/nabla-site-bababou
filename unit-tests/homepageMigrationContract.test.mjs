import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), "utf8");
const supported = ["fr", "en", "de", "no"];

test("homepage preview catalogs are complete across all four locales", () => {
  const catalogs = supported.map((locale) =>
    JSON.parse(read(`messages/homepage-preview/${locale}.json`)).homepagePreview,
  );
  const baseline = Object.keys(catalogs[0]).sort();
  for (const [i, catalog] of catalogs.entries()) {
    assert.deepEqual(Object.keys(catalog).sort(), baseline, supported[i]);
    for (const [key, value] of Object.entries(catalog)) {
      assert.ok(typeof value === "string" && value.trim().length > 0, `${supported[i]}:${key}`);
    }
  }
  assert.ok(baseline.includes("contact") && baseline.includes("legacy"));
});

test("preview is opt-in, non-indexable and cannot replace the approved homepage", () => {
  const page = read("app/[locale]/home-preview/page.tsx");
  assert.match(page, /process\.env\.HOMEPAGE_PREVIEW_ENABLED === "true"/);
  assert.match(page, /if \(!previewEnabled\(\)\) notFound\(\)/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /alternates: \{ canonical: "\/" \}/);
  assert.match(page, /getTranslations\("homepagePreview"\)/);
  assert.match(read("proxy.ts"), /NextResponse\.rewrite\(new URL\("\/index\.html"/);
  assert.match(read("app/[locale]/page.tsx"), /redirect\("\/"\)/);
  assert.ok(existsSync(join(root, "public/index.html")));
});

test("preview uses accessible navigation and keeps legacy resources available", () => {
  const page = read("app/[locale]/home-preview/page.tsx");
  assert.doesNotMatch(page, /<SkipToMainContent \/>/);
  const header = read("components/RouteHeader.tsx");
  assert.match(header, /isHomePreview \? \(/);
  assert.match(header, /<a className="skip-to-main" href="#main-content">/);
  assert.match(page, /<main id="main-content"/);
  assert.match(page, /aria-labelledby="preview-title"/);
  assert.match(page, /href="#preview-contact"/);
  assert.match(read("components/home/LegacyContactSection.tsx"), /mailto:aa@bababou\.com/);
  for (const target of ["people-contacted.html", "for-fathers.html", "feed.xml"]) {
    assert.ok(existsSync(join(root, "public", target)), target);
    assert.ok(page.includes('/' + target), target);
  }
  const css = read("app/[locale]/home-preview/page.module.css");
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /flex-wrap: wrap/);
});

test("preview remains out of the public sitemap and canonical page catalog", () => {
  const catalog = read("lib/sitePageCatalog.ts");
  const sitemap = read("app/sitemap.ts");
  assert.doesNotMatch(catalog, /"home-preview":/);
  assert.doesNotMatch(sitemap, /home-preview/);
  assert.match(catalog, /if \(slug === "index"\) return "\/"/);
});

test("homepage preview translations use the existing next-intl catalog", () => {
  const loader = read("i18n/messages.ts");
  assert.match(loader, /HOMEPAGE_PREVIEW_LOADERS/);
  assert.match(loader, /homepagePreview,/);
  for (const locale of supported) {
    assert.ok(loader.includes(`messages/homepage-preview/${locale}.json`), locale);
  }
});

test("first migrated contact section matches the approved legacy English text", () => {
  const legacy = read("public/index.html");
  const component = read("components/home/LegacyContactSection.tsx");
  const page = read("app/[locale]/home-preview/page.tsx");
  const text = (value) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const approvedHeading = legacy.match(
    /<h3 id="contact-me-heading"[^>]*>([\s\S]*?)<\/h3>/,
  )?.[1];
  const approvedLead = legacy.match(
    /<p class="contact-me-card__lead"[^>]*>([\s\S]*?)<\/p>/,
  )?.[1];
  const approvedReassurance = legacy.match(
    /<p class="contact-me-card__reassurance"[^>]*>([\s\S]*?)<\/p>/,
  )?.[1];
  const migratedHeading = component.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];
  const migratedReassurance = component.match(
    /<p>\s*(You can contact me[\s\S]*?)<\/p>/,
  )?.[1];

  assert.ok(approvedHeading && approvedLead && approvedReassurance);
  assert.ok(migratedHeading && migratedReassurance);
  assert.equal(text(migratedHeading), text(approvedHeading));
  assert.equal(text(migratedReassurance), text(approvedReassurance));
  assert.equal(text(approvedLead), "Email me at: aa@bababou.com");
  assert.match(component, /href="mailto:aa@bababou\.com"/);
  assert.match(component, /lang="en"/);
  assert.match(component, /aria-labelledby="preview-contact-heading"/);
  assert.match(page, /<LegacyContactSection \/>/);
  assert.match(page, /href="#preview-contact"/);
  assert.doesNotMatch(page, /href="mailto:aa@bababou\.com"/);
});

test("second migrated message section matches all approved English paragraphs", () => {
  const legacy = read("public/index.html");
  const component = read("components/home/LegacyMessageSection.tsx");
  const page = read("app/[locale]/home-preview/page.tsx");
  const approved = legacy.match(
    /<h3 class="text-info mb-3">A Message from Your Papa:<\/h3>\s*<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/,
  )?.[1];
  const migrated = component.match(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/)?.[1];
  assert.ok(approved && migrated, "missing message blockquote");

  const normalizeParagraphs = (block) =>
    [...block.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((match) =>
      match[1]
        .replace(/\{" "\}/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );

  const originalParagraphs = normalizeParagraphs(approved);
  assert.equal(originalParagraphs.length, 3);
  assert.deepEqual(normalizeParagraphs(migrated), originalParagraphs);
  assert.match(component, /lang="en"/);
  assert.match(component, /aria-labelledby="preview-letter-heading"/);
  assert.match(component, /<h2 id="preview-letter-heading">A Message from Your Papa:<\/h2>/);
  assert.match(page, /<LegacyMessageSection \/>/);
  assert.ok(
    page.indexOf("<LegacyContactSection />") < page.indexOf("<LegacyMessageSection />"),
    "preserve the legacy section order",
  );
});

test("migrated homepage sections follow Vercel Web Interface Guidelines", () => {
  const previewCss = read("app/[locale]/home-preview/page.module.css");
  const contactCss = read("components/home/LegacyContactSection.module.css");
  const messageCss = read("components/home/LegacyMessageSection.module.css");

  assert.match(previewCss, /\.main a:hover/);
  assert.match(previewCss, /:focus-visible/);
  assert.match(previewCss, /text-wrap: balance/);
  assert.match(previewCss, /scroll-margin-top/);
  assert.match(contactCss, /\.section a:hover/);
  assert.match(contactCss, /:focus-visible/);
  assert.match(messageCss, /text-wrap: balance/);
  assert.match(messageCss, /scroll-margin-top/);
  for (const stylesheet of [previewCss, contactCss, messageCss]) {
    assert.doesNotMatch(stylesheet, /transition:\s*all\b/);
    assert.doesNotMatch(stylesheet, /outline:\s*none\b/);
  }
});

test("found-website section preserves the approved notice and footer tagline", () => {
  const legacy = read("public/index.html");
  const component = read("components/home/LegacyFoundWebsiteSection.tsx");
  const page = read("app/[locale]/home-preview/page.tsx");

  const note = legacy.match(
    /<div class="contact-me-note[^"]*"[^>]*>([\s\S]*?)<\/div>/,
  )?.[1];
  const tagline = legacy.match(
    /<p class="special-message-footer-tagline[^"]*"[^>]*>([\s\S]*?)<\/p>/,
  )?.[1];
  assert.ok(note && tagline, "approved legacy sections are missing");

  const normalize = (value) => value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const originalHeading = note.match(
    /<p[^>]*id="found-website-heading"[^>]*>([\s\S]*?)<\/p>/,
  )?.[1];
  const originalNotice = note.match(
    /<p class="mb-0">([\s\S]*?)<\/p>/,
  )?.[1];
  const reactHeading = component.match(
    /<h2 id="preview-found-website-heading">([\s\S]*?)<\/h2>/,
  )?.[1];
  const reactNotice = component.match(
    /<p>\s*(Please know[\s\S]*?)<\/p>/,
  )?.[1];
  const reactTagline = component.match(
    /<p className=\{styles\.tagline\}>([\s\S]*?)<\/p>/,
  )?.[1];
  assert.ok(originalHeading && originalNotice && reactHeading && reactNotice && reactTagline);
  assert.equal(normalize(reactHeading), normalize(originalHeading));
  assert.equal(normalize(reactNotice), normalize(originalNotice));
  assert.equal(normalize(reactTagline), normalize(tagline));
  assert.match(component, /lang="en"/);
  assert.match(component, /aria-labelledby="preview-found-website-heading"/);
  assert.doesNotMatch(component, /role="alert"/);
  assert.match(page, /<LegacyFoundWebsiteSection \/>/);
  assert.ok(
    page.indexOf("<LegacyMessageSection />") < page.indexOf("<LegacyFoundWebsiteSection />"),
    "preserve the published section order",
  );
});

test("opening message preserves the published heading and first two paragraphs", () => {
  const legacy = read("public/index.html");
  const component = read("components/home/LegacyOpeningSection.tsx");
  const page = read("app/[locale]/home-preview/page.tsx");

  const source = legacy.match(
    /<h1 id="main-heading"[^>]*>([\s\S]*?)<\/h1>[\s\S]*?<h2 class="mb-4">([\s\S]*?)<\/h2>[\s\S]*?<p class="lead mb-3">([\s\S]*?)<\/p>[\s\S]*?<p class="h5 mb-3">([\s\S]*?)<\/p>/,
  );
  assert.ok(source, "legacy introduction is missing");
  const migrated = component.match(
    /<h2 id="preview-opening-heading">([\s\S]*?)<\/h2>[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<p>([\s\S]*?)<\/p>/,
  );
  assert.ok(migrated, "migrated introduction is missing");
  const text = (value) => value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (let i = 1; i <= 4; i++) {
    assert.equal(text(migrated[i]), text(source[i]), "approved excerpt " + i);
  }
  assert.match(component, /lang="en"/);
  assert.match(component, /aria-labelledby="preview-opening-heading"/);
  const order = [
    "<LegacyOpeningSection />",
    "<LegacyContactSection />",
    "<LegacyMessageSection />",
    "<LegacyFoundWebsiteSection />",
  ].map((name) => page.indexOf(name));
  assert.ok(order.every((position) => position !== -1), "all approved sections render");
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "preserve section order");
});

test("legal resource introduction keeps approved text without duplicating sensitive cards", () => {
  const legacy = read("public/index.html");
  const component = read("components/home/LegacyLegalResourcesSection.tsx");
  const page = read("app/[locale]/home-preview/page.tsx");
  const original = legacy.match(/<p>\s*(Information for parents in difficulty:[\s\S]*?)<\/p>/)?.[1];
  const migrated = component.match(/<p>\s*(Information for parents in difficulty:[\s\S]*?)<\/p>/)?.[1];
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  assert.ok(original && migrated);
  assert.equal(normalize(migrated), normalize(original));
  assert.match(component, /lang="en"/);
  assert.match(component, /href="\/for-fathers\.html"/);
  assert.match(page, /<LegacyLegalResourcesSection \/>/);
  assert.ok(page.indexOf("<LegacyFoundWebsiteSection />") < page.indexOf("<LegacyLegalResourcesSection />"));
  assert.doesNotMatch(component, /passport-fr-bababou|flag-norway-location|14CV32249/);
});

test("approved public supporting sections remain in document order and preserve native disclosure", () => {
  const page = read("app/[locale]/home-preview/page.tsx");
  const names = ["LegacyLegalResourcesSection", "LegacyPeopleSection", "LegacyAssociationsSection", "LegacyDisclosureSection", "LegacyFooterSection"];
  const positions = names.map((name) => page.indexOf("<" + name + " />"));
  assert.ok(positions.every((position) => position !== -1));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  const disclosure = read("components/home/LegacyDisclosureSection.tsx");
  assert.match(disclosure, /<details className=\{styles\.details\}>/);
  assert.match(disclosure, /<summary className=\{styles\.summary\}>/);
  const disclosureCss = read("components/home/LegacyDisclosureSection.module.css");
  assert.match(disclosureCss, /min-height: 2\.75rem/);
  assert.match(disclosureCss, /\.summary:focus-visible/);
  assert.match(disclosureCss, /\.summary:hover/);
  assert.doesNotMatch(disclosureCss, /transition:\s*all\b|outline:\s*none\b/);
  for (const target of ["service_terms", "privacy_policy", "impressum", "accessibility_statement", "cookie_policy"]) {
    assert.match(read("components/home/LegacyFooterSection.tsx"), new RegExp(target));
  }
  const people = read("components/home/LegacyPeopleSection.tsx");
  assert.match(people, /href="\/people-contacted\.html"/);
  assert.match(people, /href="\/central-authorities\.html"/);
});

test("document disclosure keeps the exact approved public text", () => {
  const legacy = read("public/index.html");
  const component = read("components/home/LegacyDisclosureSection.tsx");
  const original = legacy.match(
    /<summary id="documents-disclosure-heading"[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<div class="mt-3">([\s\S]*?)<\/div>/,
  );
  const migrated = component.match(
    /<summary className=\{styles\.summary\}>([\s\S]*?)<\/summary>[\s\S]*?<div className=\{styles\.content\}>([\s\S]*?)<\/div>/,
  );
  assert.ok(original && migrated, "missing disclosure section");

  const normalize = (value) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const paragraphs = (body) => [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
    .map((match) => normalize(match[1]));

  assert.equal(normalize(migrated[1]), normalize(original[1]));
  assert.deepEqual(paragraphs(migrated[2]), paragraphs(original[2]));
  assert.equal(paragraphs(original[2]).length, 2);
  assert.match(component, /<details className=\{styles\.details\}>/);
  assert.match(component, /<summary className=\{styles\.summary\}>/);
});
