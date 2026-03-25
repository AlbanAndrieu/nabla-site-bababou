import { expect, test } from "@playwright/test";

test.describe("Site widgets integration", () => {
	test("should inject print, back-to-top and coffee controls on homepage", async ({
		page,
	}) => {
		await page.goto("/");

		const printButton = page.locator("#nabla-print-pdf-btn");
		await expect(printButton).toHaveCount(1);
		await expect(printButton).toBeVisible();
		await expect(printButton).toHaveAttribute("aria-label", /.+/);

		const backToTop = page.locator("#nabla-back-to-top");
		await expect(backToTop).toHaveCount(1);
		await expect(backToTop).toBeVisible();
		await expect(backToTop).toHaveAttribute("href", "#top");

		const coffeeFab = page.locator("#coffee-fab");
		await expect(coffeeFab).toHaveCount(1);
		await expect(coffeeFab).toBeVisible();
	});

	test("should trigger top scroll when back-to-top control is clicked", async ({
		page,
	}) => {
		await page.goto("/");

		await page.evaluate(() => {
			const calls: Array<[number, number]> = [];
			(window as unknown as { __scrollCalls?: Array<[number, number]> }).__scrollCalls =
				calls;
			const original = window.scrollTo.bind(window);
			window.scrollTo = ((x: number, y: number) => {
				calls.push([x, y]);
				original(x, y);
			}) as typeof window.scrollTo;
		});

		await page.locator("#nabla-back-to-top").click();

		const sawScrollTop = await page.evaluate(() => {
			const calls = (
				window as unknown as { __scrollCalls?: Array<[number, number]> }
			).__scrollCalls;
			return !!calls?.some(([x, y]) => x === 0 && y === 0);
		});
		expect(sawScrollTop).toBeTruthy();
	});

	test("should keep 404 in minimal chrome mode while still applying stored theme", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			localStorage.setItem("site-theme-preference", "light");
		});

		await page.goto("/404.html");

		await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
		await expect(page.locator("#theme-toggle-root")).toHaveCount(0);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
		await expect(page.locator("#coffee-fab")).toHaveCount(0);
	});
});
