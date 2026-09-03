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

## État de référence — 2026-09-03

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
- [x] Test de structure protégeant le `postinstall` legacy tant que ses consommateurs ne sont pas audités.
- [x] Migration 5 : redirects `contact`/`email`/`link`, metadata sociales par route, top anchor et validations Preview E2E (#116).
- [x] La tentative de 404 Next localisée de #118 a été remplacée par la restauration de l'exception statique protégée `public/404.html` via `global-not-found` (#139).
- [x] Preview E2E dédupliqué sur `repository_dispatch` avec cache Chromium réutilisable depuis le scope de la branche par défaut (#121).
- [x] Migration 7 / P5 : manifeste/lockfile réconciliés, tooling Next 16.3.2 aligné et dépendances Express orphelines retirées (#123).
- [x] Locales de premier rang `fr`, `en`, `de` et `no` activées dans `routing.locales`, avec catalogues et contrats de routing/SEO associés (#129).
- [x] Les six policies (`service_terms`, `privacy_policy`, `legal`, `impressum`, `cookie_policy`, `accessibility_statement`) sont rendues nativement en FR/EN/DE/NO (#130, #131, #134, #136), avec récupération du contrat Preview E2E après #136 (#137).
- [x] Index `/policy` natif localisé ajouté et comportement 404 statique protégé restauré (#139).
- [x] Résultats de paiement `success` / `cancel` migrés vers des routes Next FR/EN/DE/NO noindex, avec redirects legacy et domaine i18n dédié (#140).
- [x] Réconciliation post-#140 validée sur Preview exact : FR non préfixé déterministe, 404 globale statique protégée, cleanup payment et Playwright 167/167 sur le SHA déployé (#141).

### Blocages opérationnels actuels

- [ ] Merger la réconciliation #141 maintenant que CI, Vercel Preview et Playwright Preview sont verts sur le SHA exact.
- [ ] Vérifier le binding DNS/domaine de `bababou.com` et le rattachement au projet Vercel ; le projet ne le rapporte pas encore parmi ses domaines attachés.
- [ ] Vérifier `/`, `/index.html`, les routes Next déjà migrées et Playwright Preview sur le SHA exact après chaque changement de routage/runtime.

## P1 — Stabiliser et simplifier le runtime

Objectif : un seul chemin de build et de déploiement, aligné sur `nabla-site-alban`, sans casser le runtime legacy encore requis.

- [x] Remplacer l'ancienne version preview de Next.js par une version stable ; le projet utilise désormais Next `16.3.2`.
- [x] Aligner explicitement `next` et `eslint-config-next` dans le manifeste/lockfile et vérifier leur résolution effective (#123).
- [x] Borner les engines Node/npm au major supporté par CI/Vercel (`Node 24`, `npm 11`) dans `package.json`.
  - [x] Réconcilier les métadonnées `engines` racine du lockfile lors de la régénération atomique du lockfile (#123).
- [x] Supprimer `express` et `@types/express` après confirmation de l'absence de consommateur (#123).
  - [x] Audit du code versionné : aucun import ESM, `require()` ou appel `express()` trouvé.
  - [x] Retrait effectif avec régénération atomique du lockfile (#123).
- [ ] Retirer Wrangler et `wrangler.jsonc` une fois confirmé qu'aucun déploiement Cloudflare Workers n'est encore requis.
  - [x] Audit dépôt : aucune CI ni consommateur applicatif Wrangler détecté ; seuls `package.json` et `wrangler.jsonc` restent référencés.
  - [ ] Confirmer l'absence de déploiement externe encore utilisé avant retrait du package/configuration.
- [ ] Auditer les consommateurs de `dist/`, `index/dist/` et les assets copiés par `postinstall`.
  - [x] Audit initial du dépôt : `app/scripts/arf.js`, `app/resources/`, `dist/` et `index/dist/` ne sont pas versionnés sur la branche courante.
  - [x] `npm ci` exécute néanmoins le `postinstall` sans erreur dans la CI.
  - [ ] Vérifier les consommateurs externes/legacy et la génération attendue hors Git avant toute suppression.
- [x] **Conserver le `postinstall` actuel et `copyfiles` tant que l'audit n'est pas terminé.** Leur retrait doit être atomique avec la migration des consommateurs correspondants.
- [x] Ajouter un test de régression qui verrouille le `postinstall` legacy pendant cette phase hybride.
- [ ] Supprimer les scripts redondants `build:n`, `start:n`, `build:v`, `start:v`, `dev:wrangler`, `start:wrangler`, `deploy:wrangler` seulement après retrait vérifié de leurs runtimes.
- [ ] Conserver à terme un seul couple nominal `build: next build` / `start: next start`.
- [x] Exécuter explicitement `next build` dans la CI GitHub de qualité afin de ne pas dépendre uniquement de Vercel pour valider la compilation.
- [x] Contraindre le tracing de `htmlFromPublic.ts` aux fragments explicitement allowlistés (#108).
- [x] Réduire ensuite `htmlFromPublic.ts` au seul `public/404.html` protégé et retirer le composant `PublicHtmlFragment` devenu sans consommateur après la migration native complète des policies.
- [x] Éviter le pull de l'image Docker Snyk lorsque `SNYK_TOKEN` est vide ; la CI utilise désormais le CLI uniquement lorsque le token existe.
- [ ] Mesurer l'impact sur taille d'installation/cache et durée de build après ces optimisations.
  - [x] Instrumenter le job Quality sans second build : `npm ci`, `node_modules`, cache npm, `npm run check`, `next build` et taille `.next` sont publiés dans le Job Summary (#122).
  - [ ] Conserver plusieurs baselines post-merge et comparer les régressions avant d'ajuster davantage la CI.

## P2 — Finaliser l'architecture i18n et routing

- [ ] Nettoyer les derniers textes/labels copiés du site `nabla-site-alban` qui subsistent dans les catalogues legacy non chargés.
  - [x] Les surfaces Next actives ne rendent plus le chrome professionnel copié.
  - [x] `contactPage`, `email` et `linkPage` n'existent plus en double dans les catalogues legacy.
- [x] Générer le sélecteur de langue depuis `routing.locales`.
- [x] Composer les catalogues runtime via `i18n/messages.ts` avec loaders explicites par locale et rejet des namespaces dupliqués.
- [x] Extraire les domaines runtime sous `messages/site`, `messages/contact`, `messages/email`, `messages/link` et `messages/checkout`.
- [x] Introduire un skip-link Next partagé.
- [x] Remplacer les types locaux de props par les `PageProps<...>` générés lorsque pertinent.
- [x] Centraliser la politique canonical des routes Next natives : FR sans préfixe, EN/DE/NO préfixés, y compris `contact`, `email`, `link`, `success`, `cancel` et les policies.
- [x] Générer les alternates depuis `routing.locales` avec `fr` comme `x-default`.
- [x] Stabiliser FR et EN sur un Preview réel avant d'ajouter de nouvelles locales (#116, #118, #121).
- [x] Ajouter `de` et `no` à `routing.locales` avec des catalogues complets et validés (#129).
- [ ] Garder Google Translate uniquement pour les langues hors locales de premier rang.
- [ ] Réconcilier les catalogues/routes legacy avec les surfaces réellement publiées : auditer les entrées fantômes (`pricing`, `payment`, `startup-thanks`, etc.), `lib/htmlRoutes.config.mjs` et l'ancien générateur `scripts/old/generate_fr_locale_html.py`, puis retirer uniquement les artefacts sans consommateur prouvé.

## P3 — Migration Next.js et UI/UX

### Homepage owner-controlled

- [ ] Décomposer progressivement `app/[locale]/page.tsx` en composants de sections focalisés en conservant strictement les disclosures approuvées.
- [ ] Déplacer les textes localisables vers `messages/home/{locale}.json` sans pseudonymiser ni modifier les informations sensibles approuvées.
- [ ] Toute proposition qui change une identité, un caviardage ou une disclosure de `/` / `public/index.html` doit être présentée au propriétaire avant modification.
- [ ] Retirer chaque section legacy du fragment dès que son composant React atteint la parité.
- [ ] Vérifier responsive/mobile, accessibilité, liens, assets, metadata et SEO.
- [ ] Une fois la page native prête et explicitement validée, retirer le rewrite temporaire de `/` et rediriger `/index.html` vers `/`.

### Surfaces Next natives et pages publiques

- [x] Finaliser les redirects legacy de `contact`, `email` et `link` vers leurs canonicals Next (#116).
- [x] Donner à chaque route Next native ses propres Open Graph/Twitter metadata au lieu d'un aperçu social générique hérité du layout (#116).
- [x] Harmoniser skip-link, top anchor, landmarks, icônes décoratives et navigation interne sur `contact`, `email` et `link` (#116).
- [ ] Harmoniser cartes, boutons, spacing et typographie entre les surfaces Next natives.
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
- [ ] Différer les pages contenant un corpus familial sensible jusqu'à la phase finale de confidentialité.

## P4 — SEO et métadonnées

- [x] Canonicals et hreflang FR/EN/DE/NO des routes Next natives.
- [x] Sitemap hybride et robots alignés sur les routes actuellement indexables.
- [x] Open Graph/Twitter complets et spécifiques pour chaque route Next native (#116).
- [x] Redirects permanents des anciennes URLs `.html` pour `contact`, `email`, `link`, `success` et `cancel` après migration des routes Next correspondantes (#116, #140).
- [x] Vérifier les redirects et métadonnées avec Playwright sur le Preview exact (#116).
- [x] Ajouter DE/NO dans les alternates après stabilisation des catalogues, y compris pour les six policies nativement localisées (#129, #130, #131, #134, #136).
- [ ] Garder la homepage et son Open Graph/Twitter comme exception propriétaire : aucun changement sans accord explicite.

## P5 — Nettoyage technique, performance et CI

- [x] Aligner package/lockfile et retirer les dépendances confirmées orphelines (#123).
- [ ] Retirer progressivement les runtimes/scripts legacy après preuve d'absence de consommateurs.
- [x] Retirer le bridge HTML des policies et le composant `PublicHtmlFragment` devenu orphelin ; conserver `htmlFromPublic` uniquement pour l'exception 404 imposée par la policy du repo.
- [ ] Supprimer les pages `.html` et assets orphelins après validation des redirects et de la parité Next.
  - [x] Après gate #141 vert, retirer `public/success.html`, `public/cancel.html` et l'ignore Stylelint `public/checkout.css` devenu sans fichier ; verrouiller leur absence par contrat unitaire.
  - [ ] Auditer puis retirer les catalogues/configurations legacy orphelins (`lib/htmlRoutes.config.mjs`, entrées fantômes de `sitePageCatalog`, scripts `scripts/old/`) uniquement après preuve d'absence de consommateur.
- [ ] Réduire les téléchargements et jobs CI inutiles.
  - [x] Snyk ne prépare plus/pull plus son image Docker lorsque `SNYK_TOKEN` est absent.
  - [x] Les Preview Vercel ne déclenchent plus deux suites Playwright concurrentes et le chemin conservé réutilise le cache Chromium (#121).
  - [x] Le workflow séparé de seed Chromium devient inutile et est retiré après validation du cache détenu par `repository_dispatch` (#122).
  - [x] Les anciens contrats Playwright de 404 localisée et de chrome checkout legacy sont retirés/réconciliés avec les surfaces réellement publiées (#141).
  - [x] Les changements docs/repository-maintenance évitent un Preview Vercel grâce à l'`ignoreCommand` versionné et testé.
- [ ] Mesurer durée de `npm ci`, `npm run check`, `next build`, taille de cache et taille de sortie.
  - [x] Instrumentation Quality ajoutée sans job ni build supplémentaire (#122).
  - [ ] Collecter plusieurs baselines post-merge et définir des seuils uniquement après observation.
- [x] Maintenir lint JS/TS/CSS, typecheck, unit tests, `next build`, Playwright Preview, accessibilité et tests SEO comme gates.

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
  - [ ] Auditer puis retirer les routes/catalogues/scripts fantômes (`lib/htmlRoutes.config.mjs`, `pricing`, `payment`, `startup-thanks`, `scripts/old/generate_fr_locale_html.py`) si aucun consommateur externe n'est identifié.
  - [ ] Retrait des runtimes/scripts/assets legacy restants après preuve d'absence de consommateurs externes.
- [ ] **Migration 8 / P3** — extraction progressive de sections homepage en conservant les disclosures approuvées, sans changement sensible non validé.
- [ ] **Migration finale / P6** — confidentialité hors homepage : pseudonymisation/caviardage du corpus restant et extension complète du privacy gate.

## Règles de maintenance de cette roadmap

- Chaque nouvelle dette de migration/refactoring doit être ajoutée ici avec priorité et, si possible, numéro de PR/issue.
- Une PR coche uniquement les éléments réellement vérifiés par CI/Preview/production.
- Ne jamais déplacer des données sensibles dans ce fichier pour documenter un défaut : décrire la catégorie de donnée, pas sa valeur.
- Supprimer les TODO obsolètes du code lorsqu'ils sont représentés ici ; garder dans le code uniquement les TODO locaux dont le contexte est nécessaire à l'implémentation.
