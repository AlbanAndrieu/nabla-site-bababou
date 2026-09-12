import { expect, test } from "@playwright/test";

test.describe("Responsive Design Tests", () => {
	test("keeps the homepage usable across mobile, tablet and desktop", async ({
		page,
	}) => {
		const viewports = [
			{ width: 320, height: 568, name: "small-mobile" },
			{ width: 375, height: 667, name: "mobile" },
			{ width: 768, height: 1024, name: "tablet" },
			{ width: 1024, height: 768, name: "tablet-landscape" },
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
				expect(hasHorizontalScroll).toBeFalsy();

				if (viewport.name === "mobile") {
					mobileBodyWidth = bodyWidth;
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
	const viewports = [
		{ width: 320, height: 568, name: "small-mobile" },
		{ width: 375, height: 667, name: "mobile" },
		{ width: 768, height: 1024, name: "tablet" },
		{ width: 1024, height: 768, name: "tablet-landscape" },
		{ width: 1440, height: 900, name: "desktop" },
	] as const;
	const paths = ["/contact", "/de/contact", "/policy"] as const;

	for (const viewport of viewports) {
		test(`keeps controls and content usable on ${viewport.name}`, async ({ page }) => {
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});

			for (const path of paths) {
				await page.goto(path);
				await expect(page.locator("body")).toBeVisible();

				const viewportMetrics = await page.evaluate(() => ({
					clientWidth: document.documentElement.clientWidth,
					hasHorizontalScroll:
						document.documentElement.scrollWidth >
						document.documentElement.clientWidth,
				}));
				expect(
					viewportMetrics.hasHorizontalScroll,
					`${path} should not overflow horizontally on ${viewport.name}`,
				).toBe(false);

				const mainBox = await page.locator("main").first().boundingBox();
				expect(
					mainBox?.width ?? 0,
					`${path} main content should stay inside ${viewport.name}`,
				).toBeLessThanOrEqual(viewportMetrics.clientWidth);

				const localeSelect = page.locator("#route-header-locale");
				await expect(localeSelect).toBeVisible();
				const localeBox = await localeSelect.boundingBox();
				expect(
					localeBox?.height ?? 0,
					`${path} language selector should be at least 44px high`,
				).toBeGreaterThanOrEqual(44);
				expect(localeBox?.width ?? 0).toBeLessThanOrEqual(
					viewportMetrics.clientWidth,
				);

				if (viewport.width <= 900) {
					const navBox = await page.locator("header nav").first().boundingBox();
					const localeLabelBox = await page
						.locator('header label[for="route-header-locale"]')
						.boundingBox();
					expect(navBox).not.toBeNull();
					expect(localeLabelBox).not.toBeNull();
					expect((navBox?.y ?? 0) + (navBox?.height ?? 0)).toBeLessThanOrEqual(
						(localeLabelBox?.y ?? 0) + 1,
					);
				}

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

				if (viewport.width <= 575.98) {
					const localeLabelBox = await page
						.locator('header label[for="route-header-locale"]')
						.boundingBox();
				expect(Math.abs((localeBox?.width ?? 0) - (localeLabelBox?.width ?? 0))).toBeLessThanOrEqual(2);

					const legalLink = page.locator("footer .footer-links a").first();
					await expect(legalLink).toBeVisible();
					const legalBox = await legalLink.boundingBox();
					expect(legalBox?.height ?? 0).toBeGreaterThanOrEqual(44);
				}

				if (path.endsWith("/contact")) {
					const contactCta = page.locator('a[href="#contact-details"]').first();
					await expect(contactCta).toBeVisible();
					const ctaBox = await contactCta.boundingBox();
					expect(
						ctaBox?.height ?? 0,
						`${path} contact CTA should be at least 44px high`,
					).toBeGreaterThanOrEqual(44);
					expect(ctaBox?.width ?? 0).toBeLessThanOrEqual(
						viewportMetrics.clientWidth,
					);

					const map = page.locator(".map-container iframe");
					await expect(map).toBeVisible();
					const mapBox = await map.boundingBox();
					expect(mapBox?.width ?? 0).toBeLessThanOrEqual(
						viewportMetrics.clientWidth,
					);
					expect(mapBox?.height ?? 0).toBeGreaterThanOrEqual(240);
				}
			}
		});
	}

	test("reflows at 200% text and honors reduced motion on small mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 320, height: 568 });
		await page.emulateMedia({ reducedMotion: "reduce" });

		for (const path of paths) {
			await page.goto(path);
			await page.addStyleTag({
				content: "html { font-size: 200% !important; }",
			});
			await expect(page.locator("body")).toBeVisible();

			const metrics = await page.evaluate(() => {
				const maxCssTimeMs = (value: string): number =>
					Math.max(
						0,
						...value.split(",").map((part) => {
							const trimmed = part.trim();
							if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed);
							if (trimmed.endsWith("s")) {
								return Number.parseFloat(trimmed) * 1000;
							}
							return 0;
						}),
					);
				const motionTarget = document.querySelector(
					'a[href="#contact-details"], footer a.social-link',
				);
				const motionStyles = motionTarget
					? window.getComputedStyle(motionTarget)
					: null;
				return {
					clientWidth: document.documentElement.clientWidth,
					hasHorizontalScroll:
						document.documentElement.scrollWidth >
						document.documentElement.clientWidth,
					rootFontSize: Number.parseFloat(
						window.getComputedStyle(document.documentElement).fontSize,
					),
					scrollBehavior: window.getComputedStyle(document.documentElement)
						.scrollBehavior,
					transitionDurationMs: motionStyles
						? maxCssTimeMs(motionStyles.transitionDuration)
						: 0,
					animationDurationMs: motionStyles
						? maxCssTimeMs(motionStyles.animationDuration)
						: 0,
				};
			});

			expect(metrics.rootFontSize, `${path} should honor 200% text sizing`).toBeGreaterThanOrEqual(32);
			expect(
				metrics.hasHorizontalScroll,
				`${path} should reflow without horizontal scrolling at 200% text`,
			).toBe(false);
			expect(metrics.scrollBehavior).toBe("auto");
			expect(metrics.transitionDurationMs).toBeLessThanOrEqual(0.02);
			expect(metrics.animationDurationMs).toBeLessThanOrEqual(0.02);

			const mainBox = await page.locator("main").first().boundingBox();
			expect(mainBox?.width ?? 0).toBeLessThanOrEqual(metrics.clientWidth);
			await expect(page.locator("#route-header-locale")).toBeVisible();
		}
	});
});
