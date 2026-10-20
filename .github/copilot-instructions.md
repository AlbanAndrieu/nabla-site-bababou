# Copilot instructions — Nabla Site Bababou

The canonical repository policy is [`/AGENTS.md`](../AGENTS.md). Read and follow it first; do not duplicate or weaken it here.

Load specialized guidance only when the task touches the corresponding surface:

- [`copilot-instructions-nextjs.md`](copilot-instructions-nextjs.md) — Next.js/App Router work.
- [`copilot-instructions-static-site.md`](copilot-instructions-static-site.md) — legacy/static `public/` work.
- [`copilot-instructions-api.md`](copilot-instructions-api.md) — API/serverless work.
- [`copilot-instructions-cicd.md`](copilot-instructions-cicd.md) — CI/CD, Vercel and workflow work.
- [`copilot-instructions-python.md`](copilot-instructions-python.md) — Python/tooling work.

## Efficient agent workflow

After editing, prefer the local deterministic path documented in `AGENTS.md`:

```bash
just quality-fix
# Review deterministic changes and commit them.
just publish
```

- `QG_AUTOFIX_REQUIRED` means deterministic hooks changed files. Review the exact patch, run the local fix path, commit, and retry; do not start broad CI-log analysis for that condition.
- Inspect remote failures progressively: workflow/status → failing job → failing step → only the relevant logs/artifacts.
- Keep iterative PRs draft so synchronization runs only the cheap Git preflight. Use `ready_for_review` for the authoritative remote checkpoint.
- In API-only environments, never claim workstation/local gates ran. Keep patches atomic and inspect the resulting CI.
- Reuse an exact local publication proof when valid; do not force repeated full validation without a reason.

Protected homepage/404/legacy/i18n rules and all publication constraints live in `AGENTS.md` and remain authoritative.
