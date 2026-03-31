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

	test("should honor marketing mode ids and not load Datadog", async ({
		page,
	}) => {
		await page.goto("/404.html");
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
		await page.goto("/404.html");
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
		await page.goto("/404.html");
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
