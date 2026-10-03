import { expect, test } from "@playwright/test";

test.describe("Checkout success page regressions", () => {
  test("keeps checkout reference hidden when session_id is missing", async ({
    page,
  }) => {
    await page.goto("/success.html");

    const sessionRef = page.locator("#checkout-session-ref");
    await expect(sessionRef).toHaveAttribute("hidden", "");
    await expect(sessionRef).toBeHidden();
  });

  test("shows checkout reference when session_id is provided", async ({
    page,
  }) => {
    await page.goto("/success.html?session_id=cs_test_12345");

    const sessionRef = page.locator("#checkout-session-ref");
    await expect(sessionRef).toBeVisible();
    await expect(sessionRef).toHaveText("Checkout reference: cs_test_12345");
    await expect(sessionRef).not.toHaveAttribute("hidden", "");
  });

  test("renders session_id as text instead of HTML", async ({ page }) => {
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
