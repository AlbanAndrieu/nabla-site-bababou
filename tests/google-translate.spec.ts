import { expect, test, type Page } from "@playwright/test";

type TranslateHostOptions = {
	bodyHtml?: string;
	scriptAttrs?: Record<string, string | true>;
	includeScriptTwice?: boolean;
};

function escapeAttribute(value: string) {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

async function gotoTranslateHost(
	page: Page,
	{
		bodyHtml = '<a name="top"></a>',
		scriptAttrs = {},
		includeScriptTwice = false,
	}: TranslateHostOptions = {},
) {
	const extraAttrs = Object.entries(scriptAttrs)
		.map(([name, value]) =>
			value === true ? name : `${name}="${escapeAttribute(String(value))}"`,
		)
		.join(" ");
	const attrs = extraAttrs ? ` ${extraAttrs}` : "";
	const scriptTags = includeScriptTwice
		? `<script src="/site-google-translate.js" defer${attrs}></script>
<script src="/site-google-translate.js" defer${attrs}></script>`
		: `<script src="/site-google-translate.js" defer${attrs}></script>`;

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
		${scriptTags}
	</body>
</html>`,
		});
	});

	await page.route(
		"**/translate.google.com/translate_a/element.js?cb=googleTranslateElementInit",
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/javascript",
				body: "",
			});
		},
	);

	await page.goto("/translate-test-host.html");
	await page.waitForLoadState("domcontentloaded");
}

test.describe("Google Translate widget regressions", () => {
	test("injects mount wrapper and loader when mount is missing", async ({ page }) => {
		await gotoTranslateHost(page);

		await expect(page.locator(".google-translate-widget")).toHaveCount(1);
		await expect(page.locator("#google_translate_element")).toHaveCount(1);
		await expect(page.locator(".google-translate-widget__toggle")).toHaveAttribute(
			"aria-expanded",
			"false",
		);

		const wrapperIsFirstChild = await page.evaluate(() => {
			const body = document.body;
			return body?.firstElementChild?.classList.contains(
				"google-translate-widget",
			);
		});
		expect(wrapperIsFirstChild).toBeTruthy();

		await expect(
			page.locator(
				'script[src*="translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"]',
			),
		).toHaveCount(1);
	});

	test("honors data-no-google-translate and skips startup", async ({ page }) => {
		await gotoTranslateHost(page, {
			scriptAttrs: { "data-no-google-translate": true },
		});

		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#google_translate_element")).toHaveCount(0);
		await expect(
			page.locator('script[src*="translate.google.com/translate_a/element.js"]'),
		).toHaveCount(0);

		const startedFlag = await page.evaluate(
			() => (window as { __NABLA_GOOGLE_TRANSLATE_STARTED?: boolean })
				.__NABLA_GOOGLE_TRANSLATE_STARTED,
		);
		expect(startedFlag).toBeUndefined();
	});

	test("reuses existing mount without injecting wrapper", async ({ page }) => {
		await gotoTranslateHost(page, {
			bodyHtml:
				'<a name="top"></a><main><div id="google_translate_element"></div></main>',
		});

		await expect(page.locator("#google_translate_element")).toHaveCount(1);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(
			page.locator(
				'script[src*="translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"]',
			),
		).toHaveCount(1);
	});

	test("starts only once when script is included twice", async ({ page }) => {
		await gotoTranslateHost(page, { includeScriptTwice: true });

		await expect(page.locator(".google-translate-widget")).toHaveCount(1);
		await expect(page.locator("#google_translate_element")).toHaveCount(1);
		await expect(
			page.locator(
				'script[src*="translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"]',
			),
		).toHaveCount(1);
	});

	test("googleTranslateElementInit is guarded and idempotent", async ({ page }) => {
		await gotoTranslateHost(page);

		const withoutApi = await page.evaluate(() => {
			const win = window as unknown as {
				googleTranslateElementInit: () => void;
				__NABLA_GOOGLE_TRANSLATE_READY?: boolean;
			};
			win.googleTranslateElementInit();
			return {
				ready: win.__NABLA_GOOGLE_TRANSLATE_READY ?? false,
			};
		});
		expect(withoutApi.ready).toBeFalsy();

		const withApi = await page.evaluate(() => {
			const win = window as unknown as {
				google: {
					translate: {
						TranslateElement: {
							new (
								config: Record<string, unknown>,
								mountId: string,
							): unknown;
							InlineLayout: { SIMPLE: string };
						};
					};
				};
				googleTranslateElementInit: () => void;
				__NABLA_GOOGLE_TRANSLATE_READY?: boolean;
				__translateCtorCalls?: Array<{
					config: Record<string, unknown>;
					mountId: string;
				}>;
			};

			win.__translateCtorCalls = [];
			function MockTranslateElement(
				this: unknown,
				config: Record<string, unknown>,
				mountId: string,
			) {
				win.__translateCtorCalls?.push({ config, mountId });
			}

			(
				MockTranslateElement as unknown as { InlineLayout: { SIMPLE: string } }
			).InlineLayout = { SIMPLE: "SIMPLE_LAYOUT" };

			win.google = {
				translate: {
					TranslateElement:
						MockTranslateElement as unknown as {
							new (
								config: Record<string, unknown>,
								mountId: string,
							): unknown;
							InlineLayout: { SIMPLE: string };
						},
				},
			};

			win.googleTranslateElementInit();
			win.googleTranslateElementInit();

			return {
				ready: win.__NABLA_GOOGLE_TRANSLATE_READY ?? false,
				calls: win.__translateCtorCalls ?? [],
			};
		});

		expect(withApi.ready).toBeTruthy();
		expect(withApi.calls).toHaveLength(1);
		expect(withApi.calls[0].mountId).toBe("google_translate_element");
		expect(withApi.calls[0].config.pageLanguage).toBe("en");
		expect(typeof withApi.calls[0].config.includedLanguages).toBe("string");
		expect(withApi.calls[0].config.autoDisplay).toBe(false);
		expect(withApi.calls[0].config.layout).toBe("SIMPLE_LAYOUT");
	});

	test("mobile toggle opens and closes predictably", async ({ page }) => {
		await gotoTranslateHost(page);

		const widget = page.locator(".google-translate-widget");
		const toggle = page.locator(".google-translate-widget__toggle");

		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(widget).not.toHaveClass(/is-open/);

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(widget).toHaveClass(/is-open/);

		await page.keyboard.press("Escape");
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(widget).not.toHaveClass(/is-open/);

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await page.locator("body").click({ position: { x: 5, y: 5 } });
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(widget).not.toHaveClass(/is-open/);
	});
});
