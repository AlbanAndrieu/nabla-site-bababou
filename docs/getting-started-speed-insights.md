# Vercel Speed Insights — project integration

This repository does **not** use the `@vercel/speed-insights` npm package or a
local Vercel CLI dependency.

## Runtime contract

`public/site-analytics.js` owns the browser integration and loads the Vercel
platform endpoints directly when remote analytics are enabled:

```text
/_vercel/insights/script.js
/_vercel/speed-insights/script.js
```

The same helper keeps these remote scripts disabled on ordinary localhost runs
unless the existing project override is explicitly enabled.

The browser contract is covered by `tests/site-analytics.spec.ts`; do not add a
second React component or duplicate script injection in the App Router layout.

## Deployment

Vercel deployments come from the repository's Git integration. The local
application dependency graph does not need the Vercel CLI.

For the current project:

1. enable Web Analytics / Speed Insights in the Vercel project settings;
2. deploy through the connected Git branch or pull request;
3. verify the Preview contains the two `/_vercel/` scripts;
4. verify data in the Vercel dashboard after traffic reaches the deployment.

## Privacy

Keep analytics behavior aligned with the site's consent and privacy policy.
Additional marketing/observability integrations must not be enabled merely to
replace an npm package removed for being unused.
