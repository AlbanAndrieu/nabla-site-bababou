import { expect, test } from "@playwright/test";

test.describe("Theme Toggle Tests", () => {
	test("renders explicit modes, applies theme tokens, and persists preference", async ({
		page,
	}) => {
		await page.goto("/");

		const root = page.locator("#theme-toggle-root");
		const htmlElement = page.locator("html");
		const lightBtn = root.locator('.theme-toggle__btn[data-theme="light"]');
		const darkBtn = root.locator('.theme-toggle__btn[data-theme="dark"]');
		const autoBtn = root.locator('.theme-toggle__btn[data-theme="auto"]');

		await test.step("renders one accessible segmented control", async () => {
			await expect(root).toBeVisible();
			await expect(root).toHaveAttribute("role", "region");
			await expect(root).toHaveAttribute("aria-label", "Display theme");
			await expect(root.locator(".theme-toggle__btn")).toHaveCount(3);
			await expect(lightBtn).toHaveAttribute("aria-label", "Light");
			await expect(darkBtn).toHaveAttribute("aria-label", "Dark");
			await expect(autoBtn).toHaveAttribute("aria-label", "Auto (system)");
			await expect(
				root.locator('.theme-toggle__btn[aria-pressed="true"]'),
			).toHaveCount(1);
		});

		const readTextPrimary = () =>
			page.evaluate(() =>
				getComputedStyle(document.documentElement)
					.getPropertyValue("--text-primary")
					.trim(),
			);

		let lightTextPrimary = "";
		let darkTextPrimary = "";

		await test.step("applies and persists light mode", async () => {
			await lightBtn.scrollIntoViewIfNeeded();
			await lightBtn.click({ force: true });
			await expect(htmlElement).toHaveAttribute("data-theme", "light", {
				timeout: 15_000,
			});
			await expect
				.poll(
					async () =>
						page.evaluate(
							() => localStorage.getItem("site-theme-preference") ?? "",
						),
					{ timeout: 15_000 },
				)
				.toBe("light");
			lightTextPrimary = await readTextPrimary();
			expect(lightTextPrimary.length).toBeGreaterThan(0);
		});

		await test.step("applies dark mode and changes theme tokens", async () => {
			await darkBtn.scrollIntoViewIfNeeded();
			await darkBtn.click({ force: true });
			await expect(htmlElement).toHaveAttribute("data-theme", "dark", {
				timeout: 15_000,
			});
			await expect
				.poll(
					async () =>
						page.evaluate(
							() => localStorage.getItem("site-theme-preference") ?? "",
						),
					{ timeout: 15_000 },
				)
				.toBe("dark");
			darkTextPrimary = await readTextPrimary();
			expect(darkTextPrimary.length).toBeGreaterThan(0);
			expect(darkTextPrimary).not.toBe(lightTextPrimary);
		});

		await test.step("restores persisted dark preference after reload", async () => {
			await page.reload();
			await expect(htmlElement).toHaveAttribute("data-theme", "dark", {
				timeout: 15_000,
			});
			await expect(
				page.locator('#theme-toggle-root [data-theme="dark"]'),
			).toHaveAttribute("aria-pressed", "true");
			expect(
				await page.evaluate(() =>
					localStorage.getItem("site-theme-preference"),
				),
			).toBe("dark");
		});
	});

	test("treats invalid stored preference as auto", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("site-theme-preference", "invalid-theme");
		});

		await page.goto("/");

		await expect(
			page.locator('#theme-toggle-root [data-theme="auto"]'),
		).toHaveAttribute("aria-pressed", "true");

		const resolvedPreference = await page.evaluate(() => {
			return window.themeToggle?.get();
		});
		expect(resolvedPreference).toBe("auto");
	});
});
