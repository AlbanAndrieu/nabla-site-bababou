---
name: local-first-quality
description: Preuves L0-L3 et validation à moindre coût sans affaiblir les gates ou utiliser des crédits CI pour déboguer.
---
# Local-first quality — preuves réelles

Lire `AGENTS.md` et `docs/agent-execution-modes.md` ; règles complètes dans `docs/operations.md`. Réponses en phrases courtes, esprit ASD-STE100 (sans prétendre à une conformité officielle).

| Niveau | Ce qui est attesté |
| --- | --- |
| L0 | Sources lues au SHA, aucun test |
| L1 | Test ciblé exécuté (fixture signalée explicitement) |
| L2 | Corrections et contrôles concernés convergés |
| L3 | `bash scripts/agent-publish.sh` réussi sur HEAD/base/toolchain propre |

**Workstation** : `just agent-plan`, puis `just agent-verify offline` ou `p0` ; `just quality-fix` seulement si des modifications déterministes sont requises ; revoir, committer puis `just agent-verify publish` une seule fois (la quality gate est déjà incluse). `just agent-verify browser` uniquement avec Playwright et environnement autorisé.

**Codex sans checkout** : L0 via fichiers/PR GitHub, première step CI échouée, patch atomique. `npm ci`, build, tests, confidentialité, BetterLeaks, SAST/SCA, DAST et publication : `NOT_RUN`, sans prétendre que l'API GitHub est un checkout.

Ne pas transférer `.private-publication-source/**`, `.redaction-work/**` ou originaux privés ; `protect-family-privacy` est obligatoire pour les fichiers légaux/familiaux. Conserver 404, index, URLs et protocole de cutover.

**N'utilise pas `[skip ci]`**. Garde la **PR en Draft** en itération, sans déclencher des runners à répétition. Ni `skipped` ni `READY` ne prouvent la qualité ; jamais de fusion automatique. Le rapport contient SHA, commandes réellement exécutées, `PASS/FAIL/BLOCKED/NOT_RUN` et backlog résiduel.
