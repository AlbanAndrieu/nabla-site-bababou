---
name: roadmap-local-first
description: Deterministic Bababou roadmap and pull-request workflow for local-first agents, especially smaller OpenCode models. Use when asked to continue the roadmap, work in the current PR, fix the quality gate, minimize GitHub Actions usage, or prepare a branch for review.
---

# Roadmap local-first execution

Use this skill for roadmap continuation and PR quality work. It is deliberately procedural so a smaller model does not have to infer the repository workflow.

This skill complements `/AGENTS.md`. It never weakens privacy, security, legacy-parity, protected-404, branch, or publication rules.

## Start with facts

Run these before choosing work:

```bash
git branch --show-current
git status --short
git diff --stat
bash scripts/agent-quality-gate.sh --preflight
```

Stop if the branch is `master`. Work only on the current dedicated branch/PR.

Read only the relevant unchecked block of `docs/roadmap.md`. Do not scan the whole repository to invent a new plan when the roadmap already has one.

## Load specialized skills on demand

Use the OpenCode `skill` tool. Do not preload every skill.

- CI failure, unfinished validation, or completion accounting → `quality-follow-up`.
- Family/legal/publication/privacy content → `protect-family-privacy`.
- Static/legacy route migration → `next-migrate-locale-pages`.
- Next.js runtime behavior → `next-dev-loop`.
- Browser interaction → `agent-browser`.
- Cache Components work → the matching `next-cache-components-*` skill.

If no specialized skill matches, follow `AGENTS.md` and existing code/tests instead of inventing a new convention.

## Pick one finishable roadmap item

Prefer work that:

1. is already represented by an unchecked roadmap item;
2. fits the current PR objective;
3. can be validated locally;
4. removes measurable debt without changing unrelated content;
5. preserves the current `ci-scope.sh` fast path when the change is only agent/quality/documentation tooling.

Do not opportunistically edit runtime, package manifests, legal content, the protected 404, or owner-controlled homepage merely because they are nearby.

## Interpret preflight scope literally

The `--preflight` output is the cost map:

- `maintenance_only=true` → do not invent a Next build, Preview, Playwright Preview, ZAP, Snyk, or Semgrep run.
- `build=true` → a local production build is required before publication.
- `sast=true` → source/security validation is required when available.
- `dependencies=true` → dependency validation is required.
- `preview_required=true` → the change is deployment-relevant; when GitHub-hosted runners are unavailable, maximize local build/browser checks and record remote Preview proof as unavailable rather than faking it.
- empty diff → fail-safe/full classification is intentional.

## Editing loop

For each coherent batch:

1. make the smallest patch;
2. run the closest unit/contract/lint check;
3. run `bash scripts/agent-p0-check.sh`;
4. run `bash scripts/agent-quality-gate.sh --fix`;
5. inspect `git status --short`, `git diff --stat`, then only the affected diff;
6. if `--fix` changed files, keep iterating until deterministic mutations converge;
7. commit the reviewed batch;
8. run `bash scripts/agent-publish.sh` for the exact committed HEAD/base/toolchain proof before publication.

Never use `git push --no-verify`. Never weaken a rule merely to make a gate pass.

## Failure routing

- `QG_AUTOFIX_REQUIRED` → run the local fix phase; do not spend time reading broad CI logs.
- `QG_PRECOMMIT_FAILED` → inspect the specific hook/error and affected file.
- `QG_FIX_DID_NOT_CONVERGE` → inspect the changing diff and conflicting formatters.
- `QG_BASE_STALE` → fetch/rebase the working branch before publication; do not force `master`.
- test/type/security failure → fix the semantic cause, then rerun the closest check.
- GitHub job with `steps=null`, no logs, or no allocated runner → infrastructure/quota evidence; do not infer a code regression and do not manually rerun while the user has said credits are unavailable.

## GitHub Actions unavailable

When credits/runners are unavailable:

1. keep the PR draft;
2. do not manually rerun hosted workflows;
3. use `agent-p0-check.sh`, targeted tests, lint/type checks, local build, local Playwright/browser checks, and `agent-publish.sh` according to the classified scope;
4. distinguish clearly between checks that passed locally and checks not executed;
5. keep runner-backed validation as an unchecked roadmap/PR residual when it is still required.

## Pull-request description

Keep the PR description in French unless the user asks otherwise. Include:

- objectif;
- changements;
- périmètre;
- exact `ci-scope`;
- validations locales réellement exécutées;
- GitHub Actions status, explicitly identifying `steps=null` as pre-allocation infrastructure when applicable;
- validation remaining before Ready/merge.

Do not claim a check passed from static inspection alone.

## Completion

Before reporting completion:

1. load `quality-follow-up`;
2. account for every requested or discovered residual in `docs/roadmap.md`;
3. confirm the branch is not behind its base;
4. confirm the PR remains draft while required local or runner-backed evidence is missing;
5. never merge unless the user explicitly asks.
