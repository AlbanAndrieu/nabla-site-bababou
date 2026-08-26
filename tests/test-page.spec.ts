import { expect, test } from "@playwright/test";

test.describe("Localized test page (/en/test)", () => {
  test("should render main test sections and contact", async ({ page }) => {
    await page.goto("/en/test");

    // Target the section heading exactly; the page also has an OSINT-labelled h1.
    await expect(
      page.getByRole("heading", {
        name: "OSINT framework placeholder",
        exact: true,
      }),
    ).toBeVisible();

    // Check for Labyrinth logo (alt text)
    await expect(
      page.getByAltText(
        "Labyrinth illustration representing the difficult journey",
      ),
    ).toBeVisible();

    // Check for contact section
    await expect(
      page.getByRole("heading", { name: "Let's Work Together" }),
    ).toBeVisible();
    await expect(page.getByText("aa@bababou.com")).toBeVisible();
    await expect(page.getByText("Connect with me")).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Nabla Logo" }).first(),
    ).toBeVisible();
  });
});
