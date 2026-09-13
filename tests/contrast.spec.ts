import { expect, test } from "@playwright/test";

type Rgb = [number, number, number];

function parseRgb(value: string): Rgb {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) {
    throw new Error(`Unsupported computed color: ${value}`);
  }
  return channels as Rgb;
}

function relativeLuminance([red, green, blue]: Rgb) {
  const linear = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(parseRgb(foreground));
  const backgroundLuminance = relativeLuminance(parseRgb(background));
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

async function foregroundBackgroundPair(
  locator: import("@playwright/test").Locator,
  backgroundLocator: import("@playwright/test").Locator,
) {
  return {
    foreground: await locator.evaluate(
      (element) => getComputedStyle(element).color,
    ),
    background: await backgroundLocator.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  };
}

test.describe("WCAG-aligned contrast regressions", () => {
  test("people-contacted keeps the hero card readable in light and dark themes", async ({
    page,
  }) => {
    await page.goto("/people-contacted.html");
    await expect(page.locator("#legacy-contrast-styles")).toHaveCount(1);

    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((selectedTheme) => {
        const themeToggle = (
          window as typeof window & {
            themeToggle?: { set(theme: string): void };
          }
        ).themeToggle;
        themeToggle?.set(selectedTheme);
      }, theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const card = page.locator(".people-hero .card");
      const heading = page.locator("#header");
      const mutedCopy = card.locator(".text-muted");

      const headingPair = await foregroundBackgroundPair(heading, card);
      const mutedPair = await foregroundBackgroundPair(mutedCopy, card);

      expect(
        contrastRatio(headingPair.foreground, headingPair.background),
        `${theme} hero heading contrast`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(mutedPair.foreground, mutedPair.background),
        `${theme} muted hero copy contrast`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("central-authorities legacy URL lands on a native readable surface", async ({
    page,
  }) => {
    await page.goto("/central-authorities.html");
    expect(new URL(page.url()).pathname).toBe("/en/central-authorities");
    await expect(page.locator('link[href*="bootstrap"]')).toHaveCount(0);

    const heading = page.getByRole("heading", {
      level: 1,
      name: "Reaching Central Authorities",
    });
    const body = page.locator("body");
    const pair = await foregroundBackgroundPair(heading, body);

    expect(
      contrastRatio(pair.foreground, pair.background),
      "native Central Authorities heading contrast",
    ).toBeGreaterThanOrEqual(4.5);
  });
});
