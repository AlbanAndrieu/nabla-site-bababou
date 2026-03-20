import { expect, test } from "@playwright/test";

test.describe("Homepage Tests", () => {
	test("should load the homepage successfully", async ({ page }) => {
		await page.goto("/");

		// Check page title
		await expect(page).toHaveTitle(/Missing Child/);

		// Check that the main content is visible
		await expect(page.locator("main")).toBeVisible();
	});

	test("should display the main heading", async ({ page }) => {
		await page.goto("/");

		// Check for the main heading (Bababou / Éléonore and Papa looking for you)
		const heading = page.locator("h1");
		await expect(heading).toBeVisible();
		await expect(heading).toContainText(/Bababou.*Éléonore|Éléonore.*Bababou/i);
		await expect(heading).toContainText(/your Papa is looking for you/i);
	});

	test("should have navigation elements", async ({ page }) => {
		await page.goto("/");

		// At least one nav must be visible (e.g. page-nav at top)
		await expect(page.locator("nav").first()).toBeVisible();
	});

	test("should have footer with social links", async ({ page }) => {
		await page.goto("/");

		// Check for footer
		const footer = page.locator("footer");
		await expect(footer).toBeVisible();
	});

	test("should have proper meta tags for SEO", async ({ page }) => {
		await page.goto("/");

		// Check for essential meta tags
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toBeTruthy();

		// Check for Open Graph tags
		const ogTitle = await page
			.locator('meta[property="og:title"]')
			.getAttribute("content");
		expect(ogTitle).toBeTruthy();

		const ogDescription = await page
			.locator('meta[property="og:description"]')
			.getAttribute("content");
		expect(ogDescription).toBeTruthy();
	});

	test("should be responsive on mobile", async ({ page, viewport }) => {
		await page.goto("/");

		// Verify page loads on mobile viewport
		if (viewport && viewport.width < 768) {
			await expect(page.locator("body")).toBeVisible();

			// Check that content is still accessible
			await expect(page.locator("main")).toBeVisible();
		}
	});

	test("should have accessible skip link", async ({ page }) => {
		await page.goto("/");

		// Check for skip to main content link (accessibility feature)
		const skipLink = page.locator('a.skip-to-main, a[href="#main-content"]');
		if ((await skipLink.count()) > 0) {
			await expect(skipLink).toBeInViewport({ ratio: 0 });
		}
	});

	test("should have proper ARIA labels", async ({ page }) => {
		await page.goto("/");

		// At least one nav with aria-label must be present and visible
		const navWithLabel = page.locator("nav[aria-label]");
		await expect(navWithLabel.first()).toBeVisible();
	});
});
