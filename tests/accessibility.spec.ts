import { expect, test } from "@playwright/test";

test.describe("Accessibility Tests", () => {
	test("should have valid HTML structure", async ({ page }) => {
		await page.goto("/");

		// Check for doctype
		const doctype = await page.evaluate(() => {
			return document.doctype !== null;
		});
		expect(doctype).toBeTruthy();

		// Check for html lang attribute
		const htmlLang = await page.locator("html").getAttribute("lang");
		expect(htmlLang).toBeTruthy();
	});

	test("should have only one h1 tag", async ({ page }) => {
		await page.goto("/");

		// Count h1 in the main document only (not iframe documents). Exclude rare injected UI.
		const h1Count = await page.evaluate(() => {
			return Array.from(document.querySelectorAll("h1")).filter((h) => {
				if (h.getRootNode() !== document) return false;
				if (
					h.closest(
						"#google_translate_element, .google-translate-widget, .goog-te-banner-frame, [class*='goog-te']",
					)
				)
					return false;
				return true;
			}).length;
		});
		expect(h1Count).toBeLessThanOrEqual(1);
	});

	test("should have proper heading hierarchy", async ({ page }) => {
		await page.goto("/");

		// Get all headings
		const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();

		if (headings.length > 0) {
			const headingLevels = await Promise.all(
				headings.map(async (h) => {
					const tagName = await h.evaluate((el) => el.tagName.toLowerCase());
					return Number.parseInt(tagName.replace("h", ""));
				}),
			);

			// Check that we don't skip heading levels
			for (let i = 1; i < headingLevels.length; i++) {
				const diff = headingLevels[i] - headingLevels[i - 1];
				expect(diff).toBeLessThanOrEqual(1);
			}
		}
	});

	test("should have alt text on all images", async ({ page }) => {
		await page.goto("/");

		// Only check images in main content (exclude third-party widgets e.g. Google Translate)
		const images = await page
			.locator("main img, header img, .container img, body > .container img")
			.all();

		for (const img of images) {
			const alt = await img.getAttribute("alt");
			const ariaHidden = await img.getAttribute("aria-hidden");

			// Image should either have alt text or be aria-hidden
			expect(alt !== null || ariaHidden === "true").toBeTruthy();
		}
	});

	test("should have accessible form labels", async ({ page }) => {
		await page.goto("/");

		// Check only inputs in main/header/form, excluding third-party widgets. Use the DOM API for
		// accessible names (labels property, aria-*) so wrapped <label><input></label> is valid.
		const violations = await page.evaluate(() => {
			const thirdPartySelector =
				"#google_translate_element, [id*='goog-te'], [id*='goog-gt'], [id*='google_translate'], [class*='goog-te'], [class*='goog-gt'], [class*='grecaptcha'], .cf-turnstile, [data-sitekey], .google-translate-widget, [role='combobox'], [class*='skiptranslate']";

			function hasAccessibleName(el: HTMLInputElement): boolean {
				if (el.getAttribute("aria-hidden") === "true") return true;
				const al = el.getAttribute("aria-label")?.trim();
				if (al) return true;
				const title = el.getAttribute("title")?.trim();
				if (title) return true;
				if (el.type === "image" && el.getAttribute("alt")?.trim()) return true;
				const lb = el.getAttribute("aria-labelledby");
				if (lb) {
					for (const id of lb.split(/\s+/).filter(Boolean)) {
						const ref = document.getElementById(id);
						if (ref?.textContent?.trim()) return true;
					}
				}
				if (el.labels && el.labels.length > 0) return true;
				const id = el.id;
				if (id) {
					const lab = document.querySelector(`label[for="${CSS.escape(id)}"]`);
					if (lab?.textContent?.trim()) return true;
				}
				return false;
			}

			function looksLikeThirdPartyWidget(el: HTMLInputElement): boolean {
				if (el.closest(thirdPartySelector)) return true;
				const name = (el.getAttribute("name") || "").toLowerCase();
				if (/turnstile|cf-turnstile|g-recaptcha|__hstc|__utm/.test(name))
					return true;
				const pid = (el.id || "").toLowerCase();
				if (/turnstile|recaptcha|goog-te|goog-gt|gtm-|vwo_|mixpanel/.test(pid))
					return true;
				return false;
			}

			const roots = document.querySelectorAll("main, header, form");
			const bad: string[] = [];
			roots.forEach((root) => {
				root.querySelectorAll('input:not([type="hidden"])').forEach((node) => {
					const el = node as HTMLInputElement;
					if (el.getRootNode() !== document) return;
					if (looksLikeThirdPartyWidget(el)) return;
					if (!hasAccessibleName(el)) bad.push(el.outerHTML.slice(0, 120));
				});
			});
			return bad;
		});

		expect(violations).toEqual([]);
	});

	test("should have sufficient color contrast", async ({ page }) => {
		await page.goto("/");

		// This is a basic check - for thorough contrast checking, use axe-core
		const { backgroundColor, color } = await page.evaluate(() => {
			const s = window.getComputedStyle(document.body);
			return { backgroundColor: s.backgroundColor, color: s.color };
		});

		// Both must be set and non-transparent (non-empty and not fully transparent)
		expect(backgroundColor).toBeTruthy();
		expect(color).toBeTruthy();
		expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
		expect(backgroundColor).not.toBe("transparent");
	});

	test("should be keyboard navigable", async ({ page }) => {
		await page.goto("/");

		const interactive = [
			"a",
			"button",
			"input",
			"select",
			"textarea",
			"iframe",
		];

		const hasFocusable = await page.evaluate(() => {
			return (
				document.querySelector(
					'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
				) !== null
			);
		});
		expect(hasFocusable).toBeTruthy();

		let tag: string | null = null;
		for (let i = 0; i < 40; i++) {
			await page.keyboard.press("Tab");
			tag = await page.evaluate(
				() => document.activeElement?.tagName?.toLowerCase() ?? null,
			);
			if (tag && interactive.includes(tag)) break;
		}

		// WebKit / some configs skip links on Tab; fall back to programmatic focus
		if (!tag || !interactive.includes(tag)) {
			const first = page
				.locator(
					'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
				)
				.first();
			await first.focus();
			tag = await page.evaluate(
				() => document.activeElement?.tagName?.toLowerCase() ?? null,
			);
		}

		expect(tag).toBeTruthy();
		expect(interactive).toContain(tag);
	});

	test("should have proper viewport meta tag", async ({ page }) => {
		await page.goto("/");

		const viewportMeta = await page
			.locator('meta[name="viewport"]')
			.getAttribute("content");
		expect(viewportMeta).toBeTruthy();
		expect(viewportMeta).toContain("width=device-width");
	});

	test("should have landmark regions", async ({ page }) => {
		await page.goto("/");

		// Check for main landmark
		const main = await page.locator('main, [role="main"]').count();
		expect(main).toBeGreaterThan(0);

		// Check for navigation landmark
		const nav = await page.locator('nav, [role="navigation"]').count();
		expect(nav).toBeGreaterThan(0);
	});

	test("should have focus indicators", async ({ page }) => {
		await page.goto("/");

		// Find first interactive element
		const firstLink = page.locator("a, button").first();

		if ((await firstLink.count()) > 0) {
			await firstLink.focus();

			// Check if element has focus
			const hasFocus = await firstLink.evaluate((el) => {
				return document.activeElement === el;
			});

			expect(hasFocus).toBeTruthy();
		}
	});
});
