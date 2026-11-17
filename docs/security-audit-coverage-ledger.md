# Registre de couverture — revue de sécurité de Bababou

Mise à jour : 18 octobre 2026. Référence source : `docs/security-audit-source-review-2026-10-12.md`.

**Ce registre est un suivi documentaire, pas le `coverage-ledger.json` validé du skill Cloudflare.**
Une lecture de code n'est ni un scan exécuté ni une preuve d'absence de vulnérabilité.

| Contrôle | Périmètre | État | Preuve et limite | Priorité |
| --- | --- | --- | --- | --- |
| Baseline production | `master@a0de8d9fdb31d646dffffd7dcb8a9beec380c932` | verified-external | Statuts GitHub Vercel, Production Post-deploy Smoke et Production DAST tous `success`, contrôlés le 14/10/2026. Ne concerne pas les autres SHAs. | P0 |
| Intégrité du skill | `scripts/verify-security-audit-skill.mjs` | implemented-not-verified | Vérification des 22 blobs prévue ; snapshot réel du skill non vérifié ici. | P1 |
| Injection HTML | `app/global-not-found.tsx`, `lib/htmlFromPublic.ts` | needs-validation | 404 HTML versionnée, injection `dangerouslySetInnerHTML` ; aucune entrée attaquant prouvée. | P1 |
| CSP | `next.config.mjs` | needs-validation | CSP absente pour préserver les pages legacy ; aucun XSS prouvé. | P2 |
| Proxy | `proxy.ts` | reviewed-source-only | Routage vers destinations fixes dans l'échantillon lu. | P2 |
| Routes API | `api/hello.js`, `app/__legacy-html-not-found__/route.ts` | reviewed-source-only | Réponse constante et 404 statique ; tests HTTP non rejoués ici. | P2 |
| Confidentialité | `scripts/privacy-gate.ts`, `scripts/publication-privacy-gate.ts` | reviewed-source-only | Contrôles de publication examinés ; aucun document privé ouvert. | P0 |
| BetterLeaks | staged / worktree / historique | not-run | Aucun scan exécuté dans cette reprise ; ne pas remplacer par Gitleaks. | P1 |
| SAST | Semgrep (sources modifiées) | verified-external | Job Quality #39084115761 (SHA `9c56f1d`) : Semgrep `success` ; pas d'analyse exhaustive du dépôt. | P1 |
| SCA production | npm audit --omit=dev --audit-level=high | implemented-not-verified | Bloquant à chaque PR non draft/push master, même sans changement de lockfile. CI sur nouveau HEAD à vérifier ; scan distinct de Snyk. | P0 |
| SCA complet | npm audit --json (dev inclus) | verified-external-with-debt | Premier run #39156263209 : **13 vulnérabilités, 11 HIGH + 2 MODERATE**, causant un échec du gate full ; politique affinée pour reporter toutes les vulnérabilités dev, bloquer CRITICAL et scanner la production strictement. Voir dette ci-dessous. | P1 |
| E2E | Playwright | verified-external | Preview #39084318971 sur `9c56f1d` : 191 tests réussis, incluant le contrôle d'exposition technique. | P2 |
| DAST preview | OWASP ZAP | verified-external | Preview #39084318959 sur `9c56f1d` : 0 FAIL, 9 catégories WARN, sans suppression des règles. | P1 |
| Audit Cloudflare complet | six phases / `findings.json` | not-run | Aucun rapport complet produit ni finding confirmé par le skill. | P1 |

## Clôture

Chaque ligne doit conserver un statut séparant `verified-external`, `reviewed-source-only`, `needs-validation`, `implemented-not-verified` et `not-run`. Pour valider un nouveau contrôle : joindre la révision exacte, le périmètre, le résultat daté et une preuve expurgée, sans publier de secrets ni d'informations familiales. Les conclusions de l'audit complet exigent les artefacts upstream et une vérification indépendante des findings.


## Correctif du vérificateur de snapshot (PR #232)
Le contrôle de couverture d'intégrité distingue maintenant les métadonnées Git du contenu upstream pour les deux formes de checkout : répertoire `.git/` et fichier pointeur `.git` des worktrees. Le contrôle de symlink s'exécute avant cette exclusion ; les liens symboliques restent donc refusés. Test unitaire dédié ajouté. Cette modification corrige un faux positif potentiel, mais **ne constitue pas l'exécution de l'audit Cloudflare complet**.

## Préparation et critères d'acceptation — PR #232 (17 octobre 2026)

- **Acquisition contrôlée, non exécutée** : `scripts/prepare-security-audit-skill.sh` propose `--fetch-verify` dans un chemin inexistant, ou `--verify-existing` sur un checkout existant. La révision Git exacte `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` et les 22 blobs déclarés doivent correspondre.
- **Contrat de sûreté renforcé** : `.git` en répertoire réel ou fichier pointeur est autorisé à la racine ; `.git` sous forme de symlink est rejeté avant toute exclusion. Un nouveau test de régression couvre ce dernier cas.
- **Prochaine preuve L1** : `node --test unit-tests/verifySecurityAuditSkill.test.mjs` et `bash -n scripts/prepare-security-audit-skill.sh`, avec sortie, date et commit exact. Non exécuté dans cette intervention.
- **Prochaine preuve d'intégrité L2** : appeler le script avec un répertoire public jetable, préserver le résultat final, puis supprimer le checkout après contrôle. Ne pas utiliser de corpus privé.
- **Audit L3 (distinct)** : effectuer les six phases du skill en sandbox sans accès aux données privées ; faire valider les artefacts selon les schémas et validateurs upstream ; revue humaine indépendante des findings. Aucun scan externe, PII ou fichier familial dans les artefacts versionnés.
- **Garde-fous** : `[skip ci]` n'est pas un résultat de test ; BetterLeaks, Semgrep, Playwright et ZAP doivent rester intacts et seront à exécuter avant toute fusion.


## Qualification ciblée du rapport ZAP — PR #233 (18 octobre 2026)

Source : [scan Preview #39080516029](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/39080516029), déploiement exact `021bc5b1f90149fbf5d5f8ab74aaddeed691fced`. **0 règle FAIL, 9 catégories WARN**, 55 règles PASS, 3 IGNORE selon la politique `.zap/rules.tsv`. Un statut CI vert ne ferme pas les avertissements. Le rapport JSON recense 4 catégories medium, 4 low et 5 informational, regroupées différemment des 9 règles WARN. Cette preuve historique disposait de l’artefact `zap-preview-report`. Depuis la convergence avec Site Alban dans la PR #234, les preuves HTTP brutes restent sur le runner et sont supprimées ; seuls les agrégats de risque et les statuts exact-SHA sont publiés. Pour investiguer un finding, reproduire le scan sur un runner de confiance au lieu d'exposer URL, cookies ou instances dans GitHub.

- **10099 — Source Code Disclosure: Python** : la politique existante signale un faux positif connu dans le texte de la homepage, sans autoriser une véritable exposition de code. Le test `tests/source-disclosure.spec.ts` vérifie désormais que des chemins techniques types répondent 403/404 depuis la Preview, sans scanner les hôtes internes. Le test reste à valider sur son propre HEAD. Une observation 200 ou une fuite reproductible doit rester bloquante et être examinée avant publication.
- **10010/10015** : cookie de locale accessible au client et directives de cache ; examiner les en-têtes et l'utilisation effective des cookies, ne pas forcer `HttpOnly` sur une valeur requise côté navigateur sans migration.
- **10017/90003/90004** : JavaScript tiers, absence de SRI et politique COEP ; inventorier les URL externes et vérifier leur compatibilité avec les pages legacy avant de durcir les en-têtes.
- **10038/10098/10027** : CSP absente, CORS et commentaires suspects ; identifier les réponses et occurrences du rapport ; définir un déploiement progressif CSP `Report-Only` sans invalider les styles et scripts legacy, puis vérifier absence de données sensibles exposées.

Aucun `WARN` n'est passé silencieusement à `IGNORE`. Les preuves d'intégrité Cloudflare, les six phases d'audit, BetterLeaks sur un vrai historique Git et les contrôles locaux L3 restent distincts et ouverts.

## Dette SCA avérée — 18 octobre 2026

[Run CI #39156263209](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/39156263209), SHA `fd8bd054f62a4a1d829613b9480b8e673ae4c732` : `npm audit --audit-level=high` a remonté **13 vulnérabilités (11 HIGH, 2 MODERATE)**. Ne pas assimiler ces alertes à 13 exploitations indépendantes : `npm audit` compte notamment des packages parents impactés par une même dépendance.

- Chaîne `opencommit` (dev) → `@actions/github` / `@actions/http-client` / `undici` / `@fastify/busboy` et `axios` : vulnérabilités HTTP, déni de service et injection selon les avis émis. Évaluer suppression de l'outil inutilisé ou montée de version compatible avec régénération complète du lockfile.
- Chaîne de lint/formatage `eslint-config-next`, `stylelint` → `fast-glob` / `globby` / `micromatch` / `braces` : risque de déni de service à partir de motifs malveillants. `npm audit fix --force` proposait une **régression Stylelint 7.7.0** : **refusée** faute de compatibilité. Étudier les versions patchées et `overrides` validés, pas de changement d'intégrité ou de résolution manuelle non vérifiée.
- **Contrat de risque** : audit de production `--omit=dev --audit-level=high` obligatoire et bloquant (HIGH/CRITICAL) ; audit complet dev inclus sur chaque PR non draft et sur master, avec noms et nombres des packages impactés dans `GITHUB_STEP_SUMMARY`, erreur de scanner ou CRITICAL toujours bloquants. Les HIGH de dev restent une dette explicitement non résolue et **non éligible au qualificatif "full SCA PASS"**.
- À clôturer après remédiation vérifiée : 0 HIGH dans le rapport complet, lockfile régénéré par npm réel, tests unitaires, build, SAST et Preview conservés ; **aucun `--force` et aucun contournement des scans existants**.

## DAST production au 17 novembre 2026

[Run 44163310324](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/44163310324), SHA `d2367a7d0a88d32bbab5947028adbb31c02fc134` : scanner ZAP exit 0, SARIF minimisé H0/M4, 4 catégories LOW, 5 INFO conservées comme compteurs (pas de détails publics). IDs medium : `10038`, `10098`, `10099`, `90003`. [Run précédent 44080102456](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/44080102456) concordant. La correction #282 du démarrage Docker est fusionnée. La qualification et la remédiation demeurent ouvertes : voir [runbook ZAP et Vercel WAF](security-zap-waf-remediation.md). Le site n'est pas déclaré exempt de vulnérabilités.
