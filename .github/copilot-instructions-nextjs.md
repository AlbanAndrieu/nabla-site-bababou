# Copilot instructions — Next.js runtime

This repository is a **single root Next.js/Vercel project**. The `app/` directory is the App Router tree; it is not a standalone npm project.

## Runtime contract

- Next.js: **16.3.2** (App Router)
- React: **19.2.x**
- TypeScript: **5.x**
- Tailwind CSS: **4.x** through `@tailwindcss/postcss`
- i18n: `next-intl`, with first-class locales `fr`, `en`, `de`, `no`
- Default locale: French, unprefixed on migrated Next routes
- Deployment: Vercel Git integration; no local Vercel CLI dependency
- Analytics: `public/site-analytics.js` injects the Vercel platform endpoints and Datadog browser CDN integration; do not add duplicate React analytics SDK components

## Commands

Run commands from the repository root:

```bash
npm ci
npm run dev
npm run check
npm run build
npm run start
```

Before publication, use the canonical project gate documented in `AGENTS.md`:

```bash
bash scripts/quality-gate.sh
```

Keep package/build commands at the repository root. Do not treat `app/` as a nested npm project, do not expect a nested manifest, and do not introduce a manual local Vercel CLI deployment path.

## Project structure

```text
app/                    # Next.js App Router
components/             # Shared React components
i18n/                   # next-intl routing and message loading
messages/               # Localized runtime catalogs
lib/                    # Routing/SEO/content helpers
public/                 # Legacy static surfaces and shared assets
scripts/                # Build, privacy and repository tooling
unit-tests/              # Deterministic contract tests
tests/                   # Playwright E2E tests
next.config.mjs          # Next.js configuration
postcss.config.mjs       # Tailwind/PostCSS integration
package.json             # Single root manifest
```

## Hybrid migration rules

- Next.js/Vercel is the target runtime.
- Keep a legacy static page until its Next replacement has functional, visual, SEO, accessibility and E2E parity.
- Never create a second durable implementation of the same route.
- `public/404.html` is the protected reviewed 404 source consumed through `global-not-found`.
- The homepage `/` / `public/index.html` is owner-controlled. Do not change sensitive disclosures, pseudonymization or redaction there without explicit approval.
- Keep Google Translate complementary only; first-class canonical locales are handled by `next-intl`.

## App Router conventions

- Default to Server Components.
- Add `"use client"` only for hooks, browser APIs or client event handling.
- Use generated `PageProps<...>` route types where the project already does so.
- Use shared routing helpers for canonicals/alternates instead of rebuilding locale policy in page components.
- Keep route copy in the focused message domain rather than hardcoding translated UI strings.
- Reuse shared chrome, accessibility primitives and metadata helpers instead of duplicating header/footer/skip-link logic.

## Styling

- Tailwind is available through `app/globals.css` and `postcss.config.mjs`.
- Existing migrated pages also depend on versioned styles in `public/`; do not rewrite them wholesale merely to use Tailwind.
- Preserve light/dark behavior, responsive layout, print behavior and WCAG AA expectations.

## Analytics and observability

The application does **not** directly depend on these retired npm packages:

- `@vercel/analytics`
- `@vercel/speed-insights`
- `@vercel/otel`
- `@vercel/toolbar`
- `@datadog/browser-rum`

Vercel Web Analytics and Speed Insights use the platform scripts loaded by `public/site-analytics.js`. Datadog RUM is also browser-CDN based there. Do not re-add an npm SDK without a proven runtime consumer.

## Testing

For a focused change, run the closest relevant test first. The publication gate must retain:

- ESLint
- Stylelint
- Next route type generation
- TypeScript typecheck
- unit tests
- privacy gate
- `next build`
- Playwright Preview E2E for runtime/routing changes

Do not weaken or skip checks merely to make CI green.

## Next.js documentation

This project pins a current Next 16 release. Prefer the documentation shipped in the installed `next` package and the generated Next agent rules in `AGENTS.md` over assumptions from older Next.js versions.
