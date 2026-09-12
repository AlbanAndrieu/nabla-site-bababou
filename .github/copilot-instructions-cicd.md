# Copilot instructions — CI/CD

The repository uses GitHub Actions for validation and Vercel Git Integration for deployment.

## Current workflows

The files under `.github/workflows/` are authoritative. The current set is:

- `ci.yml` — canonical quality/security gate, including the Next.js build and CI performance summary;
- `vercel-preview.yml` — creates/removes explicit `vercel-preview-pr-*` checkpoint branches for on-demand Preview deployments;
- `playwright.yml` — browser validation, including exact Vercel Preview E2E through repository dispatch;
- `release.yml` — semantic-release after successful current-`master` Quality validation; release packages are fetched ephemerally there and stay out of the normal application lock graph;
- `docker-build.yml` — Docker validation;
- `copilot-setup-steps.yml` — Copilot environment bootstrap.

MegaLinter is intentionally not a GitHub workflow: `.mega-linter.yml` remains only for the `.gitlab-ci.yml` fallback. Do not restore a duplicate GitHub MegaLinter job without proving a validation gap in the canonical Quality/pre-commit path.

## Runtime

- Node.js major: **24 LTS** (24.21.0 baseline); Node 25 is EOL and must not be reintroduced.
- npm: **>=11.17.0 <12**; install scripts are governed by the repository `allowScripts` policy.
- Run Node/npm commands from the repository root.
- `package.json` and `package-lock.json` at the root are the only application npm manifests.
- Vercel deployments come from Git Integration. Only `master` and `vercel-preview-*` refs auto-deploy; normal PR branches require the on-demand checkpoint workflow. Do not add a local Vercel CLI deployment workflow unless the project deliberately changes that architecture.

## Validation

Before publication, the canonical local gate is:

```bash
mise run hooks
bash scripts/quality-gate.sh
```

In GitHub Actions, `ci.yml` must preserve the equivalent lint, typecheck, unit, privacy and `next build` coverage. Runtime/routing changes also require the exact deployed Vercel Preview and its Playwright run.

## Workflow changes

When editing Actions:

1. use least-privilege permissions;
2. pin every remote action to an immutable reviewed commit SHA;
3. use repository/environment secrets only when a versioned step consumes them;
4. never print secrets or sensitive values;
5. avoid duplicate builds or duplicate Playwright paths;
6. use path filtering/ignore policy only when it cannot hide runtime-relevant changes;
7. keep Node/npm versions aligned with `package.json`;
8. update unit workflow-contract tests when the event model changes.
9. keep `.npmrc` in Quality path filters and review any dependency install script before changing `allowScripts`; never use `dangerously-allow-all-scripts`.

## Deployment boundary

GitHub Actions validates the project. Vercel deploys it.

Do not add deployment tokens, manual CLI wrappers, or a second build root merely to work around a failing Preview. Diagnose the Vercel build/runtime/configuration instead.

Wrangler is retired; Vercel Git Integration is the only versioned web deployment path.
