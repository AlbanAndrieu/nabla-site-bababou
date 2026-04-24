<!-- markdown-link-check-disable-next-line -->

# [![Nabla](https://nabla.albandrieu.com/assets/nabla/nabla-4.png)](https://github.com/AlbanAndrieu/nabla-site-bababou) nabla-site-bababou

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)

For Eléonore - Default nabla files for bababou website

## Features

### Multi-Language Support

The website supports translation into multiple languages using Google Translate. Visitors can translate the entire website content into their preferred language using the translation widget located in the top-right corner of each page.

**Supported Languages Include:**
- English (default)
- French (Français)
- Norwegian (Norsk)
- German (Deutsch)
- Spanish (Español)
- Italian (Italiano)
- Portuguese (Português)
- Dutch (Nederlands)
- Swedish (Svenska)
- Danish (Dansk)
- Finnish (Suomi)
- Polish (Polski)
- Czech (Čeština)
- Russian (Русский)
- Arabic (العربية)
- Japanese (日本語)
- Chinese Simplified (简体中文)

The translation feature is available on all pages including:
- Main index page
- Privacy Policy
- Terms of Service
- 404 Error page

### Dark Mode Support

The website includes a theme toggle feature that allows users to switch between light and dark modes. The preference is persisted across sessions.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 24.11.0
- **npm** >= 11.6.2
- **pnpm** ^10.22.0 (optional, for pnpm workspace features)
- **Python** 3.12 (for local development server)

You can check your versions with:
```bash
node --version
npm --version
python --version
```

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/AlbanAndrieu/nabla-site-bababou.git
cd nabla-site-bababou

# Install dependencies (REQUIRED before any build/start)
npm install

# For the Next.js application
cd app && npm install
```

The postinstall script automatically copies necessary assets to the correct locations.

## Development

### Running the Site Locally

**Static Site (Root Project):**

Using Cloudflare Workers (recommended):
```bash
npm run start
# or
npm run dev
# or
wrangler dev
```

Using Python HTTP server (alternative):
```bash
npm run start-python
# or
python -m http.server 8001
```

The site will be available at:
- Wrangler: `http://localhost:8787`
- Python: `http://localhost:8001`

**Next.js application (`app/`):**
```bash
cd app
npm run dev
# Opens at http://localhost:3000 — serves the same static tree as `public/` (symlinked into the Next app).
```

### Linting

Always run linting before committing code:

```bash
# Root project
npm run lint

# Next.js app
cd app && npm run lint
```

### Testing

The project uses Playwright for end-to-end testing:

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

**Test Coverage:**
- Homepage functionality and content
- 404 error page
- Dark/light theme toggle
- Google Translate widget
- Accessibility features (ARIA labels, keyboard navigation, etc.)
- Responsive design on mobile and desktop

Tests run automatically on pull requests via GitHub Actions.

### Building

**Next.js application:**
```bash
cd app
npm run build
```

**Note:** The canonical static site lives in the repository `public/` folder. The Next app uses `app/public` → `../public` so Vercel can run Next while URLs match the static layout. The root project can still serve files directly from `public/` (for example Wrangler) without a Next build.

## Deployment

### Vercel Deployment

```bash
# Preview deployment
vercel dev
vercel deploy

# Production deployment
vercel --prod
```

### Cloudflare Workers

```bash
npm run deploy
# or
wrangler deploy
```

## Project Structure

```
nabla-site-bababou/
├── public/              # Static website files
│   ├── index.html       # Main page
│   ├── 404.html         # Error page
│   ├── arf.js           # ARF visualization
│   ├── arf.css          # ARF styles
│   ├── theme.css        # Theme styles
│   ├── theme-toggle.js  # Dark mode toggle
│   ├── site-google-translate.js   # Google Translate widget loader
│   └── policy/          # Legal documents
├── app/                 # Next.js application (public → ../public)
│   ├── app/             # Next.js App Router
│   └── package.json     # Next.js dependencies
├── api/                 # API functions
├── tests/               # Playwright end-to-end tests
├── .github/             # GitHub workflows and configurations
│   └── workflows/
│       ├── playwright.yml    # Playwright test workflow
│       └── opencommit.yml    # OpenCommit workflow
├── package.json         # Root package configuration
├── playwright.config.ts # Playwright test configuration
├── vercel.json          # Vercel deployment config
└── wrangler.jsonc       # Cloudflare Workers config
```

## Continuous Integration

The project uses GitHub Actions for continuous integration:

### Playwright Tests Workflow
- **Trigger**: Push to main branches, pull requests, or manual dispatch
- **Actions**: Runs all Playwright end-to-end tests
- **Artifacts**: Uploads test reports and results for 30 days
- **Browser**: Runs tests on Chromium, Firefox, WebKit, and mobile viewports

View workflow status in the [Actions tab](https://github.com/AlbanAndrieu/nabla-site-bababou/actions).


## Code Quality

The project uses extensive linting and pre-commit hooks:

- **ESLint** for JavaScript/TypeScript
- **MegaLinter** for multi-language linting
- **Pre-commit hooks** for automated validation

To install pre-commit hooks:
```bash
pre-commit install
```

## Contributing

The [issue tracker](https://github.com/AlbanAndrieu/nabla-site-bababou/issues) is the preferred channel for bug reports, features requests and submitting pull requests.

For pull requests, editor preferences are available in the [.editorconfig](.editorconfig) file for easy use in common text editors. Read more and download plugins at <http://editorconfig.org>.

### Commit Message Format

This project uses conventional commits with emoji support. Valid commit types:
- `feat`, `feature` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Build system changes
- `ci` - CI/CD changes
- `chore` - Other changes

Example:
```bash
feat: add new feature
fix(scope): fix bug in component
🛠️  build: update dependencies
```

## License

[Apache License 2.0](LICENSE)

---

Alban Andrieu [linkedin](https://fr.linkedin.com/in/nabla/)
