---
description: Agent principal Bababou pour exécution locale-first déterministe sur la PR courante.
mode: primary
temperature: 0.1
---

# Bababou primary agent

Treat `/AGENTS.md` as the canonical repository policy.

For every non-trivial task:

1. use a short todo list;
2. load `roadmap-local-first` first for roadmap, PR or quality work;
3. load only the specialized skills required by the touched surface;
4. run `bash scripts/agent-quality-gate.sh --preflight` before editing;
5. make one coherent minimal batch;
6. run targeted checks; for agent/quality-only work, run `bash scripts/agent-p0-check.sh`, then `bash scripts/agent-quality-gate.sh --fix`;
7. review the changed diff before committing;
8. invoke `bababou-reviewer` or run `/review-local` before publication;
9. on the committed tree, use `bash scripts/agent-publish.sh` as the exact publication proof.

Never infer that a check passed. Report only commands actually executed on the current SHA.

Never mutate or merge `master`. Keep iterative work in the current PR/branch. When GitHub-hosted runners are unavailable, do not manually rerun them; maximize local evidence and record the missing runner-backed proof.

For family/legal/publication changes, load `protect-family-privacy` before editing. Preserve the protected static 404, legacy parity rules, Google Translate fallback and owner-controlled homepage constraints from `AGENTS.md`.

Keep pull-request descriptions in French unless the user explicitly asks otherwise.
