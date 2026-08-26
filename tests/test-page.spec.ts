import { expect, test } from "@playwright/test";

test.describe("Localized test page (/en/test)", () => {
  test("should render the migrated test surface and contact link", async ({ page }) => {
    await page.goto("/en/test");

    await expect(
      page.getByRole("heading", {
        name: "OSINT framework test surface",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "OSINT framework placeholder",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Visualization integration pending migration.", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Public contact surface",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Open the localized Bababou contact page",
        exact: true,
      }),
    ).toHaveAttribute("href", "/en/contact");
  });
});
