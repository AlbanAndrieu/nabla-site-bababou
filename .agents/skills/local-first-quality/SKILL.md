---
name: local-first-quality
description: >-
  Apply exact-HEAD L0–L3 evidence, offline source recovery, deterministic
  quality convergence and secure publication before consuming GitHub Actions
  credits.
---
# Local-first quality — Bababou

Adapted from `nabla-compose#251` at `575314e27510e59fd47af4eb9ec2c59d908cefdf` (`.agents/skills/local-first-quality/SKILL.md`). Preserve the source's evidence model; use **this repository's actual commands**, not Compose-only task names.

## Communication — esprit ASD-STE100

Applique cette règle à toutes tes réponses, aux rapports de validation, aux procédures et aux descriptions de PR :

> Explique cela dans l’esprit de l’ASD-STE100. Utilise des phrases simples et directes. Décris une seule action par étape de procédure. Évite les synonymes inutiles.

- Préfère les phrases courtes, la voix active et les termes techniques précis.
- Utilise toujours le même terme pour la même notion.
- Donne **une seule action par étape** dans les procédures. Sépare les actions différentes.
- Distingue les faits vérifiés, les tests réellement exécutés et les contrôles non exécutés.
- Évite les formulations ambiguës et les synonymes sans utilité.
- Respecte l'esprit de l'ASD-STE100 sans revendiquer une conformité officielle.

## Principle and evidence levels

Start with the cheapest deterministic check able to falsify the patch. Widen only once it passes. Never treat a green GitHub check, an API file read, or an archive without `.git` as an **L3 local publication** pass.

- **L0 · static**: files/config inspected on the pinned SHA; nothing executed.
- **L1 · targeted**: exact fetched files or a deliberately scoped reproduction actually executed; identify partial fixtures.
- **L2 · convergence**: deterministic fixes and affected-file pre-commit/quality checks executed and converged.
- **L3 · publication**: `bash scripts/agent-publish.sh` passed on a clean, committed checkout for the **exact HEAD**, verified with `--status`.

Keep results of remote CI separate from local L0–L3. Mark unavailable tests `BLOCKED_NETWORK`, `MISSING_TOOL` or `NOT_RUN`, never PASS.

## Standard iteration (real Git checkout)

```bash
git branch --show-current
git status --short
git diff --stat
bash scripts/agent-quality-gate.sh --preflight
# focused unit/config/syntax check of changed paths
bash scripts/agent-p0-check.sh
npm run quality:agent:fix
git diff --check
# review deterministic changes, commit logical batch
bash scripts/agent-publish.sh
bash scripts/agent-publish.sh --status
```

Stop on `master` or detached HEAD. Follow the real scope classifier: maintenance-only changes do not justify unnecessary Next builds/Preview; runtime-impacting changes must retain relevant SAST, build, Playwright, ZAP and production protections. `just p0`, `just quality-fix`, `just publish-check` and `just publish-status` are optional aliases; `just offline-l1` is the syntax-only fallback. Keep `Makefile`.

If an autofixer changes files, review the exact diff, commit only intended changes, and rerun the failing gate until it converges. Do not repeat an unchanged failing command, bypass Git hooks, weaken security gates or manually rerun CI to use it as an editor. Never auto-merge.

## Mandatory execution when agent shell DNS is blocked

The GitHub connector supplies **source bytes**, not execution evidence:

1. Pin the PR `head_sha`, base and latest existing CI result. If HEAD moves, refetch and reconcile instead of overwriting an intervening edit.
2. Use an already-existing exact-SHA source snapshot artifact when available; validate its originating run/SHA and archive digest. Never trigger a CI run just to obtain an archive. The extracted archive has no `.git` and is not an L3 checkout.
3. Otherwise fetch the minimal actual changed files and imports through the connector into a temporary, isolated directory. Do not invent source snippets and test the snippet instead of the changed file.
4. For each edited shell file run `bash -n` **on that exact file**; run available ShellCheck/shfmt. For TS/JS, execute the narrow Node contract with the correct pinned runtime where possible. If dependencies are missing, report the precise limitation.
5. Where Git index, branch, file modes, or ancestry determine behavior, construct a temporary Git repository and execute both a failing and ordinary passing fixture. Never use live operator TrueNAS paths or private source materials.
6. Report `L1 exact-file local execution` versus `L1 partial reproduction` honestly. Neither proves L2/L3. Preserve exit codes, log just the first actionable failure, and keep full evidence only where safe.

Avoid retrying `git clone`, `curl`, pip or npm against a known-blocked host with no changed prerequisite. If a verified exact-HEAD snapshot cannot be acquired, per-file GitHub reads and narrow fixture execution are preferable to falsely claiming a local full pass.

## Security and confidentiality

BetterLeaks v1.9.0 is the only canonical secret scanner. For a **real Git checkout**, run:

```bash
just secrets-config
just secrets-staged
just secrets-worktree
just secrets-history
```

These scans require real Git/index/history. No scan performed means no BetterLeaks PASS. Do not replace with Gitleaks. Keep `.private-publication-source/**`, `.redaction-work/**`, credentials, keys, unpublished family/legal documents and ignored files out of public APIs, archives, Context7, and Dagger contexts. Privacy review is mandatory before publication changes.

Dagger here remains an **opt-in spike** using `scripts/dagger-ci.sh`, `just dagger-*`, and `just dagger-benchmark`. These are **not** the Compose `dagger-sync/list/native-parity/poc/bench` pipeline; do not introduce those commands without a separate migration plan. Its present `hadolint-docker` debt prevents full-quality parity. A mocked CLI and two benchmark samples are targeted execution evidence, not proof of engine-level exclusions or cache behavior. Do not expose the Docker socket or live secrets.

For external library APIs use repository-versioned docs first; Context7 is optional and must never make P0/quality/publication depend on network or leak private material.

## Remote CI policy and reports

Inspect current PR/checks before each new logical batch; fix actual failures first. Check workflow → failing job → failing step; only expand relevant log/artifact. Respect GitHub Actions credit constraints; do not manually rerun workflows. **N'utilise pas `[skip ci]`.** Le contrôle `QG_CI_SKIP_DIRECTIVE` interdit cette directive. Garde la PR en Draft pour éviter les jobs GitHub payants. Vérifie les conditions `draft == false` avant de publier un commit. Utilise la classification de scope pour limiter les builds Preview. Ne passe en Ready qu'après la validation locale requise.

Keep PR descriptions **in French**, PR **draft** while iterating, and never merge automatically. Report: exact SHA, changed paths, L0/L1/L2/L3 checks actually run, remote checks on that SHA, and remaining blockers. A complete local quality gate is green **only after L3 on that exact HEAD**.
