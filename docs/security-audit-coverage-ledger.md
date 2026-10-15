# Registre de couverture — revue de sécurité de Bababou

Mise à jour : 14 octobre 2026. Référence source : `docs/security-audit-source-review-2026-10-12.md`.

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
| SAST | Semgrep | not-run | Résultats exact-HEAD non réexaminés dans cette reprise. | P1 |
| E2E | Playwright | verified-external | Workflow réussi sur `master@a0de8d9`, non équivalent à un résultat sur la PR #232. | P2 |
| DAST preview | OWASP ZAP | not-run | Workflow Preview sur le master marqué `skipped`, ne pas annoncer un scan réussi. | P1 |
| Audit Cloudflare complet | six phases / `findings.json` | not-run | Aucun rapport complet produit ni finding confirmé par le skill. | P1 |

## Clôture

Chaque ligne doit conserver un statut séparant `verified-external`, `reviewed-source-only`, `needs-validation`, `implemented-not-verified` et `not-run`. Pour valider un nouveau contrôle : joindre la révision exacte, le périmètre, le résultat daté et une preuve expurgée, sans publier de secrets ni d'informations familiales. Les conclusions de l'audit complet exigent les artefacts upstream et une vérification indépendante des findings.


## Correctif du vérificateur de snapshot (PR #232)
Le contrôle de couverture d'intégrité distingue maintenant les métadonnées Git du contenu upstream pour les deux formes de checkout : répertoire `.git/` et fichier pointeur `.git` des worktrees. Le contrôle de symlink s'exécute avant cette exclusion ; les liens symboliques restent donc refusés. Test unitaire dédié ajouté. Cette modification corrige un faux positif potentiel, mais **ne constitue pas l'exécution de l'audit Cloudflare complet**.
