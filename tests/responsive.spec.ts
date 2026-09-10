import { expect, test } from "@playwright/test";

test.describe("Responsive Design Tests", () => {
	test("keeps the homepage usable across mobile, tablet and desktop", async ({
		page,
	}) => {
		const viewports = [
			{ width: 375, height: 667, name: "mobile" },
			{ width: 768, height: 1024, name: "tablet" },
			{ width: 1920, height: 1080, name: "desktop" },
		] as const;
		let mobileBodyWidth = 0;
		let desktopBodyWidth = 0;

		for (const viewport of viewports) {
			await test.step(viewport.name, async () => {
				await page.setViewportSize({
					width: viewport.width,
					height: viewport.height,
				});
				await page.goto("/");

				await expect(page.locator("body")).toBeVisible();
				await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
					"content",
					/width=device-width/,
				);

				const { bodyWidth, fontSize, hasHorizontalScroll } =
					await page.evaluate(() => ({
						bodyWidth: document.body.offsetWidth,
						fontSize: Number.parseFloat(
							window.getComputedStyle(document.body).fontSize,
						),
						hasHorizontalScroll:
							document.documentElement.scrollWidth >
							document.documentElement.clientWidth,
					}));

				expect(fontSize).toBeGreaterThanOrEqual(12);
				if (viewport.name === "mobile") {
					mobileBodyWidth = bodyWidth;
					expect(hasHorizontalScroll).toBeFalsy();

					const interactiveElements = page.locator(
						'button, a, input[type="button"], input[type="submit"]',
					);
					const count = await interactiveElements.count();
					expect(count).toBeGreaterThan(0);

					let foundTouchFriendly = false;
					for (let index = 0; index < count; index += 1) {
						const element = interactiveElements.nth(index);
						if (!(await element.isVisible())) continue;
						const box = await element.boundingBox();
						if (box && (box.width >= 40 || box.height >= 40)) {
							foundTouchFriendly = true;
							break;
						}
					}
					expect(foundTouchFriendly).toBeTruthy();
				}

				if (viewport.name === "desktop") {
					desktopBodyWidth = bodyWidth;
				}
			});
		}

		expect(desktopBodyWidth).toBeGreaterThan(mobileBodyWidth);
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
			expect(
				hasHorizontalScroll,
				`${path} should not overflow horizontally`,
			).toBe(false);

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
