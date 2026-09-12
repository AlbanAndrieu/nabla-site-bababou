# Copilot instructions — Next.js

Use `/AGENTS.md` as the canonical repository policy.

## Current application

- App Router lives at repository-root `app/`; there is no nested application package.
- Next.js 16.3.4 / React 19 / TypeScript / `next-intl`.
- Node.js local/CI is pinned to `24.21.0`; package engine stays `>=24.11.0 <26` so Vercel can use its supported Node 24.x runtime; npm is `>=11.17.0 <12`.
- First-class locales: `fr`, `en`, `de`, `no`; French is the unprefixed default on migrated routes.
- Vercel Git Integration owns deployment; no local Vercel CLI dependency or wrapper is expected.
- Ordinary PR branches do not auto-deploy. Runtime validation uses an explicit `vercel-preview-pr-*` checkpoint after Quality succeeds.
- Browser analytics are loaded by `public/site-analytics.js`; do not restore retired Vercel/Datadog npm SDKs without a proven runtime consumer.

## Bababou hybrid invariants

- Keep legacy `public/**` pages/assets until their Next replacements reach functional, visual, SEO, accessibility and E2E parity.
- `public/404.html` is the protected reviewed 404 source consumed by `global-not-found`.
- The homepage `/` / `public/index.html` is owner-controlled; do not change sensitive disclosure, pseudonymization or redaction without explicit approval.
- Google Translate remains complementary; canonical first-class locale routing belongs to `next-intl`.

## Commands

```bash
npm ci
npm run check
npm run build
npm test
```

Use the canonical publication gate from `AGENTS.md` and the installed Next.js documentation/agent rules before changing Next 16 behavior.
