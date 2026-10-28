import { expect, test } from "@playwright/test";

const paths = [
  "/contact", "/en/contact", "/policy", "/en/policy",
  "/home-preview", "/en/home-preview", "/de/home-preview", "/no/home-preview",
] as const;

/**
 * A 200% root-font resize is a browser-independent approximation of text-only
 * enlargement. Chromium CDP Emulation.setEmulatedOSTextScale does not reliably
 * change the computed font size in desktop Chrome, and is unavailable in
 * Firefox/WebKit. This is NOT a claim of validating native browser zoom.
 */
async function enlargeTextBy200Percent(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const baseline = Number.parseFloat(getComputedStyle(root).fontSize);
    if (!Number.isFinite(baseline) || baseline <= 0) {
      throw new Error("Cannot determine baseline root font size");
    }
    root.style.setProperty("font-size", `${baseline * 2}px`, "important");
    return baseline;
  });
}

test.describe("Accessible responsive reflow", () => {
  test("reflows with 200% enlarged root text and reduced motion", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const path of paths) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
      const baselineFontSize = await enlargeTextBy200Percent(page);

      const metrics = await page.evaluate(() => {
        const maxCssTimeMs = (value: string): number =>
          Math.max(0, ...value.split(",").map((part) => {
            const trimmed = part.trim();
            if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed);
            if (trimmed.endsWith("s")) return Number.parseFloat(trimmed) * 1000;
            return 0;
          }));
        const motionTarget = document.querySelector("main a[href], main button, footer a");
        const motionStyles = motionTarget ? window.getComputedStyle(motionTarget) : null;
        return {
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          rootFontSize: Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize),
          scrollBehavior: window.getComputedStyle(document.documentElement).scrollBehavior,
          transitionDurationMs: motionStyles ? maxCssTimeMs(motionStyles.transitionDuration) : 0,
          animationDurationMs: motionStyles ? maxCssTimeMs(motionStyles.animationDuration) : 0,
        };
      });

      expect(metrics.rootFontSize, `${path} must enlarge the baseline text by 200%`)
        .toBeGreaterThanOrEqual(baselineFontSize * 1.99);
      expect(metrics.hasHorizontalScroll, `${path} should reflow without horizontal scrolling at 200% text`).toBe(false);
      expect(metrics.scrollBehavior).toBe("auto");
      expect(metrics.transitionDurationMs).toBeLessThanOrEqual(0.02);
      expect(metrics.animationDurationMs).toBeLessThanOrEqual(0.02);

      const mainBox = await page.locator("main#main-content").boundingBox();
      expect(mainBox?.width ?? 0).toBeLessThanOrEqual(metrics.clientWidth + 1);
      await expect(page.locator("#route-header-locale")).toBeVisible();
    }
  });
});
