import { expect, test } from "@playwright/test";

test.describe("Homepage Tests", () => {
	test("preserves the approved homepage content, metadata and chrome", async ({
		page,
	}) => {
		await page.goto("/");

		await test.step("loads the owner-approved identity and primary content", async () => {
			// The homepage/index is an owner-controlled exception. Lock the currently
			// approved title so automated changes cannot silently alter its disclosure.
			await expect(page).toHaveTitle(
				"Éléonore (Bababou) — Your Father Is Looking for You | Bababou",
			);
			await expect(page.locator("#main-content")).toBeVisible();

			const heading = page.locator("h1");
			await expect(heading).toBeVisible();
			await expect(heading).toContainText(/Bababou.*Éléonore|Éléonore.*Bababou/i);
			await expect(heading).toContainText(/your Papa is looking for you/i);
		});

		await test.step("keeps structural landmarks and labeled regions", async () => {
			await expect(page.locator("header").first()).toBeVisible();
			await expect(page.locator("main").first()).toBeVisible();
			await expect(page.locator("footer")).toBeVisible();
			await expect(page.locator("section[aria-labelledby]").first()).toBeVisible();
		});

		await test.step("keeps essential SEO and social metadata", async () => {
			await expect(page.locator('meta[name="description"]')).toHaveAttribute(
				"content",
				/.+/,
			);
			await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
				"content",
				/.+/,
			);
			await expect(
				page.locator('meta[property="og:description"]'),
			).toHaveAttribute("content", /.+/);
		});

		await test.step("keeps the accessible skip link contract", async () => {
			const skipLink = page.locator('a.skip-to-main, a[href="#main-content"]');
			await expect(skipLink).toHaveCount(1);
			await expect(skipLink).toHaveAttribute("href", "#main-content");
			await expect(skipLink).not.toBeInViewport();
		});
	});
});
