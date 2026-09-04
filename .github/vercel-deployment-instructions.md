# Vercel deployment contract

Bababou is a **single root Next.js project** deployed through Vercel's Git integration.

## Source of truth

- Repository root is the project root.
- `vercel.json` selects the Next.js framework and the build-ignore policy.
- `package.json` owns install/build/start scripts.
- `scripts/vercel-ignore-build.sh` decides whether a Git commit needs a Vercel build.
- Vercel Preview deployments are created from pull-request commits that affect runtime/deployment content.
- Production deployments follow the connected `master` branch.

There is no standalone `app/` npm project and no repository-owned Vercel CLI dependency.

## Normal deployment workflow

1. Create a focused branch and pull request.
2. Run the canonical repository quality gate.
3. Let the Vercel Git integration create the Preview when the change is deploy-relevant.
4. Validate the **exact deployed SHA** with the Preview Playwright workflow.
5. Merge only after the required GitHub/Vercel/Preview gates are green.

Documentation-only or repository-maintenance commits may be intentionally skipped by `scripts/vercel-ignore-build.sh`.

## Local development

Run from the repository root:

```bash
npm ci
npm run dev
npm run check
npm run build
npm run start
```

The application normally uses port 3000 for local Next development/testing.

## Project configuration

The current `vercel.json` is intentionally small. Do not reintroduce an `app` root directory, manual CLI wrappers, or a second deployment project merely because older documentation described that architecture.

When changing routing or build behavior, validate together:

- `vercel.json`
- `next.config.mjs`
- `proxy.ts`
- `scripts/vercel-ignore-build.sh`
- unit routing/build-policy contracts
- exact Preview Playwright results

## Environment variables and secrets

Manage deployment secrets in the Vercel project settings. Do not commit credentials or `.vercel/` local metadata.

GitHub Actions does not require Vercel deployment credentials for the normal Git-integrated flow. Introduce deployment credentials only if the repository deliberately adopts a custom deployment workflow in the future.

## Preview validation

For runtime, routing, locale, SEO or asset changes:

- confirm the Vercel deployment reached `READY`;
- confirm the deployment metadata references the intended Git SHA;
- run/inspect the Preview Playwright workflow for that SHA;
- use deployment build/runtime logs when a Preview fails;
- do not treat an older successful Preview as proof for a newer commit.

## Build-rate hygiene

The project uses the Vercel Hobby plan, so unnecessary Preview fan-out matters.

- API-only agents should publish multi-file changes as one atomic Git commit.
- Keep documentation-only changes eligible for the ignore-build policy.
- Avoid making a sequence of remote file commits on a Vercel-connected branch.
- Do not add a second build solely to collect metrics already emitted by CI.

## Production/domain checks

The application runtime and DNS/domain binding are separate concerns. When validating production, check both the deployed application and the Vercel project domain attachment. A healthy Preview does not by itself prove that `bababou.com` is bound to the project.

## Troubleshooting

### Vercel build failure

1. inspect the deployment build log;
2. reproduce with `npm run check` / `npm run build` from the repository root;
3. verify Node/npm versions match `package.json` engines;
4. inspect only the routing/configuration files relevant to the failure.

### Preview missing

1. check whether `scripts/vercel-ignore-build.sh` intentionally skipped the commit;
2. confirm the Git integration still points to this repository/project;
3. inspect Vercel project status and build-rate limits.

### Preview succeeds but E2E fails

Use the Preview workflow's exact URL and SHA, then inspect Playwright traces/screenshots before changing routing or protection-bypass behavior.

## Analytics

Vercel Web Analytics and Speed Insights are platform integrations loaded through `public/site-analytics.js`; the application does not require local Vercel analytics SDK packages.

## Support

For project-specific questions or public site contact, use `aa@bababou.com`. Keep retired personal/site addresses out of support documentation.

## Related files

- `AGENTS.md`
- `docs/roadmap.md`
- `docs/GITHUB_ACTIONS_SETUP.md`
- `docs/getting-started-speed-insights.md`
- `vercel.json`
- `scripts/vercel-ignore-build.sh`
