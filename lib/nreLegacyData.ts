import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AppLocale } from "@/i18n/routing";
import { pseudonymizeProtectedChildIdentity } from "@/scripts/privacy-identities";

export type NreRow = {
  year: number;
  month: number;
  startDay: number;
  endDay: number;
  status: "nre" | "exception";
  statusDetail: string;
};

const ENGLISH_MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const FRENCH_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&rsquo;/gi, "’")
    .replace(/&ndash;/gi, "–")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function monthIndex(label: string, sourceLocale: "en" | "fr") {
  const normalized = label.toLocaleLowerCase(sourceLocale);
  const months = sourceLocale === "fr" ? FRENCH_MONTHS : ENGLISH_MONTHS;
  const index = months.findIndex((month) => normalized.startsWith(month));
  if (index === -1) throw new Error(`Unsupported NRE month label: ${label}`);
  return index + 1;
}

function parseWeekendRange(label: string) {
  const normalized = label
    .normalize("NFKC")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\u00a0/g, " ");
  const range = normalized.match(
    /(\d+)\s*(?:(?:er|re|e|eme|ème|st|nd|rd|th)\b\s*)?-\s*(\d+)/i,
  );

  return range
    ? { startDay: Number(range[1]), endDay: Number(range[2]) }
    : null;
}

export function parseNreLegacyRows(
  html: string,
  sourceLocale: "en" | "fr",
): NreRow[] {
  const rowPattern =
    /<tr\s+([^>]*(?:data-nre|data-exception)[^>]*)>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  const rows: NreRow[] = [];

  for (const match of html.matchAll(rowPattern)) {
    const attributes = match[1];
    const monthLabel = decodeHtml(match[2]);
    const weekendLabel = decodeHtml(match[3]);
    const statusDetail = pseudonymizeProtectedChildIdentity(decodeHtml(match[4]));
    const yearMatch = monthLabel.match(/(20\d{2})/);
    const weekendRange = parseWeekendRange(weekendLabel);

    if (!yearMatch || !weekendRange) {
      throw new Error(
        `Unable to parse NRE legacy row: ${monthLabel} / ${weekendLabel}`,
      );
    }

    rows.push({
      year: Number(yearMatch[1]),
      month: monthIndex(monthLabel, sourceLocale),
      startDay: weekendRange.startDay,
      endDay: weekendRange.endDay,
      status: attributes.includes('data-exception="true"')
        ? "exception"
        : "nre",
      statusDetail,
    });
  }

  if (!rows.length) throw new Error("No NRE rows found in retained static source");
  return rows;
}

export async function loadNreLegacyRows(locale: AppLocale) {
  const sourceLocale = locale === "fr" ? "fr" : "en";
  const fileName = sourceLocale === "fr" ? "nre-fr.html" : "nre-en.html";
  const source = await readFile(
    path.join(process.cwd(), "public", fileName),
    "utf8",
  );
  return parseNreLegacyRows(source, sourceLocale);
}
