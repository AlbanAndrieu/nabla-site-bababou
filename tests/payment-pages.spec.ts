import { expect, test } from "@playwright/test";

test.describe("Payment pages regression coverage", () => {
	test("success page keeps reference hidden without session id", async ({ page }) => {
		await page.goto("/success.html");

		const ref = page.locator("#checkout-session-ref");
		await expect(ref).toHaveCount(1);
		const hasHiddenAttribute = await ref.evaluate((el) =>
			el.hasAttribute("hidden"),
		);
		expect(hasHiddenAttribute).toBeTruthy();
	});

	test("success page exposes session id as plain text only", async ({ page }) => {
		const sessionId = '<img src=x onerror="alert(1)">';
		await page.goto(
			`/success.html?session_id=${encodeURIComponent(sessionId)}`,
		);

		const ref = page.locator("#checkout-session-ref");
		await expect(ref).toContainText(`Checkout reference: ${sessionId}`);
		const hasHiddenAttribute = await ref.evaluate((el) =>
			el.hasAttribute("hidden"),
		);
		expect(hasHiddenAttribute).toBeFalsy();
		await expect(ref.locator("img")).toHaveCount(0);
	});

	test("cancel page keeps safe recovery payment links", async ({ page }) => {
		await page.goto("/cancel.html");

		const directStripeLink = page.locator(
			'a[href="https://buy.stripe.com/9B65kF1Gd8hHcr2d69cV200"]',
		);
		await expect(directStripeLink).toBeVisible();
		await expect(directStripeLink).toHaveAttribute(
			"rel",
			/noopener noreferrer/,
		);

		await expect(page.locator('a[href="payment.html#pay-sepa"]')).toBeVisible();
		await expect(page.locator('a[href="payment.html"]')).toBeVisible();
	});
});
