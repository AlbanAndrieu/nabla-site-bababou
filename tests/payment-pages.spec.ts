import { expect, test } from "@playwright/test";

const STRIPE_DIRECT_URL = "https://buy.stripe.com/9B65kF1Gd8hHcr2d69cV200";

test.describe("Payment result pages", () => {
  test("legacy success URL redirects to English Next route and safely renders the session id", async ({
    page,
  }) => {
    const sessionId = '<img src=x onerror="alert(1)">';
    await page.goto(`/success.html?session_id=${encodeURIComponent(sessionId)}`);

    await expect(page).toHaveURL(/\/en\/success\?session_id=/);
    const ref = page.locator("#checkout-session-ref");
    await expect(ref).toBeVisible();
    await expect(ref).toHaveText(`Checkout reference: ${sessionId}`);
    await expect(ref.locator("img")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("success route keeps the reference hidden when no session id is present", async ({
    page,
  }) => {
    await page.goto("/en/success");

    const ref = page.locator("#checkout-session-ref");
    await expect(ref).toHaveCount(1);
    await expect(ref).toHaveAttribute("hidden", "");
    await expect(ref).toHaveText("");
  });

  test("legacy cancel URL redirects and exposes only valid recovery actions", async ({
    page,
  }) => {
    await page.goto("/cancel.html");

    await expect(page).toHaveURL(/\/en\/cancel$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Checkout canceled",
    );
    const directStripeLink = page.locator(`a[href="${STRIPE_DIRECT_URL}"]`);
    await expect(directStripeLink).toBeVisible();
    await expect(directStripeLink).toHaveAttribute(
      "rel",
      /noopener noreferrer/,
    );
    await expect(page.locator('a[href*="payment.html"]')).toHaveCount(0);
    await expect(page.locator('a[href*="checkout.html"]')).toHaveCount(0);
  });

  test("French canonical result route is localized and non-indexable", async ({
    page,
  }) => {
    await page.goto("/success");

    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Merci pour votre paiement",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://bababou.com/success",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
});
