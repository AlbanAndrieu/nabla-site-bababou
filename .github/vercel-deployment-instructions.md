# Vercel deployment contract

Bababou is one root **Next.js** project deployed through Vercel Git Integration.

## Source of truth

- repository root = Vercel project root;
- `vercel.json` owns framework/build-ignore integration;
- `package.json` owns install/build/start scripts;
- `scripts/vercel-ignore-build.sh` decides whether a Git event needs a Vercel build;
- only `master` and dedicated `vercel-preview-*` checkpoint refs are deployment branches;
- `docs/operations.md` is the runbook for validation and incident diagnosis.

There is no standalone `app/` npm project and no repository-owned Vercel CLI deployment path.

## Pull-request Preview flow

For a deploy-relevant PR:

1. local validation converges and the PR is committed;
2. Quality classifies `preview_required=true` and validates the exact PR SHA;
3. after successful Quality, `ci.yml` automatically publishes
   `vercel-preview-pr-<number>` at that exact SHA;
4. Vercel Git Integration deploys the checkpoint;
5. Playwright/ZAP validate the exact deployed SHA before merge.

`Vercel Preview (On Demand)` remains an operator fallback/recovery workflow. It is not the
normal path and must validate successful Quality evidence for the same PR SHA before publishing
a checkpoint.

Documentation/maintenance changes may skip Preview. A dedicated `vercel-preview-*` checkpoint
always builds so the deployed artifact corresponds to the validated SHA. Closing a PR removes
its checkpoint branch.

## Production

`master` is the production branch. Validate application deployment and domain binding
separately; a healthy Preview does not prove that `bababou.com` is attached correctly.

For routing/build changes, review together:

- `vercel.json`;
- `next.config.mjs`;
- `proxy.ts`;
- `scripts/vercel-ignore-build.sh`;
- relevant unit contracts;
- exact-SHA Preview evidence.

## Failure handling

- **Preview missing**: verify canonical scope, successful exact-SHA Quality, checkpoint ref,
  then Vercel deployment registration; a Git ref alone is not deployment proof.
- **Build failure**: inspect Vercel build logs and reproduce with repository-root
  `npm run check` / `npm run build`.
- **Preview READY but E2E fails**: inspect the exact URL/SHA and Playwright/ZAP evidence before
  changing routing or protection bypass.
- **Protection challenge**: follow the Vercel checkpoint/bypass signatures in
  `docs/operations.md`.

Do not add Vercel deployment credentials, manual CLI wrappers or a second project root merely
to work around Preview failures.
