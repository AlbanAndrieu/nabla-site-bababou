# Scripts et commandes canoniques — Site Bababou

**Répertoire opérationnel, 13 novembre 2026.** Le point d'entrée utilisateur est `justfile`, pas une seconde liste de pipelines shell. `Makefile` conserve les anciennes commandes compatibles. Les scripts ci-dessous sont des implémentations, **pas** des chemins alternatifs équivalents vers une quality gate.

| Besoin | Commande canonique | Implémentation / distinction |
| --- | --- | --- |
| Test rapide sans réseau | `just offline-l1` | `scripts/agent-offline-check.sh` ; L1, pas sécurité complète |
| Contrats hors ligne | `just offline-contracts` | Tests Node ciblés + contrôle des roadmaps ; pas de build |
| Préflight / périmètre | `just preflight` | `scripts/agent-quality-gate.sh` en mode `--preflight` |
| Défauts P0 | `just p0` | `scripts/agent-p0-check.sh` |
| Qualité et corrections | `just quality-fix` puis `just quality` | `scripts/agent-quality-gate.sh` ; ne pas confondre avec la gate CI `scripts/quality-gate.sh` |
| Publication de preuve | `just publish` / `just publish-status` | `scripts/agent-publish.sh` ; exige HEAD et base compatibles |
| Bascule React | `just home-cutover-verify` | `scripts/verify-home-cutover.mjs` + navigateur exact-SHA |
| Confidentialité | `just privacy-check` + `just privacy-publication` | `scripts/privacy-gate.ts` et `scripts/publication-privacy-gate.ts` ont des finalités distinctes |
| Résoudre une référence publique | `node scripts/resolve-site-document-ref.mjs SITE-DOC-...` | Lecture locale ; n'autorise aucun accès privé |
| Diagnostic runner | `just ci-diagnose RUN_ID` | `scripts/ci/diagnose-actions-startup.sh` ; lecture seule |
| Contrôle de pages publiques | Procédure [FinOps](vercel-finops.md) | `scripts/finops/vercel-public-smoke.mjs` ; faible trafic, pas de mesure CPU |
| Budget Vercel | Procédure [FinOps](vercel-finops.md) | `scripts/finops/vercel-usage-budget.mjs` ; export explicite et daté |
| Documentation et scripts | `just docs-audit` | `scripts/quality/docs-roadmap-consistency.mjs` ; liens et IDs, sans réseau |
| Dagger (optionnel) | `just dagger-p0` | `scripts/dagger-ci.sh` ; POC sans parité sécurité complète |

**Alias de compatibilité dans `justfile` :** `test-unit` → `unit`, `test-a11y` → `a11y`, `publish-check` → `publish`. Éviter de dupliquer les commandes dans des nouvelles recipes ; les alias ne doivent pas changer leur comportement.

**Ne pas fusionner** `scripts/production-home-smoke.sh`, `scripts/verify-production-live.sh` et le smoke FinOps : ils n'établissent pas les mêmes preuves et n'ont pas le même périmètre. De même, `scripts/quality-gate.sh`, `scripts/agent-p0-check.sh` et le launcher agent sont des niveaux de contrôle distincts. Une suppression n'est recevable qu'après inventaire des appels depuis `.github/workflows/`, tests et runbooks, plus validation d'équivalence.

Les optimisations des wrappers doivent rester locales au dépôt et **ne pas déclencher de CI uniquement pour diagnostiquer**. Les vérifications documentaires sont dependency-free ; les gates L2/L3, les tests navigateur, les secrets et les scanners AppSec demeurent obligatoires selon le scope. Pour toute modification : mesurer avant/après la durée et le volume des appels, ne pas annoncer un gain sans chiffres.
