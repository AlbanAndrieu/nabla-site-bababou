---
name: roadmap-local-first
description: Reprendre une tâche BB-xx ou corriger une PR avec contexte minimal et validation selon les capacités disponibles.
---
# Roadmap local-first — un seul lot à la fois

`AGENTS.md` est normatif. Lire `docs/roadmap.md` **à l'ID BB-xx actif**, `docs/engineering-roadmap.md` **au même ID** et `docs/operations.md` uniquement pour l'incident rencontré. Une ligne d'état : `PR@SHA | premier échec | fichier | preuve | prochain test`.

## Démarrage et mode

- **Workstation avec checkout réel** : `just agent-plan`, puis `bash scripts/agent-quality-gate.sh --preflight` ; choisir un seul niveau `just agent-verify offline` / `p0` / `publish` / `browser` selon le scope, sans répétition.
- **Codex/API sans checkout** : lire PR/base/HEAD et fichiers ciblés depuis GitHub ; run → job → première step rouge → 10–20 lignes de log. `steps=null` = job non exécuté, pas défaut applicatif. Pas de SSH de substitution, installation ou suite locale prétendue PASS.
- `maintenance_only=true` : ne pas lancer build, Preview, Semgrep ou ZAP sans raison ; `build/sast/dependencies/preview_required=true` : conserver chaque preuve obligatoire en `NOT_RUN` si indisponible.

## Skill uniquement à la demande

`quality-follow-up` en cas de gate rouge / clôture ; `protect-family-privacy` sur données familiales, droit, originaux et publication ; `next-migrate-locale-pages` pour HTML→React ; `next-dev-loop` pour Next runtime et `agent-browser` seulement avec navigateur actif. Ne charger aucun skill non pertinent.

## Modifier, vérifier, publier

1. Une correction cohérente et le plus petit test qui peut la réfuter. Si qualité agent : `bash scripts/agent-p0-check.sh`.
2. `QG_AUTOFIX_REQUIRED` → `bash scripts/agent-quality-gate.sh --fix`, inspecter mutations avant commit ; `QG_BASE_STALE` → rebase contrôlé ; `QG_PUBLISH_PROOF_STALE` → nouveau proof ; `QG_PUBLISH_PROTECTED_BRANCH` → stop.
3. HEAD propre et outils locaux : `bash scripts/agent-publish.sh` puis `bash scripts/agent-publish.sh --status`. Sans exécution, mentionner L0/`BLOCKED`/`NOT_RUN`. La fusion n'est jamais une preuve de quality.
4. **do not manually rerun hosted workflows** seulement pour obtenir du feedback sur un formatter. `Keep the PR description in French`, garder PR Draft, **never merge unless the user explicitly asks**.

Sécurité non négociable : 404 et anciens HTML protégés, confidentialité, BetterLeaks, SAST/SCA, DAST et Playwright. Réduire le contexte et le nombre de commandes, **jamais les exigences**.
