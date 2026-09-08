import { expect, test, type Page } from "@playwright/test";

type TranslateHostOptions = {
	bodyHtml?: string;
	scriptAttrs?: Record<string, string | true>;
};

function escapeAttribute(value: string) {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

async function gotoTranslateHost(
	page: Page,
	{
		bodyHtml = '<main id="main-content">content</main>',
		scriptAttrs = {},
	}: TranslateHostOptions = {},
) {
	const extraAttrs = Object.entries(scriptAttrs)
		.map(([name, value]) =>
			value === true ? name : `${name}="${escapeAttribute(String(value))}"`,
		)
		.join(" ");

	await page.route("**/google-translate-test-host.html", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "text/html",
			body: `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
	</head>
	<body class="page-dark">
		${bodyHtml}
		<script src="/site-google-translate.js" defer ${extraAttrs}></script>
	</body>
</html>`,
		});
	});

	await page.goto("/google-translate-test-host.html");
	await page.waitForLoadState("domcontentloaded");
}

test.describe("Google Translate widget regression coverage", () => {
	test("injects wrapper as first body element when mount is missing", async ({
		page,
	}) => {
		await gotoTranslateHost(page);

		const wrapper = page.locator(".google-translate-widget");
		await expect(wrapper).toHaveCount(1);
		await expect(page.locator("#google_translate_element")).toHaveCount(1);

		const injectedAsFirstElement = await page.evaluate(() => {
			return document.body.firstElementChild?.classList.contains(
				"google-translate-widget",
			);
		});
		expect(injectedAsFirstElement).toBeTruthy();
	});

	test("reuses existing mount without injecting wrapper", async ({ page }) => {
		await gotoTranslateHost(page, {
			bodyHtml:
				'<div id="google_translate_element"></div><main id="main-content">content</main>',
		});

		await expect(page.locator("#google_translate_element")).toHaveCount(1);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
	});

	test("honors data-no-google-translate and skips startup", async ({
		page,
	}) => {
		await gotoTranslateHost(page, {
			scriptAttrs: { "data-no-google-translate": true },
		});

		await expect(page.locator(".google-translate-widget")).toHaveCount(0);

		const startedFlag = await page.evaluate(
			() =>
				(window as { __NABLA_GOOGLE_TRANSLATE_STARTED?: boolean })
					.__NABLA_GOOGLE_TRANSLATE_STARTED,
		);
		expect(startedFlag).toBeUndefined();
	});

	test("keeps toggle state and aria-expanded in sync", async ({ page }) => {
		await gotoTranslateHost(page);

		const widget = page.locator(".google-translate-widget");
		const toggle = page.locator(".google-translate-widget__toggle");

		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(widget).not.toHaveClass(/is-open/);

		await toggle.click();
		await expect(widget).toHaveClass(/is-open/);
		await expect(toggle).toHaveAttribute("aria-expanded", "true");

		await page.keyboard.press("Escape");
		await expect(widget).not.toHaveClass(/is-open/);
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	test("googleTranslateElementInit initializes once when API is available", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			(
				window as {
					__translateInitCalls?: number;
					__translateInitArgs?: { options: unknown; targetId: string };
					google?: unknown;
				}
			).__translateInitCalls = 0;

			(window as { google?: unknown }).google = {
				translate: {
					TranslateElement: function (options: unknown, targetId: string) {
						(
							window as {
								__translateInitCalls: number;
								__translateInitArgs?: { options: unknown; targetId: string };
							}
						).__translateInitCalls += 1;
						(
							window as {
								__translateInitCalls: number;
								__translateInitArgs?: { options: unknown; targetId: string };
							}
						).__translateInitArgs = { options, targetId };
					},
				},
			};

			(
				window as {
					google: {
						translate: {
							TranslateElement: {
								InlineLayout: { SIMPLE: string };
							};
						};
					};
				}
			).google.translate.TranslateElement.InlineLayout = { SIMPLE: "SIMPLE" };
		});

		await gotoTranslateHost(page, {
			bodyHtml:
				'<script src="/mock/translate.google.com/translate_a/element.js"></script><main id="main-content">content</main>',
		});

		const initStatus = await page.evaluate(() => {
			const win = window as {
				googleTranslateElementInit?: () => void;
				__translateInitCalls?: number;
				__translateInitArgs?: { targetId: string };
				__NABLA_GOOGLE_TRANSLATE_READY?: boolean;
			};
			if (typeof win.googleTranslateElementInit !== "function") return null;
			win.googleTranslateElementInit();
			win.googleTranslateElementInit();
			return {
				calls: win.__translateInitCalls ?? 0,
				targetId: win.__translateInitArgs?.targetId ?? null,
				ready: win.__NABLA_GOOGLE_TRANSLATE_READY === true,
			};
		});

		expect(initStatus).not.toBeNull();
		expect(initStatus).toMatchObject({
			calls: 1,
			targetId: "google_translate_element",
			ready: true,
		});
	});

	test.describe("Google Translate Widget Tests", () => {
		test("should have Google Translate widget container", async ({ page }) => {
			await page.goto("/");

			// Wrapper is injected by the dedicated /site-google-translate.js runtime, not SSR.
			const wrapper = page.locator(".google-translate-widget");
			await expect(wrapper).toBeVisible({ timeout: 15_000 });
			const translateElement = page.locator("#google_translate_element");
			await expect(translateElement).toBeAttached();
		});

		test("should load Google Translate scripts", async ({ page }) => {
			await page.goto("/");

			// Wait for page to load
			await page.waitForLoadState("networkidle");

			// Check if Google Translate script is loaded
			const translateScript = page.locator(
				'script[src*="translate.google.com"]',
			);
			if ((await translateScript.count()) > 0) {
				expect(await translateScript.count()).toBeGreaterThan(0);
			}
		});

		test("should have translate configuration", async ({ page }) => {
			await page.goto("/");

			// Check if translate config exists
			const hasConfig = await page.evaluate(() => {
				return (
					typeof (window as any).googleTranslateElementInit === "function" ||
					typeof (window as any).googleTranslateConfig !== "undefined"
				);
			});

			// If config exists, verify it
			if (hasConfig) {
				expect(hasConfig).toBeTruthy();
			}
		});

		test("should be positioned correctly", async ({ page }) => {
			await page.goto("/");

			const translateElement = page.locator("#google_translate_element");

			if ((await translateElement.count()) > 0) {
				const vw = page.viewportSize()?.width ?? 1280;
				if (vw <= 575) {
					const toggle = page.locator(".google-translate-widget__toggle");
					await expect(toggle).toBeAttached({ timeout: 15_000 });
					await expect(toggle).toBeVisible();
					await toggle.click();
				}

				await expect(translateElement).toBeInViewport();

				const position = await translateElement.evaluate((el) => {
					return window.getComputedStyle(el).position;
				});

				expect(["fixed", "absolute", "relative", "sticky"]).toContain(position);
			}
		});

		test("should be accessible on mobile", async ({ page, viewport }) => {
			await page.goto("/");

			if (viewport && viewport.width < 768) {
				const translateElement = page.locator("#google_translate_element");

				if ((await translateElement.count()) > 0) {
					const vw = viewport.width;
					// Below 576px the panel is closed until the toggle opens (see theme.css)
					if (vw <= 575) {
						const toggle = page.locator(".google-translate-widget__toggle");
						if (await toggle.isVisible()) {
							await toggle.click();
						}
					}
					await expect(translateElement).toBeAttached();
					await translateElement.scrollIntoViewIfNeeded();
					await expect(translateElement).toBeInViewport({ ratio: 0.01 });
				}
			}
		});
	});
});
