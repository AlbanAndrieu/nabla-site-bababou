# VS Code Copilot instructions — nabla-site-bababou

Follow `/AGENTS.md` as the canonical repository policy.

- Runtime: Next.js 16 / React 19 / TypeScript from the repository root.
- Node.js: `>=25.9.0 <26`; npm: `>=11.17.0 <12`.
- First-class locales are `fr`, `en`, `de`, `no`; French is the unprefixed default for migrated routes.
- Vercel deployment uses Git Integration; the local Vercel CLI is retired. OpenCommit remains available through `npm run oco` / `npm run opencommit`.
- Ordinary PR branches do not auto-deploy; use the validated `vercel-preview-pr-*` checkpoint workflow for runtime Preview validation.
- `public/**` still contains hybrid runtime content. Keep a legacy page until Next parity is proven.
- `public/404.html` is the protected 404 source. Homepage disclosure/privacy rules are defined in `AGENTS.md`; do not override them here.
- Never mutate `master` directly; use a branch, validate it, then integrate through a pull request.
