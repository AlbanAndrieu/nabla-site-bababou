import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Keep the historic HTML 404 unchanged; exercise the public routing boundary.
test("legacy missing HTML stays an accessible 404 on desktop and mobile", async ({
  page,
}, testInfo) => {
  const unwanted: string[] = [];
  page.on("request", (request) => {
    if (/fonts\.(?:googleapis|gstatic)\.com|\/assets\/fontawesome(?:-free-[^/]+\/js|\/css)\//.test(request.url())) unwanted.push(request.url());
  });
  const response = await page.goto(
    "/__missing-legacy-a11y-check-20261017__.html",
    { waitUntil: "domcontentloaded" },
  );
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("404");
  const home = page.getByRole("link", { name: /back to home/i });
  await expect(home.locator("svg.home-icon[aria-hidden=true]")).toHaveCount(1);
  await expect(page.locator("script[src$='site-widgets.js'][data-no-font-awesome]")).toHaveCount(1);
  await expect(home).toHaveAttribute("href", "/");

  // A programmatic .focus() is not proof that keyboard users can reach it.
  await page.keyboard.press("Tab");
  await expect(home).toBeFocused();
  const focusEvidence = await home.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      keyboardFocusVisible: element.matches(":focus-visible"),
      visibleFocusStyle:
        (Number.parseFloat(styles.outlineWidth) || 0) > 0 ||
        styles.boxShadow !== "none",
      fitsViewport:
        rect.width > 0 &&
        rect.left >= 0 &&
        rect.right <= window.innerWidth &&
        rect.top < window.innerHeight &&
        rect.bottom > 0,
    };
  });
  expect(unwanted, "404 must not request third-party fonts or Font Awesome").toEqual([]);
  expect(focusEvidence.keyboardFocusVisible).toBe(true);
  expect(focusEvidence.visibleFocusStyle).toBe(true);
  expect(
    focusEvidence.fitsViewport,
    `404 home link overflows ${testInfo.project.name}`,
  ).toBe(true);
});

test("protected Next 404 has measurable text contrast and honors reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/__missing-legacy-a11y-check-20261017__.html", {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(404);
  await expect(page.locator('html[data-nabla-app="next-global-not-found"]')).toHaveCount(1);

  const animations = await page.locator("h1").first().evaluate((element) => {
    return window.getComputedStyle(element).animationName;
  });
  expect(animations).toBe("none");

  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});
