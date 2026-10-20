---
name: quality-follow-up
description: >-
  Mandatory Bababou completion and post-merge quality recovery. Use after
  CI/quality failures, after a PR was merged while a non-blocking check was red,
  and before declaring repository work complete.
---
# Quality follow-up and completion accounting

Use this skill whenever a quality/security gate fails, a formatter or linter
changes files in CI, a PR was merged despite a red/non-blocking check, or an
agent is about to report repository work complete.

This skill complements `/AGENTS.md`; it never weakens the repository quality,
privacy, security, protected-404, legacy-parity or default-branch rules.

## Merge is not proof of quality

A merged PR is an integration event, not evidence that its checks passed. When a
maintainer merges while `CI (Quality and Security)` or another relevant check is
red, treat the failure as unresolved work until it is either corrected in a
follow-up PR or explicitly represented by an unchecked item in
`docs/roadmap.md`.

Never rewrite history or mutate `master` directly to hide a post-merge failure.

## Post-merge follow-up protocol

When recovering a merged PR with a failed quality gate:

1. Read the merged PR, its final head SHA, the resulting `master` SHA and the
   failing workflow/job/step. Do not infer the failure from the merge state.
2. Classify the failure before editing:
   - **deterministic mutation**: formatter/linter/pre-commit changed files;
   - **deterministic validation**: lint/type/unit/security/configuration failed
     without producing a fix;
   - **runtime/deployment regression**: build, Preview, Playwright, ZAP or
     production evidence failed;
   - **transient infrastructure**: runner/cache/provider failure with evidence
     that application code was not the cause.
3. For deterministic formatter/linter mutations, use the exact diff emitted by
   the failed gate as the starting evidence. Create or reuse a dedicated
   non-default follow-up branch based on the current `master`; do not resurrect
   the old pre-merge base.
4. Run deterministic fixes until they converge, review/commit them, then run one
   strict publication pass:

   ```bash
   npm run quality:agent:fix
   # Review the resulting diff and commit it.
   npm run quality:agent:publish
   ```

   `quality:agent:fix` may need several formatter passes. The Bababou wrapper
   retries only while file contents are actually changing and stops immediately
   when a failing pass produces no deterministic change. A successful strict
   gate records an exact local proof; the pre-push `--publish` hook reuses that
   proof instead of rebuilding when HEAD/base/toolchain are unchanged.
5. Fix deterministic validation/runtime failures at their cause. Do not weaken,
   skip, downgrade or remove a rule simply because the predecessor PR was
   already merged.
6. Link the predecessor PR and failed workflow in the follow-up PR description.
   A useful title is `fix(ci): close post-<PR> quality gap` when the scope is
   primarily quality recovery.
7. Re-run authoritative CI on the follow-up head and inspect the final status.
   If a deployment-relevant change is involved, preserve the exact-SHA
   Vercel/Playwright/ZAP validation flow.

A transient infrastructure failure may be retried when the logs support that
classification. A retry is not a substitute for fixing a deterministic failure.

## API-only agents

An API-only agent that cannot execute the local quality gate must not claim that
`quality:agent:fix`, `quality:agent` or `quality:agent:publish` passed.

For a deterministic CI mutation, it may apply the exact formatter/linter diff
reported by CI to a non-default branch, preferably as one atomic commit, then use
remote CI as the authoritative validation. It must state the local-execution
limitation and inspect the resulting CI immediately.

Keep API-driven iterative PRs draft while assembling the patch so Quality stays
on its Git-only preflight. Move to ready only at the publication checkpoint;
maintenance-only changes then use the lightweight remote gate while
runtime/source changes retain the full build/security path.

## Automated GitHub issues: verified closure only

The `post-merge-quality-follow-up.yml` workflow (not an agent skill) creates
`[quality-follow-up]` issues as `github-actions[bot]` when Quality fails on
the **current** `master`. A successful follow-up *workflow job* merely means
the diagnosis ran; it **does not** prove its remediation succeeded. Inspect
its `Deterministic diff / Strict validation / Remediation PR` comment and
the original failed job before classifying the issue.

For issue cleanup: group duplicates by **verified root cause**; close a historical
issue only when a traceable merged fix and a relevant passing `master` gate
demonstrate that the specific failure no longer reproduces. Link the fixing
commit and passing run in the closing comment. Never close merely because
another PR is green, the issue is old, or the bot ran successfully. If proof
is incomplete, leave the issue open and record the **minimum diagnostic
signature and next action** in `docs/operations.md`; avoid creating an
additional issue for the same failure. Do not downgrade quality/security
checks or silently delete the only incident evidence.

## Completion rule — mandatory

Before declaring any repository task complete, account for every requested or
discovered item.

If anything remains unfinished because of time, an upstream dependency, a
non-blocking failed check, missing credentials, unavailable infrastructure,
deferred refactoring, a security warning that still requires triage, or work
intentionally postponed to another PR:

1. add an unchecked item to `docs/roadmap.md`;
2. describe the blocker/dependency and the next concrete validation or action;
3. update an existing roadmap item instead of creating a duplicate when it
   already captures the same residual work;
4. never leave the only durable record in chat, a scratchpad, CI logs, an
   ephemeral artifact or a PR comment;
5. do not mark an upstream/unmerged capability as implemented;
6. do not say the work is "done", "complete", "finished" or equivalent while an
   untracked residual remains.

A failed check on a PR that was merged anyway is itself a residual. It must be
fixed by a follow-up or recorded in the roadmap before the agent can close out
the work.

## Completion evidence

A repository task can be reported complete only when:

- the requested change is present on the working PR/branch;
- deterministic fix passes have converged;
- the relevant local or authoritative remote gates agree with the final SHA;
- deployment/runtime evidence required by the change agrees with that SHA; and
- every remaining risk, warning, deferred item or dependency is represented by
  an unchecked `docs/roadmap.md` item.

### Red master: deux succès avant clôture

Une clôture automatique ne peut être déclenchée que par une **nouvelle exécution CI push master réussie** et seulement si les deux dernières exécutions de cette même CI sont terminées et réussies. Ne pas confondre le job de suivi vert et le job Quality lui-même. Garder la séparation entre résolution technique et fermeture administrative des anciennes issues purement automatiques. Ne jamais modifier, rouvrir, étiqueter ni clore une issue avec trace d'intervention humaine ; ne pas tenter de la « reprendre » en changeant son marqueur.
