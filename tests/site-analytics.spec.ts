import { expect, type Page, test } from "@playwright/test";

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

async function injectAnalyticsScript(
	page: import("@playwright/test").Page,
	mode: string,
) {
	await page.evaluate((analyticsMode) => {
		const s = document.createElement("script");
		s.src = "/site-analytics.js";
		s.setAttribute("data-analytics-mode", analyticsMode);
		document.head.appendChild(s);
	}, mode);
}

async function gotoAnalyticsHost(page: Page) {
	for (const path of [
		"**/_vercel/insights/script.js",
		"**/_vercel/speed-insights/script.js",
	]) {
		await page.route(path, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/javascript",
				body: "",
			});
		});
	}

	await page.route("**/analytics-test-host.html", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "text/html",
			body: "<!doctype html><html><head></head><body></body></html>",
		});
	});

	await page.goto("/analytics-test-host.html?nablaEnableThirdParty=1");
}

test.describe("Site analytics loader regression tests", () => {

	test("should load default vercel analytics scripts and expose API", async ({
		page,
	}) => {
		await page.goto("/?nablaEnableThirdParty=1");

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
		// Home uses data-analytics-mode="home" and already injects GTM/gtag; use vercel-only page
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

		// init* can be a no-op if scripts are already loaded; idempotence means never duplicating.
		expect(after.gtm).toBe(Math.max(1, before.gtm));
		expect(after.gtag).toBe(Math.max(1, before.gtag));
	});

	test("should load Ahrefs script when key is provided", async ({ page }) => {
		await page.goto("/test.html?nablaEnableThirdParty=1");

		const ahrefs = page.locator(
			'script[src="https://analytics.ahrefs.com/analytics.js"][data-key]',
		);
		await expect(ahrefs).toHaveCount(1);
		await expect(ahrefs).toHaveAttribute("data-key", "tg3zLMS/bebJFl0LxctiCw");
	});

	test("should honor preset GTM and GA override IDs", async ({ page }) => {
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

	test("should load marketing integrations but skip Datadog in marketing mode", async ({
		page,
	}) => {
		await gotoAnalyticsHost(page);
		await injectAnalyticsScript(page, "marketing");

		await expect(
			page.locator('script[src*="googletagmanager.com/gtm.js?id="]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="googletagmanager.com/gtag/js?id="]'),
		).toHaveCount(1);
		await expect(
			page.locator('link[rel="preconnect"][href="https://dev.visualwebsiteoptimizer.com"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="-assets.i.posthog.com/static/array.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src="https://cdn.us.heap-api.com/config/724068705/heap_config.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator(
				'script[src="https://www.datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]',
			),
		).toHaveCount(0);
		await expect(
			page.locator('script[src*="/_vercel/insights/script.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="/_vercel/speed-insights/script.js"]'),
		).toHaveCount(1);
	});

	test("should not duplicate Vercel scripts when the loader is injected twice", async ({
		page,
	}) => {
		await gotoAnalyticsHost(page);
		await injectAnalyticsScript(page, "vercel");
		await injectAnalyticsScript(page, "vercel");

		await expect(
			page.locator('script[src="/_vercel/insights/script.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src="/_vercel/speed-insights/script.js"]'),
		).toHaveCount(1);
	});

	test("should load Datadog RUM in full mode", async ({ page }) => {
		await gotoAnalyticsHost(page);
		await injectAnalyticsScript(page, "full");

		await expect(
			page.locator(
				'script[src="https://www.datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]',
			),
		).toHaveCount(1);
	});

	test("should honor marketing mode ids and not load Datadog", async ({ page }) => {
		await gotoAnalyticsHost(page);
		await injectSiteAnalytics(page, {
			"data-analytics-mode": "marketing",
			"data-gtm-id": "GTM-MARKETING123",
			"data-ga-measurement-id": "G-MARKETING123",
		});

		await expect
			.poll(async () => {
				return page
					.locator('script[src*="googletagmanager.com/gtm.js?id=GTM-MARKETING123"]')
					.count();
			})
			.toBe(1);
		await expect
			.poll(async () => {
				return page
					.locator('script[src*="googletagmanager.com/gtag/js?id=G-MARKETING123"]')
					.count();
			})
			.toBe(1);
		await expect(
			page.locator('script[src*="datadoghq-browser-agent.com"]'),
		).toHaveCount(0);
	});

	test("should load full mode heavy vendors including Datadog", async ({
		page,
	}) => {
		await gotoAnalyticsHost(page);
		await injectSiteAnalytics(page, { "data-analytics-mode": "full" });

		await expect
			.poll(async () => {
				return page
					.locator('script[src*="datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]')
					.count();
			})
			.toBe(1);
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

	test("should load Mixpanel and Datadog in home mode", async ({ page }) => {
		await gotoAnalyticsHost(page);
		await injectSiteAnalytics(page, { "data-analytics-mode": "home" });

		await expect
			.poll(async () => {
				return page
					.locator('script[src*="cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"]')
					.count();
			})
			.toBe(1);
		await expect(
			page.locator('script[src*="datadoghq-browser-agent.com/eu1/v6/datadog-rum.js"]'),
		).toHaveCount(1);

		await expect
			.poll(async () => {
				return page.evaluate(
					() => typeof (window as any).mixpanel?.init,
				);
			})
			.toBe("function");
	});

});
