import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sections = [
  "LegacyOpeningSection",
  "LegacyFamilyFactsSection",
  "LegacyContactSection",
  "LegacyMessageSection",
  "LegacyFoundWebsiteSection",
  "LegacySiteAboutSection",
  "LegacyJourneySection",
  "LegacyLegalResourcesSection",
  "LegacyStoryGallerySection",
  "LegacyPeopleSection",
  "LegacyAssociationsSection",
  "LegacyDisclosureSection",
  "LegacyFooterSection",
];

/**
 * A source-only guard for safe, approved preview sections.
 * Dynamic association/policy links have their own route contracts.
 * Browser, third-party scripts and private/publication safety are NOT attested.
 */
export function auditPreviewLinks({ page, sectionSources, publicExists }) {
  const issues = [];
  const source = [page, ...sectionSources].join("\n");
  const readAttributes = (attribute) =>
    [...source.matchAll(new RegExp("\\b" + attribute + '="([^"]+)"', "g"))]
      .map((match) => match[1]);
  const ids = readAttributes("id");
  const counts = new Map();
  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    if (count !== 1) issues.push("DUPLICATE_ID: " + id);
  }
  const hrefs = readAttributes("href");
  const anchors = hrefs.filter((href) => href.startsWith("#"));
  for (const ref of [...anchors.map((href) => href.slice(1)), ...readAttributes("aria-labelledby")]) {
    for (const id of ref.split(/\s+/)) {
      if (!counts.has(id)) issues.push("MISSING_TARGET: " + id);
    }
  }
  const assets = hrefs.filter((href) => href.startsWith("/") && href !== "/");
  for (const href of assets) {
    // This guard handles only literal public assets, never dynamic Next routes.
    if (!/^[\/a-zA-Z0-9._-]+$/.test(href) || href.includes("..") || href.startsWith("//")) {
      issues.push("INVALID_PUBLIC_HREF");
    } else if (!publicExists(href)) {
      issues.push("MISSING_PUBLIC_ASSET: " + href);
    }
  }
  if (!counts.has("main-content")) issues.push("MISSING_MAIN_LANDMARK");
  return {
    issues,
    auditedSections: sectionSources.length,
    anchorCount: anchors.length,
    publicAssetLinks: assets.length,
    labelReferences: readAttributes("aria-labelledby").length,
  };
}

export function auditRepositoryPreview() {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const page = read("app/[locale]/home-preview/page.tsx");
  for (const section of sections) {
    if (!page.includes("<" + section + " />")) {
      throw new Error("MISSING_PREVIEW_SECTION: " + section);
    }
  }
  return auditPreviewLinks({
    page,
    sectionSources: sections.map((section) => read("components/home/" + section + ".tsx")),
    publicExists: (href) => existsSync(join(root, "public", href.slice(1))),
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = auditRepositoryPreview();
  if (result.issues.length > 0) {
    for (const issue of result.issues) console.error("P1_PREVIEW_SOURCE_DRIFT " + issue);
    process.exitCode = 1;
  } else {
    console.log(
      "P1_PREVIEW_SOURCE_OK sections=" + result.auditedSections +
      " anchors=" + result.anchorCount +
      " publicAssets=" + result.publicAssetLinks +
      " labels=" + result.labelReferences,
    );
  }
}
