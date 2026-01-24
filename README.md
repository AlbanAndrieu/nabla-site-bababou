<!-- markdown-link-check-disable-next-line -->

# [![Nabla](https://nabla.albandrieu.com/assets/nabla/nabla-4.png)](https://github.com/AlbanAndrieu/nabla-site-bababou) nabla-site-bababou

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

# nabla-site-bababou

For Eléonore

Default nabla files for bababou website

## Features

### Multi-Language Support

The website now supports translation into multiple languages using Google Translate. Visitors can translate the entire website content into their preferred language using the translation widget located in the top-right corner of each page.

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

- Node.js >= 24.11.0
- npm >= 11.6.2
- pnpm ^10.22.0 (optional)
- Python 3.x (for the Python development server)

## Installation

```bash
# Install dependencies
npm install

# Or using pnpm
pnpm install
```

## Running the Site

### Development Server Options

**Option 1: Cloudflare Wrangler (Recommended)**
```bash
npm run start
# or
npm run dev
# or
wrangler dev
```

**Option 2: Python HTTP Server**
```bash
npm run start-python
# or
python -m http.server 8001
```

The site will be available at:
- Wrangler: `http://localhost:8787`
- Python: `http://localhost:8001`

## Deployment

### Vercel Deployment

```bash
# Preview deployment
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

## Development

### Linting

```bash
npm run lint
```

### Project Structure

```
nabla-site-bababou/
├── public/              # Static website files
│   ├── index.html       # Main page
│   ├── 404.html         # Error page
│   ├── arf.js           # ARF visualization
│   ├── arf.css          # ARF styles
│   ├── theme.css        # Theme styles
│   ├── theme-toggle.js  # Dark mode toggle
│   └── google-translate-config.js  # Translation config
├── my-app/              # Next.js application
├── api/                 # API functions
├── scripts/             # Utility scripts
├── .editorconfig        # Editor configuration
├── eslint.config.js     # ESLint configuration
├── package.json         # Project dependencies
├── vercel.json          # Vercel config
└── wrangler.jsonc       # Cloudflare config
```

## Contributing

The [issue tracker](https://github.com/AlbanAndrieu/nabla-site-bababou/issues) is the preferred channel for bug reports, features requests and submitting pull requests.

For pull requests, editor preferences are available in the [.editorconfig](.editorconfig) file for easy use in common text editors. Read more and download plugins at <http://editorconfig.org>.

## License

[MIT License](LICENSE)

---

Alban Andrieu [linkedin](https://fr.linkedin.com/in/nabla/)
