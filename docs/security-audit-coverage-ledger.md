# Registre de couverture — audit sécurité Bababou

Version du registre : 1 — 13 octobre 2026.
Référence du périmètre : revue source-first `docs/security-audit-source-review-2026-10-12.md` et PR #230.
**Ce registre n'est pas une sortie validée de l'outil Cloudflare.** Il n'atteste ni une exécution complète du skill ni l'absence de vulnérabilités.

| Contrôle | Surface | État | Preuve / limite | Priorité |
| --- | --- | --- | --- | --- |
| Source upstream / intégrité | `scripts/verify-security-audit-skill.mjs` | implemented-not-executed-on-checkout | Manifeste de 22 identifiants Git ; checkout officiel complet non vérifié | P1 |
| Code source — injection 404 | `app/global-not-found.tsx`, `lib/htmlFromPublic.ts` | reviewed-needs-validation | HTML statique versionné injecté ; pas d'entrée utilisateur démontrée ; regex non assimilable à un sanitizer | P1 |
| CSP et en-têtes | `next.config.mjs`, `unit-tests/securityHeaders.test.ts` | reviewed-needs-validation | En-têtes codés ; CSP absente de manière documentée ; aucun contrôle HTTP sur la preview effectué dans cette revue | P2 |
| Proxy et redirections | `proxy.ts` | reviewed-source-only | Rewrites et destinations de redirection constantes dans le périmètre lu | P2 |
| Routes serveur | `api/hello.js`, `app/__legacy-html-not-found__/route.ts` | reviewed-source-only | Endpoint de démonstration constant ; 404 statique ; tests dynamiques non effectués | P2 |
| Chaîne publication Vercel | `scripts/vercel-ignore-build.sh` | implemented-ci-observed | Correction : absence de SHA précédent => build ; Node 24 vert sur le HEAD précédent, baseline production rouge | P0 |
| Statuts de production | `scripts/verify-production-baseline.sh` | failed-external | Production `73b8cca` Vercel `failure` / `git_info_fail`, aucune preuve READY+Smoke+DAST | P0 |
| Sécurité des secrets | BetterLeaks staged/worktree/history | not-run-here | L'outil demeure requis ; pas de résultats d'exécution de ce lot | P1 |
| Analyse statique | Semgrep/SAST | not-run-here | Pas de nouvelle preuve d'analyse source ; ne pas inférer de résultat « vert » | P1 |
| DAST | ZAP exact-SHA | not-run-here | Preview automatisée bloquée tant que la baseline de production n'est pas vérifiée | P1 |
| E2E et compatibilité | Playwright exact-SHA / 404 historique | not-run-here | Préserver `public/404.html` et son rendu ; aucun nouveau résultat dans ce lot | P2 |
| Publication et vie privée | `scripts/privacy-gate.ts`, `scripts/publication-privacy-gate.ts` | reviewed-source-only | Contrats d'exclusion/revue observés ; pas de corpus privé lu ou publié | P0 |
| Audit du compte Cloudflare | Access, WAF, Tunnel, DNS | not-run-no-authorization | Distinct du security-audit-skill, requiert une méthode autorisée et des droits adaptés | P2 |
| Workflow complet du skill | Phases upstream, `findings.json`, vérification indépendante | not-run | Aucun finding confirmé par le skill ; rapport upstream non produit | P1 |

## Règles de preuve et de clôture

- **`reviewed-source-only`** : observation du code à une révision donnée, sans exécution du programme.
- **`reviewed-needs-validation`** : hypothèse conditionnelle sans reproduction exploitable.
- **`implemented-not-executed-on-checkout`** : contrôle présent, mais résultat sur une copie upstream complète inconnu.
- **`failed-external`** : échec prouvé d'une dépendance externe ; ne pas contourner la gate.
- **`not-run`** : test non effectué, sans présumer d'un succès ou d'un échec.

Pour passer au statut `verified`, exiger une référence de commit, l'identifiant de run ou l'artefact local contrôlé, le périmètre, le verdict, et une preuve expurgée. Les essais non exécutés restent explicitement marqués `not-run`. Conserver les originaux et données sensibles **hors Git**, et ne pas exporter leur contenu vers le skill ou des prestataires tiers.

## Prochain ordre d'exécution

1. **P0** Rétablir la preuve Vercel production sur un commit légitime, puis Smoke et DAST ; ne pas modifier les conditions bloquantes pour masquer `git_info_fail`.
2. **P1** Vérifier le checkout épinglé Cloudflare et ses tests dans une sandbox appropriée ; conserver l'intégrité et l'origine du snapshot.
3. **P1** Étendre la reconnaissance et faire examiner indépendamment les deux observations `needs-validation`.
4. **P1/P2** Exploiter les résultats SAST, BetterLeaks, ZAP et Playwright sur le même HEAD, puis corriger les constats reproductibles.
5. **P2–P4** Reprendre l'accessibilité, l'i18n et le SEO uniquement après des preuves de parité avec le legacy.
