import { expect, test } from "@playwright/test";

test.describe("Navigation and Links Tests", () => {
	test("keeps homepage navigation and link semantics valid", async ({ page }) => {
		await page.goto("/");

		await test.step("internal links have non-empty targets", async () => {
			const internalLinks = page.locator(
				'a[href]:not([href^="http"]):not([href^="//"]):not([href^="#"]):not([href^="mailto"]):not([href^="tel"]):not([href^="javascript:"])',
			);
			const linkCount = await internalLinks.count();
			expect(linkCount).toBeGreaterThan(0);

			for (let index = 0; index < Math.min(linkCount, 12); index += 1) {
				const href = await internalLinks.nth(index).getAttribute("href");
				expect(href?.trim().length ?? 0).toBeGreaterThan(0);
			}
		});

		await test.step("sampled links expose an accessible name", async () => {
			const links = page.locator("a[href]");
			const linkCount = await links.count();
			expect(linkCount).toBeGreaterThan(0);

			for (let index = 0; index < Math.min(linkCount, 10); index += 1) {
				const link = links.nth(index);
				const text = (await link.textContent())?.trim();
				const ariaLabel = (await link.getAttribute("aria-label"))?.trim();
				const ariaLabelledby = (
					await link.getAttribute("aria-labelledby")
				)?.trim();
				const title = (await link.getAttribute("title"))?.trim();
				const image = link.locator("img").first();
				const imageAlt =
					(await image.count()) > 0
						? (await image.getAttribute("alt"))?.trim()
						: undefined;

				expect(
					Boolean(text || ariaLabel || ariaLabelledby || title || imageAlt),
				).toBeTruthy();
			}
		});

		await test.step("external links keep valid HTTP targets", async () => {
			const externalLinks = page.locator('a[href^="http"]');
			const linkCount = await externalLinks.count();
			expect(linkCount).toBeGreaterThan(0);

			for (let index = 0; index < Math.min(linkCount, 5); index += 1) {
				const link = externalLinks.nth(index);
				const href = (await link.getAttribute("href"))?.trim() ?? "";
				expect(href).toMatch(/^https?:\/\//);

				const target = await link.getAttribute("target");
				if (target !== null) {
					expect(["_blank", "_self", "_parent", "_top"]).toContain(target);
				}
			}
		});

		await test.step("homepage exposes navigation and footer links", async () => {
			const nav = page.locator(
				'nav, [role="navigation"], header nav, .nav, .navigation',
			);
			await expect(nav.first()).toBeVisible();
			expect(await nav.count()).toBeGreaterThan(0);

			const footer = page.locator('footer, [role="contentinfo"], .footer');
			await expect(footer.first()).toBeVisible();
			expect(await footer.locator("a[href]").count()).toBeGreaterThan(0);
		});
	});

	test("keeps the primary content link interactable", async ({ page }) => {
		await page.goto("/");

		const link = page.locator("#main-content a[href]").first();
		await expect(link).toBeVisible();
		await link.scrollIntoViewIfNeeded();

		const width = page.viewportSize()?.width ?? 1024;
		if (width < 768) {
			await link.focus();
		} else {
			await link.hover({ force: true });
		}

		await expect(link).toBeVisible();
	});
});
