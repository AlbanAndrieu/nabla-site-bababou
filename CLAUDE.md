# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Install dependencies:**
```
npm install
```

**Build and run the Next.js/Vercel project:**
```
npm run dev
npm run build
npm run start
```

**Playwright Testing (E2E):**
```
npm install             # install dependencies, incl. Playwright
npx playwright install  # install browsers (if first time)
npm test                # run all tests
npm run test:headed     # headed mode
npm run test:ui         # interactive UI mode
npm run test:debug      # debug mode
npm run test:report     # view test report
```

**Legacy static fallback audit:**
```
npm run start-python
```


## High-Level Architecture

- `app/`: Next.js App Router and localized native routes.
- `public/`: legacy static pages and shared assets retained only while migration parity is being proven; `public/404.html` is the protected reviewed 404 source.
- `api/`: Vercel serverless API routes.
- `messages/` and `i18n/`: first-class FR/EN/DE/NO runtime catalogs and routing.

- **Workflows:**
  - GitHub Actions for Playwright tests, Docker CI, MegaLinter, PDF builds, Copilot setup
  - Secrets for Docker, OCO, and MegaLinter auto-commits

## Testing & CI

- **Playwright** for End-to-End Testing: Homepage, Accessibility, Responsive Design, Navigation.
- Tests run automatically on GitHub Actions for PRs/pushes (see `.github/workflows/playwright.yml`)
- Artifacts: Test reports and traces are uploaded.

## Standards and Conventions

### HTML/CSS/JS
- **HTML:** Semantic elements, WCAG 2.1 Level AA accessibility, proper alt text, keyboard navigation, ARIA labels, mobile-first, print support, SEO meta tags, Open Graph and Twitter cards.
- **CSS:** Theme support (light/dark), CSS custom properties, print styles, responsive images (`srcset`), grid/flex layouts, print.css.
- **JavaScript:** ES6+, async/await, error handling, JSDoc for documentation, use constants and modern practices.

### Internationalization (i18n)
- All pages should set the `lang` attribute.
- Structure content for translation and RTL support using logical properties.

### PDF/Print
- Maintain `public/print.css` (media query, optimization, proper page breaks).

### SEO/Crawler
- Keep `public/robots.txt` and the active sitemap generation/output up to date.
- Include meta tags and canonical URLs.

### Commit/Branching
- Use conventional commit format.
- Feature branches.
- Update sitemap and robots.txt after deployment changes.

### Asset Organization
- Keep assets in `public/assets/`; optimize images.
- Place styles/scripts in respective directories.

## Copilot Guidance (Key Points)

- All HTML changes must be WCAG AA compliant and semantic.
- Mobile-first responsive design with required breakpoints.
- Maintain or enhance light/dark mode in `public/theme.css`.
- Print styles in `public/print.css`.
- i18n readiness; never hardcode text in JS.
- SEO: unique `<title>`, meta description/keywords, canonical URLs, structured data.
- Crawler & Sitemap: Maintain robots.txt and sitemap; submit updates to search engines.
- Open Graph & Twitter Cards: Always present on pages.
- Code consistency: HTML5 DOCTYPE, 2-space indentation, kebab-case for CSS classes, descriptive filenames.
- Documentation: Update README, comment complex logic, use JSDoc, CSS documentation.
- Performance: Minify assets, lazy load images, CDN usage, critical CSS.
- Testing: Validate HTML/CSS, accessibility checks, browser/device testing, performance.

## Quick Checklist

- Semantic HTML
- WCAG AA Accessibility
- Mobile-first, responsive
- Theme (light/dark)
- i18n
- SEO & Open Graph meta
- Print styles
- Code convention/adherence
- Sitemap and robots.txt maintenance
- Minified, optimized assets
- Comprehensive testing
- README updated for architectural changes

---

**Contact:** For questions or clarifications, contact: aa@albandrieu.com

---
