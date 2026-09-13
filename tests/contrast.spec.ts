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

function expectNormalTextContrast(
  pair: { foreground: string; background: string },
  label: string,
) {
  expect(
    contrastRatio(pair.foreground, pair.background),
    `${label} contrast`,
  ).toBeGreaterThanOrEqual(4.5);
}

test.describe("WCAG-aligned contrast regressions", () => {
  test("people-contacted keeps representative cards readable throughout theme changes", async ({
    page,
  }) => {
    await page.goto("/people-contacted.html");
    const compatibilityStyles = page.locator("#legacy-contrast-styles");
    await expect(compatibilityStyles).toHaveCount(1);
    await expect
      .poll(() =>
        compatibilityStyles.evaluate(
          (element) => Boolean((element as HTMLLinkElement).sheet),
        ),
      )
      .toBe(true);

    const assertRepresentativeContrast = async (label: string) => {
      const heroCard = page.locator(".people-hero .card");
      const heroHeading = page.locator("#header");
      const heroMutedCopy = heroCard.locator(".text-muted");
      const disclosureCard = page.locator(".card.border-warning");
      const disclosureCopy = disclosureCard.locator(".card-text");

      expectNormalTextContrast(
        await foregroundBackgroundPair(heroHeading, heroCard),
        `${label} hero heading`,
      );
      expectNormalTextContrast(
        await foregroundBackgroundPair(heroMutedCopy, heroCard),
        `${label} muted hero copy`,
      );
      expectNormalTextContrast(
        await foregroundBackgroundPair(disclosureCopy, disclosureCard),
        `${label} disclosure copy`,
      );
    };

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
      await assertRepresentativeContrast(theme);
    }

    await page.emulateMedia({ colorScheme: "dark" });
    await page.evaluate(() => {
      const themeToggle = (
        window as typeof window & {
          themeToggle?: { set(theme: string): void };
        }
      ).themeToggle;
      themeToggle?.set("auto");
    });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await assertRepresentativeContrast("auto/dark-system");
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

    expectNormalTextContrast(pair, "native Central Authorities heading");
  });
});
