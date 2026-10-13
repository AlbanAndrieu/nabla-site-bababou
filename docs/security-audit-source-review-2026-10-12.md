# Revue de sécurité source-first — Bababou (périmètre réduit)

**État : PARTIAL / NEEDS_VALIDATION — 12 octobre 2026.** Ceci est une revue statique manuelle guidée par `cloudflare/security-audit-skill`, **pas** une exécution complète de ses six phases. Aucune vulnérabilité confirmée ; aucune conclusion de sécurité globale.

## Identité et provenance
- Dépôt : `AlbanAndrieu/nabla-site-bababou`
- HEAD initial consulté : `7318b82495e7453f9e46c9af42ef0e4893262bca` (des commits documentaires peuvent être ajoutés ensuite)
- Référence méthodologique : `cloudflare/security-audit-skill@c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`.
- Accès : lecture des fichiers source via GitHub. **Aucun build, navigateur, exploit, test des services déployés, outil upstream ni vérificateur de rapports exécuté** sur l'application dans cette revue.
- Exclusions : données personnelles/familiales, corpus privé, secrets, endpoints en production et contrôles Cloudflare du compte.

## Reconnaissance et frontières de confiance
- `proxy.ts` : proxy internationalisation Next.js ; rewrite racine vers `/index.html`, redirection des racines locales non-default ; `OPTIONS` retourne `204`.
- `app/__legacy-html-not-found__/route.ts` : GET lit uniquement `public/404.html` et retourne `404` avec `no-store`, `noindex`; HEAD répond `404` sans contenu.
- `lib/htmlFromPublic.ts` : `loadPublicHtmlFragment` n'accepte que le nom littéral `404.html` ; aucune traversée de chemin par paramètre utilisateur observée sur cet appel.
- `app/global-not-found.tsx` : extrait le corps du fichier 404 versionné, retire les éléments `<script>` via une regex, puis utilise `dangerouslySetInnerHTML`.
- `components/ThemeBootstrap.tsx` : JavaScript embarqué constant ; le choix du thème depuis `localStorage` est borné à trois valeurs.
- `api/hello.js` : endpoint public renvoyant un message constant ; aucune donnée sensible ni action privilégiée observée.
- `next.config.mjs` et `unit-tests/securityHeaders.test.ts` : `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy et Permissions-Policy déclarés ; CSP globale absente intentionnellement pour compatibilité legacy.

## Couverture et observations

| Surface | Preuve source | Observation | Statut |
| --- | --- | --- | --- |
| Traversée de chemin 404 | `lib/htmlFromPublic.ts` | Nom de fichier explicitement limité à `404.html`. | reviewed_source_only |
| Exposition 404 | `app/__legacy-html-not-found__/route.ts` | Réponse HTTP 404, cache désactivé ; absence de tests HTTP runtime. | reviewed_source_only |
| Injection HTML 404 | `app/global-not-found.tsx` | HTML provenant d'un actif versionné. Le retrait des scripts par regex **n'est pas un sanitiseur HTML générique** ; pas de source contrôlée par l'utilisateur démontrée. | needs_validation |
| Initialisation thème | `components/ThemeBootstrap.tsx` | Script statique ; valeur de thème allowlistée. | reviewed_source_only |
| Endpoint de démonstration | `api/hello.js` | Réponse constante sans paramètres exploités. | reviewed_source_only |
| En-têtes navigateur | `next.config.mjs`, `unit-tests/securityHeaders.test.ts` | Baseline codée, CSP absente volontairement ; efficacité en réponse HTTP non mesurée. | needs_validation |
| Internationalisation / proxy | `proxy.ts` | Rewrite vers ressource connue, aucune destination de redirection construite directement depuis une entrée libre observée. | reviewed_source_only |
| Dépendances et secrets | Non exécuté dans ce lot | BetterLeaks/SCA/SAST existants, mais aucun nouveau résultat analysé ici. | not_run |
| Auth / cloud / DAST | Non exécuté dans ce lot | Pas d'accès à des identités, données privées ou à la preview exacte-SHA. | not_run |

## Candidats à valider (pas de vulnerability findings confirmés)

**NV-01 — Traitement HTML de la 404 (risque conditionnel).** Prérequis : capacité d'altérer `public/404.html` ou chemin de chargement non fiable. La regex retire des tags `script` mais n'enlève pas tous les vecteurs d'exécution JavaScript. Aucune entrée attaquant prouvée dans la chaîne actuelle. Actions : préserver strictement la provenance/version de la 404 ; compléter les tests de contrat de chargement et privilégier une politique CSP compatible lorsque l'inventaire legacy le permettra. Ne pas remplacer l'ancienne 404 sans démontrer la parité.

**NV-02 — CSP globale absente (défense en profondeur).** Aucune CSP déployée par `next.config.mjs`, intention documentée dans un test de non-régression. Cela ne suffit **pas** à prouver une XSS. Actions : inventorier les dépendances (incluant Google Translate fallback), concevoir une CSP `Report-Only` progressive et mesurer l'impact sur la preview dans un chantier distinct avant application.

## Résultats et limites
- **Confirmed : 0 sur ce périmètre examiné** (ne signifie pas « aucune vulnérabilité » du dépôt).
- **Needs validation : 2 observations conditionnelles**, non reproduites.
- **Rejected : aucun verdict attribué** sans revue indépendante.
- **Manque** : exécution complète des six phases, sandbox d'exécution adéquat, analyse systématique du reste des sources, ledger JSON validé, `findings.json` validé, rapports upstream, navigateur/ZAP/Playwright exact-SHA, évaluation indépendante.
- **Bloqueur CI préexistant :** production Vercel `git_info_fail` sur `73b8cca`; ne pas contourner `verify-production-baseline.sh` pour masquer ce problème.

## Étapes de clôture
1. Réaliser une reconnaissance exhaustive hors données privées et un ledger couvrant routes, API, dépendances, builds, confidentialité, CI et Cloudflare/Vercel config.
2. Exécuter les hunters et validateurs upstream seulement sous les contraintes de sandbox du skill ; conserver les artefacts sensibles hors dépôt.
3. Reproduire localement les seuls candidats démontrables avec fixtures, faire une validation indépendante et publier un résumé expurgé sans données de l'enfant.
4. Corriger les findings confirmés dans la PR, préserver la 404 historique et les contrôles BetterLeaks, SAST, Playwright, ZAP.

## Lot complémentaire — chaîne de publication et confidentialité

Revue source-first de `scripts/vercel-ignore-build.sh`, `scripts/privacy-gate.ts`, `scripts/publication-privacy-gate.ts` et `scripts/verify-production-baseline.sh`.

- **Publication Vercel — écart corrigé** : le chemin de repli sur `HEAD^` lorsque `VERCEL_GIT_PREVIOUS_SHA` est absent peut sous-estimer les changements depuis le dernier déploiement valide, notamment si une branche possède plusieurs commits. Le script retourne désormais `1` (« construire ») si le SHA précédent est absent ou invalide, au lieu d'une décision de skip calculée sur un parent non fiable. Test de contrat : `unit-tests/vercelIgnoreBuildContract.test.ts`. C'est un durcissement de **correction et disponibilité des changements**, pas une vulnérabilité confirmée exploitable.
- **Confidentialité** : le gate de publication interdit explicitement plusieurs formats source bruts et exige une revue préalable, une vérification de rédaction irréversible et le contrôle des métadonnées. Le gate de confidentialité scanne des surfaces publiques et le build ; aucune exécution ni résultat runtime de ces contrôles n'est revendiqué ici.
- **Baseline production** : le script exige simultanément Vercel, Smoke et DAST, et refuse les statuts en échec. Le blocage actuel `git_info_fail` est conservé. Aucun bypass, fausse attestation de production ou correction de statut GitHub.

**Preuves manquantes** : exécution complète des scripts avec fixtures hermétiques, revue des résultats de scans effectifs, vérification dynamique de la preview et validation indépendante de la séquence de publication.
