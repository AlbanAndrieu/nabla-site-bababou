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
| SCA | npm audit (lockfile complet) | implemented-not-verified | Gate `npm audit --audit-level=high` ajouté à la CI sur toute PR non draft ; validation sur le nouvel HEAD attendue. Snyk reste conditionnel, sans claim PASS s'il est skipped. | P0 |
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

Source : [scan Preview #39080516029](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/39080516029), déploiement exact `021bc5b1f90149fbf5d5f8ab74aaddeed691fced`. **0 règle FAIL, 9 catégories WARN**, 55 règles PASS, 3 IGNORE selon la politique `.zap/rules.tsv`. Un statut CI vert ne ferme pas les avertissements. Le rapport JSON recense 4 catégories medium, 4 low et 5 informational, regroupées différemment des 9 règles WARN. L'artefact `zap-preview-report` du workflow est l'autorité pour les URL/instances.

- **10099 — Source Code Disclosure: Python** : la politique existante signale un faux positif connu dans le texte de la homepage, sans autoriser une véritable exposition de code. Le test `tests/source-disclosure.spec.ts` vérifie désormais que des chemins techniques types répondent 403/404 depuis la Preview, sans scanner les hôtes internes. Le test reste à valider sur son propre HEAD. Une observation 200 ou une fuite reproductible doit rester bloquante et être examinée avant publication.
- **10010/10015** : cookie de locale accessible au client et directives de cache ; examiner les en-têtes et l'utilisation effective des cookies, ne pas forcer `HttpOnly` sur une valeur requise côté navigateur sans migration.
- **10017/90003/90004** : JavaScript tiers, absence de SRI et politique COEP ; inventorier les URL externes et vérifier leur compatibilité avec les pages legacy avant de durcir les en-têtes.
- **10038/10098/10027** : CSP absente, CORS et commentaires suspects ; identifier les réponses et occurrences du rapport ; définir un déploiement progressif CSP `Report-Only` sans invalider les styles et scripts legacy, puis vérifier absence de données sensibles exposées.

Aucun `WARN` n'est passé silencieusement à `IGNORE`. Les preuves d'intégrité Cloudflare, les six phases d'audit, BetterLeaks sur un vrai historique Git et les contrôles locaux L3 restent distincts et ouverts.
