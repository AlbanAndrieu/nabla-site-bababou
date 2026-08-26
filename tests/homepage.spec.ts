import { expect, test } from "@playwright/test";

test.describe("Homepage Tests", () => {
	test("should load the homepage successfully", async ({ page }) => {
		await page.goto("/");

		// The homepage/index is an owner-controlled exception. Lock the currently
		// approved title so automated changes cannot silently alter its disclosure.
		await expect(page).toHaveTitle(
			"Éléonore (Bababou) — Your Father Is Looking for You | Bababou",
		);

		// Primary landmark (homepage also has #second-content as a second <main>)
		await expect(page.locator("#main-content")).toBeVisible();
	});

	test("should display the main heading", async ({ page }) => {
		await page.goto("/");

		// Check for the main heading (Bababou / Éléonore and Papa looking for you)
		const heading = page.locator("h1");
		await expect(heading).toBeVisible();
		await expect(heading).toContainText(/Bababou.*Éléonore|Éléonore.*Bababou/i);
		await expect(heading).toContainText(/your Papa is looking for you/i);
	});

	test("should have header and main landmarks", async ({ page }) => {
		await page.goto("/");

		// Homepage no longer uses a top nav; header + main provide structure
		await expect(page.locator("header").first()).toBeVisible();
		await expect(page.locator("main").first()).toBeVisible();
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

		// Skip link must exist and target main content; visually hidden until focus (not in viewport)
		const skipLink = page.locator('a.skip-to-main, a[href="#main-content"]');
		await expect(skipLink).toHaveCount(1);
		await expect(skipLink).toHaveAttribute("href", "#main-content");
		await expect(skipLink).not.toBeInViewport();
	});

	test("should have labeled regions for accessibility", async ({ page }) => {
		await page.goto("/");

		// Sections tied to headings (e.g. aria-labelledby) remain the primary a11y pattern
		const labeledSection = page.locator("section[aria-labelledby]").first();
		await expect(labeledSection).toBeVisible();
	});
});
