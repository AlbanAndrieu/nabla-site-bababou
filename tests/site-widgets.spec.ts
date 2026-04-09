import { expect, test, type Page } from "@playwright/test";

type WidgetHostOptions = {
	htmlLang?: string;
	bodyHtml?: string;
	scriptAttrs?: Record<string, string | true>;
};

function escapeAttribute(value: string) {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

async function gotoWidgetsHost(
	page: Page,
	{ htmlLang = "en", bodyHtml = '<a name="top"></a>', scriptAttrs = {} }: WidgetHostOptions = {},
) {
	const extraAttrs = Object.entries(scriptAttrs)
		.map(([name, value]) =>
			value === true ? name : `${name}="${escapeAttribute(String(value))}"`,
		)
		.join(" ");

	await page.route("**/widgets-test-host.html", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "text/html",
			body: `<!doctype html>
<html lang="${htmlLang}">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
	</head>
	<body class="page-dark">
		${bodyHtml}
		<script src="/site-widgets.js" defer data-no-font-awesome data-no-google-translate ${extraAttrs}></script>
	</body>
</html>`,
		});
	});

	await page.goto("/widgets-test-host.html");
	await page.waitForLoadState("domcontentloaded");
}

test.describe("Site widgets integration", () => {

	test("should inject print, back-to-top and coffee controls on homepage", async ({
		page,
	}) => {
		await page.goto("/");

		const printButton = page.locator("#nabla-print-pdf-btn");
		await expect(printButton).toHaveCount(1);
		await expect(printButton).toBeVisible();
		await expect(printButton).toHaveAttribute("aria-label", /.+/);

		const backToTop = page.locator("#nabla-back-to-top");
		await expect(backToTop).toHaveCount(1);
		await expect(backToTop).toBeVisible();
		await expect(backToTop).toHaveAttribute("href", "#top");

		const coffeeFab = page.locator("#coffee-fab");
		await expect(coffeeFab).toHaveCount(1);
		await expect(coffeeFab).toBeVisible();
	});

	test("should trigger top scroll when back-to-top control is clicked", async ({
		page,
	}) => {
		await page.goto("/");

		await page.evaluate(() => {
			const calls: Array<[number, number]> = [];
			(window as unknown as { __scrollCalls?: Array<[number, number]> }).__scrollCalls =
				calls;
			const original = window.scrollTo.bind(window);
			window.scrollTo = ((x: number, y: number) => {
				calls.push([x, y]);
				original(x, y);
			}) as typeof window.scrollTo;
		});

		await page.locator("#nabla-back-to-top").click();

		const sawScrollTop = await page.evaluate(() => {
			const calls = (
				window as unknown as { __scrollCalls?: Array<[number, number]> }
			).__scrollCalls;
			return !!calls?.some(([x, y]) => x === 0 && y === 0);
		});
		expect(sawScrollTop).toBeTruthy();
	});

	test("should keep 404 in minimal chrome mode while still applying stored theme", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			localStorage.setItem("site-theme-preference", "light");
		});

		await page.goto("/404.html");

		await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
		await expect(page.locator("#theme-toggle-root")).toHaveCount(0);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
		await expect(page.locator("#coffee-fab")).toHaveCount(0);
	});

	test("injects print and back-to-top controls on homepage", async ({ page }) => {
		await page.goto("/");

		const printBtn = page.locator("#nabla-print-pdf-btn");
		const backToTop = page.locator("#nabla-back-to-top");

		await expect(printBtn).toBeVisible();
		await expect(printBtn).toHaveAttribute("aria-label", /print|pdf/i);
		await expect(backToTop).toBeVisible();
		await expect(backToTop).toHaveAttribute("href", "#top");
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
		await expect(printBtn).toBeVisible();
		await printBtn.click();

		const printCalls = await page.evaluate(
			() => (window as unknown as { __printCalls: number }).__printCalls,
		);
		expect(printCalls).toBe(1);
	});

	test("minimal chrome page does not inject optional widgets", async ({ page }) => {
		await page.goto("/404.html");

		await expect(page.locator("#theme-toggle-root")).toHaveCount(0);
		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);

	});

	test("should honor no-* widget flags over matching enable flags", async ({ page }) => {
		await gotoWidgetsHost(page, {
			scriptAttrs: {
				"data-print-pdf": true,
				"data-no-print-pdf": true,
				"data-coffee-fab": true,
				"data-no-coffee-fab": true,
				"data-no-back-to-top": true,
			},
		});

		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#coffee-fab")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
	});

	test("should use french default labels for print and back-to-top controls", async ({
		page,
	}) => {
		await gotoWidgetsHost(page, {
			htmlLang: "fr",
			scriptAttrs: { "data-print-pdf": true },
		});

		const printButton = page.locator("#nabla-print-pdf-btn");
		await expect(printButton).toBeVisible();
		await expect(printButton).toHaveAttribute(
			"aria-label",
			"Imprimer ou enregistrer en PDF",
		);
		await expect(printButton.locator(".print-button__label")).toHaveText(
			"Imprimer / Enregistrer en PDF",
		);

		const backToTop = page.locator("#nabla-back-to-top");
		await expect(backToTop).toHaveCount(1);
		await expect(backToTop).toHaveAttribute("aria-label", "Retour en haut de page");
		await expect(backToTop).toHaveAttribute("title", "Retour en haut");
	});

	test("should remove legacy back-to-top and apply explicit custom labels", async ({
		page,
	}) => {
		await gotoWidgetsHost(page, {
			bodyHtml: '<a name="top"></a><a id="legacy-back-to-top" class="back-to-top" href="#top">Legacy</a>',
			scriptAttrs: {
				"data-print-pdf": true,
				"data-print-pdf-label": "Save this page as PDF",
				"data-print-pdf-aria": "Print this page to PDF",
				"data-back-to-top-label": "Back up",
				"data-back-to-top-aria": "Jump to top quickly",
			},
		});

		await expect(page.locator("#legacy-back-to-top")).toHaveCount(0);

		const printButton = page.locator("#nabla-print-pdf-btn");
		await expect(printButton).toBeVisible();
		await expect(printButton).toHaveAttribute("aria-label", "Print this page to PDF");
		await expect(printButton.locator(".print-button__label")).toHaveText(
			"Save this page as PDF",
		);

		const backToTop = page.locator("#nabla-back-to-top");
		await expect(backToTop).toHaveCount(1);
		await expect(backToTop).toHaveAttribute("aria-label", "Jump to top quickly");
		await expect(backToTop).toHaveAttribute("title", "Back up");
	});

	test("falls back to safe default Ko-fi user when configured value is invalid", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			(window as unknown as { __openCalls: string[] }).__openCalls = [];
			window.open = ((url?: string | URL) => {
				(window as unknown as { __openCalls: string[] }).__openCalls.push(
					String(url ?? ""),
				);
				return null;
			}) as typeof window.open;
		});

		await gotoWidgetsHost(page, {
			scriptAttrs: {
				"data-coffee-fab": true,
				"data-coffee-kofi-user": "not a valid/user?",
			},
		});

		await page.locator("#coffee-fab").click();

		const openCalls = await page.evaluate(
			() => (window as unknown as { __openCalls: string[] }).__openCalls,
		);
		expect(openCalls).toHaveLength(1);
		expect(openCalls[0]).toBe("https://ko-fi.com/albandrieu");
	});

	test("uses delegated smooth-scroll for fragments and top shortcut", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			(window as unknown as { __scrollCalls: Array<[number, number]> }).__scrollCalls =
				[];
			(window as unknown as { __scrollIntoViewCalls: number }).__scrollIntoViewCalls =
				0;

			window.scrollTo = ((x: number, y: number) => {
				(
					window as unknown as { __scrollCalls: Array<[number, number]> }
				).__scrollCalls.push([x, y]);
			}) as typeof window.scrollTo;

			Element.prototype.scrollIntoView = function () {
				(
					window as unknown as { __scrollIntoViewCalls: number }
				).__scrollIntoViewCalls += 1;
			};
		});

		await gotoWidgetsHost(page, {
			bodyHtml:
				'<a name="top"></a><a id="jump-target" href="#target">Jump target</a><a id="jump-top" href="#top">Jump top</a><section id="target">Target</section>',
		});

		await page.locator("#jump-target").click();

		const afterTargetClick = await page.evaluate(() => ({
			scrollIntoViewCalls: (
				window as unknown as { __scrollIntoViewCalls: number }
			).__scrollIntoViewCalls,
			scrollCalls: (
				window as unknown as { __scrollCalls: Array<[number, number]> }
			).__scrollCalls.slice(),
		}));
		expect(afterTargetClick.scrollIntoViewCalls).toBeGreaterThan(0);
		const topCallsBeforeTopClick = afterTargetClick.scrollCalls.filter(
			([x, y]) => x === 0 && y === 0,
		).length;

		await page.locator("#jump-top").click();

		const topCallsAfterTopClick = await page.evaluate(() => {
			return (
				window as unknown as { __scrollCalls: Array<[number, number]> }
			).__scrollCalls.filter(([x, y]) => x === 0 && y === 0).length;
		});
		expect(topCallsAfterTopClick).toBeGreaterThan(topCallsBeforeTopClick);
	});

	test("loads Axeptio only when explicitly enabled", async ({ page }) => {
		await gotoWidgetsHost(page, {
			scriptAttrs: {
				"data-axeptio": true,
				"data-axeptio-client-id": "client-override-123",
				"data-axeptio-cookies-version": "cookies-v2",
			},
		});

		await expect(
			page.locator('script[src*="static.axept.io/sdk.js"]'),
		).toHaveCount(1);
		await expect
			.poll(async () => {
				return page.evaluate(() => {
					return (window as unknown as { axeptioSettings?: unknown })
						.axeptioSettings;
				});
			})
			.toEqual({
				clientId: "client-override-123",
				cookiesVersion: "cookies-v2",
			});
	});

	test("does not load Axeptio in minimal chrome mode", async ({ page }) => {
		await gotoWidgetsHost(page, {
			scriptAttrs: {
				"data-minimal-chrome": true,
				"data-axeptio": true,
			},
		});

		await expect(
			page.locator('script[src*="static.axept.io/sdk.js"]'),
		).toHaveCount(0);
		const hasSettings = await page.evaluate(() => {
			return Boolean(
				(window as unknown as { axeptioSettings?: unknown }).axeptioSettings,
			);
		});
		expect(hasSettings).toBeFalsy();
	});
});
