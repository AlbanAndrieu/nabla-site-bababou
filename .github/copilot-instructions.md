# Copilot Instructions for nabla-site-bababou

## Repository Overview

This is the hybrid Next.js migration repository for Bababou. The repository contains:

- A Next.js App Router application in `app/`
- Legacy HTML and static assets in `public/`, retained only until migration parity is proven
- Vercel deployment configuration

**Languages & Technologies:**
- JavaScript/TypeScript (Node.js v25.9.0+, npm v11.17.0+)
- Python 3.12 (for tooling and focused legacy-static audits)
- Next.js 16.3.2 with React 19.2.4
- Vercel deployment platform

## Specialized Instruction Files

This main file provides general guidance for the entire repository. For area-specific instructions, refer to:

- **[copilot-instructions-nextjs.md](copilot-instructions-nextjs.md)** - Next.js application (`app/`)
  - Next.js 16, React 19, TypeScript, Tailwind CSS
  - App Router conventions, component patterns, deployment

- **[copilot-instructions-static-site.md](copilot-instructions-static-site.md)** - Static website (`public/`)
  - HTML/CSS/JavaScript best practices
  - Dark mode, Google Translate, SEO, accessibility
  - Print styles, responsive design, Open Graph

- **[copilot-instructions-api.md](copilot-instructions-api.md)** - API functions (`api/`)
  - Vercel serverless functions
  - Request handling, validation, security
  - Environment variables, testing, deployment

- **[copilot-instructions-cicd.md](copilot-instructions-cicd.md)** - CI/CD workflows (`.github/workflows/`)
  - GitHub Actions workflows
  - Quality, Playwright Preview, release, MegaLinter and Copilot setup
  - Workflow patterns, triggers, debugging

- **[copilot-instructions-python.md](copilot-instructions-python.md)** - Python tools and scripts
  - Python 3.12, Pipenv, development server
  - Linting tools (Ruff, Bandit, ansible-lint)
  - Pre-commit hooks, testing, best practices

## Project Structure

### Root Directory Files
- `package.json` - Root package configuration with build scripts and dependencies
- `vercel.json` - Vercel/Next.js deployment configuration
- `eslint.config.js` - ESLint configuration for the project
- `commitlint.config.ts` - Commitlint configuration with emoji support

### Key Directories
- `public/` - static assets plus legacy HTML retained during migration
- `app/` - root Next.js App Router application
- `api/` - API functions
- `.github/workflows/` - CI, Preview E2E, release, MegaLinter, Docker and Copilot setup workflows

### Configuration Files
- `.mega-linter.yml` - MegaLinter configuration (comprehensive multi-language linter)
- `.pre-commit-config.yaml` - Pre-commit hooks configuration (extensive validation)
- `.yamllint` - YAML linting configuration
- `.ansible-lint` - Ansible linting configuration
- `Pipfile` - Python dependencies (ansible-lint, gitlint)

## Build & Development Commands

### Installation & Setup
**ALWAYS run installation before building or running:**
```bash
npm ci
```

The retired root dist-copy `postinstall` must stay absent. Legacy D3 is served
from the reviewed versioned asset `public/d3.v3.min.js`; do not restore an npm
copy step or a second package under `public/`.

### Development Servers

**Next.js application:**
```bash
npm run dev
# Opens at http://localhost:3000
```

For a focused audit of untouched legacy static HTML only:
```bash
npm run start-python
```

### Linting
**ALWAYS run the canonical quality gate before publication:**
```bash
bash scripts/quality-gate.sh
```

The project has extensive pre-commit hooks configured in `.pre-commit-config.yaml` that run automatically on commit, including:
- File format checks (trailing whitespace, end-of-file, line endings)
- Code quality (ESLint, Ruff for Python, shellcheck for bash)
- Security checks (gitleaks, bandit, detect-private-key)
- YAML/JSON/TOML validation
- HTML and markdown linting

### Building

**Next.js application:**
```bash
npm run build
```

The root project is the Next.js project; `public/` is not a separate runtime.

### Deployment

**Vercel deployment:** Preview and production deployments come from the repository's Vercel Git Integration. The local Vercel CLI was intentionally retired; use the deployment produced for the branch/PR and validate its exact SHA.

## CI/CD & Validation

### GitHub Workflows
- `.github/workflows/ci.yml` - canonical PR and post-merge `master` quality/security checks
- `.github/workflows/vercel-preview.yml` - on-demand `vercel-preview-pr-*` checkpoint publication/cleanup
- `.github/workflows/playwright.yml` - browser and exact Vercel Preview E2E validation
- `.github/workflows/release.yml` - semantic release after validated current `master`
- `.github/workflows/mega-linter.yml`, `docker-build.yml`, `copilot-setup-steps.yml` - supporting validation/tooling

### Pre-commit Hooks
The repository uses extensive pre-commit hooks. To install them:
```bash
mise run hooks
```

**Important:** Many linters and formatters run automatically via pre-commit hooks, including:
- Python: ruff, pyupgrade, bandit
- Shell: shfmt, shellcheck, bashate
- JavaScript: biome, htmllint, htmlhint
- YAML: yamllint, prettier
- Security: gitleaks, encryption-check

### MegaLinter
The project uses MegaLinter with specific disabled linters (see `.mega-linter.yml`). Disabled categories include:
- CLOUDFORMATION, EDITORCONFIG, MARKDOWN, SPELL, JAVASCRIPT, CSS_SCSS_LINT, CSS_STYLELINT, TEKTON

## Important Development Notes

### Node.js Version Requirements
**CRITICAL:** This project requires:
- Node.js >= 25.9.0
- npm >= 11.17.0

Use `.nvmrc` for version management:
```bash
nvm use
```

### Python Dependencies
Python 3.12 is required. Install Python dependencies with:
```bash
pipenv install --dev
```

### Commit Message Format
The project uses commitlint with conventional commits and emoji support. OpenCommit is intentionally retained as an optional local assistant via `npm run oco` / `npm run opencommit`; commitlint remains authoritative. Valid commit types:
- `build`, `chore`, `ci`, `docs`, `feat`, `feature`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`

Example commit messages:
```
feat: add new feature
fix(scope): fix bug in component
🛠️  build: update dependencies
```

### ESLint Ignores
The following directories are ignored by ESLint (see `eslint.config.js`):
- `node_modules/`, `.next/`, `out/`, `build/`, `dist/`, `.turbo/`
- `app/node_modules/`, `app/.next/`, `.vercel/`, `.cache/`, `.pnpm/`
- `public/**/*.min.js`, `public/d3.v3.min.js`, `public/index.js`, `public/arf.js`, `public/theme-toggle.js`
- `api/**`, `index/**` (note: index directory may not currently exist but is included for future use)

### Common Issues & Workarounds

1. **Use the root package only** - `public/package.json` and the legacy dist-copy postinstall are retired
2. **Use the canonical npm workflow** - CI and the quality gate use the root npm lockfile
3. **Python server is legacy-only** - use it only for focused static-page audits; normal development uses Next.js
4. **Pre-commit hooks may be slow** - Some hooks (like mega-linter, ansible-lint) are disabled in `.pre-commit-config.yaml` because they're too slow
5. **Large files excluded** - Several large files are excluded from git (see `.pre-commit-config.yaml` check-added-large-files)

### Shell Script Notes
Shell scripts in the repository may be excluded from some linting checks due to specific code patterns.

## Validation Steps

Before submitting a PR:
1. Run `npm ci`
2. Run `bash scripts/quality-gate.sh`
3. Use `npm run dev` for interactive Next.js validation
4. Run Playwright locally when the change affects browser behavior
5. Verify the working tree is clean before publication

## Key Resources & Documentation

- Repository: https://github.com/AlbanAndrieu/nabla-site-bababou
- Issue Tracker: https://github.com/AlbanAndrieu/nabla-site-bababou/issues
- License: MIT
- Vercel deployment: Configured via `vercel.json`

## Search Guidance

When exploring the codebase:
- Static site files: Look in `public/` directory
- Next.js app: Look in `app/` directory
- API endpoints: Look in `api/` directory
- Build configurations: check root `package.json` and `vercel.json`
- Linting configs: Check `eslint.config.js`, `.mega-linter.yml`, `.pre-commit-config.yaml`
- CI/CD: Check `.github/workflows/`

## HTML/CSS Best Practices

### Accessibility Requirements

**ALWAYS ensure accessibility standards are met when working with HTML:**

1. **Semantic HTML Elements**
   - Use semantic tags: `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>`
   - Use proper heading hierarchy (`<h1>` to `<h6>`) - only one `<h1>` per page
   - Use `<button>` for actions, `<a>` for navigation

2. **ARIA Attributes**
   - Add `aria-label` or `aria-labelledby` to navigation elements and sections
   - Use `aria-hidden="true"` for decorative icons/elements
   - Include `role` attributes when semantic HTML isn't sufficient
   - Example landmarks already in use:
     - `<nav aria-label="Main navigation">`
     - `<footer aria-label="Site footer">`
     - `<section aria-labelledby="main-heading">`

3. **Skip Links**
   - Include skip-to-content links for keyboard navigation: `<a href="#main-content" class="skip-to-main">Skip to main content</a>`
   - Main content should have `id="main-content"` and be wrapped in `<main>` tag

4. **Images and Media**
   - All images must have meaningful `alt` text (or `alt=""` for decorative images)
   - Use `aria-hidden="true"` for decorative images with empty alt text
   - Ensure sufficient color contrast ratios (WCAG AA standard: 4.5:1 for normal text)

5. **Forms and Inputs**
   - Always associate labels with form inputs using `for` and `id` attributes
   - Provide clear error messages and validation feedback
   - Use appropriate input types (`email`, `tel`, `date`, etc.)

6. **Keyboard Navigation**
   - Ensure all interactive elements are keyboard accessible
   - Maintain logical tab order
   - Provide visible focus indicators (`:focus` styles)

### Responsive Design Guidelines

**All HTML/CSS changes must be mobile-responsive:**

1. **Viewport Configuration**
   - Always include viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
   - This is already configured in all HTML files

2. **Mobile-First Approach**
   - Design for mobile screens first, then enhance for larger screens
   - Use responsive units: `rem`, `em`, `%`, `vw`, `vh` instead of fixed `px`
   - Bootstrap 5.2.1 is included - leverage its responsive grid system

3. **Responsive Images**
   - Use `max-width: 100%` and `height: auto` for images
   - Consider using `srcset` for different screen densities
   - Use Bootstrap classes: `img-fluid` for responsive images

4. **Media Queries**
   - Test layouts on mobile (320px+), tablet (768px+), desktop (1024px+)
   - Use Bootstrap breakpoints: `sm` (576px), `md` (768px), `lg` (992px), `xl` (1200px)

5. **Touch Targets**
   - Ensure clickable elements are at least 44x44 pixels for touch screens
   - Add appropriate spacing between interactive elements

### Dark/Light Mode Implementation

**The project has a complete dark/light mode system:**

1. **CSS Custom Properties (CSS Variables)**
   - Located in `public/theme.css`
   - All colors are defined as CSS variables in `:root` selector
   - Dark mode colors defined under `[data-theme="dark"]` selector
   - **When adding new styles, ALWAYS use CSS variables for colors:**
     ```css
     color: var(--text-primary);
     background-color: var(--bg-primary);
     border-color: var(--border-color);
     ```

2. **Available Theme Variables**
   - **Backgrounds**: `--bg-primary`, `--bg-secondary`, `--bg-card`
   - **Text**: `--text-primary`, `--text-secondary`, `--text-muted`
   - **Interactive**: `--link-color`, `--link-hover`, `--button-bg`, `--button-hover`
   - **Borders/Shadows**: `--border-color`, `--shadow-color`, `--shadow-hover`
   - **Alerts**: `--alert-info-bg`, `--alert-success-bg`, `--alert-warning-bg`
   - **Navigation**: `--nav-bg`, `--nav-text`

3. **Theme Toggle**
   - Implemented in `public/theme-toggle.js`
   - Automatically detects system preference via `prefers-color-scheme`
   - User preference persisted in `localStorage`
   - Loads before page render to prevent flash of wrong theme

4. **Best Practices**
   - **NEVER** hardcode colors in HTML or CSS - always use CSS variables
   - Test all new UI components in both light and dark modes
   - Ensure sufficient contrast in both themes
   - Icons and images should work in both themes (consider using CSS filters if needed)

### Google Translate Integration

**The project includes multi-language support via Google Translate:**

1. **Configuration**
   - Central config file: `public/google-translate-config.js`
   - Widget included on all pages (positioned top-right, fixed)
   - **Supported languages**: English (en), French (fr), Norwegian (no), German (de), Spanish (es), Italian (it), Portuguese (pt), Dutch (nl), Swedish (sv), Danish (da), Finnish (suomi), Polish (pl), Czech (cs), Russian (ru), Arabic (ar), Japanese (ja), Chinese Simplified (zh-CN)

2. **Implementation Pattern**
   - Widget placement: `<div id="google_translate_element"></div>`
   - Styled with `.google-translate-widget` class (fixed position, top-right)
   - Scripts loaded in HTML head:
     ```html
     <script type="text/javascript" src="/google-translate-config.js"></script>
     <script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
     ```

3. **When Adding New Pages**
   - Include the translate widget container in the same fixed position
   - Import both translate scripts in the `<head>` section
   - Ensure the widget styling matches existing pages (see `index.html` styles)

4. **Content Considerations**
   - Write clear, simple content that translates well
   - Avoid idioms or culturally-specific references
   - Use proper semantic HTML (helps translation accuracy)
   - Test translated versions to ensure layout doesn't break

### Testing and Validation

**Before submitting HTML/CSS changes:**

1. **Accessibility Testing**
   - Run through keyboard navigation (Tab, Enter, Esc keys)
   - Test with screen reader (NVDA, JAWS, VoiceOver)
   - Validate HTML: Use W3C Validator or `htmllint` (configured in pre-commit hooks)
   - Check color contrast with browser DevTools or online tools

2. **Responsive Testing**
   - Test on mobile (320px), tablet (768px), desktop (1024px+)
   - Use browser DevTools device emulation
   - Test in portrait and landscape orientations
   - Verify touch targets are appropriately sized

3. **Theme Testing**
   - Toggle between light and dark modes
   - Verify all colors use CSS variables
   - Check that all text is readable in both themes
   - Ensure images/icons work in both themes

4. **Translation Testing**
   - Verify Google Translate widget appears and functions
   - Test at least 2-3 language translations
   - Check that layout remains intact when translated
   - Ensure widget is accessible and visible

5. **Browser Compatibility**
   - Test in Chrome, Firefox, Safari, and Edge
   - Verify CSS custom properties are supported (all modern browsers)
   - Check that fallbacks exist for older browsers if needed

6. **Performance**
   - Minimize CSS file sizes
   - Optimize images (use appropriate formats and compression)
   - Leverage browser caching
   - Check Lighthouse scores (aim for 90+ in Accessibility)

### HTML/CSS Code Quality Standards

1. **Code Organization**
   - Keep CSS modular and maintainable
   - Use consistent naming conventions (BEM or similar)
   - Group related styles together
   - Add comments for complex layouts or calculations

2. **CSS Best Practices**
   - Avoid `!important` unless absolutely necessary
   - Use CSS custom properties for repeated values
   - Minimize specificity conflicts
   - Prefer classes over IDs for styling
   - Use shorthand properties when appropriate

3. **HTML Best Practices**
   - Keep markup semantic and minimal
   - Avoid inline styles (use CSS classes)
   - Validate HTML with linters (htmllint, htmlhint in pre-commit hooks)
   - Use proper DOCTYPE and language declarations

4. **File Structure**
   - Main styles: `public/wireframe.css`, `public/arf.css`, `public/theme.css`
   - Theme toggle: `public/theme-toggle.js`
   - Translation config: `public/google-translate-config.js`
   - Keep related assets organized in `public/` directory

### PDF Printing Support

**All HTML pages must be print-friendly for PDF generation:**

1. **Print Stylesheets**
   - Located in `public/theme.css` and `public/wireframe.css`
   - Use `@media print` queries to define print-specific styles
   - Already implemented Bootstrap print utility classes: `.d-print-none`, `.d-print-block`, etc.

2. **Print-Specific CSS Rules**
   ```css
   @media print {
     /* Hide non-essential elements */
     nav, .google-translate-widget, .theme-toggle, footer .social-links {
       display: none !important;
     }

     /* Optimize for print */
     body {
       background: white;
       color: black;
       font-size: 12pt;
     }

     /* Prevent page breaks inside elements */
     h1, h2, h3, h4, h5, h6, p, blockquote {
       page-break-inside: avoid;
     }

     /* Show URLs for external links in print */
     a[href^='http']:after {
       content: " (" attr(href) ")";
     }
   }
   ```

3. **Print Best Practices**
   - Remove or hide: navigation menus, theme toggles, language selectors, decorative elements
   - Ensure sufficient contrast (black text on white background)
   - Use page-break properties to control pagination
   - Set appropriate margins and padding for printed pages
   - Test PDF generation using browser print preview (Chrome, Firefox)
   - Verify all important content is visible and readable when printed

4. **Bootstrap Print Utilities**
   - Use `.d-print-none` to hide elements in print view
   - Use `.d-print-block` to show elements only in print view
   - Apply to: navigation bars, theme toggles, interactive widgets

### SEO Best Practices

**All HTML pages must follow SEO best practices:**

1. **Required Meta Tags**
   ```html
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <meta name="description" content="Clear, concise description (150-160 characters)">
   <meta name="keywords" content="relevant, keywords, separated, by, commas">
   <meta name="author" content="Author name or site name">
   ```

2. **Title Tags**
   - Keep titles unique and descriptive (50-60 characters)
   - Include primary keywords
   - Format: `Primary Keyword - Secondary Keyword | Site Name`
   - Example already in use: `Missing Child - Abducted daughter by her mother and moved from France to Norway then Germany`

3. **Heading Structure**
   - Use only ONE `<h1>` per page (main topic)
   - Maintain logical hierarchy: `<h1>` → `<h2>` → `<h3>` (never skip levels)
   - Include keywords naturally in headings

4. **Content Optimization**
   - Use semantic HTML5 elements (`<article>`, `<section>`, `<nav>`, `<aside>`)
   - Write descriptive alt text for all images
   - Use descriptive anchor text for links (avoid "click here")
   - Keep URLs clean and descriptive
   - Add schema.org structured data when appropriate

5. **Performance & Core Web Vitals**
   - Optimize images (use WebP format when possible)
   - Minimize CSS and JavaScript files
   - Use lazy loading for images below the fold
   - Ensure fast loading times (aim for < 3 seconds)
   - Target Lighthouse scores: Performance (90+), SEO (95+)

6. **Mobile-First SEO**
   - Ensure mobile responsiveness (Google mobile-first indexing)
   - Test with Google Mobile-Friendly Test tool
   - Verify touch targets are appropriately sized (48x48px minimum)

### Crawler-Friendly Guidelines

**Ensure search engine crawlers can effectively index the site:**

1. **Robots.txt Configuration**
   - Located at `public/robots.txt`
   - Already configured with proper user-agent rules
   - **When modifying robots.txt:**
     - Allow legitimate search engine crawlers (Googlebot, Bingbot, etc.)
     - Block AI scrapers and unwanted bots (listed in current robots.txt)
     - Use `Crawl-delay` to prevent server overload
     - Always reference the sitemap: `Sitemap: https://bababou.com/sitemap.xml`
     - Submit sitemap via Google Search Console (recommended over deprecated ping service)

2. **Sitemap Requirements**
   - Reference current sitemap at `public/sitemap.xml`
   - **CRITICAL: Update sitemap when adding/removing pages**
   - Submit sitemap to Google Search Console after updates
   - Use Google Search Console for sitemap verification and monitoring

3. **Crawlability Best Practices**
   - Use semantic HTML structure (crawlers parse it better)
   - Avoid JavaScript-only navigation (use proper `<a>` tags)
   - Implement proper internal linking structure
   - Use descriptive URLs (avoid query parameters when possible)
   - Ensure all pages are reachable within 3 clicks from homepage
   - Create XML sitemap for all public pages
   - Use canonical URLs to avoid duplicate content issues

4. **Technical SEO**
   - Implement proper HTTP status codes (200, 301, 404, etc.)
   - Use 301 redirects for moved pages
   - Create custom 404 page (already exists at `public/404.html`)
   - Ensure HTTPS everywhere
   - Set proper cache headers for static assets

5. **Content Accessibility for Crawlers**
   - Use clear, descriptive link text
   - Provide alt text for all images (crawlers read these)
   - Use heading tags to structure content
   - Avoid hiding important content with CSS/JavaScript
   - Make sure primary content is in HTML, not loaded via JavaScript

### Sitemap Maintenance Guidelines

**Keep `public/sitemap.xml` up to date:**

1. **Sitemap Structure**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://bababou.com/path/to/page.html</loc>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
       <lastmod>YYYY-MM-DD</lastmod>
     </url>
   </urlset>
   ```

2. **When to Update Sitemap**
   - **ALWAYS** update when adding a new HTML page
   - **ALWAYS** update when removing a page
   - Update `<lastmod>` when making significant content changes
   - Update `<changefreq>` based on expected update frequency

3. **Sitemap Best Practices**
   - Include all public-facing HTML pages
   - Exclude admin pages, login pages, API endpoints
   - Use absolute URLs (include full domain)
   - Set appropriate `<priority>` values:
     - Homepage: 1.0
     - Main pages: 0.8
     - Secondary pages: 0.5
     - Archive pages: 0.3
   - Use `<changefreq>` appropriately:
     - News/blog: `daily` or `weekly`
     - Static content: `monthly` or `yearly`
     - Homepage: `weekly`

4. **Current Sitemap Pages**
   - `https://bababou.com/` (homepage - note: actual sitemap uses /index.html)
   - `https://bababou.com/policy/privacy_policy.html`
   - `https://bababou.com/policy/service_terms.html`
   - `https://bababou.com/policy/gnu_general_public_license.txt`
   - `https://status.albandrieu.com/` (external status page - note: typically external domains should not be in sitemap)

   **Note**: Consider updating the sitemap to use canonical URLs (remove /index.html for homepage) and evaluate whether external status page should be included.

5. **Sitemap Validation**
   - Validate XML structure before committing
   - Test sitemap URL is accessible: `https://bababou.com/sitemap.xml`
   - Submit to Google Search Console after updates
   - Verify all URLs in sitemap return HTTP 200 status
   - Keep sitemap size under 50MB and 50,000 URLs

6. **Automated Sitemap Updates**
   - Consider adding a script to auto-generate sitemap from HTML files
   - Add sitemap validation to pre-commit hooks or CI/CD pipeline
   - Document sitemap update process in CONTRIBUTING.md

### Open Graph Protocol

**All HTML pages must include Open Graph meta tags for social media sharing:**

1. **Required Open Graph Tags**
   ```html
   <!-- facebook open graph tags -->
   <meta property="og:type" content="website" />
   <meta property="og:url" content="https://bababou.com" />
   <meta property="og:title" content="Page Title - 60 characters max" />
   <meta property="og:description" content="Clear description - 200 characters max" />
   <meta property="og:image" content="https://bababou.com/path/to/image.jpg" />
   <meta property="og:image:alt" content="Description of image for accessibility" />
   <meta property="og:site_name" content="Site Name" />
   <meta property="og:locale" content="en_US" />
   ```

2. **Open Graph Image Requirements**
   - Minimum size: 1200x630 pixels (recommended)
   - Aspect ratio: 1.91:1
   - Max file size: 8MB
   - Formats: JPG, PNG, WebP
   - Use absolute URLs (include full domain)
   - Ensure image is publicly accessible (not behind authentication)
   - Current example: `https://bababou.com/nabla/assets/miss-and-love-you-quote.jpeg`

3. **Twitter Card Tags**
   ```html
   <!-- twitter card tags additive with the og: tags -->
   <meta name="twitter:card" content="summary_large_image">
   <meta name="twitter:site" content="@username">
   <meta name="twitter:title" content="Page Title">
   <meta name="twitter:description" content="Page description">
   <meta name="twitter:image" content="https://bababou.com/path/to/image.jpg">
   ```

4. **Page-Specific Open Graph**
   - Customize `og:title` and `og:description` for each page
   - Use unique images for different pages when possible
   - For articles, use `og:type` = "article" and add:
     - `<meta property="article:published_time" content="YYYY-MM-DDTHH:MM:SS+00:00">`
     - `<meta property="article:author" content="Author Name">`

5. **Testing Open Graph Tags**
   - Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Use Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Use LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
   - Verify images load correctly in social media previews
   - Check that titles and descriptions are properly truncated

6. **Best Practices**
   - Keep `og:title` concise and compelling (60 characters max)
   - Write engaging `og:description` (200 characters max)
   - Use high-quality, relevant images
   - Ensure Open Graph tags are in the `<head>` section
   - Update Open Graph tags when page content changes
   - Include `og:locale` for internationalization support

### Code Consistency and Reusability

**Maintain consistent, reusable code across the project:**

1. **Component-Based Approach**
   - Create reusable HTML snippets for common elements:
     - Header/navigation (consistent across all pages)
     - Footer with social links and legal info
     - Google Translate widget integration
     - Theme toggle button
     - Meta tags template
   - Use consistent class names and structure across pages
   - Document common patterns in this file

2. **CSS Architecture**
   - Follow existing file structure:
     - `wireframe.css` - Base layout and Bootstrap overrides
     - `arf.css` - Custom application styles
     - `theme.css` - Theme-specific variables and dark mode
   - Use CSS custom properties (variables) for all colors and spacing
   - Group related styles with clear comments
   - Avoid duplicating styles across files

3. **Naming Conventions**
   - Use consistent class naming (BEM methodology recommended):
     - Block: `.navigation`, `.card`, `.button`
     - Element: `.navigation__item`, `.card__title`, `.button__icon`
     - Modifier: `.button--primary`, `.card--featured`
   - Use semantic class names (`.article-header` not `.red-text`)
   - Prefix utility classes: `.u-text-center`, `.u-mb-3`

4. **Documentation Standards**
   - Add comments to complex CSS calculations or layouts
   - Document JavaScript functions and their parameters
   - Use consistent comment formatting:
     ```css
     /* ===========================================
        Section Title
        =========================================== */

     /* Subsection description */
     .class-name { }
     ```

5. **DRY Principles (Don't Repeat Yourself)**
   - Extract repeated styles into utility classes or CSS variables
   - Create reusable JavaScript functions for common tasks
   - Use template patterns for repeated HTML structures
   - Consolidate similar media queries

6. **Version Control Best Practices**
   - Make atomic commits (one logical change per commit)
   - Write clear commit messages (use commitlint format)
   - Review changes before committing to avoid accidental inclusions
   - Keep HTML, CSS, and JS changes in separate commits when possible

7. **Cross-Page Consistency Checklist**
   - [ ] Same header/navigation structure
   - [ ] Same footer content and layout
   - [ ] Same meta tags pattern (update content per page)
   - [ ] Same Google Translate integration
   - [ ] Same theme toggle implementation
   - [ ] Same CSS file imports (wireframe.css, arf.css, theme.css)
   - [ ] Same accessibility features (skip links, ARIA labels)
   - [ ] Same print stylesheet application
   - [ ] Same Open Graph/Twitter Card implementation
   - [ ] Same analytics tracking code

8. **Testing for Consistency**
   - Visually compare pages side-by-side
   - Check that theme toggle works identically across pages
   - Verify translations work on all pages
   - Ensure print preview looks consistent
   - Test responsive behavior is uniform
   - Validate all pages pass HTML/CSS linters

## Code Review Best Practices

**ALWAYS follow these code review guidelines when reviewing PRs or code changes:**

### Review Process

1. **Pre-Review Checklist**
   - Verify CI/CD pipeline passed successfully
   - Check that all tests pass
   - Ensure linting has been run without errors
   - Confirm the PR description is clear and complete
   - Review the scope of changes - should be minimal and focused

2. **Code Quality Review**
   - **Readability**: Code should be self-documenting with clear variable/function names
   - **Maintainability**: Look for code duplication, overly complex logic, or tight coupling
   - **Consistency**: Verify adherence to project coding standards and conventions
   - **Documentation**: Check that complex logic has appropriate comments
   - **Error Handling**: Ensure errors are properly caught and handled

3. **Functional Review**
   - Verify the code accomplishes the stated goal
   - Check edge cases and boundary conditions are handled
   - Look for potential runtime errors or null/undefined issues
   - Ensure proper input validation
   - Test the changes locally if possible

4. **Security Review**
   - Look for injection vulnerabilities (SQL, XSS, command injection)
   - Check for authentication and authorization issues
   - Verify sensitive data is not exposed in logs or error messages
   - Ensure secrets are not hardcoded
   - Check for insecure dependencies or vulnerable packages
   - Validate user input is properly sanitized

5. **Performance Review**
   - Look for unnecessary loops or N+1 query problems
   - Check for memory leaks or resource cleanup issues
   - Ensure expensive operations are properly cached
   - Verify database queries are optimized
   - Check for proper use of async/await patterns

6. **Accessibility Review** (for UI changes)
   - Verify proper semantic HTML
   - Check ARIA attributes are used correctly
   - Ensure keyboard navigation works
   - Test color contrast meets WCAG standards
   - Verify screen reader compatibility

### Common Review Patterns to Check

**Anti-Patterns to Flag:**
- Commented-out code that should be removed
- Console.log statements or debug code left in
- Unused imports or variables
- Magic numbers without explanation
- Deeply nested conditionals (> 3 levels)
- Functions longer than 50-100 lines
- Missing error handling
- Hardcoded values that should be configurable

**Good Patterns to Encourage:**
- Single Responsibility Principle (one function, one purpose)
- Descriptive naming (no single-letter variables except loop counters)
- Early returns to reduce nesting
- Proper separation of concerns
- Use of TypeScript types/interfaces
- Comprehensive error messages
- Unit tests for new functionality

### Providing Feedback

1. **Be Constructive and Specific**
   - Point to exact lines with issues
   - Explain WHY something should be changed, not just WHAT
   - Suggest specific solutions or alternatives
   - Acknowledge good code and improvements

2. **Categorize Feedback**
   - **Critical**: Bugs, security issues, broken functionality
   - **Important**: Code quality, maintainability, performance
   - **Nice-to-have**: Style preferences, minor optimizations
   - **Question**: Things you don't understand or want clarification on

3. **Review Response Time**
   - Aim to review PRs within 24 hours
   - For urgent fixes, review within a few hours
   - Use "Request Changes" for blocking issues
   - Use "Approve" only when truly ready to merge
   - Use "Comment" for non-blocking feedback

### Pull Request Workflow

1. **PR Size Guidelines**
   - Keep PRs small and focused (< 400 lines changed ideally)
   - One feature/fix per PR
   - Break large changes into multiple PRs when possible
   - Explain the reasoning in the PR description

2. **PR Description Template**
   ```markdown
   ## What
   Brief description of the change

   ## Why
   Problem being solved or feature being added

   ## How
   Technical approach taken

   ## Testing
   How the changes were tested

   ## Screenshots
   (If UI changes) Before/After screenshots

   ## Checklist
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Linting passed
   - [ ] No security vulnerabilities introduced
   - [ ] Accessible (if UI change)
   - [ ] Responsive (if UI change)
   ```

3. **Merge Requirements**
   - At least one approval required
   - All CI checks must pass
   - No unresolved comments
   - Branch up to date with main/master
   - No merge conflicts

### Testing Requirements for Code Review

**ALWAYS ensure these testing standards are met:**

1. **Unit Tests**
   - New features must include unit tests
   - Bug fixes should include regression tests
   - Aim for 80%+ code coverage on new code
   - Tests should be independent and repeatable
   - Use descriptive test names that explain the scenario

2. **Integration Tests**
   - Test interactions between components/modules
   - Verify API contracts are maintained
   - Test database migrations work correctly
   - Ensure third-party integrations are mocked appropriately

3. **End-to-End Tests** (if applicable)
   - Test critical user journeys
   - Verify the full stack works together
   - Test on multiple browsers/devices for UI changes

4. **Manual Testing Checklist**
   - Test the happy path
   - Test error cases and edge conditions
   - Test with invalid or unexpected input
   - Test on different browsers (Chrome, Firefox, Safari, Edge)
   - Test on different screen sizes (mobile, tablet, desktop)
   - Test with keyboard navigation only
   - Test with screen reader if accessibility-related

### Security Review Guidelines

**Critical security checks for code review:**

1. **Authentication & Authorization**
   - Verify users are authenticated before accessing protected resources
   - Check authorization rules are correctly applied
   - Ensure session management is secure
   - Verify JWT tokens are validated properly
   - Check for insecure direct object references

2. **Input Validation**
   - All user input must be validated and sanitized
   - Use allowlists over denylists for validation
   - Validate on the server-side, not just client-side
   - Check for SQL injection vulnerabilities
   - Verify XSS protection is in place
   - Look for command injection risks

3. **Data Protection**
   - Sensitive data should be encrypted at rest and in transit
   - No passwords, API keys, or secrets in code
   - Use environment variables for configuration
   - Ensure PII (Personally Identifiable Information) is properly handled
   - Check logging doesn't expose sensitive data

4. **Dependency Security**
   - Review new dependencies before approval
   - Check for known vulnerabilities (use npm audit, Snyk, etc.)
   - Verify dependencies are from trusted sources
   - Keep dependencies up to date
   - Remove unused dependencies

5. **Error Handling**
   - Don't expose stack traces to users
   - Log errors securely without exposing sensitive info
   - Return generic error messages to users
   - Validate error handling doesn't leak information

### Documentation Standards for Reviewers

**Ensure proper documentation is included:**

1. **Code Comments**
   - Complex algorithms should have explanatory comments
   - Public APIs should have JSDoc/TSDoc comments
   - Non-obvious workarounds should be explained
   - Don't comment obvious code - let the code speak for itself

2. **README Updates**
   - New features should update relevant README sections
   - Installation/setup instructions should be current
   - Environment variables should be documented
   - API endpoints should be documented

3. **CHANGELOG Updates**
   - Significant changes should be added to CHANGELOG
   - Follow Keep a Changelog format
   - Include version number and date
   - Categorize as Added, Changed, Deprecated, Removed, Fixed, Security

4. **Inline Documentation**
   - Update copilot-instructions.md for new patterns
   - Update CONTRIBUTING.md for new workflows
   - Keep architecture documentation current

### Agent-Specific Review Guidelines

**When using GitHub Copilot for code review:**

1. **Code Review Agent**
   - Use Copilot's code review features to catch common issues
   - Review Copilot's suggestions critically - don't accept blindly
   - Focus on high-signal issues (bugs, security, logic errors)
   - Ignore low-priority style suggestions unless they matter
   - Use Copilot to identify patterns across the codebase

2. **Task Execution Agent**
   - Break complex tasks into smaller, focused subtasks
   - Provide clear context and requirements
   - Specify expected outcomes explicitly
   - Review agent output before committing
   - Iterate on instructions if output doesn't meet expectations

3. **Exploration Agent**
   - Use to understand unfamiliar codebases
   - Ask targeted questions about specific files or patterns
   - Request summaries of complex logic
   - Identify dependencies and relationships

### Prompt Engineering for Better Reviews

**How to get better results from AI-assisted code review:**

1. **Be Specific**
   - Bad: "Review this code"
   - Good: "Review this authentication logic for security vulnerabilities, specifically checking for SQL injection and session fixation issues"

2. **Provide Context**
   - Include relevant background about the feature
   - Explain the problem being solved
   - Reference related issues or PRs
   - Mention any constraints or requirements

3. **Ask Targeted Questions**
   - "Does this handle edge case X?"
   - "Are there any performance concerns with this approach?"
   - "Is this accessible for screen readers?"
   - "What security issues might this introduce?"

4. **Iterative Refinement**
   - Start with high-level review
   - Drill into specific concerns
   - Ask follow-up questions for clarification
   - Request alternative implementations if needed

### Common Code Review Mistakes to Avoid

**Don't do these during code review:**

1. **Nitpicking Style Issues**
   - Use automated linters for style enforcement
   - Don't waste review time on formatting
   - Focus on substance over style

2. **Reviewing Too Quickly**
   - Take time to understand the changes
   - Test locally when possible
   - Don't just skim the diff

3. **Being Vague**
   - Point to specific lines with issues
   - Provide actionable feedback
   - Include examples or suggestions

4. **Blocking on Opinions**
   - Distinguish between objective issues and preferences
   - Accept that there are multiple valid approaches
   - Save strong opinions for architecture discussions

5. **Not Testing**
   - Always pull the branch and test locally for significant changes
   - Verify the fix actually solves the stated problem
   - Check for regressions

### Code Review Tools and Resources

1. **GitHub Features**
   - Use inline comments for specific issues
   - Use review comments for general feedback
   - Request changes for blocking issues
   - Use suggested changes for quick fixes
   - Add reaction emojis to acknowledge comments

2. **External Tools**
   - CodeClimate for code quality metrics
   - SonarQube for static analysis
   - Lighthouse for performance and accessibility
   - npm audit / Snyk for security scanning

3. **Documentation References**
   - Keep this copilot-instructions.md file handy
   - Reference CONTRIBUTING.md for workflow
   - Check README.md for project-specific context

## Additional Quality Standards

### Security Considerations

1. **Content Security Policy**
   - Review third-party scripts carefully
   - Current integrations: Google Analytics, Google Translate, Mixpanel, VWO, PostHog
   - Only add new third-party scripts if absolutely necessary
   - Use subresource integrity (SRI) for CDN resources when possible

2. **Data Privacy**
   - Link to privacy policy: `public/policy/privacy_policy.html`
   - Ensure GDPR compliance for EU visitors
   - Document cookie usage
   - Provide opt-out mechanisms for tracking

3. **External Links**
   - Use `rel="noopener noreferrer"` for external links
   - Verify external links periodically
   - Ensure links open in appropriate context

### Performance Optimization

1. **Asset Optimization**
   - Minify CSS and JavaScript files
   - Optimize images (compress, use appropriate formats)
   - Use CDN for common libraries (Bootstrap, Font Awesome)
   - Enable browser caching via HTTP headers

2. **Loading Strategy**
   - Load critical CSS inline or in `<head>`
   - Defer non-critical JavaScript
   - Use `async` or `defer` attributes appropriately
   - Already implemented: theme-toggle.js loads early to prevent flash

3. **Lighthouse Performance Targets**
   - Performance: 90+
   - Accessibility: 95+
   - Best Practices: 95+
   - SEO: 95+

### Maintenance and Updates

1. **Regular Reviews**
   - Review and update sitemap monthly
   - Check for broken links quarterly
   - Update dependencies regularly (npm, Python packages)
   - Monitor Lighthouse scores in CI/CD
   - Review robots.txt annually

2. **Content Updates**
   - Update `<lastmod>` in sitemap when content changes
   - Refresh Open Graph images if content changes significantly
   - Keep copyright year current in footer
   - Archive old content appropriately

3. **Documentation**
   - Update this file when adding new standards
   - Document any deviations from standards (with justification)
   - Keep README.md current with setup instructions
   - Update CONTRIBUTING.md with new guidelines

## Iterative Development Best Practices

**Follow these practices for efficient, high-quality development:**

### 1. Test-Driven Development (TDD)

When implementing new features:
1. Write a failing test first that describes the desired behavior
2. Write the minimum code necessary to make the test pass
3. Refactor the code while keeping tests green
4. Repeat for each new feature or behavior

Benefits:
- Ensures code is testable from the start
- Provides immediate feedback on correctness
- Creates a safety net for refactoring
- Documents expected behavior

### 2. Small, Incremental Changes

**ALWAYS prefer small, focused changes:**
- Make one logical change at a time
- Commit early and commit often
- Keep commits atomic (one concept per commit)
- Push frequently to avoid losing work
- Create draft PRs early for feedback

Example workflow:
```bash
# Make a small change
git add <file>
git commit -m "feat: add input validation for email field"
git push

# Get feedback, then continue with next small change
git add <file>
git commit -m "test: add tests for email validation"
git push
```

### 3. Continuous Integration Workflow

**Leverage CI/CD for fast feedback:**
1. Push code to trigger CI pipeline
2. Review CI results immediately
3. Fix any failures before continuing
4. Don't let CI failures accumulate
5. Keep the main branch green at all times

If CI fails:
- Fix it immediately or revert
- Don't push more changes on top of failures
- Investigate the root cause
- Update tests if behavior changed intentionally

### 4. Code Review Iteration

**Respond to code review feedback effectively:**
1. Address all comments before requesting re-review
2. Mark conversations as resolved after fixing
3. Push commits in response to feedback (don't force push unless necessary)
4. Respond to comments explaining your changes
5. Ask questions if feedback is unclear

When receiving feedback:
- Don't take criticism personally
- Ask for clarification if needed
- Explain your reasoning if you disagree (politely)
- Be open to learning and improving
- Thank reviewers for their time

### 5. Refactoring Safely

**When refactoring code:**
1. Ensure comprehensive test coverage before refactoring
2. Make small, incremental refactoring changes
3. Run tests after each change
4. Commit after each successful refactoring step
5. Keep functional changes separate from refactoring

Red-green-refactor cycle:
1. **Red**: Write a failing test
2. **Green**: Make it pass with minimal code
3. **Refactor**: Improve the code quality without changing behavior

### 6. Debugging Workflow

**When fixing bugs:**
1. Write a test that reproduces the bug first
2. Verify the test fails with the buggy code
3. Fix the bug
4. Verify the test passes
5. Check for similar bugs in related code
6. Document the fix in the commit message

### 7. Feature Flags for Large Changes

For significant features:
- Use feature flags to merge code before it's complete
- Deploy disabled features to production
- Enable progressively (beta users, then all users)
- Roll back instantly if issues occur
- Clean up flags after full rollout

## Effective Copilot Usage Guidelines

**Get the most out of GitHub Copilot:**

### 1. Writing Better Prompts

**Use clear, specific prompts in comments:**
```typescript
// Bad: Create a function
// Good: Create a function that validates email addresses using regex and returns true if valid

// Bad: Handle errors
// Good: Implement try-catch error handling that logs the error and returns a user-friendly message
```

**Provide context before the code:**
```typescript
/**
 * User authentication service
 * Handles login, logout, and session management
 * Uses JWT tokens stored in HTTP-only cookies
 */
class AuthService {
  // Copilot will generate better suggestions with this context
}
```

### 2. Leveraging Copilot Chat

**Ask Copilot Chat for:**
- Explanations of unfamiliar code
- Alternative implementations
- Potential bugs or security issues
- Test scenarios to consider
- Refactoring suggestions
- Documentation generation

Example Chat queries:
- "Explain what this function does and identify any edge cases"
- "What security vulnerabilities might exist in this authentication code?"
- "Suggest 5 test cases for this validation function"
- "How can I refactor this to improve performance?"

### 3. Code Review with Copilot

**Use Copilot during code review to:**
- Identify common bug patterns
- Spot security vulnerabilities
- Check for performance issues
- Suggest improvements
- Generate test cases

Always review Copilot's suggestions critically:
- Don't blindly accept all suggestions
- Verify suggestions are correct and appropriate
- Consider false positives
- Use human judgment for final decisions

### 4. Copilot for Documentation

**Generate documentation with Copilot:**
```typescript
// Highlight a function, ask Copilot: "Generate JSDoc comments for this function"
// Or start typing /** above a function and let Copilot complete it

/**
 * Copilot will generate:
 * - Function description
 * - @param descriptions
 * - @returns description
 * - @throws descriptions
 * - @example usage
 */
```

### 5. Learning from Copilot

**Copilot as a learning tool:**
- Study the suggestions Copilot makes
- Learn new APIs and patterns
- Discover built-in functions you didn't know about
- See different approaches to problems
- Ask "why" questions in Copilot Chat

### 6. When NOT to Use Copilot

**Situations where manual coding is better:**
- Security-critical code (review extra carefully)
- Complex business logic requiring deep understanding
- Code with specific regulatory compliance requirements
- When learning a new language or framework (type manually to learn)
- When Copilot repeatedly suggests incorrect code

### 7. Copilot Best Practices Summary

✅ **Do:**
- Use descriptive variable and function names
- Write clear comments explaining intent
- Break complex problems into smaller functions
- Review and test all Copilot suggestions
- Use Copilot to accelerate routine tasks
- Learn from Copilot's suggestions
- Provide feedback when suggestions are wrong

❌ **Don't:**
- Accept suggestions without understanding them
- Use Copilot-generated code without testing
- Rely on Copilot for security-critical decisions
- Ignore your own judgment and expertise
- Copy sensitive data into Copilot prompts
- Expect perfect code generation every time

## Copilot Instructions File Best Practices

**Maintaining this file:**

### Structure and Organization

1. **Keep it Focused**
   - This file should be under 10,000 lines (currently well within limit)
   - Break very large instruction sets into separate files if needed
   - Use clear headings and hierarchy
   - Keep related topics together

2. **Use Clear Formatting**
   - Use markdown headers (##, ###) for sections
   - Use bullet points for lists
   - Use code blocks for examples
   - Use bold for emphasis on critical points

3. **Be Specific and Actionable**
   - Write instructions as clear rules: "ALWAYS do X", "NEVER do Y"
   - Provide examples of good and bad patterns
   - Explain WHY, not just WHAT
   - Include code examples where helpful

4. **Update Regularly**
   - Add new patterns as they emerge
   - Remove outdated guidance
   - Refine based on how well Copilot follows instructions
   - Document lessons learned from code reviews

### Path-Specific Instructions (Advanced)

For path-specific instructions, create `[name].instructions.md` files:

```markdown
---
description: "Python-specific coding standards"
applyTo: "**/*.py"
---

# Python Coding Standards

- Use type hints for all function signatures
- Follow PEP 8 style guide
- Use dataclasses for data structures
- Prefer f-strings over .format()
```

### Agent-Specific Instructions

Use frontmatter to target specific Copilot agents:

```markdown
---
description: "Instructions for code review agent"
agents: ["code-review"]
---

# Code Review Focus Areas

Focus reviews on:
1. Security vulnerabilities
2. Logic errors
3. Performance issues

Ignore:
- Style preferences (handled by linters)
- Trivial formatting issues
```

### Testing Your Instructions

**Verify instructions are effective:**
1. Make changes and see how Copilot responds
2. Ask Copilot Chat if it's aware of your guidelines
3. Review generated code against your standards
4. Iterate and refine based on results
5. Document what works and what doesn't

### Example Custom Instructions for Common Scenarios

**For React/TypeScript projects:**
```markdown
## React Best Practices
- Use functional components only (no class components)
- Use hooks for state management
- Export named components (not default exports)
- Props interfaces should end with "Props"
- Use TypeScript strict mode
```

**For Node.js APIs:**
```markdown
## API Development Standards
- Use async/await (not callbacks or raw promises)
- Implement proper error handling middleware
- Validate all input with a validation library (e.g., Zod)
- Use HTTP status codes correctly
- Document endpoints with OpenAPI/Swagger
```

**For Security-Critical Code:**
```markdown
## Security Requirements
- Never log sensitive data (passwords, tokens, PII)
- Always validate and sanitize user input
- Use parameterized queries (never string concatenation)
- Implement rate limiting on public endpoints
- Use HTTPS only
```

## Resources and Further Reading

### Official GitHub Copilot Documentation
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Custom Instructions Guide](https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions)
- [Best Practices for Using GitHub Copilot](https://docs.github.com/en/copilot/get-started/best-practices)
- [Prompt Engineering for Copilot](https://docs.github.com/en/copilot/using-github-copilot/prompt-engineering-for-github-copilot)

### GitHub Blog Articles
- [5 Tips for Writing Better Custom Instructions](https://github.blog/ai-and-ml/github-copilot/5-tips-for-writing-better-custom-instructions-for-copilot/)
- [Mastering Copilot Code Review](https://github.blog/ai-and-ml/unlocking-the-full-power-of-copilot-code-review-master-your-instructions-files/)

### Community Resources
- [Copilot Craft - Complete Instructions Guide](https://www.copilotcraft.dev/blog/getting-started-github-copilot-instructions)
- [GitHub Copilot Patterns](https://patterns.hattmo.com/)

### Code Quality and Review
- [Google Engineering Practices - Code Review](https://google.github.io/eng-practices/review/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)

### Security Resources
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)

### Accessibility Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM Resources](https://webaim.org/resources/)

### Testing Resources
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Last Updated:** 2026-01-27

**Note:** This instruction file is continuously evolving. If you find sections that are outdated, unclear, or could be improved, please update them. The goal is to make this file as useful as possible for both human developers and AI assistants like GitHub Copilot.
