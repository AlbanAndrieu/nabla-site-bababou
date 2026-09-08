# Roadmap consolidée — migration Next.js

> Source unique pour les TODO, migrations et refactorings encore actifs du projet.
> Ne pas créer de nouveau `TODO.md`, `MIGRATION.md` ou roadmap parallèle : ajouter les travaux ici et lier la PR correspondante.

## Principes

- Next.js/Vercel est le runtime cible.
- La migration reste incrémentale : les pages statiques de `public/` continuent de fonctionner jusqu'à leur remplacement explicite.
- Une route legacy n'est redirigée définitivement vers Next qu'après parité fonctionnelle, visuelle, SEO, accessibilité et tests E2E.
- Les locales de premier rang sont `fr`, `en`, puis `de` et `no`. Google Translate reste un complément, pas une source de routes canonicales.
- Les PR de migration doivent rester petites et supprimer une dette legacy mesurable plutôt que créer une seconde implémentation durable.
- Respecter autant que possible la structure et le nommage stabilisés dans `nabla-site-alban` ; documenter explicitement les divergences nécessaires au mode hybride Bababou.
- Suivre les patterns du `master` courant de `nabla-site-alban`, pas un ancien snapshot : helpers partagés, types de routes Next natifs, ownership i18n par les composants et tests de contrat doivent être portés lorsqu'ils s'appliquent à Bababou.
- Ne pas recopier aveuglément les politiques propres au repo de référence : `nabla-site-alban` a l'anglais à la racine, alors que Bababou conserve le français comme `defaultLocale` non préfixée.
- La homepage `/` et `public/index.html` sont des exceptions de publication contrôlées par le propriétaire : toute modification de pseudonymisation, caviardage ou disclosure sensible sur ces surfaces nécessite un accord explicite préalable.
- Le privacy hardening global hors homepage est volontairement reporté à la dernière phase de cette roadmap ; les contrôles déjà en place restent actifs entre-temps.
- `public/404.html` est une exception protégée : il reste la source visuelle revue de la 404 et doit être servi via le mécanisme `global-not-found`, sans réécriture React native non approuvée.

## Ordre d'exécution prioritaire — décision du 2026-08-26

1. **Migration Next.js** : réduire la dette hybride sur les routes déjà natives, puis migrer les pages publiques à faible risque.
2. **UI/UX et accessibilité** : harmoniser chrome, composants, responsive, navigation clavier et design system.
3. **SEO et métadonnées** : canonicals, redirects, hreflang, sitemap/robots, Open Graph et Twitter/X par route.
4. **Nettoyage technique** : supprimer progressivement code, scripts, dépendances et assets legacy devenus sans consommateur.
5. **Performance et CI** : réduire tracing, builds, téléchargements inutiles et coûts de validation.
6. **Confidentialité finale hors homepage** : pseudonymisation/caviardage du corpus restant, extension du gate et vérification irréversible des documents/assets concernés.

## État de référence — 2026-09-08

### Terminé

- [x] Déploiement configuré comme projet Next.js/Vercel.
- [x] App Router et `next-intl` introduits.
- [x] Routage hybride : `/` sert temporairement `public/index.html` avant `next-intl` via `proxy.ts`.
- [x] Les fichiers statiques explicites de `public/` restent servis pendant la migration.
- [x] Canonicals et metadata Next corrigés pour Bababou et la locale française par défaut.
- [x] Routes françaises sans préfixe et routes anglaises sous `/en` pour les surfaces Next natives.
- [x] Le home reste volontairement mono-canonical sur `/` tant que son cutover n'est pas terminé ; `/fr` et `/en` ne publient pas de faux home Next.
- [x] Bridge progressif HTML -> React utilisé pendant la migration des policies ; les routes policy n'en dépendent plus après leur passage intégral en contenu natif. `htmlFromPublic` reste volontairement limité à l'exception 404 protégée.
- [x] Playwright Preview utilise le SHA et l'URL de déploiement exacts, le bypass Vercel et un fallback OIDC.
- [x] CI Next génère les types de routes avant le typecheck et conserve `public/**` comme source runtime pendant la phase hybride.
- [x] Script `scripts/vercel-ignore-build.sh` ajouté pour réduire les déploiements inutiles.
- [x] `vercel.json` applique `bash scripts/vercel-ignore-build.sh` via `ignoreCommand`; le contrat unitaire le verrouille et un commit docs-only a été ignoré/cancelé côté Vercel comme attendu (#141).
- [x] Sélecteur de langue généré depuis `routing.locales` au lieu d'options FR/EN maintenues à la main (#101).
- [x] Migration 2 / P1 intégrée à `master` : CI qualité, `next build`, contrats E2E Next/Vercel et invariants hybrides (#100/#102).
- [x] Migration 3a / P2 intégrée : politique canonical hybride, alternates, `PageProps` générés et primitives d'accessibilité partagées (#105).
- [x] Migration 3b / P2 intégrée : catalogues runtime focalisés `site`, `contact`, `email`, `link`, nettoyage des surfaces Next actives et sitemap hybride (#106).
- [x] Privacy policy et exception homepage/index clarifiées, avec aliases juridiques `Mr A` / `Ms B` et règle de caviardage (#110).
- [x] Les anciens `messages/{locale}.json` ne sont plus chargés par le runtime Next ; les namespaces déjà migrés ont été retirés de ces catalogues legacy.
- [x] Ancien contrat de conservation du `postinstall` remplacé par un contrat d'absence après audit complet de ses inputs/outputs (#145).
- [x] Migration 5 : redirects `contact`/`email`/`link`, metadata sociales par route, top anchor et validations Preview E2E (#116).
- [x] La tentative de 404 Next localisée de #118 a été remplacée par la restauration de l'exception statique protégée `public/404.html` via `global-not-found` (#139).
- [x] Preview E2E dédupliqué sur `repository_dispatch` avec cache Chromium réutilisable depuis le scope de la branche par défaut (#121).
- [x] Migration 7 / P5 : manifeste/lockfile réconciliés, tooling Next 16.3.2 aligné et dépendances Express orphelines retirées (#123).
- [x] Locales de premier rang `fr`, `en`, `de` et `no` activées dans `routing.locales`, avec catalogues et contrats de routing/SEO associés (#129).
- [x] Les six policies (`service_terms`, `privacy_policy`, `legal`, `impressum`, `cookie_policy`, `accessibility_statement`) sont rendues nativement en FR/EN/DE/NO (#130, #131, #134, #136), avec récupération du contrat Preview E2E après #136 (#137).
- [x] Index `/policy` natif localisé ajouté et comportement 404 statique protégé restauré (#139).
- [x] Résultats de paiement `success` / `cancel` migrés vers des routes Next FR/EN/DE/NO noindex, avec redirects legacy et domaine i18n dédié (#140).
- [x] Réconciliation post-#140 validée sur Preview exact : FR non préfixé déterministe, 404 globale statique protégée, cleanup payment et Playwright 167/167 sur le SHA déployé (#141).
- [x] Routes/aliases fantômes `pricing`, `payment`, `startup`, `startup-thanks`, `checkout`, `checkout-tjm`, `login`, `ai`, `security`, `expertise`, `ciso`, `truenas`, `ctid`, `freenas`, `nabla`, `workstation`, `cv` et `jm` retirés du catalogue ; configuration/générateur legacy, support homelab non routé et styles dédiés `security`/`ciso`/`login`/`ctid` supprimés (#142).
- [x] Documentation agent/outillage réconciliée avec l'architecture Next/Vercel réelle ; anciennes références `my-app`, `vue-client`, runbook frontend absent et sitemap obsolète retirées (#142).
- [x] Manifeste secondaire `public/package.json` supprimé après preuve d'absence de consommateur ; documentation locale/Playwright/Copilot réalignée sur le runtime Next/Vercel (#143).
- [x] Retirer aussi `main: "index.html"` du `package.json` racine privé : `public/index.html` reste une surface HTTP owner-controlled via `proxy.ts`, pas un entrypoint de package npm (#168).
- [x] SDK Stripe Node/React retirés après confirmation qu'aucun code runtime ne les importe ; les résultats `success`/`cancel` conservent uniquement le lien Checkout hébergé (#144).
- [x] Hardening CI post-#167 : caches npm/pre-commit/Next best-effort, réutilisation de `.next/cache`, GitHub Actions Quality/Copilot pinées sur SHA immuables et gate final 160/160 vert.

### Blocages opérationnels actuels

- [x] Vérifier le binding DNS/domaine de `bababou.com` et le rattachement au projet Vercel.
  - [x] Vérification Vercel API du 2026-09-08 : le projet `nabla-site-bababou` publie bien les alias `www.bababou.com` et `bababou.com`, ainsi que les domaines `*.vercel.app`.
  - [x] Le déploiement production post-#168 est `READY` sur le SHA exact `234f847b0cf760162f7b0d69a5da0a2247fd843b`; HTTPS atteint bien Vercel sur `www.bababou.com`.
  - [x] Les probes automatisées non authentifiées peuvent recevoir le Vercel Security Checkpoint (`HTTP 429`, `x-vercel-mitigated: challenge`) ; ce signal ne doit plus être interprété comme un domaine détaché ni comme un succès applicatif.
- [ ] Vérifier `/`, `/index.html`, les routes Next déjà migrées et Playwright Preview sur le SHA exact après chaque changement de routage/runtime.
  - [x] Câbler un smoke production léger sur `vercel.deployment.success` pour `master`/`production`, sans `npm ci` ni navigateur : `/`, `/index.html`, `/test` FR/EN/DE/NO, `/test.html`, `/contact` et `/policy` sont vérifiés sur le deployment URL exact avec bypass/OIDC.
  - [x] Sonder séparément `https://www.bababou.com/` et classer `HTTP 429` / `x-vercel-mitigated: challenge` comme Security Checkpoint informatif lorsque le deployment exact est sain.
  - [x] Observer le premier smoke production post-merge : #170 a déployé `cdf0dfa` en `READY` avec les alias `www.bababou.com` / `bababou.com`; Vercel ne remonte aucun runtime 4xx/5xx sur ce déploiement et la homepage publique répond. Le run Playwright #521 a néanmoins false-fail sur le `HTTP 307` du rewrite protégé `/ → /index.html`, pas sur une panne applicative.
  - [x] Corriger le smoke pour accepter uniquement ce `307` attendu vers `/index.html`, après avoir exclu les redirects d'authentification Vercel ; `/index.html` reste ensuite vérifié séparément en `200`.
  - [ ] Observer le premier smoke production **corrigé** sur un nouveau `vercel.deployment.success` avant de considérer ce contrôle opérationnel comme stabilisé.

## P1 — Stabiliser et simplifier le runtime

Objectif : un seul chemin de build et de déploiement, aligné sur `nabla-site-alban`, sans casser le runtime legacy encore requis.

- [x] Remplacer l'ancienne version preview de Next.js par une version stable ; le projet utilise désormais Next `16.3.4` (Active LTS), au-delà du minimum `16.3.3` de la security release d'août 2026.
- [x] Aligner explicitement `next` et `eslint-config-next` dans le manifeste/lockfile et vérifier leur résolution effective (#123), puis converger vers `16.3.4` comme `nabla-site-alban`.
- [x] Séparer la cible de validation Node 25 du runtime Vercel : local/CI restent sur Node `25.9.0`, tandis que `package.json#engines.node` accepte `>=24.11.0 <26` afin que Vercel puisse utiliser son runtime Node 24.x supporté ; npm reste `>=11.17.0 <12`.
  - [x] Réconcilier les métadonnées `engines` racine du lockfile lors de la régénération atomique du lockfile (#123), puis après le correctif de compatibilité Vercel post-#150.
- [x] Supprimer `express` et `@types/express` après confirmation de l'absence de consommateur (#123).
  - [x] Audit du code versionné : aucun import ESM, `require()` ou appel `express()` trouvé.
  - [x] Retrait effectif avec régénération atomique du lockfile (#123).
- [x] Retirer Wrangler et `wrangler.jsonc` après décision explicite du propriétaire (#150).
  - [x] Audit dépôt : aucune CI ni consommateur applicatif Wrangler détecté.
  - [x] Retirer le manifeste autonome `public/package.json` et les instructions qui présentaient Wrangler comme runtime recommandé (#143).
  - [x] Retirer le package, les scripts npm, la configuration et les nœuds lockfile exclusivement liés (#150).
  - [x] Réconcilier ensuite la documentation de `public/`/contribution et les exclusions pre-commit : aucun `my-app/`, aucun web-root autonome, licence MIT et runtime Next racine.
- [x] Auditer puis retirer les sorties `dist/`, `index/dist/` et le `postinstall` legacy (#145).
  - [x] Les quatre inputs applicatifs historiques (`index.html`, `wireframe.css`, `app/scripts/arf.js`, `app/resources/`) n'existent plus à la racine.
  - [x] Les sorties `dist/` et `index/` ne sont ni versionnées ni consommées par le runtime Next/Vercel ou la CI GitHub actuelle.
  - [x] Le `dist/` encore cité dans `.gitlab-ci.yml` appartient à l'ancien `vue-client/`, pas au `dist/` racine.
  - [x] Le D3 réellement servi aux pages legacy reste le fichier versionné `public/d3.v3.min.js`; aucun import npm `d3` n'existe.
  - [x] Retirer atomiquement `postinstall`, `copyfiles`, `d3` et leurs 47 entrées lockfile exclusivement dépendantes.
  - [x] Remplacer le contrat de conservation par un contrat d'absence.
- [x] Supprimer les scripts runtime redondants après preuve d'absence de consommateurs.
  - [x] Retirer `dev:v`, `build:v`, `start:v`, l'ancien `build.sh` et le package CLI `vercel`; les déploiements sont portés par la Git Integration Vercel (#146).
  - [x] Retirer `dev:wrangler`, `start:wrangler`, `deploy:wrangler` avec Wrangler (#150).
- [x] Conserver un seul couple nominal `build: next build` / `start: next start` comme `nabla-site-alban`; retirer `scripts/run-next-build.mjs` et mesurer l’unique build directement dans Quality via les phases `check:prebuild` / build / `check:postbuild`, sans seconde compilation. `dev:test`, `start:test` et `start-python` restent des helpers explicites de test/diagnostic (#168).
- [x] Exécuter explicitement `next build` dans la CI GitHub de qualité afin de ne pas dépendre uniquement de Vercel pour valider la compilation.
- [x] Contraindre le tracing de `htmlFromPublic.ts` aux fragments explicitement allowlistés (#108).
- [x] Réduire ensuite `htmlFromPublic.ts` au seul `public/404.html` protégé et retirer le composant `PublicHtmlFragment` devenu sans consommateur après la migration native complète des policies.
- [x] Éviter le pull de l'image Docker Snyk lorsque `SNYK_TOKEN` est vide ; la CI utilise désormais le CLI uniquement lorsque le token existe.
- [x] Mesurer l'impact sur taille d'installation/cache et durée de build après ces optimisations.
  - [x] Réduire le graphe d'installation de 47 paquets via #145, 324 paquets CLI Vercel via #146 puis 144 paquets observabilité/devtools via #147 avant de comparer les nouvelles baselines CI.
  - [x] Instrumenter le job Quality sans second build : `npm ci`, `node_modules`, cache npm, `npm run check`, `next build` et taille `.next` sont publiés dans le Job Summary (#122).
  - [x] Conserver plusieurs baselines post-merge et comparer les régressions avant d'ajuster davantage la CI ; #158, #167 et #168 fournissent désormais trois points de référence.

## P2 — Finaliser l'architecture i18n et routing

- [x] Nettoyer les derniers textes/labels copiés du site `nabla-site-alban` qui subsistaient dans les catalogues legacy non chargés : le namespace professionnel `home` est retiré de `messages/fr.json` / `messages/en.json`, et le skill de migration interdit désormais de recréer des namespaces runtime dans ces registres racine.
  - [x] Les surfaces Next actives ne rendent plus le chrome professionnel copié.
  - [x] `contactPage`, `email` et `linkPage` n'existent plus en double dans les catalogues legacy.
- [x] Générer le sélecteur de langue depuis `routing.locales`.
- [x] Composer les catalogues runtime via `i18n/messages.ts` avec loaders explicites par locale et rejet des namespaces dupliqués.
- [x] Extraire les domaines runtime sous `messages/site`, `messages/contact`, `messages/email`, `messages/link`, `messages/checkout` et `messages/test` pour la surface technique localisée.
- [x] Introduire un skip-link Next partagé.
- [x] Remplacer les types locaux de props par les `PageProps<...>` générés lorsque pertinent.
- [x] Centraliser la politique canonical des routes Next natives : FR sans préfixe, EN/DE/NO préfixés, y compris `contact`, `email`, `link`, `success`, `cancel` et les policies.
- [x] Générer les alternates depuis `routing.locales` avec `fr` comme `x-default`.
- [x] Stabiliser FR et EN sur un Preview réel avant d'ajouter de nouvelles locales (#116, #118, #121).
- [x] Ajouter `de` et `no` à `routing.locales` avec des catalogues complets et validés (#129).
- [ ] Garder Google Translate uniquement pour les langues hors locales de premier rang.
  - [x] Retirer le double bootstrap Google Translate legacy des deux derniers consommateurs de `google-translate-config.js` : conserver uniquement `site-google-translate.js`, qui possède déjà le mount, le callback et le chargement externe, puis supprimer le stub no-op devenu orphelin (#171).
  - [x] Les routes Next natives restent exclusivement pilotées par `next-intl` pour FR/EN/DE/NO ; les instructions agent/Copilot interdisent d'ajouter Google Translate aux nouvelles surfaces Next.
  - [ ] Les pages HTML legacy peuvent encore proposer Google Translate, y compris vers une locale de premier rang lorsqu'aucune route native équivalente n'a atteint la parité ; réduire cette liste au fil des migrations, sans casser le fallback legacy.
- [x] Réconcilier les catalogues/routes legacy avec les surfaces réellement publiées : 18 routes/aliases fantômes retirés de `SITE_PAGES`, `lib/htmlRoutes.config.mjs`, `scripts/old/generate_fr_locale_html.py` et le support homelab sans route supprimés après audit d'absence de consommateur (#142).

## P3 — Migration Next.js et UI/UX

### Homepage owner-controlled

- [ ] Décomposer progressivement `app/[locale]/page.tsx` en composants de sections focalisés en conservant strictement les disclosures approuvées.
- [ ] Déplacer les textes localisables vers `messages/home/{locale}.json` sans pseudonymiser ni modifier les informations sensibles approuvées.
- [ ] Toute proposition qui change une identité, un caviardage ou une disclosure de `/` / `public/index.html` doit être présentée au propriétaire avant modification.
- [ ] Retirer chaque section legacy du fragment dès que son composant React atteint la parité.
- [ ] Vérifier responsive/mobile, accessibilité, liens, assets, metadata et SEO.
- [x] Retirer le scaffold `app/components/Hero.tsx` orphelin avant le cutover : aucun consommateur, namespace `home` déjà retiré et CTA vers les routes fantômes `startup` / `expertise`; la future homepage native devra repartir de la source owner-controlled auditée sans réintroduire ces liens (#168).
- [ ] Une fois la page native prête et explicitement validée, retirer le rewrite temporaire de `/` et rediriger `/index.html` vers `/`.

### Surfaces Next natives et pages publiques

- [x] Finaliser les redirects legacy de `contact`, `email` et `link` vers leurs canonicals Next (#116).
- [x] Donner à chaque route Next native ses propres Open Graph/Twitter metadata au lieu d'un aperçu social générique hérité du layout (#116).
- [x] Harmoniser skip-link, top anchor, landmarks, icônes décoratives et navigation interne sur `contact`, `email` et `link` (#116).
- [x] Retirer le bouton canonique `/cv` résiduel de `/contact` tout en conservant provisoirement les liens directs vers les variantes CV jusqu'à leur audit d'artefacts (#142).
- [ ] Harmoniser cartes, boutons, spacing et typographie entre les surfaces Next natives.
  - [x] Appliquer globalement la préférence de thème `light|dark|auto` dès le layout Next, avant les runtimes page-specific, sans charger les widgets legacy (#160).
  - [x] Porter les tokens de contraste clair au niveau WCAG AA pour liens, boutons primaires et segments de thème inactifs, avec contrat déterministe light/dark (#160).
  - [x] Porter le design-system sémantique d’Alban #105–#107 : aliases `--ui-*`, `Container` responsive, `RouteHeader`, `Footer` et `ContactHero` scindés en CSS Modules, avec contrôles 44 px et focus visible sans dépendance Bootstrap sur ce chrome Next.
  - [x] Migrer le lot Bootstrap `card`/grid/actions des surfaces Next natives `email`, `policy` (index + six pages), `success`, `cancel`, `contact`, `link` et `test` vers `ActionLink`, `Container`, `ContentLayout` et `Surface`, avec contrat de non-régression (#162).
- [ ] Poursuivre les pages publiques structurées à faible risque en conservant le fallback legacy jusqu'à preuve de parité.
  - [x] Exception 404 : `public/404.html` reste la source protégée, consommée par `global-not-found`; la 404 React localisée de #118 n'est plus le comportement cible (#139).
  - [x] Accessibility Statement : route propre Next, source HTML inchangée conservée, chrome/metadata et Preview E2E validés (#124).
  - [x] Conditions d’utilisation localisées et rendues nativement en FR/EN/DE/NO (#130).
  - [x] Privacy Policy localisée et rendue nativement en FR/EN/DE/NO (#131).
  - [x] Legal notices et Impressum localisés et rendus nativement en FR/EN/DE/NO (#134).
  - [x] Cookie Policy et contenu de l’Accessibility Statement migrés depuis le bridge HTML anglais vers du contenu natif FR/EN/DE/NO (#136), avec contrat E2E corrigé dans #137.
  - [x] Index `/policy` localisé nativement (#139).
  - [x] `success` et `cancel` migrés vers Next avec i18n FR/EN/DE/NO, noindex et redirects legacy (#140).
  - [x] `public/success.html` et `public/cancel.html` supprimés après validation complète CI + Preview + Playwright de #141 ; les redirects `.html` restent couverts après suppression physique.
  - [ ] Migrer ensuite les autres pages publiques structurées à faible risque.
    - [x] Surface technique `/test` : supprimer le doublon `app/test/page.tsx` et conserver la seule implémentation Next localisée `app/[locale]/test/page.tsx` (#142).
    - [ ] Conserver `public/test.html` tant que sa finalité/contenu legacy ne sont pas réconciliés avec `/test`; l'audit post-#167 confirme que ce legacy charge le corpus ARF, donc aucune suppression/redirection avant la phase P6 et une preuve de parité complète.
      - [x] Localiser la surface Next `/test` en FR/EN/DE/NO via un domaine `messages/test`, y compris ses metadata noindex, sans importer le corpus legacy.
      - [x] Ajouter un contrat de coexistence qui exige `public/test.html` et ses signaux ARF (`d3.v3.min.js`, `arf.js`, `index.js`, association) et interdit tout redirect `/test.html` tant que la parité n'est pas démontrée.
      - [x] Ajouter une couverture Playwright FR/EN/DE/NO/noindex pour la surface Next et vérifier que `/test.html` reste un fallback ARF distinct.
      - [ ] Exécuter cette couverture sur un checkpoint Vercel du SHA exact avant toute nouvelle déclaration de parité ou suppression legacy.
      - [x] Durcir le préflight Playwright afin qu'un `HTTP 429` ou `x-vercel-mitigated: challenge` soit identifié comme Vercel Security Checkpoint et rejeté avant les tests, au lieu d'être pris pour un accès valide.
    - [x] Inventorier les HTML legacy racine post-#167 : aucune nouvelle cible P3 faible risque immédiate n'est éligible ; `404.html` est protégée, `index.html` est owner-controlled, `contact.html` reste utile au fallback Docker statique, et les autres surfaces relèvent du corpus différé.
- [ ] Différer les pages contenant un corpus familial sensible jusqu'à la phase finale de confidentialité.

## P4 — SEO et métadonnées

- [x] Canonicals et hreflang FR/EN/DE/NO des routes Next natives.
- [x] Sitemap hybride et robots alignés sur les routes actuellement indexables.
- [x] Open Graph/Twitter complets et spécifiques pour chaque route Next native (#116).
- [x] Redirects permanents des anciennes URLs `.html` pour `contact`, `email`, `link`, `success` et `cancel` après migration des routes Next correspondantes (#116, #140).
- [x] Vérifier les redirects et métadonnées avec Playwright sur le Preview exact (#116).
- [x] Restaurer `/feed.xml` et ajouter le feed de contact dédié avec découverte RSS Next ; garder l’identité approuvée confinée au XML dédié et scanner explicitement les deux feeds via le privacy gate (#163).
- [x] Ajouter DE/NO dans les alternates après stabilisation des catalogues, y compris pour les six policies nativement localisées (#129, #130, #131, #134, #136).
- [ ] Garder la homepage et son Open Graph/Twitter comme exception propriétaire : aucun changement sans accord explicite.

## P5 — Nettoyage technique, performance et CI

- [x] Aligner package/lockfile et retirer les dépendances confirmées orphelines (#123).
  - [x] Retirer `stripe`, `@stripe/stripe-js` et `@stripe/react-stripe-js` devenus sans consommateur après la migration/suppression des surfaces checkout (#144).
- [ ] Retirer progressivement les runtimes/scripts legacy après preuve d'absence de consommateurs.
  - [x] Retirer les scaffolds Next orphelins non publiés `app/components/Hero.tsx`, les deux anciens `LocaleSwitcher.tsx` et `i18n/navigation.ts` après preuve d'absence d'import ; `RouteHeader` reste l'unique owner du switcher FR/EN/DE/NO et `/` continue d'être réécrit vers `public/index.html` (#168).
  - [x] Conserver OpenCommit sur décision explicite du propriétaire : wrapper/config et scripts `oco` / `opencommit` restaurés, dev-only et hors runtime (#150).
  - [x] Utiliser GitHub Actions comme CI principale et des annotations ESLint GitHub pour le workflow courant, tout en conservant `.gitlab-ci.yml` et son formatter comme fallback réactivable.
  - [x] Formaliser la policy npm 11.17+ d'installation : scripts transitoires actuellement bloqués explicitement refusés via `allowScripts`, mode `strict-allow-scripts` activé et `.npmrc` ajouté aux déclencheurs Quality.
  - [x] Réconcilier le contrat supply-chain après Dependabot #151 : `esbuild` `0.28.2` est la version transitive revue et explicitement attendue par le test d'installation, au lieu de laisser un merge dependency invalider Quality.
- [x] Retirer le bridge HTML des policies et le composant `PublicHtmlFragment` devenu orphelin ; conserver `htmlFromPublic` uniquement pour l'exception 404 imposée par la policy du repo.
  - [x] Retirer `sanitize-html` et son wrapper `check:sanitize-html` après preuve que `htmlFromPublic` n'en dépend plus ; élaguer les 12 entrées lockfile devenues exclusivement orphelines.
- [ ] Supprimer les pages `.html` et assets orphelins après validation des redirects et de la parité Next.
  - [x] Après gate #141 vert, retirer `public/success.html`, `public/cancel.html` et l'ignore Stylelint `public/checkout.css` devenu sans fichier ; verrouiller leur absence par contrat unitaire.
  - [x] Retirer les routes/catalogues fantômes confirmés, `lib/htmlRoutes.config.mjs` et l'ancien générateur FR après preuve d'absence de consommateur ; conserver les CTA homepage orphelins comme dette explicite jusqu'au cutover contrôlé (#142).
- [x] Réduire les téléchargements et jobs CI inutiles.
  - [x] Ajouter un gate agent-first inspiré de `nabla-compose#132` : préflight Git sans dépendances avant `npm ci`, garde de fraîcheur/troncature/bit exécutable, workflow `--fix` → check → `--publish`, sortie compacte et pre-push dédié, sans dupliquer le gate Nabla canonique.
  - [x] Sur les PR en draft, limiter Quality au préflight Git sans installer Node/npm ni construire Next ; `ready_for_review` relance automatiquement le gate complet, afin que l'itération agent ne consomme une build qu'au checkpoint de publication.
  - [x] Snyk ne prépare plus/pull plus son image Docker lorsque `SNYK_TOKEN` est absent.
  - [x] Remplacer le cache npm implicite de `setup-node` par `actions/cache` sur `~/.npm` dans les workflows qui installent le projet ; pinner npm depuis `$RUNNER_TEMP` dans tous les workflows GitHub afin que le npm embarqué ne lise pas `.npmrc` avant npm 11.17, tout en conservant `strict-allow-scripts` et le cache.
  - [x] Rendre les caches npm/pre-commit/Next best-effort : une panne du backend GitHub Cache ne doit jamais rendre Quality rouge ; séparer restore/save, préchauffer les hooks pre-commit sur cache miss et réutiliser `.next/cache` entre builds afin d'éviter les compilations systématiquement froides.
  - [x] Pinner les GitHub Actions des chemins critiques Quality/Copilot sur les SHA immuables correspondant aux versions revues, avec contrat empêchant le retour de références flottantes dans ces workflows.
  - [x] Étendre le pinning SHA à tous les workflows GitHub actifs (Docker, Playwright, Vercel Preview et Release déjà conforme) et étendre le contrat pour empêcher toute nouvelle référence distante flottante.
  - [x] Rendre les caches npm et Chromium du workflow Playwright best-effort afin qu'une panne GitHub Cache ne transforme pas un Preview fonctionnel en faux échec E2E.
  - [x] Retirer le workflow GitHub MegaLinter dormant, encore câblé sur l'ancien `main`, plutôt que réactiver un job lourd et redondant ; conserver `.mega-linter.yml` aligné sur `master` uniquement pour le fallback `.gitlab-ci.yml`.
  - [x] Centraliser la version Node des workflows GitHub sur `.nvmrc` (`v25.9.0`) ; conserver séparément l'engine package compatible Vercel `>=24.11.0 <26`.
  - [x] Réconcilier le fallback Docker statique avec le repo réel : `master`, image Bababou, contexte limité à `public/`, BuildKit cache + Trivy, publication GHCR sur les changements du fallback et Docker Hub uniquement en opt-in manuel ; supprimer la dette `pgclient`/`PG_MAJOR`/Node inutile sans en faire le runtime principal.
  - [x] Mettre à niveau la base du fallback de `nginx:1.27-alpine` vers la stable `nginx:1.30.4-alpine-slim` avant d'envisager un gate Trivy bloquant ; l'ancienne base exposait des findings HIGH/CRITICAL corrigés dans des packages plus récents.
  - [x] Vérifier le SARIF après upgrade : 34 findings HIGH/CRITICAL sur l'ancienne base → 0 sur `nginx:1.30.4-alpine-slim`, puis activer `exit-code: 1` pour rendre le scan HIGH/CRITICAL bloquant sur le fallback Docker.
  - [x] Basculer le fallback vers l'image officielle `nginxinc/nginx-unprivileged:1.30.4-alpine-slim`, exposer 8080 et ajouter un smoke test CI prouvant un runtime non-root ainsi que le service de `/` et du `public/404.html` protégé.
  - [x] Les Preview Vercel ne déclenchent plus deux suites Playwright concurrentes et le chemin conservé réutilise le cache Chromium (#121).
  - [x] Réutiliser l'événement Vercel production jusque-là `skipped` pour un smoke `curl` ciblé et peu coûteux du SHA déployé, sans télécharger Chromium ni réexécuter la suite Playwright complète.
  - [x] Réconcilier ce smoke avec le rewrite homepage hybride protégé : sous Protection Bypass, Vercel peut matérialiser le rewrite `/ → /index.html` en `307`; accepter seulement cette destination attendue et conserver les redirects `vercel.com/login|sso-api` comme échecs (#171).
  - [x] Le workflow séparé de seed Chromium devient inutile et est retiré après validation du cache détenu par `repository_dispatch` (#122).
  - [x] Les anciens contrats Playwright de 404 localisée et de chrome checkout legacy sont retirés/réconciliés avec les surfaces réellement publiées (#141).
  - [x] Les changements docs/repository-maintenance évitent un Preview Vercel grâce à l'`ignoreCommand` versionné et testé.
  - [x] Les agents API-only doivent publier les changements multi-fichiers en un commit Git atomique lorsque possible, afin d'éviter le fan-out de Preview Vercel et les rate limits ; #142 a été squashée ainsi avant validation finale.
  - [x] Porter le modèle Vercel stabilisé dans `nabla-site-alban` (#130) : désactiver les auto-Preview des branches `fix/*` / `feat/*`, réserver l’auto-déploiement à `master` et aux checkpoints `vercel-preview-*`, puis créer/nettoyer ces checkpoints à la demande via un vrai `git push` afin que Vercel reçoive l’événement de branche attendu.
  - [x] Aligner le hardening checkpoint du `master` Alban : `vercel-preview-*` force toujours un build du SHA exact même lorsque son delta est docs/tests-only ; le contrat unitaire verrouille cette exception.
- [x] Mesurer durée de `npm ci`, `npm run check`, `next build`, taille de cache et taille de sortie.
  - [x] Instrumentation Quality ajoutée sans job ni build supplémentaire (#122).
  - [x] Instrumentation conservée après retour à `build: next build` : le wrapper `run-next-build.mjs` retiré n’est plus nécessaire, Quality chronomètre directement l’unique `npm run build` entre les phases pré/post-build.
  - [x] Première comparaison #146 → #147 : `npm ci` 31 → 24 s, `node_modules` 1112 → 1041 MiB, `next build` 19,6 → 18,2 s et `.next` 69 → 66 MiB.
  - [x] Deuxième baseline #148 : 808 paquets, `npm ci` 20 s, `node_modules` 918 MiB, `npm run check` 31 s, `next build` 14,0 s et `.next` 66 MiB.
  - [x] Baseline post-merge #158 à cache `master` froid : `npm ci` 22 s, `node_modules` 723 MiB, cache npm 207 MiB, `npm run check` 42 s, `next build` 19,3 s et `.next` 66 MiB ; aucun warning npm pré-pin.
  - [x] Baseline post-merge #167 / Quality #354 : cache npm hit, cache Next initial de `master` absent, `npm ci` 15 s, `node_modules` 723 MiB, cache npm 207 MiB, `npm run check` 44 s, `next build` 19,5 s et `.next` 67 MiB ; ce run amorce le cache Next propre à `master`.
  - [x] Baseline post-merge #168 / Quality #367 : 168/168 tests, cache npm hit, cache Next miss après changement de clé/runtime, `npm ci` 10 s, `node_modules` 723 MiB, cache npm 207 MiB, checks 23 s, `next build` 6,5 s et `.next` 72 MiB.
  - [ ] Collecter plusieurs baselines post-merge et définir des seuils uniquement après observation.
- [x] Maintenir lint JS/TS/CSS, typecheck, unit tests, `next build`, Playwright Preview, accessibilité et tests SEO comme gates.
  - [x] Exposer le gate canonique via `npm run quality:gate` et garder `scripts/quality-gate.sh` byte-for-byte aligné avec `nabla-site-alban`.
- [x] Aligner le cycle release sur `nabla-site-alban` (#131) sans changer l’historique Bababou : CI post-merge sur `master`, release uniquement après CI verte et contrôle que le SHA validé est toujours le `master` courant.

## P6 — Confidentialité finale hors homepage — À FAIRE EN DERNIER

Cette phase est volontairement placée après migration, UI/UX, SEO, nettoyage et performance conformément à la décision du propriétaire.

- [ ] Auditer l'ensemble du corpus public restant hors homepage/index.
- [ ] Normaliser les pseudonymes juridiques vers `the child`, `Mr A` et `Ms B` lorsque le contexte l'exige.
- [ ] Caviarder les données protégées essentielles plutôt que supprimer l'information nécessaire au sens juridique, chronologique ou probatoire.
- [ ] Étendre le privacy gate aux documents legacy/publics concernés sans faire fuiter les valeurs protégées dans les logs ou tests.
- [ ] Vérifier les PDF/images par redaction irréversible et suppression des couches/metadata cachées lorsqu'ils entrent dans le périmètre.
- [ ] Conserver `/` et `public/index.html` hors de ce hardening automatique : toute évolution de disclosure y reste soumise à accord explicite.

## Découpage des prochaines PR

- [x] **Migration 2 / P1 — PR #100/#102** : CI `next build`, contrats E2E Next/Vercel et invariants hybrides.
- [x] **Migration 3a / P2 — PR #105** : fondations routing/i18n et accessibilité partagée.
- [x] **Migration 3b / P2 — PR #106** : ownership i18n, nettoyage des surfaces Next, footer/header et sitemap hybride.
- [x] **Privacy foundation — PR #107/#110** : gate initial, policy de pseudonymisation/caviardage et exception homepage contrôlée.
- [x] **Migration 5 / P3+P4 — PR #116** : redirects contact/email/link, metadata sociales spécifiques, chrome/accessibilité et validation Preview E2E.
- [ ] **Migration 6 / P3** — 404 protégée, pages légales puis autres pages publiques structurées à faible risque.
  - [x] Exception statique 404 restaurée via `global-not-found` (#139), supersédant la 404 localisée de #118.
  - [x] Accessibility Statement migrée vers le chrome Next avec source statique préservée et Preview E2E validée (#124).
  - [x] Conditions d’utilisation natives FR/EN/DE/NO (#130).
  - [x] Privacy Policy native FR/EN/DE/NO (#131).
  - [x] Legal notices et Impressum natifs FR/EN/DE/NO (#134).
  - [x] Cookie Policy et Accessibility Statement finalisés en i18n natif FR/EN/DE/NO (#136/#137).
  - [x] Index policy et restauration finale de la 404 protégée (#139).
  - [x] Résultats de paiement `success` / `cancel` migrés vers Next (#140).
  - [x] Routage FR/404 réconcilié et tests Preview post-migration validés 167/167 sur le SHA exact (#141).
  - [ ] Poursuivre les pages publiques structurées à faible risque.
- [ ] **Migration 7 / P5** — dépendances/runtimes legacy, assets orphelins et optimisation CI/performance.
  - [x] Réconciliation release/Preview et cache Chromium (#117/#119/#120/#121).
  - [x] Suppression du seed Chromium redondant et instrumentation Quality (#122).
  - [x] Alignement package/lockfile, engines et tooling Next ; retrait d'Express orphelin (#123).
  - [x] Retrait du bridge HTML policy et réduction de `htmlFromPublic` au seul 404 protégé.
  - [x] Retrait des résultats de paiement HTML legacy après gate #141 vert, avec conservation des redirects et test d'absence.
  - [x] Retirer les routes/catalogues/scripts fantômes confirmés, le support homelab non routé et les directives/docs associées devenues sans cible (#142).
  - [x] Retirer le manifeste secondaire `public/package.json` et corriger les instructions runtime dupliquées/stales sans supprimer le corpus qualité utile (#143).
  - [x] Retirer les trois SDK Stripe orphelins et réconcilier le lockfile racine (#144).
  - [x] Retirer le `postinstall` dist historique, `copyfiles`, le package npm `d3` et 47 entrées lockfile devenues orphelines (#145).
  - [x] Retirer le CLI Vercel local, ses wrappers et 324 entrées lockfile exclusivement liées ; conserver les SDK `@vercel/*` réellement utilisés (#146).
  - [x] Retirer 10 dépendances directes observabilité/devtools sans import, déplacer `lodash-es` en devDependency et élaguer 144 entrées lockfile supplémentaires (#147).
  - [x] Restaurer OpenCommit comme outil local optionnel sans recréer de workflow OpenCommit obligatoire (#150).
  - [x] Durcir npm install avec une denylist explicite des scripts déjà bloqués et un échec strict pour toute nouvelle dépendance à script non revue.
  - [x] Converger avec le cleanup agent/tooling d’Alban #133 : Copilot Setup sur Node 25 et adapters VS Code/Cursor/Next.js/Security réduits vers `AGENTS.md`, sans anciennes instructions Vercel CLI/Git Flow/sitemap.
  - [x] Sortir la toolchain semantic-release du graphe npm normal comme Alban #133 : 4 dépendances directes et 412 entrées lockfile retirées, versions pinées et téléchargées uniquement dans le job release.
  - [x] Retirer les scaffolds Next homepage/locale orphelins et leur helper de navigation après preuve d'absence de consommateurs (#168).
  - [x] Retirer le wrapper de build métrique `scripts/run-next-build.mjs` et aligner le manifeste sur `build: next build` / `start: next start`, tout en gardant une mesure CI sans build dupliqué (#168).
  - [x] Élaguer la distribution Font Awesome complète vendorizée : les pages legacy ne consomment que `js/fontawesome.js`, `js/solid.js` et `js/brands.js`; conserver ces trois fichiers et la licence aux mêmes URLs, retirer 5 681 fichiers CSS/SCSS/metadata/sprites/SVG/webfonts non servis (~26,3 MB) et verrouiller ce sous-ensemble par contrat (#170).
  - [x] Élaguer aussi le bundle CSS Font Awesome : conserver uniquement `fontawesome.css`, `brands.css`, `solid.css` et les deux webfonts réellement référencées; retirer 19 variantes/minifiés/shims/fonts non chargés (~405 KB) avec contrat sur les consommateurs Next + legacy (#170).
  - [x] Corriger le déclencheur Docker PR pour inclure `public/**` comme le trigger `push master`, puis étendre le smoke fallback aux trois bundles Font Awesome conservés afin qu'un asset public supprimé par erreur échoue avant merge (#170).
  - [x] Sortir le convertisseur JPG/Pillow de `public/assets/` vers `scripts/`, conserver son défaut `public/assets` et le wrapper existant, afin que le tooling de maintenance ne soit plus servi comme asset HTTP (#170).
  - [x] Retirer `scripts/run-install.sh` et `scripts/run-test.sh` après audit : aucun consommateur externe, le premier réinstallait des packages Font Awesome hors manifeste et le second dupliquait des sous-ensembles Playwright déjà couverts par les scripts npm canoniques (#170).
  - [x] Retirer `public/google-translate-config.js` après suppression de ses deux derniers tags consommateurs ; le fichier était déjà un stub no-op et le contrat interdit désormais de réintroduire ce bootstrap ou le loader Google direct dans les HTML legacy (#171).
  - [ ] Retrait des runtimes/scripts/assets legacy restants après preuve d'absence de consommateurs externes.
- [ ] **Migration 8 / P3** — extraction progressive de sections homepage en conservant les disclosures approuvées, sans changement sensible non validé.
- [ ] **Migration finale / P6** — confidentialité hors homepage : pseudonymisation/caviardage du corpus restant et extension complète du privacy gate.

## Règles de maintenance de cette roadmap

- Chaque nouvelle dette de migration/refactoring doit être ajoutée ici avec priorité et, si possible, numéro de PR/issue.
- Une PR coche uniquement les éléments réellement vérifiés par CI/Preview/production.
- Ne jamais déplacer des données sensibles dans ce fichier pour documenter un défaut : décrire la catégorie de donnée, pas sa valeur.
- Supprimer les TODO obsolètes du code lorsqu'ils sont représentés ici ; garder dans le code uniquement les TODO locaux dont le contexte est nécessaire à l'implémentation.
