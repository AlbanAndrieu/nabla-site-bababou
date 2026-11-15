import { expect, test } from "@playwright/test";

const routes = ["/home-preview", "/en/nre", "/de/people-contacted", "/no/for-fathers", "/contact", "/en/ca/demande-explications-autorites-competentes-fr"] as const;

test("native React pages load no historical global CSS bundles", async ({ page }) => {
  const legacyRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/(?:wireframe|landing-sections|style|theme|print|site-content-page|page-layouts)\.css(?:\?|$)/.test(request.url())) legacyRequests.push(request.url());
  });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('html[data-nabla-app="next-intl"]')).toHaveCount(1);
    for (const name of ["wireframe.css", "landing-sections.css", "style.css", "theme.css", "print.css", "site-content-page.css", "page-layouts.css"]) {
      await expect(page.locator('link[rel="stylesheet"][href*="' + name + '"]')).toHaveCount(0);
    }
    const heading = page.locator("main#main-content h1");
    await expect(heading).toBeVisible();
    const result = await heading.evaluate((node) => {
      const css = getComputedStyle(node);
      return { size: parseFloat(css.fontSize), weight: parseInt(css.fontWeight, 10) };
    });
    expect(result.size, route).toBeGreaterThan(20);
    expect(result.weight, route).toBeGreaterThanOrEqual(600);
    if (route === "/contact") {
      await expect(page.locator('main a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator('main a[href^="https://calendly.com/"]')).toBeVisible();
    }
  }
  expect(legacyRequests).toEqual([]);
});

test("historic HTML archive keeps its own stylesheet for rollback", async ({ request }) => {
  const response = await request.get("/index.html");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('href="wireframe.css"');
});


test("native colors remain legible in explicit light and dark modes", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("site-theme-preference", "light");
  });
  await page.goto("/en/nre");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const light = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(light).toBe("rgb(255, 255, 255)");

  await page.evaluate(() => localStorage.setItem("site-theme-preference", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const dark = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dark).toBe("rgb(26, 26, 26)");
});


test("printing keeps article content and hides only Next chrome", async ({ page }) => {
  const response = await page.goto("/en/nre");
  expect(response?.status()).toBe(200);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("main#main-content h1")).toBeVisible();
  await expect(page.locator("body > header")).toBeHidden();
  await expect(page.locator("body > footer")).toBeHidden();
  const paper = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(paper).toBe("rgb(255, 255, 255)");
  const article = await page.locator("main#main-content").evaluate((el) => {
    const css = getComputedStyle(el);
    return {display: css.display, overflow: css.overflow};
  });
  expect(article.display).not.toBe("none");
  expect(article.overflow).toBe("visible");
});

test("PDF button retains an accessible, styled native fallback", async ({ page }) => {
  await page.goto("/email");
  // Style is independent of legacy print.css even when the injected widget
  // cannot initialize in a test environment.
  const values = await page.evaluate(() => {
    const button = document.createElement("button");
    button.id = "print-css-fixture";
    button.type = "button";
    button.className = "print-button";
    button.setAttribute("aria-label", "Print or save as PDF");
    button.textContent = "Print or save as PDF";
    document.body.appendChild(button);
    const css = getComputedStyle(button);
    const answer = {
      position: css.position,
      minimum: Number.parseFloat(css.minHeight),
      background: css.backgroundColor,
    };
    button.remove();
    return answer;
  });
  expect(values.position).toBe("fixed");
  expect(values.minimum).toBeGreaterThanOrEqual(44);
  expect(values.background).not.toBe("rgba(0, 0, 0, 0)");
});


test("dark theme prints NRE content using light, legible paper tokens", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("site-theme-preference", "dark"));
  await page.goto("/en/nre");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ media: "print" });
  const appearance = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    content: getComputedStyle(document.querySelector("main#main-content")!).color,
    textToken: getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim(),
  }));
  expect(appearance.body).toBe("rgb(255, 255, 255)");
  expect(appearance.content).toBe("rgb(17, 17, 17)");
  expect(appearance.textToken).toBe("#111");
});

test("printing Contact preserves article hero while hiding shared navigation", async ({ page }) => {
  await page.goto("/contact");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("body > header")).toBeHidden();
  await expect(page.locator("main#main-content header")).toBeVisible();
  await expect(page.locator("main#main-content .map-container iframe")).toBeVisible();
});
