import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const POLICY_INDEX_CASES = [
  { path: "/policy", lang: "fr", heading: "Politiques et informations légales" },
  { path: "/en/policy", lang: "en", heading: "Policies and legal information" },
  { path: "/de/policy", lang: "de", heading: "Richtlinien und rechtliche Informationen" },
  { path: "/no/policy", lang: "no", heading: "Retningslinjer og juridisk informasjon" },
] as const;

const POLICY_SLUGS = [
  "accessibility_statement",
  "cookie_policy",
  "impressum",
  "legal",
  "privacy_policy",
  "service_terms",
] as const;

test.describe("policy index", () => {
  for (const pageCase of POLICY_INDEX_CASES) {
    test(`${pageCase.path} lists every localized policy`, async ({ page }) => {
      const response = await page.goto(pageCase.path);
      expect(response?.status()).toBe(200);

      await expect(page.locator("html")).toHaveAttribute("lang", pageCase.lang);

      const expected = JSON.parse(
        readFileSync(
          new URL(`../messages/policy-index/${pageCase.lang}.json`, import.meta.url),
          "utf8",
        ),
      ).policyIndexPage as {
        metadataTitle: string;
        metadataDescription: string;
        heading: string;
        intro: string;
      };
      await expect(page).toHaveTitle(expected.metadataTitle);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        expected.metadataDescription,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        expected.metadataTitle,
      );
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
        "content",
        expected.metadataDescription,
      );
      await expect(page.locator("main h1")).toHaveText(expected.heading);
      await expect(page.locator("main header p")).toHaveText(expected.intro);
      await expect(
        page.getByRole("heading", { level: 1, name: pageCase.heading }),
      ).toBeVisible();

      const policyCards = page.locator("main article");
      await expect(policyCards).toHaveCount(POLICY_SLUGS.length);

      for (const slug of POLICY_SLUGS) {
        const prefix = pageCase.lang === "fr" ? "" : `/${pageCase.lang}`;
        await expect(
          policyCards.locator(`a[href="${prefix}/policy/${slug}"]`),
        ).toHaveCount(1);
      }

      const canonical = pageCase.lang === "fr" ? "/policy" : `/${pageCase.lang}/policy`;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${canonical.replaceAll("/", "\\/")}$`),
      );
    });
  }
});
