import { expect, test, type Page } from "@playwright/test";

type TranslateHostOptions = {
	bodyHtml?: string;
	scriptAttrs?: Record<string, string | true>;
	scriptCopies?: number;
};

function escapeAttribute(value: string) {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

async function stubGoogleTranslateLoader(page: Page) {
	await page.route(
		/https:\/\/translate\.google\.com\/translate_a\/element\.js\?cb=googleTranslateElementInit/,
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/javascript",
				body: "window.__googleTranslateLoaderHits = (window.__googleTranslateLoaderHits || 0) + 1;",
			});
		},
	);
}

async function gotoTranslateHost(
	page: Page,
	{
		bodyHtml = "",
		scriptAttrs = {},
		scriptCopies = 1,
	}: TranslateHostOptions = {},
) {
	const attrs = Object.entries(scriptAttrs)
		.map(([name, value]) =>
			value === true ? name : `${name}="${escapeAttribute(String(value))}"`,
		)
		.join(" ");
	const scriptTag = `<script src="/site-google-translate.js" defer${attrs ? ` ${attrs}` : ""}></script>`;
	const scripts = Array.from({ length: scriptCopies }, () => scriptTag).join("\n");

	await page.route("**/google-translate-host.html", async (route) => {
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
		${scripts}
	</body>
</html>`,
		});
	});

	await page.goto("/google-translate-host.html");
	await page.waitForLoadState("domcontentloaded");
}

test.describe("Google Translate bootstrap regressions", () => {
	test("skips bootstrap when explicitly disabled", async ({ page }) => {
		await gotoTranslateHost(page, {
			scriptAttrs: { "data-no-google-translate": true },
		});

		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#google_translate_element")).toHaveCount(0);
		await expect(
			page.locator('script[src*="translate.google.com/translate_a/element.js"]'),
		).toHaveCount(0);

		const hasCallback = await page.evaluate(() => {
			return typeof (window as any).googleTranslateElementInit === "function";
		});
		expect(hasCallback).toBeFalsy();
	});

	test("injects widget shell and external script only once", async ({ page }) => {
		await stubGoogleTranslateLoader(page);
		await gotoTranslateHost(page, { scriptCopies: 2 });

		await expect(page.locator(".google-translate-widget")).toHaveCount(1);
		await expect(page.locator(".google-translate-widget__toggle")).toHaveCount(1);
		await expect(page.locator("#google_translate_element")).toHaveCount(1);
		await expect(
			page.locator('script[src*="translate.google.com/translate_a/element.js"]'),
		).toHaveCount(1);
	});

	test("reuses existing mount instead of prepending wrapper", async ({ page }) => {
		await stubGoogleTranslateLoader(page);
		await gotoTranslateHost(page, {
			bodyHtml: '<div id="google_translate_element"></div>',
		});

		await expect(page.locator("#google_translate_element")).toHaveCount(1);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(
			page.locator('script[src*="translate.google.com/translate_a/element.js"]'),
		).toHaveCount(1);
	});

	test("supports mobile toggle open/close interactions", async ({ page }) => {
		await stubGoogleTranslateLoader(page);
		await page.setViewportSize({ width: 375, height: 812 });
		await gotoTranslateHost(page);

		const widget = page.locator(".google-translate-widget");
		const toggle = page.locator(".google-translate-widget__toggle");

		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await toggle.click();
		await expect(widget).toHaveClass(/is-open/);
		await expect(toggle).toHaveAttribute("aria-expanded", "true");

		await page.mouse.click(5, 400);
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(widget).not.toHaveClass(/is-open/);

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await page.keyboard.press("Escape");
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	test("initialization callback is idempotent", async ({ page }) => {
		await page.addInitScript(() => {
			(window as any).__translateCtorCalls = 0;
			(window as any).__translateCtorArgs = null;

			const TranslateElement = function (...args: unknown[]) {
				(window as any).__translateCtorCalls += 1;
				(window as any).__translateCtorArgs = args;
			} as any;

			TranslateElement.InlineLayout = { SIMPLE: "SIMPLE" };

			(window as any).google = {
				translate: {
					TranslateElement,
				},
			};
		});

		await stubGoogleTranslateLoader(page);
		await gotoTranslateHost(page);

		const result = await page.evaluate(() => {
			(window as any).googleTranslateElementInit();
			(window as any).googleTranslateElementInit();

			return {
				calls: (window as any).__translateCtorCalls,
				args: (window as any).__translateCtorArgs,
				ready: !!(window as any).__NABLA_GOOGLE_TRANSLATE_READY,
			};
		});

		expect(result.calls).toBe(1);
		expect(result.ready).toBeTruthy();
		expect(result.args?.[0]?.pageLanguage).toBe("en");
		expect(result.args?.[1]).toBe("google_translate_element");
	});

	test("callback exits safely when Google API is unavailable", async ({ page }) => {
		await stubGoogleTranslateLoader(page);
		await gotoTranslateHost(page);

		const readyAfterInit = await page.evaluate(() => {
			(window as any).google = undefined;
			(window as any).__NABLA_GOOGLE_TRANSLATE_READY = false;
			(window as any).googleTranslateElementInit();
			return !!(window as any).__NABLA_GOOGLE_TRANSLATE_READY;
		});

		expect(readyAfterInit).toBeFalsy();
	});
});
