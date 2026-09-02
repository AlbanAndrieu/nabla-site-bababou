import { type APIRequestContext, expect, test } from "@playwright/test";

const SITE_URL = "https://bababou.com";

const LEGACY_BRIDGED_POLICIES = [
  {
    path: "/policy/accessibility_statement",
    heading: "Accessibility Statement",
    title: "Accessibility Statement | Bababou",
    relatedPolicies: [],
  },
  {
    path: "/policy/cookie_policy",
    heading: "Cookie Policy",
    title: "Cookie Policy | Bababou",
    relatedPolicies: ["privacy_policy"],
  },
] as const;

const LEGACY_BRIDGE_LOCALES = [
  { requestPrefix: "/fr", localizedPrefix: "" },
  { requestPrefix: "/en", localizedPrefix: "/en" },
] as const;

const NATIVE_LOCALIZED_POLICIES = [
  {
    slug: "service_terms",
    emailLinks: 2,
    cnilLinks: 0,
    ddgLinks: 0,
    relatedPolicies: [],
    locales: [
      {
        locale: "fr",
        heading: "Conditions d’utilisation",
        title: "Conditions d’utilisation | Bababou",
      },
      {
        locale: "en",
        heading: "Terms of Service",
        title: "Terms of Service | Bababou",
      },
      {
        locale: "de",
        heading: "Nutzungsbedingungen",
        title: "Nutzungsbedingungen | Bababou",
      },
      {
        locale: "no",
        heading: "Vilkår for bruk",
        title: "Vilkår for bruk | Bababou",
      },
    ],
  },
  {
    slug: "privacy_policy",
    emailLinks: 2,
    cnilLinks: 1,
    ddgLinks: 0,
    relatedPolicies: [],
    locales: [
      {
        locale: "fr",
        heading: "Politique de confidentialité",
        title: "Politique de confidentialité | Bababou",
      },
      {
        locale: "en",
        heading: "Privacy Policy",
        title: "Privacy Policy | Bababou",
      },
      {
        locale: "de",
        heading: "Datenschutzerklärung",
        title: "Datenschutzerklärung | Bababou",
      },
      {
        locale: "no",
        heading: "Personvernerklæring",
        title: "Personvernerklæring | Bababou",
      },
    ],
  },
  {
    slug: "legal",
    emailLinks: 1,
    cnilLinks: 1,
    ddgLinks: 0,
    relatedPolicies: ["privacy_policy", "service_terms"],
    locales: [
      {
        locale: "fr",
        heading: "Mentions légales",
        title: "Mentions légales | Alban Andrieu",
      },
      {
        locale: "en",
        heading: "Legal notices",
        title: "Legal notices | Alban Andrieu",
      },
      {
        locale: "de",
        heading: "Rechtliche Hinweise",
        title: "Rechtliche Hinweise | Alban Andrieu",
      },
      {
        locale: "no",
        heading: "Juridisk informasjon",
        title: "Juridisk informasjon | Alban Andrieu",
      },
    ],
  },
  {
    slug: "impressum",
    emailLinks: 0,
    cnilLinks: 0,
    ddgLinks: 1,
    relatedPolicies: ["privacy_policy", "service_terms"],
    locales: [
      {
        locale: "fr",
        heading: "Impressum (mentions légales)",
        title: "Impressum (mentions légales) | Bababou",
      },
      {
        locale: "en",
        heading: "Impressum (Legal Notice)",
        title: "Impressum (Legal Notice) | Bababou",
      },
      {
        locale: "de",
        heading: "Impressum",
        title: "Impressum | Bababou",
      },
      {
        locale: "no",
        heading: "Impressum (juridisk informasjon)",
        title: "Impressum (juridisk informasjon) | Bababou",
      },
    ],
  },
] as const;

function redirectPath(location: string | undefined) {
  expect(location, "redirect response should expose a Location header").toBeTruthy();
  return new URL(location ?? "/", SITE_URL).pathname;
}

async function applicationRedirect(request: APIRequestContext, path: string) {
  let response = await request.get(path, { maxRedirects: 0 });

  if (
    response.status() === 307 &&
    redirectPath(response.headers().location) === path
  ) {
    response = await request.get(path, { maxRedirects: 0 });
  }

  return response;
}

for (const policy of LEGACY_BRIDGED_POLICIES) {
  for (const { requestPrefix, localizedPrefix } of LEGACY_BRIDGE_LOCALES) {
    const path = `${requestPrefix}${policy.path}`;

    test(`${policy.heading} uses native Next chrome at ${path}`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();

      await expect(page.locator("html")).toHaveAttribute(
        "data-nabla-app",
        "next-intl",
      );
      await expect(page.locator(".route-header")).toBeVisible();
      await expect(page.locator("footer.footer")).toBeVisible();
      await expect(page.locator("#main-content")).toHaveAttribute("lang", "en");
      await expect(page.locator("#main-content h1")).toHaveText(policy.heading);
      await expect(page.locator('a[href="#main-content"]')).toBeVisible();
      await expect(
        page.locator('#main-content a[href$=".html"]'),
      ).toHaveCount(0);

      const html = await page.content();
      expect(html).not.toMatch(/<script[^>]+theme-toggle\.js/i);
      expect(html).not.toMatch(/<script[^>]+site-google-translate\.js/i);

      for (const relatedPolicy of policy.relatedPolicies) {
        const links = page.locator(
          `#main-content a[href="${localizedPrefix}/policy/${relatedPolicy}"]`,
        );
        expect(await links.count()).toBeGreaterThan(0);
      }
    });

    test(`${policy.heading} publishes the clean canonical at ${path}`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE_URL}${policy.path}`,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        `${SITE_URL}${policy.path}`,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        policy.title,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary",
      );
    });
  }

  test(`legacy ${policy.heading} HTML permanently redirects to the clean policy route`, async ({
    request,
  }) => {
    const legacyPath = `${policy.path}.html`;
    const response = await applicationRedirect(request, legacyPath);

    expect(response.status()).toBe(308);
    expect(redirectPath(response.headers().location)).toBe(policy.path);
  });
}

for (const policy of NATIVE_LOCALIZED_POLICIES) {
  const policyPath = `/policy/${policy.slug}`;

  for (const locale of policy.locales) {
    const requestPath = `/${locale.locale}${policyPath}`;
    const canonicalPath =
      locale.locale === "fr" ? policyPath : `/${locale.locale}${policyPath}`;
    const localizedPrefix = locale.locale === "fr" ? "" : `/${locale.locale}`;

    test(`localized ${policy.slug} is native at ${requestPath}`, async ({
      page,
    }) => {
      const response = await page.goto(requestPath);
      expect(response?.ok()).toBeTruthy();

      await expect(page.locator("html")).toHaveAttribute(
        "data-nabla-app",
        "next-intl",
      );
      await expect(page.locator("#main-content")).toHaveAttribute(
        "lang",
        locale.locale,
      );
      await expect(page.locator("#main-content h1")).toHaveText(locale.heading);
      await expect(
        page.locator('#main-content a[href="mailto:aa@bababou.com"]'),
      ).toHaveCount(policy.emailLinks);
      await expect(
        page.locator('#main-content a[href="https://www.cnil.fr/"]'),
      ).toHaveCount(policy.cnilLinks);
      await expect(
        page.locator(
          '#main-content a[href="https://www.gesetze-im-internet.de/ddg/__5.html"]',
        ),
      ).toHaveCount(policy.ddgLinks);
      await expect(page.locator("#main-content")).not.toContainText("{email}");
      await expect(page.locator("#main-content")).not.toContainText("{cnil}");
      await expect(page.locator("#main-content")).not.toContainText("{privacy}");
      await expect(page.locator("#main-content")).not.toContainText("{terms}");
      await expect(page.locator("#main-content")).not.toContainText("{home}");
      await expect(page.locator("#main-content")).not.toContainText("{ddg}");
      await expect(page.locator("#main-content")).not.toContainText(
        "Telemediengesetz",
      );
      await expect(page.locator("#main-content")).not.toContainText("[COUNTRY]");
      await expect(page.locator("#main-content")).not.toContainText(
        "[CITY / COUNTRY]",
      );

      for (const relatedPolicy of policy.relatedPolicies) {
        const links = page.locator(
          `#main-content a[href="${localizedPrefix}/policy/${relatedPolicy}"]`,
        );
        expect(await links.count()).toBeGreaterThan(0);
      }
    });

    test(`localized ${policy.slug} publishes locale SEO at ${requestPath}`, async ({
      page,
    }) => {
      await page.goto(requestPath);

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE_URL}${canonicalPath}`,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        `${SITE_URL}${canonicalPath}`,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        locale.title,
      );

      const expectedAlternates = {
        fr: policyPath,
        en: `/en${policyPath}`,
        de: `/de${policyPath}`,
        no: `/no${policyPath}`,
        "x-default": policyPath,
      } as const;

      for (const [hreflang, path] of Object.entries(expectedAlternates)) {
        await expect(
          page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`),
        ).toHaveAttribute("href", `${SITE_URL}${path}`);
      }
    });
  }

  test(`legacy ${policy.slug} HTML permanently redirects to the French-default clean route`, async ({
    request,
  }) => {
    const response = await applicationRedirect(request, `${policyPath}.html`);

    expect(response.status()).toBe(308);
    expect(redirectPath(response.headers().location)).toBe(policyPath);
  });
}
