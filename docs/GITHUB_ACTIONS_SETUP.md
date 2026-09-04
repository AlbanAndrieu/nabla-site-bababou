# GitHub Actions setup

GitHub Actions is the repository validation layer; Vercel's Git integration is the deployment layer.

## Current contract

The exact workflow set evolves, so `.github/workflows/` is authoritative. Core responsibilities include:

- canonical quality/security checks;
- Next.js build validation;
- Playwright end-to-end testing;
- exact Vercel Preview Playwright validation;
- release/tooling workflows where configured.

Do not document a second `app/` npm project or a separate GitHub-driven Vercel deployment path unless the repository actually adopts one.

## Local equivalent

From the repository root:

```bash
npm ci
bash scripts/quality-gate.sh
```

The quality gate is the source of truth before publication. Do not weaken individual checks to compensate for CI failures.

## Vercel deployment

Production and Preview deployments normally come from the Vercel Git integration attached to this repository.

GitHub Actions therefore does **not** need Vercel deployment secrets for the normal project workflow. The Preview E2E workflow consumes deployment events/metadata and validates the exact deployed SHA; it is not a deployment replacement.

## GitHub secrets

Only configure secrets that are consumed by a versioned workflow. Before adding a new secret:

1. identify the workflow and step that reads it;
2. document why it is required;
3. scope it to the minimum privilege and environment;
4. avoid echoing it in logs;
5. remove it when the consuming workflow is retired.

Do not add Vercel CLI credentials pre-emptively: the local CLI and its npm wrappers were intentionally removed when Git integration was confirmed as the deployment mechanism.

## Vercel Preview E2E

For runtime changes, validation should prove all three layers:

1. GitHub quality workflow passed for the commit;
2. Vercel reports a `READY` deployment for that exact SHA;
3. Preview Playwright passed against that exact deployment URL.

If the Preview is intentionally skipped by `scripts/vercel-ignore-build.sh`, no deployment validation is expected for that docs/repository-maintenance-only commit.

## Security

- never commit credentials, tokens or `.vercel/` metadata;
- prefer repository/environment secret scopes over broad account credentials;
- rotate credentials that still have an active consumer;
- delete obsolete secrets after their workflow is removed;
- treat workflow logs and uploaded artifacts as potential disclosure surfaces.

## Troubleshooting

When CI fails, inspect progressively:

1. workflow/status;
2. failing job;
3. failing step;
4. relevant log excerpt or artifact;
5. only then broaden the investigation.

When Vercel fails while GitHub CI passes, inspect Vercel build/runtime logs and project configuration rather than adding CLI deployment logic to Actions.
