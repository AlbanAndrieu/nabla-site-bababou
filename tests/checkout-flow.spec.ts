import { expect, test } from "@playwright/test";

test.describe("Checkout flow regression coverage", () => {
	test("success page hides checkout reference when session id is missing", async ({
		page,
	}) => {
		await page.goto("/success.html");

		const ref = page.locator("#checkout-session-ref");
		await expect(ref).toHaveCount(1);
		await expect(ref).toHaveAttribute("hidden", "");
		await expect(ref).toHaveText("");
	});

	test("success page renders session id as text without HTML interpretation", async ({
		page,
	}) => {
		const injectedSessionId = "<img src=x onerror=alert(1)>";
		await page.goto(`/success.html?session_id=${encodeURIComponent(injectedSessionId)}`);

		const ref = page.locator("#checkout-session-ref");
		await expect(ref).toHaveCount(1);
		await expect(ref).not.toHaveAttribute("hidden", "");
		await expect(ref).toHaveText(`Checkout reference: ${injectedSessionId}`);
		await expect(ref.locator("img")).toHaveCount(0);
	});

	test("cancel page preserves retry and fallback payment links", async ({ page }) => {
		await page.goto("/cancel.html");

		await expect(page).toHaveTitle(/Checkout canceled/i);
		await expect(page.locator('a.checkout-button[href="payment.html"]')).toHaveCount(1);
		await expect(page.locator('a[href="https://buy.stripe.com/9B65kF1Gd8hHcr2d69cV200"]')).toHaveCount(1);
		await expect(page.locator('a[href="payment.html#pay-sepa"]')).toHaveCount(1);
	});
});
