import { expect, test, type Page } from "@playwright/test";

async function injectSiteAnalytics(
	page: Page,
	attrs: Record<string, string> = {},
) {
	await page.evaluate((injectedAttrs) => {
		const script = document.createElement("script");
		script.src = "/site-analytics.js";
		script.setAttribute("data-test-injected", "true");
		Object.entries(injectedAttrs).forEach(([name, value]) => {
			script.setAttribute(name, value);
		});
		document.head.appendChild(script);
	}, attrs);
}

test.describe("Site analytics loader regression tests", () => {
	test("loads default vercel analytics and exposes public API", async ({
		page,
	}) => {
		await page.goto("/");

		await expect
			.poll(async () => {
				return page.evaluate(() => {
					return typeof (window as any).NABLA_SITE_ANALYTICS?.initGtm;
				});
			})
			.toBe("function");

		await expect(
			page.locator('script[src*="/_vercel/insights/script.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="/_vercel/speed-insights/script.js"]'),
		).toHaveCount(1);
	});

	test("keeps GTM and gtag init idempotent when called repeatedly", async ({
		page,
	}) => {
		await page.goto("/");

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

	test("loads Ahrefs script from data-ahrefs-key", async ({ page }) => {
		await page.goto("/test.html");

		const ahrefs = page.locator(
			'script[src="https://analytics.ahrefs.com/analytics.js"][data-key]',
		);
		await expect(ahrefs).toHaveCount(1);
		await expect(ahrefs).toHaveAttribute("data-key", "tg3zLMS/bebJFl0LxctiCw");
	});

	test("uses preset GTM and GA IDs when API is called without arguments", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			(window as any).NABLA_ANALYTICS_PRESET = {
				gtmContainerId: "GTM-OVERRIDE123",
				gaMeasurementId: "G-OVERRIDE123",
			};
		});

		await page.goto("/people-contacted.html");
		await page.evaluate(() => {
			const api = (window as any).NABLA_SITE_ANALYTICS;
			api.initGtm();
			api.initGtag();
		});

		await expect(
			page.locator(
				'script[src*="googletagmanager.com/gtm.js?id=GTM-OVERRIDE123"]',
			),
		).toHaveCount(1);
		await expect(
			page.locator(
				'script[src*="googletagmanager.com/gtag/js?id=G-OVERRIDE123"]',
			),
		).toHaveCount(1);
	});

	test("prefers explicit API IDs over preset IDs", async ({ page }) => {
		await page.addInitScript(() => {
			(window as any).NABLA_ANALYTICS_PRESET = {
				gtmContainerId: "GTM-PRESET123",
				gaMeasurementId: "G-PRESET123",
			};
		});

		await page.goto("/people-contacted.html");
		await page.evaluate(() => {
			const api = (window as any).NABLA_SITE_ANALYTICS;
			api.initGtm("GTM-EXPLICIT123");
			api.initGtag("G-EXPLICIT123");
		});

		await expect(
			page.locator(
				'script[src*="googletagmanager.com/gtm.js?id=GTM-EXPLICIT123"]',
			),
		).toHaveCount(1);
		await expect(
			page.locator(
				'script[src*="googletagmanager.com/gtag/js?id=G-EXPLICIT123"]',
			),
		).toHaveCount(1);
		await expect(
			page.locator(
				'script[src*="googletagmanager.com/gtm.js?id=GTM-PRESET123"]',
			),
		).toHaveCount(0);
		await expect(
			page.locator(
				'script[src*="googletagmanager.com/gtag/js?id=G-PRESET123"]',
			),
		).toHaveCount(0);
	});

	test("marketing mode loads marketing vendors but not Datadog", async ({
		page,
	}) => {
		await page.goto("/404.html");
		await injectSiteAnalytics(page, { "data-analytics-mode": "marketing" });

		await expect(
			page.locator('script[src*="googletagmanager.com/gtm.js?id="]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="googletagmanager.com/gtag/js?id="]'),
		).toHaveCount(1);
		await expect(
			page.locator(
				'link[rel="preconnect"][href="https://dev.visualwebsiteoptimizer.com"]',
			),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="-assets.i.posthog.com/static/array.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src="https://cdn.us.heap-api.com/config/724068705/heap_config.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="datadoghq-browser-agent.com"]'),
		).toHaveCount(0);
		await expect(
			page.locator('script[src*="/_vercel/insights/script.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="/_vercel/speed-insights/script.js"]'),
		).toHaveCount(1);
	});

	test("full mode loads Datadog and heavy vendor scripts", async ({ page }) => {
		await page.goto("/404.html");
		await injectSiteAnalytics(page, { "data-analytics-mode": "full" });

		await expect(
			page.locator(
				'script[src*="datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]',
			),
		).toHaveCount(1);
		await expect(
			page.locator(
				'link[rel="preconnect"][href="https://dev.visualwebsiteoptimizer.com"]',
			),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="posthog.com/static/array.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="cdn.us.heap-api.com/config/724068705/heap_config.js"]'),
		).toHaveCount(1);
	});

	test("home mode loads Mixpanel and Datadog", async ({ page }) => {
		await page.goto("/404.html");
		await injectSiteAnalytics(page, { "data-analytics-mode": "home" });

		await expect(
			page.locator('script[src*="cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]'),
		).toHaveCount(1);

		await expect
			.poll(async () => {
				return page.evaluate(() => typeof (window as any).mixpanel?.init);
			})
			.toBe("function");
	});
});
