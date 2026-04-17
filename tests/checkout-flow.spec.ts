import { expect, test } from "@playwright/test";

test.describe("Checkout flow regression tests", () => {
	test("should expose a valid checkout form contract", async ({ page }) => {
		const response = await page.goto("/checkout.html");
		expect(response?.status()).toBe(200);

		const checkoutForm = page.locator(
			'form.checkout-form[action="/api/create-checkout-session"][method="POST"]',
		);
		await expect(checkoutForm).toHaveCount(1);

		const submitButton = page.locator("#checkout-button");
		await expect(submitButton).toBeVisible();
		await expect(submitButton).toHaveAttribute("type", "submit");
		await expect(submitButton).toContainText(/proceed to checkout/i);
	});

	test("should keep cancel page recovery links visible", async ({ page }) => {
		await page.goto("/cancel.html");

		await expect(page).toHaveTitle(/checkout canceled/i);
		await expect(
			page.locator('meta[name="robots"][content="noindex, nofollow"]'),
		).toHaveCount(1);
		await expect(
			page.locator('a.checkout-button[href="payment.html"]'),
		).toBeVisible();
		await expect(
			page.locator('a.checkout-button-secondary[href="/index.html"]'),
		).toBeVisible();
	});

	test("should keep checkout session reference hidden by default", async ({
		page,
	}) => {
		await page.goto("/success.html");

		const sessionRef = page.locator("#checkout-session-ref");
		await expect(sessionRef).toHaveAttribute("hidden", "");
		await expect(sessionRef).toBeHidden();
		await expect(sessionRef).toHaveText("");
	});

	test("should display checkout session reference when session_id exists", async ({
		page,
	}) => {
		await page.goto("/success.html?session_id=cs_test_123");

		const sessionRef = page.locator("#checkout-session-ref");
		await expect(sessionRef).not.toHaveAttribute("hidden", "");
		await expect(sessionRef).toBeVisible();
		await expect(sessionRef).toContainText("Checkout reference: cs_test_123");
	});

	test("should render session_id as text instead of executable markup", async ({
		page,
	}) => {
		await page.goto(
			"/success.html?session_id=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E",
		);

		const sessionRef = page.locator("#checkout-session-ref");
		await expect(sessionRef).toBeVisible();
		await expect(sessionRef).toContainText(
			"Checkout reference: <img src=x onerror=alert(1)>",
		);
		await expect(sessionRef.locator("img")).toHaveCount(0);
	});
});
