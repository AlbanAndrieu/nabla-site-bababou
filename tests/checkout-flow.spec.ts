import { expect, test } from "@playwright/test";

test.describe("Checkout flow regression tests", () => {
	test("checkout page keeps form action and submit CTA", async ({ page }) => {
		const response = await page.goto("/checkout.html");
		expect(response?.status()).toBe(200);

		await expect(page).toHaveTitle(/Checkout/i);

		const form = page.locator('form[action="/api/create-checkout-session"][method="POST"]');
		await expect(form).toBeVisible();

		const submit = page.locator("#checkout-button");
		await expect(submit).toBeVisible();
		await expect(submit).toHaveAttribute("type", "submit");
		await expect(submit).toContainText(/Proceed to checkout/i);
	});

	test("cancel page offers deterministic recovery actions", async ({ page }) => {
		const response = await page.goto("/cancel.html");
		expect(response?.status()).toBe(200);

		await expect(page.locator("main")).toContainText(/Checkout canceled/i);
		await expect(page.locator('a[href="payment.html"]')).toBeVisible();
		await expect(page.locator('a[href="payment.html#pay-sepa"]')).toBeVisible();

		const stripeDirectLink = page.locator(
			'a[href="https://buy.stripe.com/9B65kF1Gd8hHcr2d69cV200"]',
		);
		await expect(stripeDirectLink).toBeVisible();
		await expect(stripeDirectLink).toHaveAttribute("rel", /noopener/);
	});

	test("success page keeps session reference hidden without session_id", async ({
		page,
	}) => {
		const response = await page.goto("/success.html");
		expect(response?.status()).toBe(200);

		const sessionRef = page.locator("#checkout-session-ref");
		await expect(sessionRef).toHaveAttribute("hidden", "");
		await expect(sessionRef).toHaveText("");
	});

	test("success page reveals session reference when session_id exists", async ({
		page,
	}) => {
		const response = await page.goto("/success.html?session_id=cs_test_abc123");
		expect(response?.status()).toBe(200);

		const sessionRef = page.locator("#checkout-session-ref");
		await expect(sessionRef).toBeVisible();
		await expect(sessionRef).toContainText("Checkout reference: cs_test_abc123");
		await expect(sessionRef).not.toHaveAttribute("hidden", "");
	});
});
