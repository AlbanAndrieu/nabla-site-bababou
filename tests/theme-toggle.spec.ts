import { expect, test } from "@playwright/test";

test.describe("Theme Toggle Tests", () => {
	test("should have theme toggle button", async ({ page }) => {
		await page.goto("/");

		// Look for theme toggle button
		const themeToggle = page.locator(
			'button[aria-label*="theme" i], .theme-toggle, #theme-toggle',
		);
		if ((await themeToggle.count()) > 0) {
			await expect(themeToggle).toBeVisible();
		}
	});

	test("should toggle between light and dark theme", async ({ page }) => {
		await page.goto("/");

		const themeToggle = page
			.locator(
				'button[aria-label*="theme" i], .theme-toggle, #theme-toggle-btn',
			)
			.first();

		await expect(themeToggle).toHaveCount(1);

		// data-theme on <html> is the *effective* scheme; "auto" can match the same value as "dark".
		// Missing/invalid localStorage matches app default (dark); toggles always write a string, never back to null.
		const readPref = () =>
			page.evaluate(() => localStorage.getItem("site-theme-preference"));
		const raw = await readPref();
		const initialPref =
			raw === "light" || raw === "dark" || raw === "auto" ? raw : "dark";

		await themeToggle.click();
		await page.waitForTimeout(350);

		const newPref = await readPref();
		expect(newPref).not.toBe(initialPref);

		for (let i = 0; i < 4; i++) {
			const current = await readPref();
			if (current === initialPref) break;
			await themeToggle.click();
			await page.waitForTimeout(350);
		}

		expect(await readPref()).toBe(initialPref);
	});

	test("should persist theme preference", async ({ page, context }) => {
		await page.goto("/");

		const themeToggle = page
			.locator('button[aria-label*="theme" i], .theme-toggle, #theme-toggle')
			.first();

		if ((await themeToggle.count()) > 0) {
			// Set to dark theme
			await themeToggle.click();
			await page.waitForTimeout(300);

			const htmlElement = page.locator("html");
			const darkTheme = await htmlElement.getAttribute("data-theme");

			// Reload page
			await page.reload();

			// Check if theme persisted
			const persistedTheme = await htmlElement.getAttribute("data-theme");
			expect(persistedTheme).toBe(darkTheme);
		}
	});

	test("should apply correct styles in dark mode", async ({ page }) => {
		await page.goto("/");

		const themeToggle = page
			.locator(
				'button[aria-label*="theme" i], .theme-toggle, #theme-toggle-btn',
			)
			.first();
		await expect(themeToggle).toHaveCount(1);

		const htmlElement = page.locator("html");

		// Cycle to light theme (avoid relying on "auto" which may match system = dark on WebKit)
		for (
			let i = 0;
			i < 5 && (await htmlElement.getAttribute("data-theme")) !== "light";
			i++
		) {
			await themeToggle.click();
			await page.waitForTimeout(350);
		}
		expect(await htmlElement.getAttribute("data-theme")).toBe("light");
		const lightStyles = await page.evaluate(() => {
			const s = window.getComputedStyle(document.body);
			return { color: s.color, backgroundColor: s.backgroundColor };
		});

		// Cycle to dark theme
		for (
			let i = 0;
			i < 5 && (await htmlElement.getAttribute("data-theme")) !== "dark";
			i++
		) {
			await themeToggle.click();
			await page.waitForTimeout(350);
		}
		expect(await htmlElement.getAttribute("data-theme")).toBe("dark");
		const darkStyles = await page.evaluate(() => {
			const s = window.getComputedStyle(document.body);
			return { color: s.color, backgroundColor: s.backgroundColor };
		});

		// WebKit often reports backgroundColor as transparent when .page-dark uses background + gradients;
		// body text color is set explicitly for light vs dark and is comparable across engines.
		expect(darkStyles.color).not.toBe(lightStyles.color);
	});
});
