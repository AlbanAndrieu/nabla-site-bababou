# Copilot instructions — Python tooling

Follow `/AGENTS.md` as the canonical repository policy.

Python is auxiliary tooling in this repository; the application runtime is root Next.js/Node 24.

- Use the Python version/tooling already declared by the repository instead of introducing another environment manager.
- The Python HTTP server is only for focused legacy-static audits; normal development uses `npm run dev`.
- Install canonical Git hooks with `mise run hooks`, not an ad-hoc subset of `pre-commit install` commands.
- Run the focused Python formatter/linter/check already configured for the file being changed.
- Do not duplicate npm/Next build or publication logic in Python.
- Never embed credentials, personal data or production secrets in scripts, fixtures or examples.
- Before publication, the repository-wide source of truth remains `bash scripts/quality-gate.sh`.
