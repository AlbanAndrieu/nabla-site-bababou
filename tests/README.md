# Playwright Tests

This directory contains end-to-end tests using [Playwright](https://playwright.dev/).

## Test Structure

- `homepage.spec.ts` - Tests for the homepage including meta tags and basic structure
- `404.spec.ts` - Tests for the 404 error page
- `theme-toggle.spec.ts` - Tests for dark/light theme switching
- `google-translate.spec.ts` - Tests for Google Translate widget functionality
- `accessibility.spec.ts` - Tests for accessibility features (WCAG compliance, ARIA, keyboard navigation, etc.)
- `responsive.spec.ts` - Tests for responsive design across different viewports
- `navigation.spec.ts` - Tests for links, navigation, and routing

## Running Tests

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see the browser)
npm run test:headed

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

## Writing New Tests

### Basic Test Structure

To add new tests, create a new file with the `.spec.ts` extension in this directory:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use descriptive test names** - Describe the user-visible contract being validated.
2. **Test user behavior** - Focus on what users see and interact with, not implementation details.
3. **Keep tests independent** - Each test must be able to run on its own.
4. **Prefer accessible selectors** - Use roles, labels and stable IDs before CSS implementation details.
5. **Use event-driven waits** - Prefer Playwright locator assertions and auto-waiting. Avoid fixed sleeps and avoid `networkidle` for pages that intentionally load third-party resources.
6. **Use page objects for complex pages** - Extract common page interactions into reusable helpers when it improves clarity.
7. **Test responsive design** - Keep mobile-only assertions explicitly scoped so desktop runs do not perform unnecessary navigation.
8. **Check accessibility** - Ensure features remain keyboard-accessible and screen-reader friendly.

### Common Patterns

#### Testing visibility
```typescript
await expect(page.locator('nav')).toBeVisible();
```

#### Testing text content
```typescript
await expect(page.locator('h1')).toContainText(/Expected Text/i);
```

#### Testing attributes
```typescript
await expect(page.locator('img')).toHaveAttribute('alt', /.+/);
```

#### Testing for meta tags (SEO)
```typescript
await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
```

#### Testing responsive behavior
```typescript
test('should work on mobile', async ({ page, viewport }) => {
  test.skip(!viewport || viewport.width >= 768, 'Mobile-only coverage');
  await page.goto('/');
  // Mobile-specific assertions
});
```

#### Testing theme or state changes
```typescript
const button = page.locator('.theme-toggle');
await button.click();
await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
```

## Configuration

Test configuration is in `playwright.config.ts` in the root directory:

- **Base URL**: `http://localhost:3000` by default; set `BASE_URL` for an external Preview
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Auto-start server**: local tests start the Next.js dev server; CI local runs use `next start`
- **Retries on CI**: 2 retries on failure in CI environment
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

## Debugging

### Debug Mode
```bash
npm run test:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- See locator highlights
- Edit locators
- View console logs

### Headed Mode
```bash
npm run test:headed
```

Runs tests with a visible browser window.

### UI Mode
```bash
npm run test:ui
```

Opens an interactive UI to run and debug tests with time-travel debugging.

## CI/CD Integration

The dedicated Playwright workflow runs against an already-built Vercel deployment:
- automatically on `vercel.deployment.success` repository-dispatch events;
- manually through `workflow_dispatch` with an explicit deployment URL;
- Preview runs target the exact deployed SHA and use Vercel Automation Bypass or the trusted OIDC fallback;
- production deployments run the lightweight production route smoke instead of reinstalling and launching the full browser suite.

Pull-request Quality has its own project/unit/build checks before the automatic Vercel Preview checkpoint is published. See `.github/workflows/playwright.yml` and `.github/workflows/ci.yml` for the exact orchestration.

Playwright traces/screenshots are uploaded on failure with short retention (currently 3 days) to reduce artifact storage cost.

## Troubleshooting

### Tests fail locally but pass in CI
- Ensure browsers are installed: `npx playwright install --with-deps`
- Check that the Next.js dev server is reachable on `http://localhost:3000`

### Flaky tests
- Inspect the trace and identify the actual readiness condition before increasing timeouts.
- Replace fixed sleeps and broad `networkidle` waits with locator assertions, URL assertions, response waits, or another explicit application signal.
- Keep retries as a diagnostic safety net, not as a substitute for deterministic synchronization.

### Element not found
- Use Playwright Inspector to find correct selectors
- Prefer an accessible locator or stable ID
- If an element is created dynamically, assert the concrete state that proves it is ready
- Verify the expected route/deployment SHA before debugging selectors

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
