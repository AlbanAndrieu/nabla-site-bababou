import { createHash } from "node:crypto";

export type IdentityFingerprintSet = ReadonlySet<string>;

// SHA-256 fingerprints of normalized protected child-name variants.
// The protected source values are intentionally not stored in the repository.
export const PROTECTED_CHILD_IDENTITY_FINGERPRINTS: IdentityFingerprintSet = new Set([
  "e6c09d94d4f43a39c7d1cf6a6d670a76962bc4e0af3b80a16db29ffde71df8c2",
  "5b0e1ceb3173b8ff0de2a262df2abaa0d403bfaea700f399f82a4c9f7226398b",
  "f3d2b782bc9e28be5264bd7a156567a76e4bb5921cda9f1e148724b1330e941a",
  "0708682382da2f3de680ab2249af546778e6ec4e5e99b50ccb1fa6c5efa1f03d",
  "511898c9bcb07aa2d0eeeefdaea80dc272ee3783592442ffb74f94babeabb6bd",
]);

export function normalizeIdentity(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function identityFingerprint(value: string): string {
  return createHash("sha256").update(normalizeIdentity(value)).digest("hex");
}

type WordSpan = { start: number; end: number; text: string };

function wordSpans(text: string): WordSpan[] {
  const spans: WordSpan[] = [];
  for (const match of text.matchAll(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu)) {
    const start = match.index ?? 0;
    spans.push({ start, end: start + match[0].length, text: match[0] });
  }
  return spans;
}

export function findIdentitySpans(
  text: string,
  fingerprints: IdentityFingerprintSet,
  maxWords = 4,
): Array<{ start: number; end: number }> {
  const words = wordSpans(text);
  const matches: Array<{ start: number; end: number }> = [];

  for (let size = Math.min(maxWords, words.length); size >= 1; size -= 1) {
    for (let index = 0; index + size <= words.length; index += 1) {
      const slice = words.slice(index, index + size);
      const candidate = text.slice(slice[0].start, slice[slice.length - 1].end);
      if (!fingerprints.has(identityFingerprint(candidate))) continue;
      const start = slice[0].start;
      const end = slice[slice.length - 1].end;
      if (!matches.some((match) => start < match.end && end > match.start)) {
        matches.push({ start, end });
      }
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

export function replaceProtectedIdentity(
  text: string,
  replacement: string,
  fingerprints: IdentityFingerprintSet = PROTECTED_CHILD_IDENTITY_FINGERPRINTS,
): string {
  const matches = findIdentitySpans(text, fingerprints);
  if (!matches.length) return text;

  let output = "";
  let cursor = 0;
  for (const match of matches) {
    output += text.slice(cursor, match.start) + replacement;
    cursor = match.end;
  }
  return output + text.slice(cursor);
}
