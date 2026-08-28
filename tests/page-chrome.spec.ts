import { type APIRequestContext, expect, test } from "@playwright/test";

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
	{ path: "/abduction-germany.html", label: "abduction germany page" },
	{ path: "/abduction-norway.html", label: "abduction norway page" },
	{
		path: "/ca/demande-explications-autorites-competentes-fr.html",
		label: "ca demande explications page",
	},
	{ path: "/people-contacted.html", label: "people-contacted page" },
	{ path: "/ca/index.html", label: "central authorities index page" },
	{
		path: "/central-authorities-failures.html",
		label: "central authorities failures page",
	},
	{ path: "/central-authorities.html", label: "central authorities page" },
	{ path: "/for-fathers.html", label: "for fathers page" },
	{ path: "/nre-en.html", label: "nre english page" },
	{ path: "/nre-fr.html", label: "nre french page" },
	{ path: "/policy/privacy_policy.html", label: "privacy policy page" },
	{
		path: "/policy/accessibility_statement.html",
		label: "accessibility statement page",
	},
	{ path: "/policy/cookie_policy.html", label: "cookie policy page" },
	{ path: "/policy/impressum.html", label: "impressum page" },
	{ path: "/policy/legal.html", label: "legal page" },
	{ path: "/policy/service_terms.html", label: "service terms page" },
	{ path: "/test.html", label: "test page" },
];

const MIGRATED_NEXT_PAGES: StandardPageCase[] = [
	{ path: "/contact.html", label: "contact page" },
	{ path: "/email.html", label: "email contact addresses page" },
	{ path: "/link.html", label: "links page" },
];

const CHECKOUT_CHROME_CASES: ChromeContractCase[] = [
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
				expect(html).toMatch(/<script[^>]+theme-toggle\.js[^>]*><\/script>/i);
				expect(html).toMatch(
					/<script[^>]+site-google-translate\.js[^>]*defer[^>]*><\/script>/i,
				);
				expect(html).toMatch(/<script[^>]+site-analytics\.js[^>]*><\/script>/i);
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

	test("migrated pages use native Next chrome instead of legacy static chrome", async ({
		request,
	}) => {
		for (const pageCase of MIGRATED_NEXT_PAGES) {
			const html = await fetchHtml(pageCase.path, request);

			await test.step(pageCase.label, async () => {
				expect(html).toContain('data-nabla-app="next-intl"');
				expect(html).toContain('class="route-header');
				expect(html).toContain('class="footer text-center"');
				expect(html).not.toContain('a name="top"');
				expect(html).not.toMatch(
					/<script[^>]+theme-toggle\.js[^>]*><\/script>/i,
				);
				expect(html).not.toMatch(
					/<script[^>]+site-google-translate\.js[^>]*><\/script>/i,
				);
			});
		}
	});

	test("404 stays in minimal chrome mode", async ({ request }) => {
		const response = await request.get("/404.html");
		expect(response.status()).toBe(404);
		const html = await response.text();

		expect(html).toMatch(/404|not found/i);
		expect(html).not.toContain('a name="top"');
		expect(html).not.toMatch(/<script[^>]+theme-toggle\.js[^>]*><\/script>/i);
		expect(html).not.toMatch(
			/<script[^>]+site-google-translate\.js[^>]*><\/script>/i,
		);
		expect(html).not.toMatch(
			/<script[^>]+site-widgets\.js[^>]*data-print-pdf[^>]*><\/script>/i,
		);
		expect(html).not.toMatch(
			/<script[^>]+site-widgets\.js[^>]*data-coffee-fab[^>]*><\/script>/i,
		);
	});

	test("checkout pages keep explicit legacy chrome contracts", async ({ request }) => {
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
