import { expect, test } from "@playwright/test";

test.describe("Responsive Design Tests", () => {
	test("should be responsive on mobile devices", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
		await page.goto("/");

		// Check that page is visible
		await expect(page.locator("body")).toBeVisible();

		// Check that viewport meta tag exists
		const viewport = page.locator('meta[name="viewport"]');
		await expect(viewport).toHaveAttribute("content", /width=device-width/);
	});

	test("should be responsive on tablet devices", async ({ page }) => {
		// Set tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 }); // iPad
		await page.goto("/");

		// Check that page is visible
		await expect(page.locator("body")).toBeVisible();
	});

	test("should be responsive on desktop", async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");

		// Check that page is visible
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have touch-friendly interactive elements on mobile", async ({
		page,
	}) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		// Get all buttons and links
		const interactiveElements = page.locator(
			'button, a, input[type="button"], input[type="submit"]',
		);
		const count = await interactiveElements.count();

		// At least one visible interactive element should be touch-friendly (≥40px in one dimension, WCAG-style)
		let foundTouchFriendly = false;
		for (let i = 0; i < count; i++) {
			const element = interactiveElements.nth(i);
			if (await element.isVisible()) {
				const box = await element.boundingBox();
				if (box && (box.width >= 40 || box.height >= 40)) {
					foundTouchFriendly = true;
					break;
				}
			}
		}
		expect(foundTouchFriendly).toBeTruthy();
	});

	test("should not have horizontal scroll on mobile", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		// Check for horizontal scroll
		const hasHorizontalScroll = await page.evaluate(() => {
			return (
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth
			);
		});

		expect(hasHorizontalScroll).toBeFalsy();
	});

	test("should adapt layout between mobile and desktop", async ({ page }) => {
		// Check mobile layout
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		const mobileBodyWidth = await page.evaluate(
			() => document.body.offsetWidth,
		);

		// Check desktop layout
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		const desktopBodyWidth = await page.evaluate(
			() => document.body.offsetWidth,
		);

		// Desktop should be wider than mobile
		expect(desktopBodyWidth).toBeGreaterThan(mobileBodyWidth);
	});

	test("should have readable text on all viewport sizes", async ({ page }) => {
		const viewports = [
			{ width: 375, height: 667, name: "mobile" },
			{ width: 768, height: 1024, name: "tablet" },
			{ width: 1920, height: 1080, name: "desktop" },
		];

		for (const viewport of viewports) {
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});
			await page.goto("/");

			// Check that body text is visible and has reasonable font size
			const fontSize = await page.evaluate(() => {
				const body = document.body;
				const styles = window.getComputedStyle(body);
				return Number.parseFloat(styles.fontSize);
			});

			// Font size should be at least 12px
			expect(fontSize).toBeGreaterThanOrEqual(12);
		}
	});
});

test.describe("Native Next chrome", () => {
  test("keeps 44px controls and no horizontal overflow on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    for (const path of ["/contact", "/en/contact", "/policy"]) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();

      const hasHorizontalScroll = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll, `${path} should not overflow horizontally`).toBe(
        false,
      );

      const localeSelect = page.locator("#route-header-locale");
      await expect(localeSelect).toBeVisible();
      const localeBox = await localeSelect.boundingBox();
      expect(
        localeBox?.height ?? 0,
        `${path} language selector should be at least 44px high`,
      ).toBeGreaterThanOrEqual(44);

      const socialLinks = page.locator(
        'footer[role="contentinfo"] a.social-link',
      );
      const socialCount = await socialLinks.count();
      expect(socialCount).toBeGreaterThanOrEqual(2);
      for (let index = 0; index < socialCount; index += 1) {
        const link = socialLinks.nth(index);
        if (!(await link.isVisible())) continue;
        const box = await link.boundingBox();
        expect(
          Math.min(box?.width ?? 0, box?.height ?? 0),
          `${path} footer social control should be at least 44x44px`,
        ).toBeGreaterThanOrEqual(44);
      }

      if (path.endsWith("/contact")) {
        const contactCta = page.locator('a[href="#contact-details"]').first();
        await expect(contactCta).toBeVisible();
        const ctaBox = await contactCta.boundingBox();
        expect(
          ctaBox?.height ?? 0,
          `${path} contact CTA should be at least 44px high`,
        ).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
