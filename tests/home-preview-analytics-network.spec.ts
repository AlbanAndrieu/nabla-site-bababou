import { expect, test } from "@playwright/test";

/**
 * Verify the actual browser request stream. The Node VM contracts exercise
 * analytics callbacks but cannot prove that a rendered review page is quiet.
 * No WAF bypass, external tracker or production mutation is needed locally.
 */
const previewPaths = [
  "/home-preview",
  "/en/home-preview",
  "/de/home-preview",
  "/no/home-preview",
] as const;

function isTrackingRequest(rawUrl: string): boolean {
  const url = new URL(rawUrl);
  const host = url.hostname.toLowerCase();
  if (
    url.pathname.startsWith("/_vercel/insights") ||
    url.pathname.startsWith("/_vercel/speed-insights")
  ) return true;

  return [
    "googletagmanager.com",
    "google-analytics.com",
    "analytics.ahrefs.com",
    "mxpnl.com",
    "mixpanel.com",
    "posthog.com",
    "visualwebsiteoptimizer.com",
    "heap-api.com",
    "datadoghq-browser-agent.com",
  ].some((domain) => host === domain || host.endsWith("." + domain));
}

test.describe("React homepage review — browser analytics privacy", () => {
  for (const path of previewPaths) {
    test(path + " sends no analytics requests, including with local test override", async ({ page }) => {
      const trackingRequests: string[] = [];
      page.on("request", (request) => {
        if (!isTrackingRequest(request.url())) return;
        // Keep privacy diagnostics free of query strings and payloads.
        const { hostname, pathname } = new URL(request.url());
        trackingRequests.push(hostname + pathname);
      });

      const response = await page.goto(path + "?nablaEnableThirdParty=1", {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), path).toBe(200);
      await expect(page.locator("main#main-content")).toBeVisible();
      // A missing loader would make a zero-network assertion meaningless.
      await expect(page.locator('script[src="/site-analytics.js"]')).toHaveCount(1);
      await page.waitForLoadState("networkidle");

      expect(trackingRequests, "Unexpected analytics on " + path).toEqual([]);
      expect(
        await page.evaluate(() =>
          typeof (window as Window & { NABLA_SITE_ANALYTICS?: unknown }).NABLA_SITE_ANALYTICS
        ),
      ).toBe("undefined");
    });
  }
});
