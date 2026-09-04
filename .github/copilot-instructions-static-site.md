# Copilot instructions — legacy static surfaces

Follow `/AGENTS.md` as the canonical repository policy.

- `public/**` contains shared assets plus legacy HTML retained during the incremental Next.js migration.
- Next.js/Vercel is the target runtime. Use `npm run dev` for normal development; `npm run start-python` is only for focused static-file audits.
- Do not restore the retired local Vercel CLI. Preview/production deployment belongs to Vercel Git Integration and the repository checkpoint workflow.
- Keep a legacy page until its Next replacement has functional, visual, SEO, accessibility and E2E parity.
- `public/404.html` is a protected reviewed source consumed by `global-not-found`; do not redesign or replace it casually.
- `public/index.html` / the homepage is owner-controlled. Follow the disclosure/privacy rules in `AGENTS.md` before editing it.
- First-class locales are handled by `next-intl`; Google Translate is complementary for other languages.
- Preserve existing theme, print, responsive and page-chrome contracts when touching a retained static page.
- Update routing/SEO assets only when the corresponding published surface actually changes.
