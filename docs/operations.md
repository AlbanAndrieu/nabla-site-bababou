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

## Annexe A — reprise d'un agent sans accès réseau

Cette annexe conserve les prérequis de diagnostic qui ne sont pas visibles dans le code du site et les décisions à prendre face à une erreur de lancement. Elle ne permet pas de déclarer une compilation Next verte sans dépendances.

### A.1 Séparer les deux versions de Node sans modifier les fichiers d'outillage

- Le développement et les workflows principaux utilisent `.nvmrc` : **Node 26 Current**.
- Vercel utilise `.nvmrc-production` : **Node 24.x**.
- Mise déclare `node = "24"` et `npm = "12.2.1"` pour les contrôles de compatibilité.
- Le fichier `.nvmrc` ne doit pas être remplacé silencieusement par la version Mise : les deux chemins couvrent des environnements distincts.
- Les intervalles exacts de `package.json#engines` sont vérifiés avant l'exécution des tests.
- En local, identifier explicitement le runtime actif plutôt que déduire la version depuis le nom du terminal.

```bash
git rev-parse --show-toplevel
git rev-parse HEAD
node --version
npm --version
cat .nvmrc
cat .nvmrc-production
mise current node npm  # seulement si mise est déjà présent
```

Le diagnostic de version doit signaler un runtime incompatible avant un téléchargement de 300 Mo ou un build. Un changement de runtime ne remplace pas un test de régression.

### A.2 Vérifications hors réseau

1. Lire `git status --short` sans supprimer les modifications d'un autre agent.
2. Comparer `git rev-parse HEAD` au SHA de la PR à diagnostiquer.
3. Vérifier `node --version` et la politique des deux runtimes.
4. Exécuter `just offline-l1` si `just` et le checkout Git sont présents.
5. Exécuter `just offline-contracts` avec un Node compatible.
6. Exécuter `just homepage-runtime-parity` pour les scripts historiques.
7. Lire les résultats en distinguant `PASS`, `FAIL`, `BLOCKED` et `NOT_RUN`.
8. Ne pas lancer de `npm install` si les registres sont inaccessibles.

Sans accès DNS à GitHub/npm, ne pas prétendre avoir installé les dépendances ni exécuté le build. Les fichiers lus via le connecteur GitHub fournissent uniquement une preuve de source, pas un checkout local.

### A.3 Vérifications du build avec dépendances présentes

1. Vérifier les versions verrouillées avec `just toolchain-check`.
2. Installer uniquement depuis le lockfile avec `npm ci --no-audit --no-fund`.
3. Lancer `just source-check` avant les tests lourds.
4. Lancer `npm run test:unit` sur le même checkout.
5. Générer les types Next avec `npx next typegen`.
6. Lancer `npm run typecheck` après génération des types.
7. Lancer `npm run build` en conservant le statut de sortie.
8. Exécuter les navigateurs seulement si le build attendu et l'accès au site sont disponibles.
9. Conserver le premier message d'erreur et le SHA, sans poster d'identifiants sensibles.
10. Ne pas substituer le code retour d'une commande de diagnostic à celui du build.

### A.4 Scénarios d'échec à classifier

| Signal | Classe | Vérification initiale |
| --- | --- | --- |
| `ENOTFOUND` / `EAI_AGAIN` sur le registre npm | Réseau | DNS/résolution ; ne pas répéter sans changement de contexte |
| `npm ERR! EBADENGINE` | Runtime | Comparer `node -v` et `package.json#engines` |
| `npm ci` refuse le lockfile | Dépendances | Comparer `package-lock.json` et `package.json`, sans `npm install` correctif automatique |
| `Cannot find module next` | Prérequis | Vérifier le checkout et `node_modules`, ne pas qualifier une erreur applicative |
| `Cannot find module typescript` | Prérequis | Vérifier `npm ci` avant `just source-check` |
| `TS17001` | Compilation | Contrôler les attributs JSX dupliqués avec `check:jsx-attributes` |
| `TS2307` | Imports | Vérifier alias `@/`, noms de fichiers et dépendances verrouillées |
| `TS7016` pour un `.mjs` | Types | Vérifier `allowJs` et `tsconfig.json`, sans créer un shim non examiné |
| `Module not found` pendant Next | Build | Lire l'import précis, la casse et le bundler Turbopack |
| `next-env.d.ts` modifié | Génération | Utiliser le wrapper `run-next-clean.sh` et comparer le diff final |
| `QG_LARGE_DELETION` | Protection | Vérifier le contenu supprimé depuis la base ; conserver les diagnostics essentiels |
| `QG_BASE_STALE` | Git | Rebaser avec une base valide sans écraser les changements locaux |
| `QG_PUBLISH_PROOF_STALE` | Preuve | Réexécuter la gate sur le HEAD final au lieu de réutiliser une ancienne trace |
| `404` sur une ancienne URL HTML | Routage | Examiner la réécriture legacy et les redirections localisées |
| `401`/`403` sur Preview | Accès | Vérifier la protection Vercel et le jeton autorisé, sans la désactiver |
| `429` avec challenge | Mitigation | Vérifier `x-vercel-mitigated` avant de conclure à une panne |
| `READY` sans build | Déploiement | Vérifier `scripts/vercel-ignore-build.sh` et les événements Git |

### A.5 Particularités des contrats du site

- La racine `/` reste le document HTML historique, y compris lorsque les pages Next compilent.
- Les pages locales de test ne sont pas automatiquement une preuve de publication de la homepage.
- Les 15 scripts historiques peuvent rester présents sans avoir de parité React.
- Le test des politiques vérifie 6 slugs × 4 locales ; les traductions de l'index représentent 20 chaînes approuvées.
- La centralisation des routes ne justifie aucune modification de canonical, hreflang, sitemap ou 404.
- Les preuves du rendu doivent être obtenues sur le deployment exact, pas sur une autre Preview.
- Les données familiales privées, les secrets et les originaux non expurgés restent hors des journaux de l'agent.

### A.6 Résultat à enregistrer dans la description de PR

Indiquer le SHA, le runtime actif, les commandes exécutées, les contrôles réussis et les limites `NOT_RUN`. L'absence de registre npm ou de clone Git empêche une preuve L2/L3. Conserver séparément les vérifications L0 du code et les tests L1 réellement exécutés. Ne pas déclencher de CI payante pour faire disparaître un statut `BLOCKED`.
