import { expect, test, type APIRequestContext } from "@playwright/test";

type StandardPageCase = {
	path: string;
	label: string;
};

type ChromeContractCase = {
	path: string;
	label: string;
	hasTranslate: boolean;
	hasAnalytics: boolean;
	requiredWidgetAttrs: string[];
	forbiddenWidgetAttrs: string[];
};

const STANDARD_PAGES: StandardPageCase[] = [
	{ path: "/", label: "homepage" },
	{ path: "/people-contacted.html", label: "people-contacted page" },
	{ path: "/policy/privacy_policy.html", label: "privacy policy page" },
	{ path: "/ca/index.html", label: "central authorities index page" },
];

const CHECKOUT_CHROME_CASES: ChromeContractCase[] = [
	{
		path: "/contact.html",
		label: "contact page",
		hasTranslate: true,
		hasAnalytics: true,
		requiredWidgetAttrs: ["data-axeptio", "data-print-pdf", "data-coffee-fab"],
		forbiddenWidgetAttrs: ["data-no-print-pdf", "data-no-coffee-fab", "data-minimal-chrome"],
	},
	{
		path: "/cancel.html",
		label: "cancel page",
		hasTranslate: true,
		hasAnalytics: true,
		requiredWidgetAttrs: ["data-no-print-pdf", "data-no-coffee-fab"],
		forbiddenWidgetAttrs: ["data-print-pdf", "data-coffee-fab", "data-minimal-chrome"],
	},
	{
		path: "/success.html",
		label: "success page",
		hasTranslate: true,
		hasAnalytics: true,
		requiredWidgetAttrs: ["data-no-print-pdf", "data-coffee-fab"],
		forbiddenWidgetAttrs: ["data-print-pdf", "data-no-coffee-fab", "data-minimal-chrome"],
	},
	{
		path: "/checkout.html",
		label: "checkout page",
		hasTranslate: false,
		hasAnalytics: false,
		requiredWidgetAttrs: ["data-no-print-pdf", "data-no-coffee-fab"],
		forbiddenWidgetAttrs: ["data-print-pdf", "data-coffee-fab", "data-minimal-chrome"],
	},
];

async function fetchHtml(path: string, request: APIRequestContext) {
	const response = await request.get(path);
	expect(response.ok()).toBeTruthy();
	return response.text();
}

test.describe("Page chrome structure regression coverage", () => {
	test("standard pages keep top anchor and full chrome script contracts", async ({
		request,
	}) => {
		for (const pageCase of STANDARD_PAGES) {
			const html = await fetchHtml(pageCase.path, request);

			await test.step(pageCase.label, async () => {
				expect(html).toContain('a name="top"');
				expect(html).toMatch(
					/<script[^>]+theme-toggle\.js[^>]*><\/script>/i,
				);
				expect(html).toMatch(
					/<script[^>]+site-google-translate\.js[^>]*defer[^>]*><\/script>/i,
				);
				expect(html).toMatch(
					/<script[^>]+site-analytics\.js[^>]*><\/script>/i,
				);
				expect(html).toMatch(
					/<script[^>]+site-widgets\.js[^>]*data-print-pdf[^>]*><\/script>/i,
				);
				expect(html).toMatch(
					/<script[^>]+site-widgets\.js[^>]*data-coffee-fab[^>]*><\/script>/i,
				);
				expect(html).not.toMatch(
					/<script[^>]+site-widgets\.js[^>]*data-minimal-chrome[^>]*><\/script>/i,
				);
			});
		}
	});

	test("404 stays in minimal chrome mode", async ({ request }) => {
		const html = await fetchHtml("/404.html", request);

		expect(html).not.toContain('a name="top"');
		expect(html).toMatch(
			/<script[^>]+site-widgets\.js[^>]*data-minimal-chrome[^>]*><\/script>/i,
		);
		expect(html).not.toMatch(
			/<script[^>]+site-widgets\.js[^>]*data-print-pdf[^>]*><\/script>/i,
		);
		expect(html).not.toMatch(
			/<script[^>]+site-widgets\.js[^>]*data-coffee-fab[^>]*><\/script>/i,
		);
		expect(html).not.toMatch(
			/<script[^>]+theme-toggle\.js[^>]*><\/script>/i,
		);
		expect(html).not.toMatch(
			/<script[^>]+site-google-translate\.js[^>]*><\/script>/i,
		);
		expect(html).not.toMatch(
			/<script[^>]+site-analytics\.js[^>]*><\/script>/i,
		);
	});

	test("checkout and contact pages keep explicit chrome contracts", async ({
		request,
	}) => {
		for (const pageCase of CHECKOUT_CHROME_CASES) {
			const html = await fetchHtml(pageCase.path, request);

			await test.step(pageCase.label, async () => {
				expect(html).toContain('a name="top"');
				expect(html).toMatch(
					/<script[^>]+theme-toggle\.js[^>]*><\/script>/i,
				);

				if (pageCase.hasTranslate) {
					expect(html).toMatch(
						/<script[^>]+site-google-translate\.js[^>]*defer[^>]*><\/script>/i,
					);
				} else {
					expect(html).not.toMatch(
						/<script[^>]+site-google-translate\.js[^>]*><\/script>/i,
					);
				}

				if (pageCase.hasAnalytics) {
					expect(html).toMatch(
						/<script[^>]+site-analytics\.js[^>]*><\/script>/i,
					);
				} else {
					expect(html).not.toMatch(
						/<script[^>]+site-analytics\.js[^>]*><\/script>/i,
					);
				}

				expect(html).toMatch(
					/<script[^>]+site-widgets\.js[^>]*><\/script>/i,
				);

				for (const requiredAttr of pageCase.requiredWidgetAttrs) {
					expect(html).toMatch(
						new RegExp(
							`<script[^>]+site-widgets\\.js[^>]*${requiredAttr}[^>]*><\\/script>`,
							"i",
						),
					);
				}

				for (const forbiddenAttr of pageCase.forbiddenWidgetAttrs) {
					expect(html).not.toMatch(
						new RegExp(
							`<script[^>]+site-widgets\\.js[^>]*${forbiddenAttr}[^>]*><\\/script>`,
							"i",
						),
					);
				}
			});
		}
	});
});
