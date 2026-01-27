import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have valid HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for doctype
    const doctype = await page.evaluate(() => {
      return document.doctype !== null;
    });
    expect(doctype).toBeTruthy();
    
    // Check for html lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
  });

  test('should have only one h1 tag', async ({ page }) => {
    await page.goto('/');
    
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    if (headings.length > 0) {
      const headingLevels = await Promise.all(
        headings.map(async (h) => {
          const tagName = await h.evaluate(el => el.tagName.toLowerCase());
          return parseInt(tagName.replace('h', ''));
        })
      );
      
      // Check that we don't skip heading levels
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    }
  });

  test('should have alt text on all images', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Image should either have alt text or be aria-hidden
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/');
    
    const inputs = await page.locator('input:not([type="hidden"])').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      // If input has an id, check for associated label
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        const hasAccessibleName = label > 0 || ariaLabel || ariaLabelledby;
        expect(hasAccessibleName).toBeTruthy();
      } else {
        // If no id, should have aria-label or aria-labelledby
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This is a basic check - for thorough contrast checking, use axe-core
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    const bodyColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).color;
    });
    
    // Just check that both are set
    expect(bodyBg).toBeTruthy();
    expect(bodyColor).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Check if an element is focused
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName.toLowerCase();
    });
    
    // Should focus on an interactive element (a, button, input, etc.)
    const interactiveElements = ['a', 'button', 'input', 'select', 'textarea'];
    if (focusedElement) {
      expect(interactiveElements).toContain(focusedElement);
    }
  });

  test('should have proper viewport meta tag', async ({ page }) => {
    await page.goto('/');
    
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toBeTruthy();
    expect(viewportMeta).toContain('width=device-width');
  });

  test('should have landmark regions', async ({ page }) => {
    await page.goto('/');
    
    // Check for main landmark
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThan(0);
    
    // Check for navigation landmark
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(nav).toBeGreaterThan(0);
  });

  test('should have focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Find first interactive element
    const firstLink = page.locator('a, button').first();
    
    if (await firstLink.count() > 0) {
      await firstLink.focus();
      
      // Check if element has focus
      const hasFocus = await firstLink.evaluate((el) => {
        return document.activeElement === el;
      });
      
      expect(hasFocus).toBeTruthy();
    }
  });
});
