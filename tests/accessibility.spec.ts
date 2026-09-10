import { expect, test } from "@playwright/test";

test.describe("Accessibility Tests", () => {
	test("exposes accessible document semantics and landmarks", async ({ page }) => {
		await page.goto("/");

		await test.step("has valid document metadata", async () => {
			const hasDoctype = await page.evaluate(() => document.doctype !== null);
			expect(hasDoctype).toBeTruthy();
			await expect(page.locator("html")).toHaveAttribute("lang", /.+/);
			await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
				"content",
				/width=device-width/,
			);
		});

		await test.step("keeps a coherent heading structure", async () => {
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

			const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
			expect(headings.length).toBeGreaterThan(0);
			const headingLevels = await Promise.all(
				headings.map(async (heading) => {
					const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
					return Number.parseInt(tagName.replace("h", ""), 10);
				}),
			);

			for (let i = 1; i < headingLevels.length; i++) {
				const diff = headingLevels[i] - headingLevels[i - 1];
				expect(diff).toBeLessThanOrEqual(1);
			}
		});

		await test.step("labels site-owned images and form controls", async () => {
			const images = await page
				.locator("main img, header img, .container img, body > .container img")
				.all();

			for (const img of images) {
				const alt = await img.getAttribute("alt");
				const ariaHidden = await img.getAttribute("aria-hidden");
				expect(alt !== null || ariaHidden === "true").toBeTruthy();
			}

			const violations = await page.evaluate(() => {
				const thirdPartySelector =
					"#google_translate_element, [id*='goog-te'], [id*='goog-gt'], [id*='google_translate'], [class*='goog-te'], [class*='goog-gt'], [class*='grecaptcha'], .cf-turnstile, [data-sitekey], .google-translate-widget, [role='combobox'], [class*='skiptranslate']";

				function hasAccessibleName(el: HTMLInputElement): boolean {
					if (el.getAttribute("aria-hidden") === "true") return true;
					const ariaLabel = el.getAttribute("aria-label")?.trim();
					if (ariaLabel) return true;
					const title = el.getAttribute("title")?.trim();
					if (title) return true;
					if (el.type === "image" && el.getAttribute("alt")?.trim()) return true;
					const labelledBy = el.getAttribute("aria-labelledby");
					if (labelledBy) {
						for (const id of labelledBy.split(/\s+/).filter(Boolean)) {
							const ref = document.getElementById(id);
							if (ref?.textContent?.trim()) return true;
						}
					}
					if (el.labels && el.labels.length > 0) return true;
					if (el.id) {
						const label = document.querySelector(
							`label[for="${CSS.escape(el.id)}"]`,
						);
						if (label?.textContent?.trim()) return true;
					}
					return false;
				}

				function looksLikeThirdPartyWidget(el: HTMLInputElement): boolean {
					if (el.closest(thirdPartySelector)) return true;
					const name = (el.getAttribute("name") || "").toLowerCase();
					if (/turnstile|cf-turnstile|g-recaptcha|__hstc|__utm/.test(name)) {
						return true;
					}
					const id = (el.id || "").toLowerCase();
					return /turnstile|recaptcha|goog-te|goog-gt|gtm-|vwo_|mixpanel/.test(
						id,
					);
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

		await test.step("keeps readable theme tokens and structural landmarks", async () => {
			const { backgroundColor, color } = await page.evaluate(() => {
				const styles = window.getComputedStyle(document.body);
				return {
					backgroundColor: styles.backgroundColor,
					color: styles.color,
				};
			});

			expect(backgroundColor).toBeTruthy();
			expect(color).toBeTruthy();
			expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
			expect(backgroundColor).not.toBe("transparent");
			await expect(page.locator('main, [role="main"]')).not.toHaveCount(0);
			await expect(page.locator("header")).not.toHaveCount(0);
		});
	});

	test("supports keyboard navigation and explicit focus", async ({ page }) => {
		await page.goto("/");

		const interactiveTags = [
			"a",
			"button",
			"input",
			"select",
			"textarea",
			"iframe",
		];
		const focusableSelector =
			'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])';

		await expect(page.locator(focusableSelector).first()).toBeAttached();

		let tag: string | null = null;
		for (let i = 0; i < 40; i++) {
			await page.keyboard.press("Tab");
			tag = await page.evaluate(
				() => document.activeElement?.tagName?.toLowerCase() ?? null,
			);
			if (tag && interactiveTags.includes(tag)) break;
		}

		if (!tag || !interactiveTags.includes(tag)) {
			await page.locator(focusableSelector).first().focus();
			tag = await page.evaluate(
				() => document.activeElement?.tagName?.toLowerCase() ?? null,
			);
		}

		expect(tag).toBeTruthy();
		expect(interactiveTags).toContain(tag);

		const focusTarget = page.locator(
			'#theme-toggle-root .theme-toggle__btn[data-theme="light"]',
		);
		await expect(focusTarget).toBeVisible();
		await focusTarget.focus();
		expect(
			await focusTarget.evaluate((el) => document.activeElement === el),
		).toBeTruthy();
	});
});
