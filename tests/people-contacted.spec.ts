import { expect, test } from "@playwright/test";

const mockPeopleTree = {
	children: [
		{
			name: "France",
			type: "folder",
			children: [
				{
					name: "Authorities",
					type: "folder",
					children: [
						{
							name: "French Central Authority",
							type: "url",
							url: "https://example.org/french-central-authority",
							comment: "contacted",
						},
					],
				},
			],
		},
		{
			name: "Norway",
			type: "folder",
			children: [
				{
					name: "Authorities",
					type: "folder",
					children: [
						{
							name: "Norwegian King Harald V (Royal House)",
							type: "url",
							url: "https://example.org/royal-house",
							comment: "answered promptly",
						},
						{
							name: "Mannsforum",
							type: "url",
							url: "https://example.org/mannsforum",
							email: "https://example.org/not-an-email",
							comment: "association",
						},
						{
							name: "Lawyer Contact",
							type: "url",
							url: "https://example.org/lawyer-contact",
							email: "lawyer@example.org",
							comment: "legal support",
						},
						{
							name: '<img src=x onerror="window.__peopleCardsXss=1">',
							type: "url",
							url: "https://example.org/xss-attempt",
							comment: "<script>window.__peopleCardsXss=1</script>",
						},
					],
				},
			],
		},
	],
};

test.describe("People Contacted page", () => {
	test("renders grouped cards and validates card details", async ({ page }) => {
		await page.route("**/arf.json", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(mockPeopleTree),
			});
		});

		await page.goto("/people-contacted.html");

		const cardsRoot = page.locator("#people-cards-root");
		await expect(cardsRoot.locator(".people-card")).toHaveCount(4);

		const countryHeadings = page.locator(".people-by-country > h3");
		await expect(countryHeadings.first()).toContainText("Norway");
		await expect(countryHeadings.nth(1)).toContainText("France");

		const kingCard = cardsRoot
			.locator(".people-card")
			.filter({
				has: page.locator(
					'h3.card-title a:has-text("Norwegian King Harald V (Royal House)")',
				),
			})
			.first();
		await expect(kingCard.locator(".fa-crown")).toHaveCount(1);
		await expect(kingCard.locator('a[href="https://example.org/royal-house"]')).toHaveAttribute(
			"target",
			"_blank",
		);
		await expect(kingCard.locator('a[href="https://example.org/royal-house"]')).toHaveAttribute(
			"rel",
			/noopener/,
		);

		const mannsforumCard = cardsRoot
			.locator(".people-card")
			.filter({
				has: page.locator('h3.card-title a:has-text("Mannsforum")'),
			})
			.first();
		await expect(mannsforumCard.locator('a[href^="mailto:"]')).toHaveCount(0);

		const lawyerCard = cardsRoot
			.locator(".people-card")
			.filter({
				has: page.locator('h3.card-title a:has-text("Lawyer Contact")'),
			})
			.first();
		await expect(lawyerCard.locator('a[href="mailto:lawyer@example.org"]')).toHaveCount(1);

		await expect(page.locator("#people-cards-root script")).toHaveCount(0);
		const cardsHtml = await cardsRoot.innerHTML();
		expect(cardsHtml).toContain("&lt;img src=x onerror=");
		expect(cardsHtml).toContain("&lt;script&gt;");

		const xssFlag = await page.evaluate(() => (window as any).__peopleCardsXss ?? null);
		expect(xssFlag).toBeNull();
	});

	test("shows fallback message when arf.json cannot be loaded", async ({ page }) => {
		await page.route("**/arf.json", async (route) => {
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({ error: "failed" }),
			});
		});

		await page.goto("/people-contacted.html");

		await expect(page.locator("#people-cards-root")).toContainText(
			"Could not load the list.",
		);
	});
});
