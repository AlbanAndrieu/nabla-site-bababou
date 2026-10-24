# Opérations — runbook unique Bababou

**Périmètre :** Git/PR, contrôles locaux, Vercel, routage hybride, sécurité et incidents CI. La [roadmap](roadmap.md) suit les tâches encore ouvertes ; [homepage-migration-parity.md](homepage-migration-parity.md) définit la parité fonctionnelle ; [publication-redaction.md](publication-redaction.md) protège les contenus sensibles. Les anciens SHAs, runs et PR sont des **preuves historiques**, pas un état courant.

## 1. Autorités et invariants

- `.github/workflows/` définit la CI. La **Git integration Vercel** déploie le projet Next.js racine ; aucun Vercel CLI local ni sous-projet `app/` supplémentaire.
- `vercel.json`, `package.json`, `proxy.ts`, `next.config.mjs` et `scripts/vercel-ignore-build.sh` définissent le contrat de build et de routage.
- `justfile` est l'interface locale canonique ; conserver `Makefile` pour compatibilité. Les versions sont verrouillées par `mise.toml`, `mise.lock`, `package.json` et `package-lock.json`.
- La homepage `/` continue de servir le HTML legacy approuvé. La Preview React `/[locale]/home-preview` requiert un opt-in serveur et reste `noindex`. Ne pas la publier ni activer la collecte additionnelle sans revue.
- Une PR d'agent reste **Draft**. Les workflows qui filtrent les Draft peuvent être `skipped`, mais **Draft ne garantit pas zéro workflow**. Ne pas ajouter `[skip ci]`, ne pas court-circuiter les gates et ne pas relancer les Actions payantes pour déboguer un formatage local.
- Aucun acteur ne fusionne, ne promeut ou ne modifie des protections sans demande explicite.

## 2. Reprise locale — procédure

Exécuter les commandes dans un checkout Git complet et sur une branche non-default. Un runbook n'est pas une preuve d'exécution.

1. Contrôler la branche avec `git branch --show-current`.
2. Contrôler les changements avec `git status --short`.
3. Contrôler les outils avec `just toolchain-check`.
4. Contrôler la syntaxe locale avec `just offline-l1`.
5. Contrôler la base Git disponible avec `QUALITY_BASE_REF=origin/master just offline-pr`.
6. Exécuter les contrats Node sans dépendances avec `just offline-contracts`.
7. Après `npm ci`, exécuter `just source-check`.
8. Exécuter le préflight et les contrats P0 avec `just p0`.
9. Exécuter `just quality-fix` si une correction déterministe est nécessaire.
10. Examiner toute mutation avec `git diff --check`.
11. Exécuter `just quality`.
12. Sur un HEAD committé propre, exécuter `just publish`.
13. Contrôler la preuve exacte sans relancer les gates avec `just publish-status`.

Les commandes `offline-*` ne valident pas les dépendances, le build, l'accessibilité ni les scanners de sécurité. `just source-check` utilise le parseur TypeScript, l'inventaire des scripts legacy et les contrats React ciblés. `just homepage-runtime-parity` surveille **15 inclusions** du HTML historique ; une absence de dérive ne prouve pas l'équivalence des widgets.

Pour les erreurs des scripts qualité : `bash scripts/agent-p0-check.sh --verbose` développe les logs ; `P0_LOG_TAIL`, `QUALITY_LOG_TAIL` et `QUALITY_DIFF_LINES` limitent uniquement le volume affiché. Les avertissements ou `NOT_RUN` ne sont pas transformés en succès.

### Travail en worktree / terminal interactif

- Ne pas envoyer `set -euo pipefail` directement dans le shell interactif parent. Lancer les séquences strictes dans un script Bash enfant ou un sous-shell.
- Isoler chaque worktree et ses répertoires `node_modules`, `.next` et `.venv`. Ne partager que des caches de téléchargement sûrs. Sérialiser les écritures de métadonnées Git entre agents.
- Ne pas effacer des modifications inconnues par `reset --hard`, `clean -fd` ou `worktree prune`.
- Ne pas sourcer automatiquement `.envrc`/direnv ni charger les secrets production pour une vérification read-only.
- Si le réseau GitHub/npm est absent, ne pas répéter des requêtes identiquement vouées à l'échec. Utiliser un snapshot vérifié au SHA exact ou les fichiers minimaux avec un niveau de preuve L0/L1 clairement identifié.

### Classification des preuves

| Niveau | Ce qui est attesté |
| --- | --- |
| L0 | Lecture de source/configuration au SHA donné |
| L1 | Exécution ciblée sur fichiers réels ou fixture explicitement délimitée |
| L2 | Convergence locale des contrôles concernés et corrections déterministes |
| L3 | `just publish` vert, sur un HEAD committé propre et vérifié |

Un statut CI GitHub/Vercel est une preuve **distante distincte**. Déclarer `NOT_RUN` ou `BLOCKED` pour les vérifications absentes. Ne pas présenter un test Node 22 comme un build Next.js Node 24 LTS/npm 12.

## 3. Preview et validation production

1. Vérifier le HEAD demandé et le SHA réellement construit dans Vercel.
2. Vérifier Node 24.x, la compilation Next et TypeScript dans les logs du même déploiement.
3. Vérifier l'état `READY` du déploiement ; un build ignoré par `scripts/vercel-ignore-build.sh` ne vaut pas un build.
4. Vérifier la protection de la Preview ; ne pas désactiver Password Protection pour faciliter un test.
5. Vérifier les routes, le contenu approuvé, la navigation, le responsive, les redirections et les réponses 404 sur cette Preview.
6. Exécuter Playwright, WCAG/axe et ZAP sur **cette même révision**, depuis un environnement autorisé.
7. Après promotion approuvée, vérifier le domaine, `Production Post-deploy Smoke` et `Production DAST` au SHA réellement servi.

La publication de nouvelles données familiales relève de [publication-redaction.md](publication-redaction.md). Aucun `READY`, `success` ou en-tête HTTP isolé ne valide la confidentialité de bout en bout.

`scripts/production-home-smoke.sh` effectue les requêtes publiques en lecture seule. `PRODUCTION_SMOKE_VERBOSE=1` développe le détail. Distinguer `403`/auth, `429`/challenge, indisponibilité DNS et véritable `5xx`.

### Recette dédiée — refactoring des routes et politiques

Les listes communes sont dans `lib/mainContentRoute.mjs`. Le module `lib/nativePolicyCatalog.ts` décide des URL et du contenu juridique. Les traductions de l'index sont chargées par `i18n/messages.ts`. Avant publication de ce type de refactoring :

1. Exécuter `just offline-contracts` pour la parité des slugs, des ancres et des catalogues.
2. Exécuter `npm run test:unit` sur Node 24/npm 12 pour le fournisseur juridique typé et les anciens contrats de routage.
3. Exécuter `npm run typecheck` après génération des types Next.
4. Exécuter `npm run build` et comparer les redirections `.html`, `/ca/index.html` et `/nre-{fr,en}.html`.
5. Exécuter `npx playwright test tests/policy-index.spec.ts tests/policy-next.spec.ts tests/accessibility-keyboard.spec.ts` sur une Preview **au SHA exact** et autorisée.
6. Comparer les six liens juridiques, les titres, descriptions, canonical et hreflang sur FR/EN/DE/NO.
7. Réexécuter `just quality`, la vérification privée et les scanners avant Ready/merge.

Une égalité de listes et de traductions vérifiée dans les sources est une **preuve L0**, pas une recette HTTP ni un build validé. Préserver la page `public/index.html` et les fichiers juridiques historiques.

## 4. Diagnostic — signatures qui ne sont pas déductibles du code

| Signature | Hypothèse à vérifier | Action en lecture seule |
| --- | --- | --- |
| `runner_id=0`, `steps=[]` ou `null` | Job non alloué ; quotas, droits ou infrastructure possibles | `just ci-diagnose <run_id>` ; consulter Billing/Actions ; ne pas conclure à un bug de code |
| Vercel `git_info_fail` | Métadonnées Git ou liaison projet/intégration GitHub défaillantes | Vérifier Project → Settings → Git et les événements du déploiement ; préserver [l'incident daté](vercel-github-baseline-recovery-2026-10-13.md) |
| Statut Vercel `success` avec `Canceled by Ignored Build Step` | Build volontairement ignoré, pas un déploiement `READY` | Vérifier les fichiers du scope et le SHA d'un véritable build |
| `PROD_BASE_UNHEALTHY` | La référence de production n'a pas de preuves Vercel/Smoke/DAST suffisantes | `scripts/verify-production-baseline.sh` et preuves externes ; ne pas assouplir la garde |
| `HTTP 429` + `x-vercel-mitigated: challenge` | Vercel Security Checkpoint | Distinguer challenge de panne applicative ; vérifier identité et environnement autorisés |
| Preview `READY`, Playwright/ZAP rouge | SHA, bypass, routing, accès ou défaillance réelle | Vérifier SHA → URL → trace/alerte → configuration → code |
| Ref `vercel-preview-*` sans deployment | Ref Git non consommée par Vercel | Examiner événement Git et association au deployment réel |
| Legacy HTML absente / 404 routée vers `/[locale]` | Next intercepte la route avant le fallback | Vérifier `next.config.mjs`, `handle: miss`, `check: true`, `x-matched-path` et le test 404 |
| `master` Quality rouge après merge | Echec réel du job ou problème de runner | Lire workflow → job → step → première erreur ; ne pas attribuer un `success` de remédiation à la gate source |

Les codes de `scripts/ci/diagnose-actions-startup.sh` : `0` succès d'analyse, `1` step exécuté en échec, `2` échec avant step, `3` en attente, `4` lecture inconclusive. Un code `2` n'atteste pas une cause de facturation. Les log/artifacts complets ne sont consultés qu'après identification du premier défaut.

### Incidents quality `master` sans prolifération d'issues

Le workflow `.github/workflows/post-merge-quality-follow-up.yml` possède son registre `[quality-follow-up] unresolved master Quality failures` et prépare une PR Draft si une remédiation est possible. Il ne fusionne pas. Il conserve un commentaire par SHA/run au lieu d'une issue par run ; l'automatisation ne doit ni reprendre une issue modifiée manuellement ni rouvrir une issue fermée.

**Clôture :** seuls les **deux plus récents** runs `CI (Quality and Security)`, événement `push`, branche `master`, tous deux `completed/success`, permettent d'envisager la clôture d'un ticket strictement détenu par le bot. Un run plus récent rouge, en attente, ignoré ou annulé bloque cette clôture. Les dix anciens tickets Quality (#183–#231) exigent aussi revue des preuves ; une Preview verte ne les résout pas. La remédiation réussie au sens de l'agent ne vaut pas une Quality `master` verte.

### Release / ancien routage

- `node scripts/ci/release-tag-bridge.mjs --check` vérifie la cohérence de tags sans écriture. `--apply` est réservé au workflow de Release et exige la vérification du SHA distant.
- Le routage `*.html` peut dépendre de `handle: miss` + `check: true` ; ne pas revenir à `afterFiles`/`handle: error` sans tests. Voir tests de régression route 404.
- Le fallback homepage `/` peut inclure des `307` de handshake ou un cookie de bypass ; distinguer cette transition de l'état final `200` attendu sur le HTML.

## 5. Sécurité, confidentialité et outillage annexe

`just secrets-config`, `just secrets-staged`, `just secrets-worktree` et `just secrets-history` utilisent **BetterLeaks v1.9.0**, sans Gitleaks. Les scanners SAST/SCA, la publication privée, Playwright et ZAP restent distincts et bloquants selon le scope. Ne jamais indexer `.private-publication-source/**` ou `.redaction-work/**`, ni exposer les secrets dans logs/artefacts. Lire [publication-redaction.md](publication-redaction.md) avant toute publication et [security-audit-coverage-ledger.md](security-audit-coverage-ledger.md) pour les constats datés.

`public/site-analytics.js` charge Web Analytics et Speed Insights selon la configuration, sans exiger de Vercel CLI local. Vérifier les endpoints `/_vercel/insights/script.js`, `/_vercel/speed-insights/script.js` et le consentement sur un vrai déploiement.

Dagger est un **POC opt-in** via `just dagger-*`. Les hooks `shfmt-docker` et `hadolint-docker` empêchent encore de revendiquer une parité de qualité complète sur le moteur isolé. Context7 et Cloudflare security-audit-skill ne doivent jamais recevoir des documents privés ; leur installation ou usage n'est pas une preuve de résultat.

## 6. Références et historique à conserver

- [README](../README.md) — vue d'ensemble et carte de navigation documentaire.
- [Roadmap](roadmap.md) — travaux **ouverts** et critères d'acceptation.
- [Parité homepage](homepage-migration-parity.md) — contenu et comportement à préserver.
- [Publication/redaction](publication-redaction.md) — politique opérationnelle sensible.
- [Couverture des audits](security-audit-coverage-ledger.md) — preuves ZAP/SAST/SCA datées.
- [Cloudflare security-audit-skill](security-audit-skill.md) — qualification du skill sans divulgation.
- [Revue statique de sécurité du 12 octobre](security-audit-source-review-2026-10-12.md) — preuve historique partielle, non remplacée par un scan.
- [Incident Vercel/GitHub du 13 octobre](vercel-github-baseline-recovery-2026-10-13.md) — diagnostic historique `git_info_fail`.
- [Déploiement Vercel](../.github/vercel-deployment-instructions.md) — paramètres d'intégration.

**Ne pas recopier l'historique de commits, les SHAs anciens et les comptes rendus de tests dans la roadmap.** Les rapports datés restent des pièces de preuve ; ils ne dirigent pas les opérations courantes.
