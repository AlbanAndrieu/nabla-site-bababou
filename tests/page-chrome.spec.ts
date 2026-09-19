import { type APIRequestContext, expect, test } from "@playwright/test";

type StandardPageCase = { path: string; label: string };

const STANDARD_PAGES: StandardPageCase[] = [
  { path: "/", label: "homepage" },
  { path: "/abduction-germany.html", label: "abduction germany page" },
  { path: "/abduction-norway.html", label: "abduction norway page" },
  { path: "/ca/demande-explications-autorites-competentes-fr.html", label: "ca demande explications page" },
  { path: "/people-contacted.html", label: "people-contacted page" },
  { path: "/for-fathers.html", label: "for fathers page" },
  { path: "/test.html", label: "test page" },
];

const MIGRATED_NEXT_PAGES: StandardPageCase[] = [
  { path: "/contact.html", label: "contact page" },
  { path: "/central-authorities.html", label: "central authorities page" },
  { path: "/central-authorities-failures.html", label: "central authorities failures page" },
  { path: "/ca/index.html", label: "central authorities document hub" },
  { path: "/nre-en.html", label: "nre english page" },
  { path: "/nre-fr.html", label: "nre french page" },
  { path: "/email.html", label: "email contact addresses page" },
  { path: "/link.html", label: "links page" },
  { path: "/cancel.html", label: "cancel payment result page" },
  { path: "/success.html", label: "success payment result page" },
  { path: "/policy/accessibility_statement.html", label: "accessibility statement page" },
  { path: "/policy/cookie_policy.html", label: "cookie policy page" },
  { path: "/policy/impressum.html", label: "impressum page" },
  { path: "/policy/legal.html", label: "legal page" },
  { path: "/policy/privacy_policy.html", label: "privacy policy page" },
  { path: "/policy/service_terms.html", label: "service terms page" },
];

async function fetchHtml(path: string, request: APIRequestContext) {
  const response = await request.get(path);
  expect(response.ok()).toBeTruthy();
  return response.text();
}

test.describe("Page chrome structure regression coverage", () => {
  test("standard pages keep top anchor and full chrome script contracts", async ({ request }) => {
    for (const pageCase of STANDARD_PAGES) {
      const html = await fetchHtml(pageCase.path, request);
      await test.step(pageCase.label, async () => {
        expect(html).toContain('a name="top"');
        expect(html).toMatch(/<script[^>]+theme-toggle\.js[^>]*><\/script>/i);
        expect(html).toMatch(/<script[^>]+site-google-translate\.js[^>]*defer[^>]*><\/script>/i);
        expect(html).toMatch(/<script[^>]+site-analytics\.js[^>]*><\/script>/i);
        expect(html).toMatch(/<script[^>]+site-widgets\.js[^>]*data-print-pdf[^>]*><\/script>/i);
        expect(html).toMatch(/<script[^>]+site-widgets\.js[^>]*data-coffee-fab[^>]*><\/script>/i);
        expect(html).not.toMatch(/<script[^>]+site-widgets\.js[^>]*data-minimal-chrome[^>]*><\/script>/i);
      });
    }
  });

  test("migrated pages use native Next chrome instead of legacy static chrome", async ({ request }) => {
    for (const pageCase of MIGRATED_NEXT_PAGES) {
      const html = await fetchHtml(pageCase.path, request);
      await test.step(pageCase.label, async () => {
        expect(html).toContain('data-nabla-app="next-intl"');
        expect(html).toContain('id="route-header-locale"');
        expect(html).toMatch(/<footer[^>]*role="contentinfo"/i);
        expect(html).toContain('id="top" data-role="top-anchor"');
        expect(html).not.toContain('a name="top"');
        expect(html).not.toContain('href="/policy/legal.html"');
        expect(html).not.toMatch(/<script[^>]+theme-toggle\.js[^>]*><\/script>/i);
        expect(html).not.toMatch(/<script[^>]+site-google-translate\.js[^>]*><\/script>/i);
      });
    }
  });

  test("404 stays in minimal chrome mode", async ({ request }) => {
    const response = await request.get("/missing-next-route-for-page-chrome");
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toContain('data-nabla-app="next-global-not-found"');
    expect(html).toContain('class="cloak__wrapper"');
    expect(html).not.toContain('a name="top"');
    expect(html).not.toContain('id="route-header-locale"');
    expect(html).not.toMatch(/<footer[^>]*role="contentinfo"/i);
    expect(html).not.toMatch(/<script[^>]+theme-toggle\.js[^>]*><\/script>/i);
    expect(html).not.toMatch(/<script[^>]+site-google-translate\.js[^>]*><\/script>/i);
    expect(html).not.toMatch(/<script[^>]+site-widgets\.js[^>]*data-print-pdf[^>]*><\/script>/i);
    expect(html).not.toMatch(/<script[^>]+site-widgets\.js[^>]*data-coffee-fab[^>]*><\/script>/i);
  });
});
