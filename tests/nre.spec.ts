import { expect, test } from "@playwright/test";

const localeCases = [
  { path: "/nre", lang: "fr" },
  { path: "/en/nre", lang: "en" },
  { path: "/de/nre", lang: "de" },
  { path: "/no/nre", lang: "no" },
] as const;

test.describe("NRE React migration", () => {
  for (const localeCase of localeCases) {
    test(`renders native ${localeCase.lang} content`, async ({ page }) => {
      await page.goto(localeCase.path);

      await expect(page.locator("html")).toHaveAttribute("lang", localeCase.lang);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main table")).toBeVisible();
      await expect(page.locator("#route-header-locale")).toHaveValue(
        localeCase.lang,
      );
      await expect(page.locator('link[href*="bootstrap"]')).toHaveCount(0);
      await expect(page.locator('script[src*="bootstrap"]')).toHaveCount(0);
    });
  }

  test("redirects retained French and English legacy NRE URLs", async ({ page }) => {
    await page.goto("/nre-fr.html");
    expect(new URL(page.url()).pathname).toBe("/nre");

    await page.goto("/nre-en.html");
    expect(new URL(page.url()).pathname).toBe("/en/nre");
  });
  test("theme selector remains at upper-right without covering NRE locale navigation", async ({ page }) => {
    for (const path of ["/en/nre", "/home-preview"]) {
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        const theme = page.getByRole("group", { name: "Display theme" });
        const locale = page.locator("#route-header-locale");
        await expect(theme).toBeVisible();
        await expect(locale).toBeVisible();
        const positions = await page.evaluate(() => {
          const group = document.querySelector('[role="group"][aria-label="Display theme"]');
          const switcher = document.getElementById("route-header-locale");
          if (!group || !switcher) throw new Error("Theme or locale control missing");
          const themeRect = group.getBoundingClientRect();
          const localeRect = switcher.getBoundingClientRect();
          return {
            cssPosition: getComputedStyle(group).position,
            top: themeRect.top,
            right: window.innerWidth - themeRect.right,
            left: themeRect.left,
            overlapsLocale: !(themeRect.right <= localeRect.left ||
              themeRect.left >= localeRect.right ||
              themeRect.bottom <= localeRect.top ||
              themeRect.top >= localeRect.bottom),
          };
        });
        expect(positions.cssPosition).toBe("fixed");
        expect(positions.top).toBeGreaterThanOrEqual(0);
        expect(positions.top).toBeLessThan(50);
        expect(positions.right).toBeGreaterThanOrEqual(0);
        expect(positions.right).toBeLessThan(50);
        expect(positions.left).toBeGreaterThanOrEqual(0);
        expect(positions.overlapsLocale).toBe(false);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expect(theme).toBeInViewport();
        const dark = theme.getByRole("button", { name: "Dark", exact: true });
        await dark.click();
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await expect(dark).toHaveAttribute("aria-pressed", "true");
      }
    }
  });

  test("rounded theme segments visually match the historic homepage", async ({ page }) => {
    for (const { path } of localeCases) {
      for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        const theme = page.getByRole("group", { name: "Display theme" });
        const light = theme.getByRole("button", { name: "Light", exact: true });
        const dark = theme.getByRole("button", { name: "Dark", exact: true });
        const automatic = theme.getByRole("button", { name: "Auto (system)", exact: true });

        await expect(theme).toHaveCSS("border-top-left-radius", "800px");
        for (const button of [light, dark, automatic]) {
          await expect(button).toHaveAttribute("title", /^(Light|Dark|Auto \(system\))$/);
          const geometry = await button.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
              borderRadius: getComputedStyle(element).borderTopLeftRadius,
            };
          });
          expect(geometry.width).toBeGreaterThanOrEqual(40);
          expect(geometry.height).toBeGreaterThanOrEqual(40);
          if (width === 375) {
            expect(Math.abs(geometry.width - geometry.height)).toBeLessThanOrEqual(1);
            expect(geometry.borderRadius).toBe("50%");
          } else {
            expect(Number.parseFloat(geometry.borderRadius)).toBeGreaterThanOrEqual(40);
          }
        }

        await light.click();
        await expect(light).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
        await dark.click();
        await expect(dark).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await automatic.click();
        await expect(automatic).toHaveAttribute("aria-pressed", "true");
      }
    }
  });

  test("theme labels stay accessible and controls printable on localized NRE routes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    for (const { path } of localeCases) {
      await page.goto(path);
      const group = page.getByRole("group", { name: "Display theme" });
      for (const label of ["Light", "Dark", "Auto (system)"]) {
        await expect(group.getByRole("button", { name: label, exact: true })).toBeVisible();
      }
      await expect(group).toHaveCSS("position", "fixed");
    }
  });

});
