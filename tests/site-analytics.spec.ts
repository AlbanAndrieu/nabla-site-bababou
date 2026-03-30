import { expect, test, type Page } from "@playwright/test";

test.describe("Site analytics loader regression tests", () => {
	async function injectAnalyticsScript(
		page: Page,
		attributes: Record<string, string> = {},
	) {
		await page.goto("/404.html");
		await page.evaluate((attrs) => {
			return new Promise<void>((resolve, reject) => {
				const script = document.createElement("script");
				script.src = "/site-analytics.js";
				for (const [name, value] of Object.entries(attrs)) {
					script.setAttribute(name, value);
				}
				script.onload = () => resolve();
				script.onerror = () => reject(new Error("Failed to load site-analytics.js"));
				document.head.appendChild(script);
			});
		}, attributes);
	}

	test("should load default vercel analytics scripts and expose API", async ({
		page,
	}) => {
		await page.goto("/people-contacted.html");

		await expect
			.poll(async () => {
				return page.evaluate(() => {
					return typeof (window as any).NABLA_SITE_ANALYTICS?.initGtm;
				});
			})
			.toBe("function");

		// Browsers may normalize script src to an absolute URL; match by path suffix
		await expect(
			page.locator('script[src*="/_vercel/insights/script.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="/_vercel/speed-insights/script.js"]'),
		).toHaveCount(1);
	});

	test("should keep GTM and gtag init idempotent", async ({ page }) => {
		await page.goto("/people-contacted.html");

		await expect
			.poll(async () => {
				return page.evaluate(() => {
					return typeof (window as any).NABLA_SITE_ANALYTICS?.initGtm;
				});
			})
			.toBe("function");

		const before = await page.evaluate(() => {
			return {
				gtm: document.querySelectorAll(
					'script[src*="googletagmanager.com/gtm.js?id="]',
				).length,
				gtag: document.querySelectorAll(
					'script[src*="googletagmanager.com/gtag/js?id="]',
				).length,
			};
		});

		await page.evaluate(() => {
			const api = (window as any).NABLA_SITE_ANALYTICS;
			api.initGtm("GTM-TEST123");
			api.initGtm("GTM-TEST123");
			api.initGtag("G-TEST123");
			api.initGtag("G-TEST123");
		});

		const after = await page.evaluate(() => {
			return {
				gtm: document.querySelectorAll(
					'script[src*="googletagmanager.com/gtm.js?id="]',
				).length,
				gtag: document.querySelectorAll(
					'script[src*="googletagmanager.com/gtag/js?id="]',
				).length,
			};
		});

		expect(after.gtm - before.gtm).toBe(1);
		expect(after.gtag - before.gtag).toBe(1);
	});

	test("should load Ahrefs script when key is provided", async ({ page }) => {
		await page.goto("/test.html");

		const ahrefs = page.locator(
			'script[src="https://analytics.ahrefs.com/analytics.js"][data-key]',
		);
		await expect(ahrefs).toHaveCount(1);
		await expect(ahrefs).toHaveAttribute("data-key", "tg3zLMS/bebJFl0LxctiCw");
	});

	test("should load Datadog in full mode", async ({ page }) => {
		await injectAnalyticsScript(page, { "data-analytics-mode": "full" });

		await expect(
			page.locator('script[src*="googletagmanager.com/gtm.js?id="]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="googletagmanager.com/gtag/js?id="]'),
		).toHaveCount(1);
		await expect(
			page.locator(
				'script[src*="datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]',
			),
		).toHaveCount(1);
	});

	test("should skip Datadog but load other heavy vendors in marketing mode", async ({
		page,
	}) => {
		await injectAnalyticsScript(page, { "data-analytics-mode": "marketing" });

		await expect(
			page.locator('script[src*="-assets.i.posthog.com/static/array.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="cdn.us.heap-api.com/config/724068705/heap_config.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator(
				'script[src*="datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]',
			),
		).toHaveCount(0);
	});

	test("should initialize Mixpanel in home mode", async ({ page }) => {
		await injectAnalyticsScript(page, { "data-analytics-mode": "home" });

		await expect(
			page.locator('script[src*="cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator(
				'script[src*="datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]',
			),
		).toHaveCount(1);
	});

	test("should resolve GTM and GA IDs from script attributes", async ({ page }) => {
		await injectAnalyticsScript(page, {
			"data-analytics-mode": "marketing",
			"data-gtm-id": "GTM-UNIT123",
			"data-ga-measurement-id": "G-UNIT123",
		});

		await expect(
			page.locator(
				'script[src*="googletagmanager.com/gtm.js?id=GTM-UNIT123"]',
			),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="googletagmanager.com/gtag/js?id=G-UNIT123"]'),
		).toHaveCount(1);
	});
});
