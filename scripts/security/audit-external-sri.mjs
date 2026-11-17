/**
 * Review external resources from the two public, approved HTML entrypoints.
 * Never log arbitrary source URLs or document bodies. This is a regression
 * guard: it cannot independently prove the remote bytes match their SRI hashes.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const REVIEWED_DOCUMENTS = Object.freeze([
  "public/index.html",
  "public/ca/demande-explications-autorites-competentes-fr.html",
]);

// Dynamically served vendor resources cannot use a fixed SRI hash without a
// supported immutable distribution. They remain security debt, not a PASS.
export const DYNAMIC_EXCEPTIONS = Object.freeze([
  "https://challenges.cloudflare.com/turnstile/v0/api.js",
  "https://uptime.betterstack.com/widgets/announcement.js",
]);

const SRI_PATTERN = /^sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2}$/;
const FIXED_VENDOR = /^https:\/\/(?:code\.jquery\.com|cdnjs\.cloudflare\.com|stackpath\.bootstrapcdn\.com)\//;

function attribute(element, name) {
  const match = new RegExp("\\b" + name + "\\s*=\\s*([\\\"'])((?:(?!\\1)[^\\n])*?)\\1", "i").exec(element);
  return match?.[2] || "";
}

export function inspectMarkup(markup) {
  const findings = [];
  let verifiedTags = 0;
  let dynamicExceptions = 0;
  for (const match of markup.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    const tag = match[0];
    const isScript = /^<script\b/i.test(tag);
    if (!isScript && attribute(tag, "rel").toLowerCase() !== "stylesheet") continue;
    const location = attribute(tag, isScript ? "src" : "href");
    if (!location.startsWith("https://")) continue;
    const url = new URL(location);
    const normalized = url.origin + url.pathname;
    if (DYNAMIC_EXCEPTIONS.includes(normalized) && isScript) {
      dynamicExceptions++;
      continue;
    }
    if (!FIXED_VENDOR.test(normalized)) {
      findings.push("external-resource-not-classified");
      continue;
    }
    if (!SRI_PATTERN.test(attribute(tag, "integrity")) ||
        attribute(tag, "crossorigin").toLowerCase() !== "anonymous") {
      findings.push("immutable-resource-missing-SRI-or-CORS");
      continue;
    }
    verifiedTags++;
  }
  return { verifiedTags, dynamicExceptions, findings };
}

export async function auditApprovedHtml() {
  let verifiedTags = 0;
  let dynamicExceptions = 0;
  let reviewed = 0;
  for (const file of REVIEWED_DOCUMENTS) {
    const markup = await readFile(new URL("../" + file, import.meta.url), "utf8");
    const result = inspectMarkup(markup);
    if (result.findings.length) {
      throw new Error(file + ": external resource classification/SRI failed (" + result.findings.length + " findings)");
    }
    verifiedTags += result.verifiedTags;
    dynamicExceptions += result.dynamicExceptions;
    reviewed++;
  }
  if (!verifiedTags || !dynamicExceptions) {
    throw new Error("Expected static SRI assets and approved dynamic exceptions are missing");
  }
  return { reviewed, verifiedTags, dynamicExceptions };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  auditApprovedHtml()
    .then(({ reviewed, verifiedTags, dynamicExceptions }) =>
      console.log("SRI sources reviewed=" + reviewed + " pinned=" + verifiedTags +
        " dynamic-exceptions-open=" + dynamicExceptions))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
