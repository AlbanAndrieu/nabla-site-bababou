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
