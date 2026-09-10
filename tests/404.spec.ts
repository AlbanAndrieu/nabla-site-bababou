import { expect, test } from "@playwright/test";

test.describe("404 Error Page Tests", () => {
	const missingPath = "/404.html";

	test("serves the protected minimal 404 contract", async ({ page }) => {
		const response = await page.goto(missingPath);

		await test.step("returns the expected semantic error response", async () => {
			expect(response?.status()).toBe(404);
			await expect(page).toHaveTitle(/404|Not Found/i);
			await expect(page.locator("body")).toContainText(
				/404|not found|page not found/i,
			);
		});

		await test.step("keeps the reviewed minimal chrome", async () => {
			await expect(page.locator("nav")).toHaveCount(0);
			await expect(page.locator("#theme-toggle-btn")).toHaveCount(0);
			await expect(page.locator("#google_translate_element")).toHaveCount(0);
			await expect(page.locator(".google-translate-widget")).toHaveCount(0);
			await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
			await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
			await expect(
				page.locator(
					'script[src*="translate.google.com/translate_a/element.js"]',
				),
			).toHaveCount(0);
		});

		await test.step("renders a valid visible HTML document", async () => {
			await expect(page.locator("html")).toHaveCount(1);
			await expect(page.locator("body")).toBeVisible();
			// Do not couple this direct /404.html endpoint check to the internal
			// markup of the protected source. Unknown Next routes verify the full
			// reviewed public/404.html presentation in next-not-found.spec.ts.
		});
	});
});
