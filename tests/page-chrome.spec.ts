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

  test("all native Next routes expose theme and print controls without legacy scripts", async ({ request }) => {
    for (const pageCase of MIGRATED_NEXT_PAGES) {
      const html = await fetchHtml(pageCase.path, request);
      await test.step(pageCase.label, async () => {
        expect(html).toContain('aria-label="Display theme"');
        expect(html).toContain("Print / Save as PDF");
        expect(html).not.toMatch(/<script[^>]+site-widgets\\.js/i);
      });
    }
  });

  test("theme preference persists when navigating between native pages", async ({ page }) => {
    await page.goto("/contact");
    const group = page.getByRole("group", { name: "Display theme" });
    await expect(group).toHaveCount(1);
    await group.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.goto("/policy");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("group", { name: "Display theme" })).toHaveCount(1);
    await page.getByRole("group", { name: "Display theme" })
      .getByRole("button", { name: "Auto (system)" }).click();
  });


  test("native print-to-PDF control matches legacy floating button geometry", async ({ page }) => {
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/en/central-authorities");
      const print = page.locator("button[data-site-print-control]");
      await expect(print).toHaveCount(1);
      await expect(print).toHaveAccessibleName("Print / Save as PDF");
      await expect(print.locator('svg[aria-hidden="true"]')).toHaveCount(1);

      const geometry = await print.evaluate((element) => {
        const styles = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          position: styles.position,
          right: window.innerWidth - rect.right,
          bottom: window.innerHeight - rect.bottom,
          radius: styles.borderRadius,
          background: styles.backgroundColor,
          width: rect.width,
          height: rect.height,
        };
      });
      expect(geometry.position).toBe("fixed");
      expect(geometry.right).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(48);
      expect(geometry.bottom).toBeGreaterThanOrEqual(0);
      expect(geometry.bottom).toBeLessThanOrEqual(48);
      if (width === 375) {
        expect(Math.abs(geometry.width - geometry.height)).toBeLessThanOrEqual(1);
        expect(geometry.width).toBeGreaterThanOrEqual(44);
        expect(geometry.radius).toBe("50%");
      } else {
        expect(geometry.width).toBeGreaterThan(150);
        expect(geometry.radius).toBe("8px");
      }

      await page.evaluate(() => { window.print = () => window.dispatchEvent(new Event("print-requested")); });
      const printed = page.evaluate(() => new Promise((resolve) => {
        window.addEventListener("print-requested", () => resolve(true), { once: true });
      }));
      await print.click();
      expect(await printed).toBe(true);
    }
  });

  test("remaining historic HTML pages share native footer buttons", async ({ page }) => {
    for (const path of ["/", "/abduction-germany.html", "/abduction-norway.html", "/for-fathers.html", "/test.html"]) {
      for (const width of [320, 375, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        const nav = page.locator("footer.footer nav.legacy-footer-actions");
        await expect(nav).toHaveCount(1);
        const buttons = nav.locator("a.legacy-footer-action");
        const expected = path === "/" ? 1 : path.includes("abduction-") ? 3 : 2;
        await expect(buttons).toHaveCount(expected);

        for (const theme of ["light", "dark"] as const) {
          await page.locator("html").evaluate((element, value) => {
            element.dataset.theme = value;
          }, theme);
          const overflow = await nav.evaluate((element) => element.scrollWidth - element.clientWidth);
          expect(overflow, path + " at " + width + "px in " + theme).toBeLessThanOrEqual(1);
          for (const action of await buttons.all()) {
            await expect(action).toBeVisible();
            await expect(action).toHaveCSS("box-sizing", "border-box");
            const box = await action.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.width).toBeLessThanOrEqual(width);
            expect(box!.height).toBeGreaterThanOrEqual(44);
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
          }
        }
        const top = nav.getByRole("link", { name: /Back to top/i });
        await expect(top).toHaveAttribute("href", "#top");
        await top.click();
        await expect(page).toHaveURL(/#top$/);
      }
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
