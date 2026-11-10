/**
 * Global, non-authorizing source-document access requests for linked files.
 *
 * This script does not fetch document contents, expose source URLs in request
 * query strings, alter the original link, or grant access to anything.
 * A SITE-DOC-* label is a public locator, NOT evidence or an access token.
 */
const DOCUMENT_EXTENSION = /\.(?:pdf|docx?|odt|rtf|xlsx?|ods|pptx?|odp)(?:$)/i;
const PUBLIC_DOCUMENT_PROVIDERS = new Set([
  "docs.google.com", "drive.google.com", "www.dropbox.com",
  "dropbox.com", "onedrive.live.com",
]);

export const DOCUMENT_REQUEST_LABELS = Object.freeze({
  fr: "Demander l’accès au document source",
  en: "Request access to the source document",
  de: "Zugang zum Quelldokument beantragen",
  no: "Be om tilgang til kildedokumentet",
});

export function documentLinkIdentity(rawHref, baseHref) {
  if (typeof rawHref !== "string" || !rawHref.trim() ||
      typeof baseHref !== "string") return null;
  let url;
  let page;
  try {
    url = new URL(rawHref, baseHref);
    page = new URL(baseHref);
  } catch {
    return null;
  }
  if (!["https:", "http:"].includes(url.protocol) ||
      !["https:", "http:"].includes(page.protocol) ||
      url.username || url.password) return null;
  const pathname = url.pathname;
  const isFile = DOCUMENT_EXTENSION.test(pathname);
  const provider = url.hostname.toLowerCase();
  // The only allowed query-derived data is a provider's public document ID,
  // used locally to disambiguate references. It is NEVER sent in the request.
  const providerId = (provider === "drive.google.com" && pathname === "/open")
    ? url.searchParams.get("id")
    : provider === "onedrive.live.com"
      ? (url.searchParams.get("resid") || url.searchParams.get("id")) : null;
  const safeProviderId = providerId && /^[A-Za-z0-9!_-]{8,180}$/.test(providerId)
    ? providerId : null;
  const isProvider = (PUBLIC_DOCUMENT_PROVIDERS.has(provider) && (
    /\/(?:document|spreadsheets|presentation|file)(?:\/u\/\d+)?\/d\/[^/]+/i.test(pathname) ||
    /^\/(?:s\/|scl\/fi\/)[^/]+/i.test(pathname)
  )) || Boolean(safeProviderId);
  // Approved HTML pages (including /ca/ and data-document-entry) are public
  // publications, NOT private source documents. Do not request them again.
  if (!isFile && !isProvider) return null;
  // Queries might contain access tokens or personal data: NEVER propagate them.
  const publicOrigin = url.origin === page.origin || ["bababou.com", "www.bababou.com"].includes(url.hostname.toLowerCase())
    ? "https://bababou.com" : url.origin;
  return `${publicOrigin}${pathname}${safeProviderId ? `?publicId=${encodeURIComponent(safeProviderId)}` : ""}`;
}

export function publicDocumentLocator(identity) {
  if (typeof identity !== "string" || !/^https?:\/\//.test(identity)) return null;
  // FNV-1a 64-bit is only a reproducible public locator; not a security hash.
  const encoder = new TextEncoder();
  let hash = 0xcbf29ce484222325n;
  for (const byte of encoder.encode(identity)) {
    hash = (hash ^ BigInt(byte)) * 0x100000001b3n & 0xffffffffffffffffn;
  }
  return `SITE-DOC-${hash.toString(16).padStart(16, "0")}`;
}

export function documentRequestPath(identity, locale = "fr") {
  const ref = publicDocumentLocator(identity);
  if (!ref) return null;
  const lang = ["fr", "en", "de", "no"].includes(locale) ? locale : "fr";
  return `${lang === "fr" ? "" : `/${lang}`}/evidence-access?doc=${ref}#request-documents`;
}

function currentLocale() {
  const html = document.documentElement;
  const raw = (html.lang || "").toLowerCase().split("-")[0];
  if (["fr", "en", "de", "no"].includes(raw)) return raw;
  if (raw === "nb" || raw === "nn") return "no";
  const prefix = window.location.pathname.split("/")[1];
  if (["fr", "en", "de", "no"].includes(prefix)) return prefix;
  if (/-en\.html$/.test(window.location.pathname)) return "en";
  return "fr";
}

function shouldSkipLink(link) {
  return link.classList.contains("document-access-request") ||
    link.hasAttribute("data-document-access-skip") ||
    Boolean(link.closest("nav, header, footer, [data-no-document-requests]"));
}

function enhanceDocumentLinks() {
  const locale = currentLocale();
  for (const link of document.querySelectorAll("a[href]")) {
    if (shouldSkipLink(link)) continue;
    const identity = documentLinkIdentity(
      link.getAttribute("href"), window.location.href,
    );
    const ref = identity ? publicDocumentLocator(identity) : null;
    const existing = link.nextElementSibling?.classList.contains("document-access-request")
      ? link.nextElementSibling : null;
    if (existing && existing.getAttribute("data-document-request-ref") !== ref) {
      existing.remove();
    }
    if (!ref) {
      link.removeAttribute("data-document-access-ref");
      continue;
    }
    if (existing && existing.getAttribute("data-document-request-ref") === ref) continue;
    const href = documentRequestPath(identity, locale);
    if (!href) continue;
    const request = document.createElement("a");
    request.className = "document-access-request document-source-request";
    request.href = href;
    const icon = document.createElement("span");
    icon.className = "document-source-lock-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "🔒";
    request.append(icon, document.createTextNode(DOCUMENT_REQUEST_LABELS[locale]));
    request.setAttribute("data-document-request-ref", ref);
    request.setAttribute("aria-label", `${DOCUMENT_REQUEST_LABELS[locale]} — ${ref}`);
    request.setAttribute("rel", "nofollow");
    link.setAttribute("data-document-access-ref", ref);
    link.insertAdjacentElement("afterend", request);
  }
}

function startEnhancement() {
  if (window.__bababouDocumentAccessInitialized) return;
  window.__bababouDocumentAccessInitialized = true;
  let scheduled = false;
  const refresh = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      enhanceDocumentLinks();
    });
  };
  refresh();
  // Historic HTML and native Next.js both evolve their DOM after page load.
  new MutationObserver(refresh).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["href"],
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startEnhancement, { once: true });
  } else {
    startEnhancement();
  }
}
