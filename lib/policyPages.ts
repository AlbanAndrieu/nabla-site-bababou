export type PolicyPageDefinition = Readonly<{
  sourceFile: `policy/${string}.html`;
  heading: string;
  title: string;
  description: string;
  socialDescription: string;
  canonicalPath: `/policy/${string}`;
  contentLanguage: "en";
  siteName: string;
}>;

export const POLICY_PAGES = {
  accessibility_statement: {
    sourceFile: "policy/accessibility_statement.html",
    heading: "Accessibility Statement",
    title: "Accessibility Statement | Bababou",
    description:
      "Accessibility statement for bababou.com. Our commitment to digital accessibility and WCAG compliance.",
    socialDescription:
      "Accessibility statement for bababou.com. Our commitment to digital accessibility.",
    canonicalPath: "/policy/accessibility_statement",
    contentLanguage: "en",
    siteName: "Bababou",
  },
  cookie_policy: {
    sourceFile: "policy/cookie_policy.html",
    heading: "Cookie Policy",
    title: "Cookie Policy | Bababou",
    description:
      "Cookie policy for bababou.com. How we use cookies and similar technologies and how you can manage your preferences.",
    socialDescription:
      "Cookie policy for bababou.com. How we use cookies and how you can manage your preferences.",
    canonicalPath: "/policy/cookie_policy",
    contentLanguage: "en",
    siteName: "Bababou",
  },
  impressum: {
    sourceFile: "policy/impressum.html",
    heading: "Impressum (Legal Notice)",
    title: "Impressum (Legal Notice) | Bababou",
    description:
      "Impressum (legal notice) for bababou.com. Publisher information and contact details as required for websites.",
    socialDescription:
      "Impressum (legal notice) for bababou.com. Publisher information and contact details.",
    canonicalPath: "/policy/impressum",
    contentLanguage: "en",
    siteName: "Bababou",
  },
  legal: {
    sourceFile: "policy/legal.html",
    heading: "Legal notices",
    title: "Legal notices | Alban Andrieu",
    description:
      "Legal notices for bababou.com: publisher, hosting, privacy summary, and trademarks (English).",
    socialDescription:
      "Legal notices for bababou.com: publisher, hosting, privacy summary, and trademarks.",
    canonicalPath: "/policy/legal",
    contentLanguage: "en",
    siteName: "Alban Andrieu",
  },
  privacy_policy: {
    sourceFile: "policy/privacy_policy.html",
    heading: "Privacy Policy",
    title: "Privacy Policy | Bababou",
    description:
      "Privacy Policy for bababou.com. Learn how we collect, use, and protect your personal data in accordance with GDPR regulations.",
    socialDescription:
      "Privacy Policy for bababou.com. Learn how we collect, use, and protect your personal data in accordance with GDPR regulations.",
    canonicalPath: "/policy/privacy_policy",
    contentLanguage: "en",
    siteName: "Bababou",
  },
  service_terms: {
    sourceFile: "policy/service_terms.html",
    heading: "Terms of Service",
    title: "Terms of Service | Bababou",
    description:
      "Terms of Service for bababou.com. Read the terms and conditions governing access to and use of our website and services.",
    socialDescription:
      "Terms of Service for bababou.com. Read the terms and conditions governing access to and use of our website and services.",
    canonicalPath: "/policy/service_terms",
    contentLanguage: "en",
    siteName: "Bababou",
  },
} as const satisfies Record<string, PolicyPageDefinition>;

export type PolicyPageSlug = keyof typeof POLICY_PAGES;

export const POLICY_PAGE_SLUGS = Object.keys(POLICY_PAGES) as PolicyPageSlug[];

export const NATIVE_LOCALIZED_POLICY_SLUGS = [
  "accessibility_statement",
  "cookie_policy",
  "privacy_policy",
  "service_terms",
  "legal",
  "impressum",
] as const satisfies readonly PolicyPageSlug[];

export type NativeLocalizedPolicySlug =
  (typeof NATIVE_LOCALIZED_POLICY_SLUGS)[number];

export function isPolicyPageSlug(value: string): value is PolicyPageSlug {
  return Object.prototype.hasOwnProperty.call(POLICY_PAGES, value);
}

export function isNativeLocalizedPolicySlug(
  value: PolicyPageSlug,
): value is NativeLocalizedPolicySlug {
  return (NATIVE_LOCALIZED_POLICY_SLUGS as readonly PolicyPageSlug[]).includes(
    value,
  );
}

export function getPolicyPage(slug: PolicyPageSlug) {
  return POLICY_PAGES[slug];
}

/**
 * Legacy short aliases kept for compatibility with existing tooling. Native
 * routes use the canonical slugs from POLICY_PAGES above.
 */
export const POLICY_SEGMENT_TO_FILE: Record<string, string> = {
  legal: POLICY_PAGES.legal.sourceFile,
  impressum: POLICY_PAGES.impressum.sourceFile,
  privacy: POLICY_PAGES.privacy_policy.sourceFile,
  terms: POLICY_PAGES.service_terms.sourceFile,
  cookies: POLICY_PAGES.cookie_policy.sourceFile,
  accessibility: POLICY_PAGES.accessibility_statement.sourceFile,
};
