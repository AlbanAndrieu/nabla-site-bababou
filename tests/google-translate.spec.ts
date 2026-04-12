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
	{ bodyHtml = "", scriptAttrs = {} }: TranslateHostOptions = {},
) {
	const extraAttrs = Object.entries(scriptAttrs)
		.map(([name, value]) =>
			value === true ? name : `${name}="${escapeAttribute(String(value))}"`,
		)
		.join(" ");

	await page.route("**/translate-test-host.html", async (route) => {
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

	await page.goto("/translate-test-host.html");
	await page.waitForLoadState("domcontentloaded");
}

test.describe("Google Translate widget regression coverage", () => {
	test("injects translate wrapper and loader script by default", async ({ page }) => {
		await gotoTranslateHost(page);

		await expect(page.locator(".google-translate-widget")).toHaveCount(1);
		await expect(page.locator("#google_translate_element")).toHaveCount(1);
		await expect(page.locator(".google-translate-widget__toggle")).toHaveAttribute(
			"aria-controls",
			"google_translate_element",
		);
		await expect(
			page.locator('script[src*="translate.google.com/translate_a/element.js"]'),
		).toHaveCount(1);
	});

	test("skips all initialization when opt-out flag is present", async ({ page }) => {
		await gotoTranslateHost(page, { scriptAttrs: { "data-no-google-translate": true } });

		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#google_translate_element")).toHaveCount(0);
		await expect(
			page.locator('script[src*="translate.google.com/translate_a/element.js"]'),
		).toHaveCount(0);

		const started = await page.evaluate(
			() => (window as Window & { __NABLA_GOOGLE_TRANSLATE_STARTED?: boolean }).__NABLA_GOOGLE_TRANSLATE_STARTED,
		);
		expect(started).toBeUndefined();
	});

	test("reuses existing mount and does not duplicate external loader", async ({
		page,
	}) => {
		await gotoTranslateHost(page, {
			bodyHtml:
				'<div id="google_translate_element"></div><script src="https://translate.google.com/translate_a/element.js?cb=alreadyLoaded"></script>',
		});

		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#google_translate_element")).toHaveCount(1);
		await expect(
			page.locator('script[src*="translate.google.com/translate_a/element.js"]'),
		).toHaveCount(1);
	});

	test("googleTranslateElementInit remains idempotent once ready", async ({
		page,
	}) => {
		await gotoTranslateHost(page);

		const initCalls = await page.evaluate(() => {
			type TranslateCtor = {
				new (opts: unknown, id: string): unknown;
				InlineLayout: { SIMPLE: string };
			};

			const calls: Array<{ id: string; pageLanguage: string }> = [];
			const TranslateElement = function (
				this: unknown,
				opts: { pageLanguage: string },
				id: string,
			) {
				calls.push({ id, pageLanguage: opts.pageLanguage });
			} as unknown as TranslateCtor;
			TranslateElement.InlineLayout = { SIMPLE: "simple" };

			(window as any).google = {
				translate: {
					TranslateElement,
				},
			};

			(window as any).__NABLA_GOOGLE_TRANSLATE_READY = false;
			(window as any).googleTranslateElementInit();
			(window as any).googleTranslateElementInit();
			return calls;
		});

		expect(initCalls).toHaveLength(1);
		expect(initCalls[0]).toEqual({
			id: "google_translate_element",
			pageLanguage: "en",
		});
	});
});
