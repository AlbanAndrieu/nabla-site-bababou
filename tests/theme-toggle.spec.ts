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

	test("should render segmented control with explicit modes", async ({
		page,
	}) => {
		await page.goto("/");

		const root = page.locator("#theme-toggle-root");
		await expect(root).toBeVisible();
		await expect(root).toHaveAttribute("role", "region");
		await expect(root).toHaveAttribute("aria-label", "Display theme");

		const buttons = root.locator(".theme-toggle__btn");
		await expect(buttons).toHaveCount(3);

		const lightBtn = root.locator('.theme-toggle__btn[data-theme="light"]');
		const darkBtn = root.locator('.theme-toggle__btn[data-theme="dark"]');
		const autoBtn = root.locator('.theme-toggle__btn[data-theme="auto"]');
		await expect(lightBtn).toHaveCount(1);
		await expect(darkBtn).toHaveCount(1);
		await expect(autoBtn).toHaveCount(1);

		await expect(lightBtn).toHaveAttribute(
			"aria-label",
			"Light",
		);
		await expect(darkBtn).toHaveAttribute(
			"aria-label",
			"Dark",
		);
		await expect(autoBtn).toHaveAttribute(
			"aria-label",
			"Auto (system)",
		);

		const pressedCount = await root
			.locator('.theme-toggle__btn[aria-pressed="true"]')
			.count();
		expect(pressedCount).toBe(1);
	});

	test("should persist selected segmented mode with exclusive active state", async ({
		page,
	}) => {
		await page.goto("/");

		const root = page.locator("#theme-toggle-root");
		await expect(root).toBeVisible();

		const assertActiveTheme = async (theme: "light" | "dark" | "auto") => {
			const themes: Array<"light" | "dark" | "auto"> = ["light", "dark", "auto"];
			for (const candidate of themes) {
				await expect(
					root.locator(`.theme-toggle__btn[data-theme="${candidate}"]`),
				).toHaveAttribute(
					"aria-pressed",
					candidate === theme ? "true" : "false",
				);
			}
		};

		const clickModeAndAssert = async (theme: "light" | "dark" | "auto") => {
			await root.locator(`.theme-toggle__btn[data-theme="${theme}"]`).click();
			await expect.poll(async () => {
				return page.evaluate(
					() => localStorage.getItem("site-theme-preference") ?? "",
				);
			}).toBe(theme);
			await assertActiveTheme(theme);
		};

		await clickModeAndAssert("light");
		await clickModeAndAssert("dark");
		await clickModeAndAssert("auto");
	});

	test("should treat invalid stored preference as auto", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("site-theme-preference", "invalid-theme");
		});

		await page.goto("/");

		await expect(page.locator('#theme-toggle-root [data-theme="auto"]')).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		const resolvedPreference = await page.evaluate(() => {
			return window.themeToggle?.get();
		});
		expect(resolvedPreference).toBe("auto");
	});

	test("should toggle between light and dark theme", async ({ page }) => {
		await page.goto("/");

		const lightBtn = page.locator('#theme-toggle-root .theme-toggle__btn[data-theme="light"]');
		const darkBtn = page.locator('#theme-toggle-root .theme-toggle__btn[data-theme="dark"]');

		await expect(lightBtn).toHaveCount(1);
		await expect(darkBtn).toHaveCount(1);

		await lightBtn.click();
		await expect
			.poll(async () =>
				page.evaluate(() => localStorage.getItem("site-theme-preference") ?? ""),
			)
			.toBe("light");

		await darkBtn.click();
		await expect
			.poll(async () =>
				page.evaluate(() => localStorage.getItem("site-theme-preference") ?? ""),
			)
			.toBe("dark");
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
