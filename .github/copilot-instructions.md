# Copilot Instructions for nabla-site-bababou

## Repository Overview

This is the nabla-site-bababou repository, a static website project for "bababou" created for Eléonore. The repository contains:

- A static website in the `public/` directory
- A Next.js application in the `my-app/` directory
- Cloudflare Workers configuration for deployment
- Vercel deployment configuration

**Languages & Technologies:**
- JavaScript/TypeScript (Node.js v24.11.0+, npm v11.6.2+, pnpm v10.22.0+)
- Python 3.12 (for local development server and linting tools)
- Next.js 16.0.7 with React 19.2.0
- Cloudflare Workers (wrangler)
- Vercel deployment platform

## Project Structure

### Root Directory Files
- `package.json` - Root package configuration with build scripts and dependencies
- `vercel.json` - Vercel deployment configuration (output: `public/`)
- `wrangler.jsonc` - Cloudflare Workers configuration (assets: `./public`)
- `eslint.config.js` - ESLint configuration for the project
- `commitlint.config.ts` - Commitlint configuration with emoji support

### Key Directories
- `public/` - Static assets directory served by Cloudflare/Vercel (HTML, CSS, JS, JSON)
- `my-app/` - Next.js application (separate package with its own package.json)
- `api/` - API functions (contains `hello.js`)
- `scripts/` - Utility scripts (e.g., `run-wicked.sh`)
- `.github/workflows/` - CI/CD workflows (OpenCommit action)

### Configuration Files
- `.mega-linter.yml` - MegaLinter configuration (comprehensive multi-language linter)
- `.pre-commit-config.yaml` - Pre-commit hooks configuration (extensive validation)
- `.yamllint` - YAML linting configuration
- `.ansible-lint` - Ansible linting configuration
- `Pipfile` - Python dependencies (ansible-lint, gitlint)
- `pnpm-workspace.yaml` - PNPM workspace configuration

## Build & Development Commands

### Installation & Setup
**ALWAYS run installation before building or running:**
```bash
# Install root dependencies (REQUIRED before any build/start)
pnpm install
# OR
npm install

# For my-app Next.js project
cd my-app && pnpm install
```

The postinstall script automatically:
- Copies d3.min.js to index/dist/scripts/d3
- Copies arf.js to dist/scripts/
- Copies resources/*.json to dist/resources
- Copies index.html and wireframe.css to dist/

### Development Servers

**Root Project (Static Site):**
```bash
# Cloudflare Workers dev server (primary method)
npm run start
# OR
npm run dev
# OR
wrangler dev

# Simple Python HTTP server (alternative)
npm run start-python
# OR
python -m http.server 8001
```

**Next.js App (my-app/):**
```bash
cd my-app
npm run dev
# Opens at http://localhost:3000
```

### Linting
**ALWAYS run linting before committing code:**
```bash
# Root project ESLint
npm run lint

# my-app ESLint
cd my-app && npm run lint
```

The project has extensive pre-commit hooks configured in `.pre-commit-config.yaml` that run automatically on commit, including:
- File format checks (trailing whitespace, end-of-file, line endings)
- Code quality (ESLint, Ruff for Python, shellcheck for bash)
- Security checks (gitleaks, bandit, detect-private-key)
- YAML/JSON/TOML validation
- HTML and markdown linting

### Building

**Next.js App:**
```bash
cd my-app
npm run build
```

**Note:** The root project does not have a separate build step as it serves static files directly from `public/`.

### Deployment

**Vercel Deployment:**
```bash
vercel deploy        # Preview deployment
vercel --prod        # Production deployment
```

**Cloudflare Workers:**
```bash
npm run deploy
# OR
wrangler deploy
```

## CI/CD & Validation

### GitHub Workflows
- `.github/workflows/opencommit.yml` - OpenCommit action for automated commit message generation (runs on all branches except main/master/dev/development/release)

### Pre-commit Hooks
The repository uses extensive pre-commit hooks. To install them:
```bash
pre-commit install
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
- Node.js >= 24.11.0
- npm >= 11.6.2
- pnpm ^10.22.0

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
The project uses commitlint with conventional commits and emoji support. Valid commit types:
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
- `my-app/node_modules/`, `my-app/.next/`, `.vercel/`, `.cache/`, `.pnpm/`
- `public/**/*.min.js`, `public/d3.v3.min.js`, `public/index.js`, `public/arf.js`
- `api/**`, `index/**`

### Common Issues & Workarounds

1. **Always install dependencies first** - The postinstall script is critical for setting up the project correctly
2. **Use pnpm** - This project is configured for pnpm workspaces
3. **Python server timeout** - If using Python HTTP server, it may be slower than Cloudflare Workers dev server
4. **Pre-commit hooks may be slow** - Some hooks (like mega-linter, ansible-lint) are disabled in `.pre-commit-config.yaml` because they're too slow
5. **Large files excluded** - Several large files are excluded from git (see `.pre-commit-config.yaml` check-added-large-files)

### Shell Script Notes
The `scripts/run-wicked.sh` script is excluded from some linting checks (bashate, shell-lint) due to specific code patterns.

## Validation Steps

Before submitting a PR:
1. Run `pnpm install` to ensure dependencies are up to date
2. Run `npm run lint` to check for linting errors
3. For Next.js changes: `cd my-app && npm run build` to verify builds successfully
4. Test locally with `npm run start` (Cloudflare) or `npm run start-python` (Python server)
5. Verify pre-commit hooks pass (if installed)

## Key Resources & Documentation

- Repository: https://github.com/AlbanAndrieu/nabla-site-bababou
- Issue Tracker: https://github.com/AlbanAndrieu/nabla-site-bababou/issues
- License: Apache v2
- Vercel deployment: Configured via `vercel.json`
- Cloudflare Workers: Configured via `wrangler.jsonc`

## Search Guidance

When exploring the codebase:
- Static site files: Look in `public/` directory
- Next.js app: Look in `my-app/` directory
- API endpoints: Look in `api/` directory
- Build configurations: Check root-level config files (package.json, vercel.json, wrangler.jsonc)
- Linting configs: Check `.eslintrc`, `.mega-linter.yml`, `.pre-commit-config.yaml`
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
