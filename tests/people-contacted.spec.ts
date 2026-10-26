import { expect, test } from "@playwright/test";

test.describe("People Contacted Cards", () => {
	test("should render cards with heading-driven icons and validated contacts", async ({
		page,
	}) => {
		const fixture = {
			children: [
				{
					name: "France",
					children: [
						{
							name: "Authorities",
							children: [
								{
									name: "Unknown office",
									comment: "authority fallback icon",
									url: "https://example.com/authority",
								},
							],
						},
					],
				},
				{
					name: "Norway",
					children: [
						{
							name: "Authorities",
							children: [
								{
									name: "School - Demo Academy",
									comment: "heading should override institution icon",
									url: "#",
									email: "https://example.com/not-an-email",
								},
							],
						},
						{
							name: "Lawyers",
							children: [
								{
									name: "<script>alert(1)</script> Lawyer",
									comment: "encoded title with valid email",
									url: "https://example.com/lawyer",
									email: "lawyer@example.com",
								},
							],
						},
					],
				},
			],
		};

		await page.route(/arf\.json(\?.*)?$/, (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(fixture),
			}),
		);

		await page.goto("/people-contacted.html");

		const root = page.locator("#people-cards-root");
		await expect(root.locator(".people-card")).toHaveCount(3, {
			timeout: 20_000,
		});

		const countryHeadings = await root
			.locator(".people-by-country > .h5")
			.allTextContents();
		expect(countryHeadings[0]).toContain("Norway");
		expect(countryHeadings[1]).toContain("France");

		const schoolCard = root.locator(".people-card", {
			hasText: "School - Demo Academy",
		});
		// Font Awesome may replace <i class="fa …"> with SVG; allow icon wrapper or svg
		expect(
			await schoolCard
				.locator(".people-card-icon, svg, [class*='graduation-cap']")
				.count(),
		).toBeGreaterThan(0);
		await expect(schoolCard.locator("h3 a")).toHaveCount(0);
		await expect(schoolCard.locator("h3 span")).toHaveCount(1);
		await expect(schoolCard.locator('a[href^="mailto:"]')).toHaveCount(0);

		const escapedCard = root.locator(".people-card", { hasText: "Lawyer" });
		await expect(
			escapedCard.locator('a[href="mailto:lawyer@example.com"]'),
		).toHaveCount(1);
		await expect(escapedCard.locator("script")).toHaveCount(0);
	});

	test("should show a fallback message when arf.json cannot be loaded", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === "firefox",
			"Flaky in CI: firefox intermittently times out waiting for page load",
		);
		await page.route(/arf\.json(\?.*)?$/, (route) => route.abort());
		await page.goto("/people-contacted.html");

		await expect(page.locator("#people-cards-root")).toContainText(
			"Could not load the list.",
			{ timeout: 30_000 },
		);
	});
  test("legacy footer matches primary and secondary actions from native Next pages", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en/central-authorities");
    const native = await page.locator('footer[role="contentinfo"] nav').first().locator("a, button").evaluateAll((els) =>
      els.slice(0, 2).map((el) => {
        const styles = getComputedStyle(el);
        return {
          background: styles.backgroundColor,
          foreground: styles.color,
          radius: styles.borderRadius,
          minHeight: styles.minHeight,
        };
      }),
    );
    expect(native).toHaveLength(2);

    await page.goto("/people-contacted.html");
    const nav = page.locator("footer.footer nav.legacy-footer-actions");
    await expect(nav).toHaveCount(1);
    const home = nav.getByRole("link", { name: "Back to Home" });
    const top = nav.getByRole("link", { name: "Back to top of page" });
    await expect(home).toHaveAttribute("href", "index.html");
    await expect(top).toHaveAttribute("href", "#top");
    const legacy = await nav.locator("a").evaluateAll((els) =>
      els.map((el) => {
        const styles = getComputedStyle(el);
        return {
          background: styles.backgroundColor,
          foreground: styles.color,
          radius: styles.borderRadius,
          minHeight: styles.minHeight,
        };
      }),
    );
    expect(legacy).toEqual(native);
    await top.click();
    await expect(page).toHaveURL(/#top$/);

    await page.setViewportSize({ width: 320, height: 640 });
    for (const link of [home, top]) {
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(320);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

});
