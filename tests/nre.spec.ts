import { expect, test } from "@playwright/test";

const localeCases = [
  { path: "/nre", lang: "fr" },
  { path: "/en/nre", lang: "en" },
  { path: "/de/nre", lang: "de" },
  { path: "/no/nre", lang: "no" },
] as const;

const themeLabels = {
  "fr": {
    "theme": "Thème d’affichage",
    "light": "Clair",
    "dark": "Sombre",
    "auto": "Auto (système)",
    "print": "Imprimer / Enregistrer en PDF"
  },
  "en": {
    "theme": "Display theme",
    "light": "Light",
    "dark": "Dark",
    "auto": "Auto (system)",
    "print": "Print / Save as PDF"
  },
  "de": {
    "theme": "Darstellung",
    "light": "Hell",
    "dark": "Dunkel",
    "auto": "Automatisch (System)",
    "print": "Drucken / Als PDF speichern"
  },
  "no": {
    "theme": "Visningstema",
    "light": "Lyst",
    "dark": "Mørkt",
    "auto": "Automatisk (system)",
    "print": "Skriv ut / Lagre som PDF"
  }
} as const;

test.describe("Site-wide source-document requests", () => {
  test("keeps public PDF available and prepares a safe request reference", async ({ page }) => {
    await page.goto("/nre");
    const original = page.locator('section[aria-labelledby="reference-heading"] a[href$=".pdf"]');
    await expect(original).toHaveCount(1);
    const copy = page.locator('section[aria-labelledby="reference-heading"] a[href$=".pdf"] + a.document-access-request');
    await expect(copy).toHaveCount(1);
    await expect(copy).toContainText("Demander l’accès au document source");
    await expect(copy.locator(".document-source-lock-icon")).toHaveAttribute("aria-hidden", "true");
    await expect(copy).toHaveAttribute("href", /^\/evidence-access\?doc=SITE-DOC-[0-9a-f]{16}#request-documents$/);
    const originalHref = await original.getAttribute("href");
    expect(originalHref).toMatch(/\.pdf$/);
    await copy.click();
    await expect(page).toHaveURL(/\/evidence-access\?doc=SITE-DOC-[0-9a-f]{16}#request-documents$/);
    await expect(page.getByTestId("site-document-reference")).toContainText(/SITE-DOC-[0-9a-f]{16}/);
    await expect(page.locator('a[href*="openrag"], a[href*="r2.cloudflarestorage.com"]')).toHaveCount(0);
  });

  test("legacy archives retain their public links and offer source-document access", async ({ page }) => {
    await page.goto("/abduction-norway.html");
    await expect.poll(() => page.locator("a.document-access-request").count()).toBeGreaterThan(0);
    const link = page.locator("a.document-access-request").first();
    await expect(link).toHaveAttribute("href", /\/evidence-access\?doc=SITE-DOC-[0-9a-f]{16}#request-documents$/);
  });
  test("public CA HTML needs no approval, while its PDF source is requestable", async ({ page }) => {
    await page.goto("/en/central-authorities-documents");
    const published = page.locator('a[data-document-entry][href$="demande-explications-autorites-competentes-fr.html"]');
    await expect(published).toHaveCount(1);
    await expect(published).not.toContainText("| Bababou");
    await expect(published.locator("xpath=following-sibling::a[contains(@class, 'document-access-request')]")).toHaveCount(0);

    await page.goto("/ca/demande-explications-autorites-competentes-fr.html");
    const pdf = page.locator('a[href*="Gmail%20-%20Demande"][href$=".pdf"]');
    await expect(pdf).toHaveCount(1);
    const request = page.locator('a[href*="Gmail%20-%20Demande"][href$=".pdf"] + a.document-access-request');
    await expect(request).toHaveCount(1);
    await expect(request).toContainText("Demander l’accès au document source");
    await expect(request.locator(".document-source-lock-icon")).toHaveCount(1);
    await expect(request).toHaveAttribute("href", /^\/evidence-access\?doc=SITE-DOC-[0-9a-f]{16}#request-documents$/);
  });
});

test.describe("NRE React migration", () => {
  for (const localeCase of localeCases) {
    test(`renders native ${localeCase.lang} content`, async ({ page }) => {
      await page.goto(localeCase.path);

      await expect(page.locator("html")).toHaveAttribute("lang", localeCase.lang);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main table")).toBeVisible();
      await expect(page.locator("#route-header-locale")).toHaveValue(
        localeCase.lang,
      );
      await expect(page.locator('link[href*="bootstrap"]')).toHaveCount(0);
      await expect(page.locator('script[src*="bootstrap"]')).toHaveCount(0);
    });
  }

  test("redirects retained French and English legacy NRE URLs", async ({ page }) => {
    await page.goto("/nre-fr.html");
    expect(new URL(page.url()).pathname).toBe("/nre");

    await page.goto("/nre-en.html");
    expect(new URL(page.url()).pathname).toBe("/en/nre");
  });
  test("theme selector remains at upper-right without covering NRE locale navigation", async ({ page }) => {
    for (const path of ["/en/nre", "/home-preview"]) {
      const labels = path === "/home-preview" ? themeLabels.fr : themeLabels.en;
      for (const width of [320, 375, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        const theme = page.getByRole("group", { name: labels.theme });
        const locale = page.locator("#route-header-locale");
        await expect(theme).toBeVisible();
        await expect(locale).toBeVisible();
        const positions = await page.evaluate(() => {
          const group = document.querySelector('[role="group"][aria-label]');
          const switcher = document.getElementById("route-header-locale");
          if (!group || !switcher) throw new Error("Theme or locale control missing");
          const themeRect = group.getBoundingClientRect();
          const localeRect = switcher.getBoundingClientRect();
          return {
            cssPosition: getComputedStyle(group).position,
            top: themeRect.top,
            right: window.innerWidth - themeRect.right,
            left: themeRect.left,
            overlapsLocale: !(themeRect.right <= localeRect.left ||
              themeRect.left >= localeRect.right ||
              themeRect.bottom <= localeRect.top ||
              themeRect.top >= localeRect.bottom),
          };
        });
        expect(positions.cssPosition).toBe("fixed");
        expect(positions.top).toBeGreaterThanOrEqual(0);
        expect(positions.top).toBeLessThan(50);
        expect(positions.right).toBeGreaterThanOrEqual(0);
        expect(positions.right).toBeLessThan(50);
        expect(positions.left).toBeGreaterThanOrEqual(0);
        expect(positions.overlapsLocale).toBe(false);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expect(theme).toBeInViewport();
        const dark = theme.getByRole("button", { name: labels.dark, exact: true });
        await dark.click();
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await expect(dark).toHaveAttribute("aria-pressed", "true");
      }
    }
  });

  test("rounded theme segments visually match the historic homepage", async ({ page }) => {
    for (const { path, lang } of localeCases) {
      const labels = themeLabels[lang];
      for (const width of [320, 375, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        const theme = page.getByRole("group", { name: labels.theme });
        const light = theme.getByRole("button", { name: labels.light, exact: true });
        const dark = theme.getByRole("button", { name: labels.dark, exact: true });
        const automatic = theme.getByRole("button", { name: labels.auto, exact: true });

        const trackGeometry = await theme.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          radius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
        }));
        // Root font size and browser zoom change rem->px conversion.
        expect(trackGeometry.radius).toBeGreaterThanOrEqual(trackGeometry.height / 2);
        for (const [button, label] of [[light, labels.light], [dark, labels.dark], [automatic, labels.auto]] as const) {
          await expect(button).toHaveAttribute("title", label);
          const geometry = await button.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
              borderRadius: getComputedStyle(element).borderTopLeftRadius,
            };
          });
          expect(geometry.width).toBeGreaterThanOrEqual(40);
          expect(geometry.height).toBeGreaterThanOrEqual(40);
          if (width <= 375) {
            expect(Math.abs(geometry.width - geometry.height)).toBeLessThanOrEqual(1);
            expect(geometry.borderRadius).toBe("50%");
          } else {
            expect(Number.parseFloat(geometry.borderRadius)).toBeGreaterThanOrEqual(40);
          }
        }

        await light.click();
        await expect(light).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
        await dark.click();
        await expect(dark).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await automatic.click();
        await expect(automatic).toHaveAttribute("aria-pressed", "true");
      }
    }
  });

  test("theme selection remains accessible when localStorage is unavailable", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      const storageUnavailable = () => {
        throw new DOMException("Storage unavailable", "SecurityError");
      };
      Object.defineProperty(Storage.prototype, "getItem", {
        configurable: true,
        value: storageUnavailable,
      });
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value: storageUnavailable,
      });
    });

    await page.goto("/en/nre");
    const group = page.getByRole("group", { name: "Display theme" });
    const light = group.getByRole("button", { name: "Light", exact: true });
    const dark = group.getByRole("button", { name: "Dark", exact: true });
    const auto = group.getByRole("button", { name: "Auto (system)", exact: true });

    await expect(auto).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await light.click();
    await expect(light).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await dark.click();
    await expect(dark).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await auto.click();
    await expect(auto).toHaveAttribute("aria-pressed", "true");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("theme labels stay accessible and controls printable on localized NRE routes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    for (const { path, lang } of localeCases) {
      const labels = themeLabels[lang];
      await page.goto(path);
      const group = page.getByRole("group", { name: labels.theme });
      for (const label of [labels.light, labels.dark, labels.auto]) {
        await expect(group.getByRole("button", { name: label, exact: true })).toBeVisible();
      }
      await expect(group).toHaveCSS("position", "fixed");
    }
  });


  test("public evidence register contains only four declared steps, no private document access", async ({ page }) => {
    for (const { path } of localeCases) {
      await page.goto(path);
      const register=page.getByTestId("nre-evidence-register");
      await expect(register.locator(":scope > li")).toHaveCount(4);
      for (const jurisdiction of ["FR","NO","DE","MULTI"]) {
        await expect(register.locator(`li[data-country="${jurisdiction}"]`)).toHaveCount(1);
      }
      const section=page.locator("#nre-register");
      await expect(section.getByRole("link")).toHaveCount(6);
      const href=await section.locator('a[href$="/contact#contact-details"]').getAttribute("href");
      expect(href?.endsWith("/contact#contact-details")).toBe(true);
      await expect(section).not.toContainText(/OPENRAG_API_KEY|originalObjectKey|privatePath/);
      await expect(section.locator('a[href*="openrag"], a[href$=".pdf"], a[href*="r2.cloudflarestorage.com"]')).toHaveCount(0);
      await expect(section.locator('a[href*="/evidence-access#NRE-CLAIM-"]')).toHaveCount(4);
      await expect(section).toContainText("2017");
    }
  });

  test("public evidence access page is localized, indexed and never discloses private links", async ({ page }) => {
    for (const { path, lang } of localeCases) {
      const accessPath = path.replace(/\/nre$/, "/evidence-access");
      await page.goto(accessPath);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("main#main-content h1")).toBeVisible();
      await expect(page.getByTestId("nre-access-catalog").locator(":scope > li")).toHaveCount(4);
      await expect(page.locator("#NRE-CLAIM-FR-001")).toBeVisible();
      await expect(page.locator("main")).not.toContainText(/OPENRAG_API_KEY|originalObjectKey|privatePath/);
      await expect(page.locator('a[href*="r2.cloudflarestorage.com"], a[href*="openrag"], a[href$=".pdf"]')).toHaveCount(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /evidence-access$/);
    }
  });

  test("the long-running effort to maintain contact is clearly presented in all languages", async ({ page }) => {
    for (const { path } of localeCases) {
      await page.goto(path);
      const advocacy=page.locator('section[aria-labelledby="nre-advocacy-heading"]');
      await expect(advocacy.getByRole("heading",{level:2})).toBeVisible();
      await expect(advocacy.locator('ol > li')).toHaveCount(3);
      await expect(advocacy).toContainText("2017");
      await expect(advocacy.locator('a[href="https://www.echr.coe.int/fr/european-convention-on-human-rights"]')).toBeVisible();
      await expect(advocacy.locator('a[href="#reference-heading"]')).toBeVisible();
      await expect(advocacy.locator('a[href="#timeline-heading"]')).toBeVisible();
      const testimony=page.locator('section[aria-labelledby="nre-note-heading"] details');
      await expect(testimony.locator("summary")).toBeVisible();
      await expect(testimony).not.toHaveAttribute("open","");
      await testimony.locator("summary").click();
      await expect(testimony).toHaveAttribute("open","");
    }
  });

  test("all languages expose completed weekends, status evidence and year filter", async ({ page }) => {
    for (const locale of localeCases) {
      await page.goto(locale.path);
      const rows=page.locator("main table tbody tr");
      await expect.poll(()=>rows.count()).toBeGreaterThanOrEqual(116);
      await expect(page.locator("main table tbody tr[data-review='true']").first()).toBeVisible();
      const select=page.locator("main select").filter({has:page.locator("option[value='all']")});
      await expect(select).toHaveValue("all");
      await select.selectOption("2026");
      await expect(page.locator('section[aria-labelledby="timeline-heading"] article')).toHaveCount(1);
      await expect(page.locator('section[aria-labelledby="timeline-heading"] article details')).toHaveAttribute("open", "");
      await expect.poll(()=>rows.count()).toBeGreaterThanOrEqual(10);
      await expect.poll(()=>rows.count()).toBeLessThanOrEqual(12);
      await select.selectOption("all");
      await expect.poll(() => page.locator('section[aria-labelledby="timeline-heading"] article').count()).toBeGreaterThanOrEqual(9);
      await expect.poll(()=>rows.count()).toBeGreaterThanOrEqual(116);
      // The actual class is CSS-module hashed; select semantic nested details.
      const yearDetails=page.locator("main article details").last();
      await expect(yearDetails.locator("summary")).toBeVisible();
      await yearDetails.locator("summary").click();
      await expect(yearDetails).toHaveAttribute("open","");
    }
  });

  test("four languages display verifiable dashboard and readable year cards", async ({ page }) => {
    for (const {path} of localeCases) {
      await page.goto(path);
      const main=page.locator("main#main-content");
      await expect(main).not.toContainText(/61\s*(?:days|jours|Tage|dagene)/i);
      await expect(main.locator('nav a[href="#timeline-heading"]')).toBeVisible();
      const panel=main.locator('section[aria-labelledby="nre-hours-heading"]');
      await expect(main.locator('header[aria-labelledby="nre-heading"] p')).toHaveCount(0);
      await expect(main.locator('section[aria-labelledby="nre-stats-heading"]')).not.toContainText("Dates à vérifier / avant décision");
      await expect(panel).toContainText(/1[\s.,\u202f]036\s*h/);
      await expect(panel).not.toContainText("Temps civil depuis un repère approximatif");
      const methodology=panel.locator("details");
      await expect(methodology.locator("summary")).toBeVisible();
      await methodology.locator("summary").click();
      await expect(methodology).toHaveAttribute("open","");
      const currentYear=main.locator("article details[open]");
      await expect(currentYear.first().locator("ol li").first()).toBeVisible();
      await expect(main.locator("article details ol li").first()).toContainText(/\d/);
      const overview=main.getByTestId("nre-year-overview").first();
      await expect(overview.locator("[data-month-status]")).toHaveCount(12);
      const firstStrip=main.getByTestId("nre-month-calendar").first();
      await expect(firstStrip).toBeVisible();
      await expect(firstStrip.locator('[data-weekend="true"]')).toHaveCount(2);
      const cells=firstStrip.locator('[data-calendar-day="true"]');
      await expect.poll(()=>cells.count()).toBeGreaterThanOrEqual(28);
      await expect.poll(()=>cells.count()).toBeLessThanOrEqual(42);
    }
  });

  test("complete month calendars remain readable on narrow screens", async ({ page }) => {
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("/nre");
      const strip=page.getByTestId("nre-month-calendar").first();
      await expect(strip).toBeVisible();
      await expect(strip.locator('[data-weekend="true"]')).toHaveCount(2);
      const bounds=await strip.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    }
  });

  test("reported hours are calculated without an editable input", async ({ page }) => {
    await page.goto("/en/nre");
    const panel=page.locator('section[aria-labelledby="nre-hours-heading"]');
    await expect(panel.getByRole("spinbutton")).toHaveCount(0);
    await expect(panel).toContainText(/1[\s.,\u202f]036\s*h/);
    await expect(panel).toContainText("France");
    await expect(panel).toContainText("Norway");
    await expect(panel).toContainText(/3\s*h/);
    await expect(panel).not.toContainText("1,010 h");
    const reference=page.locator('section[aria-labelledby="reference-heading"]');
    await expect(reference).toContainText("France, Norway and Germany");
  });
  test("filtering the month view by status links to exact calendar rows", async ({ page }) => {
    await page.goto("/en/nre");
    const year=page.getByRole("combobox",{name:"Filter by year"});
    const status=page.getByRole("combobox",{name:"Weekend status"});
    await year.selectOption("2022");
    await status.selectOption("exception");
    const results=page.locator('main output[aria-live="polite"]');
    await expect(results).toHaveText("Dates shown: 3");
    const overview=page.getByTestId("nre-year-overview");
    await expect(overview).toHaveCount(1);
    await expect(overview.locator("[data-month-status]")).toHaveCount(12);
    await expect(overview.locator('[data-month-status="exception"]')).toHaveCount(3);
    const reset=page.getByRole("button",{name:"Clear filters"});
    await expect(reset).toBeVisible();
    const months=page.getByTestId("nre-month-calendar");
    await expect(months).toHaveCount(3);
    await expect(page.locator("main table tbody tr")).toHaveCount(3);
    await expect(months.first().locator('[data-weekend="true"]')).toHaveCount(2);
    await page.locator('section[aria-labelledby="timeline-heading"] a[href="#nre-2022-01"]').click();
    await expect(page).toHaveURL(/#nre-2022-01$/);
    await expect(page.locator("tr#nre-2022-01")).toBeVisible();

    await status.selectOption("review");
    await expect(results).toHaveText("Dates shown: 0");
    await expect(months).toHaveCount(0);
    await expect(page.locator('section[aria-labelledby="timeline-heading"]')).toContainText("No weekend matches");
    await status.selectOption("all-statuses");
    await expect(months).toHaveCount(12);
    await reset.click();
    await expect(year).toHaveValue("all");
    await expect(status).toHaveValue("all-statuses");
    await expect(reset).toHaveCount(0);
    await expect.poll(() => months.count()).toBeGreaterThanOrEqual(116);
  });

});

test.describe("Document requests and public evidence overview", () => {
  for (const locale of ["fr", "en", "de", "no"] as const) {
    test(`shows only public registry counts in ${locale}`, async ({ page }) => {
      const prefix = locale === "fr" ? "" : `/${locale}`;
      await page.goto(`${prefix}/evidence-access`);
      const section = page.getByTestId("evidence-public-overview");
      await expect(section).toBeVisible();
      await expect(section.locator("li")).toHaveCount(4);
      await expect(section.locator("li").nth(0)).toContainText("4");
      await expect(section.locator("li").nth(1)).toContainText("4");
      await expect(section.locator("li").nth(2)).toContainText("0");
      await expect(section.locator("li").nth(3)).toContainText("1");
      await expect(section.locator('a[href="#request-documents"]')).toHaveCount(1);
      await expect(page.locator('a[href*="openrag"], a[href*="r2.cloudflarestorage.com"]')).toHaveCount(0);
    });
  }
});
