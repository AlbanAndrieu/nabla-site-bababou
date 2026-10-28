import { expect, test } from "@playwright/test";

const locales = [
  { code: "fr", path: "/home-preview" },
  { code: "en", path: "/en/home-preview" },
  { code: "de", path: "/de/home-preview" },
  { code: "no", path: "/no/home-preview" },
] as const;

test("homepage review is available on all four locale paths", async ({ request }) => {
  for (const { path } of locales) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const headers = response.headers();
    expect(headers["x-robots-tag"] ?? "").toMatch(/\bnoindex\b/i);
    expect(headers["x-robots-tag"] ?? "").toMatch(/\bnofollow\b/i);
    expect(headers["x-robots-tag"] ?? "").toMatch(/\bnosnippet\b/i);
    expect(headers["cache-control"] ?? "").toMatch(/\bprivate\b/i);
    expect(headers["cache-control"] ?? "").toMatch(/\bno-store\b/i);
  }
});

test("sitemap does not publish any React review URLs", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).not.toMatch(/<loc>[^<]*\/(?:fr\/|en\/|de\/|no\/)?home-preview\/?<\/loc>/i);
});

test("explicit French /fr/home-preview redirects to the canonical /home-preview", async ({ request }) => {
  const response = await request.get("/fr/home-preview", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers().location, "https://www.bababou.com").pathname).toBe("/home-preview");
});

test.describe("public nonindexed homepage review", () => {

  for (const { code, path } of locales) {
    test(`${code}: accessible landmarks, links and non-indexable metadata`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.keyboard.press("Tab");
      await expect(page.locator('a.skip-to-main[href="#main-content"]')).toBeFocused();
      await expect(page.locator("html")).toHaveAttribute("lang", code);
      await expect(page.locator("main#main-content h1")).toHaveCount(1);
      await expect(page.locator('a.skip-to-main[href="#main-content"]')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://bababou.com/",
      );
      await expect(page.locator('main a[href="#preview-contact"]').first()).toBeVisible();
      await expect(page.locator('#preview-opening[lang="en"]')).toHaveCount(1);
      await expect(page.locator("#preview-opening-heading")).toContainText(
        "your Papa is looking for you",
      );
      await expect(page.locator("#preview-opening h3")).toHaveText("My Dear Daughter,");
      await expect(page.locator("#preview-opening p")).toHaveCount(2);
      await expect(page.locator('#preview-contact[lang="en"]')).toHaveCount(1);
      await expect(page.locator('#preview-contact-heading')).toHaveText("How to contact me");
      await expect(page.locator('#preview-contact a[href="mailto:aa@bababou.com"]')).toHaveText(
        "aa@bababou.com",
      );
      await expect(page.locator("#preview-contact")).toContainText(
        "I promise I will respond immediately.",
      );
      await expect(page.locator('#preview-letter[lang="en"]')).toHaveCount(1);
      await expect(page.locator('#preview-letter-heading')).toHaveText(
        "A Message from Your Papa:",
      );
      await expect(page.locator("#preview-letter blockquote p")).toHaveCount(3);
      await expect(page.locator("#preview-letter blockquote")).toContainText(
        "I will always be here for you.",
      );
      await expect(page.locator('#preview-found-website[lang="en"]')).toHaveCount(1);
      await expect(page.locator("#preview-found-website-heading")).toHaveText(
        "If you are Éléonore (Bababou) and you found this website:",
      );
      await expect(page.locator("#preview-found-website")).toContainText(
        "I am here waiting for you with open arms.",
      );
      await expect(page.locator("#preview-found-website")).toContainText(
        "He has been searching for you since 2015.",
      );
      // The preview shares the layout footer. Its legal links form a
      // separate named section, not a second document footer.
      await expect(page.locator("#preview-footer nav")).toHaveAttribute(
        "aria-label",
        "Legal and accessibility links",
      );
      await expect(page.locator("main footer")).toHaveCount(0);
      await expect(page.locator("#preview-about")).not.toContainText("INDEX for albandrieu.com");
      await expect(page.locator("#preview-about")).toContainText("Bababou — public messages and resources.");
      for (const href of [
        "/policy/service_terms",
        "/policy/privacy_policy",
        "/policy/impressum",
        "/policy/accessibility_statement",
        "/policy/cookie_policy",
      ]) {
        await expect(page.locator(`#preview-footer a[href="${href}"]`)).toHaveCount(1);
      }
      const firstPolicyLink = page.locator(
        '#preview-footer a[href="/policy/service_terms"]',
      );
      await firstPolicyLink.focus();
      await expect(firstPolicyLink).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        page.locator('#preview-footer a[href="/policy/privacy_policy"]'),
      ).toBeFocused();
      await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(1);
      for (const href of ["/", "/people-contacted.html", "/for-fathers.html", "/feed.xml", "/eleonore-feed.xml"]) {
        await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible();
      }
      const associationLinks = page.locator("#preview-associations li a");
      await expect(associationLinks).toHaveCount(3);
      for (const image of [
        "/assets/auction-law-svgrepo-com.svg",
        "/assets/sos-warning-svgrepo-com.svg",
        "/assets/japan-kanji-svgrepo-com.svg",
      ]) {
        await expect(page.locator(`#preview-associations img[src="${image}"]`)).toHaveCount(1);
      }
      const disclosure = page.locator("#preview-document-disclosure details");
      const summary = disclosure.locator("summary");
      await expect(disclosure).not.toHaveAttribute("open", "");
      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(disclosure).toHaveAttribute("open", "");
      for (const width of [320, 375, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        const hasOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        expect(hasOverflow, `${code} at ${width}px`).toBe(false);
      }
    });
  }
});

test("preview section links and ARIA references resolve in the rendered DOM", async ({ page }) => {
  await page.goto("/home-preview");
  const link = page.locator('main a[href="#preview-contact"]').first();
  await link.click();
  await expect(page).toHaveURL(/#preview-contact$/);
  await expect(page.locator("#preview-contact")).toBeVisible();

  const unresolved = await page.locator("main [aria-labelledby]").evaluateAll((elements) =>
    elements.flatMap((element) =>
      (element.getAttribute("aria-labelledby") ?? "")
        .split(/\s+/)
        .filter((id) => id && document.getElementById(id) === null),
    ),
  );
  expect(unresolved).toEqual([]);
});

test("association artwork has a local fallback when a bundled SVG fails", async ({ page }) => {
  await page.route("**/assets/auction-law-svgrepo-com.svg", (route) =>
    route.fulfill({ status: 404, contentType: "image/svg+xml", body: "" }),
  );
  await page.goto("/home-preview");
  const link = page.locator('#preview-associations a[href="http://paternet.fr/tag/combat-des-peres//"]');
  await expect(link).toContainText("Paternet");
  await expect(link.locator('[data-association-icon-fallback="paternet"]')).toBeVisible();
});

test("React preview theme and print controls work without legacy widget scripts", async ({ page }) => {

  await page.goto("/home-preview");
  const controls = page.getByRole("region", { name: "Contrôles de la page" });
  const themes = controls.getByRole("group", { name: "Thème d’affichage" });
  const dark = themes.getByRole("button", { name: "Sombre", exact: true });
  const auto = themes.getByRole("button", { name: "Auto (système)" });

  await dark.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('script[src="/site-widgets.js"]')).toHaveCount(0);
  await expect(page.locator('script[src="/theme-toggle.js"]')).toHaveCount(0);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themes.getByRole("button", { name: "Sombre", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await auto.click();
  await expect(auto).toHaveAttribute("aria-pressed", "true");

  await page.evaluate(() => {
    const state = window as Window & { __printCalls?: number };
    state.__printCalls = 0;
    window.print = () => {
      state.__printCalls = (state.__printCalls ?? 0) + 1;
    };
  });
  await controls.getByRole("button", { name: "Imprimer / Enregistrer en PDF" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { __printCalls?: number }).__printCalls))
    .toBe(1);
});

test("safe ten-card gallery and country timeline match the legacy structure", async ({ page }) => {
  await page.goto("/home-preview");
  const gallery = page.locator("#preview-story-gallery");
  await expect(gallery.getByRole("listitem")).toHaveCount(10);
  await expect(gallery).toContainText("Looking for Norwegian Translator");
  await expect(gallery).toContainText("Looking for German Translator");
  await expect(gallery.getByRole("img")).toHaveCount(0);
  await expect(gallery.locator("img")).toHaveCount(6);

  const timeline = page.locator("#preview-journey");
  await expect(timeline.locator("li")).toHaveCount(3);
  for (const country of ["France", "Norway", "Germany"]) {
    await expect(timeline).toContainText(country);
  }
  await expect(page.locator("#preview-important-information")).toBeVisible();
  await expect(page.locator("#preview-contact")).toBeVisible();

  const plainText = await page.locator("main").innerText();
  expect(plainText).not.toMatch(/14CV\d{5}|kept prisoner|escape justice/i);
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow, `gallery at width ${width}`).toBe(false);
  }
});


test("localized section navigation reaches the React landmarks", async ({ page }) => {
  for (const { path } of locales) {
    await page.goto(path);
    const nav = page.locator("main nav[data-home-section-nav]");
    await expect(nav).toHaveCount(1);
    const targets = [
      "preview-opening", "preview-journey", "preview-story-gallery",
      "preview-contact", "preview-document-disclosure",
    ];
    await expect(nav.locator("a")).toHaveCount(targets.length);
    for (const target of targets) {
      await expect(nav.locator('a[href="#' + target + '"]')).toHaveCount(1);
      await expect(page.locator("#" + target)).toHaveCount(1);
    }
    await nav.locator('a[href="#preview-story-gallery"]').click();
    await expect(page).toHaveURL(/#preview-story-gallery$/);
  }
});


test("homepage keyboard focus has a contrasting outline in light and dark modes", async ({ page }) => {
  await page.goto("/home-preview");
  const controls = page.getByRole("region", { name: "Contrôles de la page" });
  const navLink = page.locator("main nav[data-home-section-nav] a").first();

  for (const theme of ["Clair", "Sombre"] as const) {
    await controls.getByRole("button", { name: theme, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme === "Clair" ? "light" : "dark");
    await page.keyboard.press("Tab");
    for (const target of [
      navLink,
      controls.getByRole("button", { name: "Imprimer / Enregistrer en PDF" }),
    ]) {
      await target.focus();
      await expect(target).toBeFocused();

      const focus = await target.evaluate((element) => {
        const styles = getComputedStyle(element);
        const main = document.querySelector("main#main-content");
        if (!main) throw new Error("Preview main landmark missing");
        return {
          outline: styles.outlineColor,
          text: getComputedStyle(main).color,
          width: Number.parseFloat(styles.outlineWidth),
          visible: element.matches(":focus-visible"),
        };
      });
      expect(focus.visible).toBe(true);
      expect(focus.width).toBeGreaterThanOrEqual(3);
      expect(focus.outline).toBe(focus.text);
    }
  }
});

test("shared footer keeps one translated keyboard back-to-top action", async ({ page }) => {
  const labels = {
    fr: "Retour en haut de la page",
    en: "Back to top of page",
    de: "Zurück zum Seitenanfang",
    no: "Tilbake til toppen av siden",
  };
  for (const { code, path } of locales) {
    await page.goto(path);
    const control = page.locator('footer[role="contentinfo"] nav button[type="button"]');
    await expect(control).toHaveCount(1);
    await expect(control).toHaveAttribute("aria-label", labels[code]);
    await expect(page.locator('main a[href="#main-content"]')).toHaveCount(0);
    await control.focus();
    await expect(control).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#top$/);
  }
});

test("React gallery recovers from missing image without third-party fallback", async ({ page }) => {
  await page.route(/alone-1\.jpg/, (route) =>
    route.fulfill({ status: 404, contentType: "text/plain", body: "" }),
  );
  await page.goto("/home-preview");
  await expect(page.locator('#preview-story-gallery [data-gallery-media-fallback="error"]')).toBeVisible();
  await expect(page.locator("#preview-story-gallery li")).toHaveCount(10);
});
