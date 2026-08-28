import { expect, test } from "@playwright/test";

test.describe("localized not-found page", () => {
	test("unknown root slug respects browser locale and shared analytics", async ({
		page,
	}) => {
		const consoleErrors: string[] = [];
		page.on("console", (message) => {
			if (message.type() === "error") consoleErrors.push(message.text());
		});

		const response = await page.goto("/toto");

		expect(response?.status()).toBe(404);
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		await expect(page.locator("html")).toHaveAttribute(
			"data-nabla-app",
			"next-intl",
		);
		await expect(
			page.getByRole("heading", { level: 1, name: "This page is missing" }),
		).toBeVisible();
		await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
		await expect(page.locator('script[src="/site-analytics.js"]')).toHaveCount(
			1,
		);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			/noindex/,
		);
		expect(consoleErrors.filter((message) => /hydrat/i.test(message))).toEqual(
			[],
		);
	});
});
