/**
 * Published ARF records only. This helper does not contact an API or assert
 * that a particular institution answered. Names and comments are owner reports,
 * not independent evidence. Do not import private OpenRAG records here.
 */
import arf from "../public/arf.json";

export type PublicContact = {
  country: string;
  institution: string;
  name: string;
  comment: string;
  url: string | null;
  email: string | null;
};

export type ContactTreeRoot = { children?: ContactNode[] };

export type ContactNode = {
  name: string;
  type?: string;
  comment?: string;
  url?: string;
  email?: string;
  children?: ContactNode[];
};

const COUNTRY_ORDER = ["Norway", "France", "Germany", "International", "Others"] as const;

export function publicContactUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export function publicContactEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) && value.length <= 254
    ? value : null;
}

export function listPublicContacts(root: ContactTreeRoot = arf as unknown as ContactTreeRoot): PublicContact[] {
  const result: PublicContact[] = [];
  function visit(node: ContactNode, country: string, path: string[], depth: number) {
    if (depth > 16 || result.length >= 2000 || !node || typeof node.name !== "string") return;
    if (Array.isArray(node.children) && node.children.length > 0) {
      for (const child of node.children) visit(child, country, [...path, node.name], depth + 1);
      return;
    }
    if (node.type === "folder" || (!node.url && !node.email && !node.comment)) return;
    result.push({
      country, institution: path[1] ?? "Other", name: node.name,
      comment: typeof node.comment === "string" ? node.comment : "",
      url: publicContactUrl(node.url), email: publicContactEmail(node.email),
    });
  }
  for (const child of root.children ?? []) visit(child, child.name, [], 0);
  const rank = (value: string) => {
    const i = COUNTRY_ORDER.indexOf(value as typeof COUNTRY_ORDER[number]);
    return i < 0 ? COUNTRY_ORDER.length : i;
  };
  return result.sort((a, b) => rank(a.country) - rank(b.country) ||
    a.institution.localeCompare(b.institution) || a.name.localeCompare(b.name));
}

export function publicContactTree(): ContactTreeRoot {
  // Source is the checked-in public JSON, not a private or runtime endpoint.
  return arf as unknown as ContactTreeRoot;
}

export const PUBLIC_CONTACT_COUNTRIES = COUNTRY_ORDER;
