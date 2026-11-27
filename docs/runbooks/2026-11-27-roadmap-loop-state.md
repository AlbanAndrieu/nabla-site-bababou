# État de la boucle roadmap — 27 novembre 2026

Branche : `fix/precommit-autoupdate-20261123` (PR #288, non fusionnée). Base : `master@5a1a2942`.

## Compteur

| Passe | Date | Résultat |
| --- | --- | --- |
| 1 | 27/11/2026 | Gate CI débloquée (espace final, ESLint), 35 tests unitaires réparés, preuves CodeQL/Semgrep/Trivy relevées, BB-08 revérifié |

## Éléments par ID

| ID | État après passe 1 | Preuve / prochaine action |
| --- | --- | --- |
| BB-02 | CodeQL `PASS` ; DAST production `FAIL` sur `master` (nettoyage) ; correctif `TESTED` local | Run 45195552723 ; run DAST 46001696342 ; rejouer DAST après fusion de #288 |
| BB-03 / BB-05 / BB-11 | `CODE_MERGED`, Playwright Preview `skipped` | Smoke production 45274527699 `success` ; recette navigateur exact-SHA à produire |
| BB-04 | `NO-GO` | Décision humaine |
| BB-08 | `BLOCKED` | CLI Hobby : pas de données de facturation sur 30 jours |
| BB-09 / BB-10 | `CODE_MERGED`, contrats unitaires réalignés | Recette visuelle/axe à faire |
| BB-01 / BB-06 / BB-07 | Inchangés | Arbitrages de publication et GO sécurité |

## Questions en attente (propriétaire)

1. **BB-08** : relever dans le tableau de bord Vercel Usage les heures Fluid Active CPU, la mémoire et les invocations sur 30 jours (aucune API Hobby disponible).
2. **BB-02** : forfait Vercel et éligibilité OWASP gérée (offre payante) avant tout passage `log → deny` ; `apply` du module Compose H04 sur un site public.
3. **BB-04** : GO de bascule de la homepage React.
4. **BB-01** : classification et décision de publication des PDF/Office déjà publics.
5. **BB-05 / BB-11** : GO de redirection des archives HTML vers les routes React.
6. **Fusion de #288** : à faire par le propriétaire, après CI verte.
