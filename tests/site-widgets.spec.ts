import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "@playwright/test";

function collectHtmlFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = join(directory, entry.name);
		if (entry.isDirectory()) return collectHtmlFiles(entryPath);
		return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
	});
}

const staticBackToTopPages = collectHtmlFiles("public").filter((filePath) =>
	readFileSync(filePath, "utf8").includes('href="#top"'),
);

const representativeStaticPages = [
	"/people-contacted.html",
	"/ca/index.html",
	"/central-authorities.html",
];

test.describe("Site widgets integration", () => {
	test("should inject print, back-to-top on homepage", async ({ page }) => {
		await page.goto("/");

		const printButton = page.locator("#nabla-print-pdf-btn");
		await expect(printButton).toBeVisible({ timeout: 15_000 });
		await expect(printButton).toHaveAttribute("aria-label", /print|pdf/i);

		const backToTop = page.locator("#nabla-back-to-top");
		await expect(backToTop).toBeVisible();
		await expect(backToTop).toHaveAttribute("href", "#top");
	});

	test("homepage publishes the canonical Bababou email without inactive cookie settings", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(
			page.locator('a[href="mailto:aa@bababou.com"]'),
		).toHaveCount(5);
		await expect(page.getByRole("link", { name: "Cookies", exact: true })).toHaveCount(0);
		await expect(
			page.locator('a[href^="javascript:openAxeptioCookies"]'),
		).toHaveCount(0);
	});

	test("removes inactive legacy cookie settings links on static pages", async ({ page }) => {
		await page.goto("/cancel.html");

		await expect(
			page.locator('a[href="javascript:openAxeptioCookies()"]'),
		).toHaveCount(0);
	});

	test("should trigger top scroll when back-to-top control is clicked", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#nabla-back-to-top").waitFor();
		await page.evaluate(() => {
			document.documentElement.style.minHeight = "200vh";
			document.body.style.minHeight = "200vh";
			window.scrollTo(0, document.documentElement.scrollHeight);
		});
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(0);

		await page.locator("#nabla-back-to-top").click();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	});

	test("all legacy #top pages load the shared back-to-top widget", () => {
		expect(staticBackToTopPages.length).toBeGreaterThan(0);

		for (const filePath of staticBackToTopPages) {
			const source = readFileSync(filePath, "utf8");
			expect(
				source,
				`${relative(process.cwd(), filePath)} must load site-widgets.js`,
			).toContain("site-widgets.js");
		}
	});

	for (const path of representativeStaticPages) {
		test(`${path} footer and floating back-to-top controls scroll to the top`, async ({
			page,
		}) => {
			await page.goto(path);
			const floatingBackToTop = page.locator("#nabla-back-to-top");
			const footerBackToTop = page.locator('footer a[href="#top"]');
			await expect(floatingBackToTop).toBeVisible();
			await expect(footerBackToTop).toBeVisible();

			for (const control of [footerBackToTop, floatingBackToTop]) {
				await page.evaluate(() => {
					document.documentElement.style.minHeight = "200vh";
					document.body.style.minHeight = "200vh";
					window.scrollTo(0, document.documentElement.scrollHeight);
				});
				await expect
					.poll(() => page.evaluate(() => window.scrollY))
					.toBeGreaterThan(0);
				await control.click();
				await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
			}
		});
	}

	test("should scroll to top when back-to-top control has href '#'", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#nabla-back-to-top").waitFor();
		await page.evaluate(() => {
			const button = document.getElementById("nabla-back-to-top");
			if (button) {
				button.setAttribute("href", "#");
			}
			document.documentElement.style.minHeight = "200vh";
			document.body.style.minHeight = "200vh";
			window.scrollTo(0, document.documentElement.scrollHeight);
		});
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(0);

		await page.locator("#nabla-back-to-top").click();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	});

	test("should keep the global 404 in minimal chrome mode", async ({ page }) => {
		const response = await page.goto("/404.html");

		expect(response?.status()).toBe(404);
		await expect(page.locator("#theme-toggle-root")).toHaveCount(0);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
		await expect(page.locator("#coffee-fab")).toHaveCount(0);
	});

	test("clicking print control calls window.print", async ({ page }) => {
		await page.addInitScript(() => {
			(window as unknown as { __printCalls: number }).__printCalls = 0;
			window.print = () => {
				(window as unknown as { __printCalls: number }).__printCalls += 1;
			};
		});

		await page.goto("/");

		const printBtn = page.locator("#nabla-print-pdf-btn");
		await expect(printBtn).toBeVisible({ timeout: 15_000 });
		await printBtn.click();

		const printCalls = await page.evaluate(
			() => (window as unknown as { __printCalls: number }).__printCalls,
		);
		expect(printCalls).toBe(1);
	});
});
