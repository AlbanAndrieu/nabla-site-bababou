# OpenCode playbook — Bababou local-first

Use this orchestration reference only when needed. `AGENTS.md` is canonical.
The `roadmap-local-first` skill owns the detailed procedure.

## Capability routing

| Need | Preferred capability |
| --- | --- |
| Plan current work | `docs/roadmap.md` + OpenCode todo tool |
| Determine validation cost | `bash scripts/agent-quality-gate.sh --preflight` |
| Dependency-free P0 regression | `bash scripts/agent-p0-check.sh` |
| Canonical scope | `bash scripts/ci-scope.sh <base> WORKTREE` before commit; `<base> HEAD` after |
| Converge deterministic mutations | `bash scripts/agent-quality-gate.sh --fix` |
| Exact publication proof | `bash scripts/agent-publish.sh` |
| Quality/CI follow-up | skill `quality-follow-up` |
| Family/legal/privacy/publication | skill `protect-family-privacy` |
| Legacy HTML → Next | skill `next-migrate-locale-pages` |
| Next runtime/browser verification | `next-dev-loop` / `agent-browser` |
| Independent review | `bababou-reviewer` / `/review-local` |
| GitHub/Vercel diagnostics | authenticated integration; exact SHA + narrow evidence first |

## Execution loop

For non-trivial work:

```text
status/diff → preflight → one roadmap item → matching skill → minimal patch
→ closest test → agent-p0-check.sh when quality/agent-related → --fix
→ diff review → reviewer → commit → agent-publish.sh → PR/roadmap evidence
```

Let `ci-scope.sh` decide whether build, SAST, dependency or Preview work is required.
Do not invent expensive checks for maintenance-only changes.

## Evidence and unavailable runners

Keep report states distinct:

- **executed** — the command/tool ran on the reported revision;
- **static contract** — source/tests support the behavior but were not executed;
- **blocked/unavailable** — runner, credentials, provider or environment prevented execution;
- **not required** — canonical scope excludes the check.

A GitHub job with `steps=null`, no allocated runner or no step logs is
infrastructure/quota evidence. Do not manually rerun while credits are unavailable,
do not call it a code regression, and keep runner-only validation open.

## Protected boundaries

Load the matching skill before editing these surfaces and preserve:

- `public/404.html` as the protected visual 404 source unless architecture change is explicitly approved;
- legacy HTML until parity is proven;
- Google Translate remains fallback while native i18n is incomplete;
- owner-controlled homepage/index disclosures;
- no manufactured legal translations for missing homologues.

## Review and workstation smoke

Run `/review-local` after deterministic fixes and before publication.
The read-only `bababou-reviewer` reports concrete defects, missing evidence and
scope/roadmap/PR inconsistencies; the primary agent owns fixes.

After agent/config changes:

```bash
opencode --version
opencode agent list
```

Both `bababou` and `bababou-reviewer` must be discovered. If not, inspect the
installed OpenCode/config schema rather than pinning a repository model.
