# Public assets and legacy pages

`public/` is the static asset directory of the repository-root **Next.js** application.

It contains shared CSS, browser scripts, images and a shrinking set of legacy HTML documents that remain available while their Next.js replacements are validated.

## Runtime contract

- Vercel Git Integration deploys the repository-root Next.js application.
- `public/` is served by Next.js/Vercel as static assets; it is **not** a separate deployment target or document-root application.
- Wrangler/Cloudflare Workers deployment configuration is intentionally absent.
- `npm run start-python` is only a local static-asset/legacy-page diagnostic helper.
- `public/404.html` is the protected rendering source for the global 404 exception documented in `AGENTS.md`.
- `public/index.html` is the owner-controlled homepage fallback while the homepage migration remains incomplete.

## Migration rule

New application pages belong under the repository-root `app/` tree, not as new standalone HTML files in `public/`.

Do not remove an existing legacy page solely because a Next.js route exists. First prove the required content, behavior, visual, SEO/metadata, accessibility and route-test parity, subject to the explicit homepage and protected-404 exceptions in `AGENTS.md`.
