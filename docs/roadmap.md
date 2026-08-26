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

## Ordre d'exécution prioritaire — décision du 2026-08-26

1. **Migration Next.js** : réduire la dette hybride sur les routes déjà natives, puis migrer les pages publiques à faible risque.
2. **UI/UX et accessibilité** : harmoniser chrome, composants, responsive, navigation clavier et design system.
3. **SEO et métadonnées** : canonicals, redirects, hreflang, sitemap/robots, Open Graph et Twitter/X par route.
4. **Nettoyage technique** : supprimer progressivement code, scripts, dépendances et assets legacy devenus sans consommateur.
5. **Performance et CI** : réduire tracing, builds, téléchargements inutiles et coûts de validation.
6. **Confidentialité finale hors homepage** : pseudonymisation/caviardage du corpus restant, extension du gate et vérification irréversible des documents/assets concernés.

## État de référence — 2026-08-26

### Terminé

- [x] Déploiement configuré comme projet Next.js/Vercel.
- [x] App Router et `next-intl` introduits.
- [x] Routage hybride : `/` sert temporairement `public/index.html` avant `next-intl` via `proxy.ts`.
- [x] Les fichiers statiques explicites de `public/` restent servis pendant la migration.
- [x] Canonicals et metadata Next corrigés pour Bababou et la locale française par défaut.
- [x] Routes françaises sans préfixe et routes anglaises sous `/en` pour les surfaces Next natives.
- [x] Le home reste volontairement mono-canonical sur `/` tant que son cutover n'est pas terminé ; `/fr` et `/en` ne publient pas de faux home Next.
- [x] Bridge progressif HTML -> React (`PublicHtmlFragment` / `htmlFromPublic`) avec tests unitaires.
- [x] Playwright Preview utilise le SHA et l'URL de déploiement exacts, le bypass Vercel et un fallback OIDC.
- [x] CI Next génère les types de routes avant le typecheck et conserve `public/**` comme source runtime pendant la phase hybride.
- [x] Script `scripts/vercel-ignore-build.sh` ajouté pour réduire les déploiements inutiles.
- [x] Sélecteur de langue généré depuis `routing.locales` au lieu d'options FR/EN maintenues à la main (#101).
- [x] Migration 2 / P1 intégrée à `master` : CI qualité, `next build`, contrats E2E Next/Vercel et invariants hybrides (#100/#102).
- [x] Migration 3a / P2 intégrée : politique canonical hybride, alternates, `PageProps` générés et primitives d'accessibilité partagées (#105).
- [x] Migration 3b / P2 intégrée : catalogues runtime focalisés `site`, `contact`, `email`, `link`, nettoyage des surfaces Next actives et sitemap hybride (#106).
- [x] Privacy policy et exception homepage/index clarifiées, avec aliases juridiques `Mr A` / `Ms B` et règle de caviardage (#110).
- [x] Les anciens `messages/{locale}.json` ne sont plus chargés par le runtime Next ; les namespaces déjà migrés ont été retirés de ces catalogues legacy.
- [x] Test de structure protégeant le `postinstall` legacy tant que ses consommateurs ne sont pas audités.

### Blocages opérationnels actuels

- [ ] Configurer dans Vercel l'Ignored Build Step sur `bash scripts/vercel-ignore-build.sh` si ce n'est pas déjà fait.
- [ ] Vérifier le binding DNS/domaine de `bababou.com` et le rattachement au projet Vercel.
- [ ] Vérifier `/`, `/index.html`, les routes Next déjà migrées et Playwright Preview sur le SHA exact après chaque changement de routage/runtime.

## P1 — Stabiliser et simplifier le runtime

Objectif : un seul chemin de build et de déploiement, aligné sur `nabla-site-alban`, sans casser le runtime legacy encore requis.

- [x] Remplacer l'ancienne version preview de Next.js par une version stable ; le projet utilise désormais Next `16.3.2`.
- [ ] Aligner explicitement `next` et `eslint-config-next` dans le manifeste/lockfile et vérifier leur résolution effective.
- [ ] Borner les engines Node/npm au major supporté par CI/Vercel (`Node 24`, `npm 11`) au lieu de bornes uniquement minimales.
- [ ] Supprimer `express` et `@types/express` s'ils restent sans consommateur.
  - [x] Audit du code versionné : aucun import ESM, `require()` ou appel `express()` trouvé.
  - [ ] Retrait effectif à faire avec régénération atomique du lockfile.
- [ ] Retirer Wrangler et `wrangler.jsonc` une fois confirmé qu'aucun déploiement Cloudflare Workers n'est encore requis.
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
- [ ] Éviter le pull de l'image Docker Snyk lorsque `SNYK_TOKEN` est vide ; aujourd'hui l'image est téléchargée même si le scan final est ensuite skipped.
- [ ] Mesurer l'impact sur taille d'installation/cache et durée de build après ces optimisations.

## P2 — Finaliser l'architecture i18n et routing

- [ ] Nettoyer les derniers textes/labels copiés du site `nabla-site-alban` qui subsistent dans les catalogues legacy non chargés.
  - [x] Les surfaces Next actives ne rendent plus le chrome professionnel copié.
  - [x] `contactPage`, `email` et `linkPage` n'existent plus en double dans les catalogues legacy.
- [x] Générer le sélecteur de langue depuis `routing.locales`.
- [x] Composer les catalogues runtime via `i18n/messages.ts` avec loaders explicites par locale et rejet des namespaces dupliqués.
- [x] Extraire les domaines runtime sous `messages/site`, `messages/contact`, `messages/email` et `messages/link`.
- [x] Introduire un skip-link Next partagé.
- [x] Remplacer les types locaux de props par les `PageProps<...>` générés lorsque pertinent.
- [x] Centraliser la politique canonical des routes Next natives : `/contact`, `/email`, `/link` pour FR et `/en/...` pour EN.
- [x] Générer les alternates depuis `routing.locales` avec `fr` comme `x-default`.
- [ ] Stabiliser FR et EN sur un Preview réel avant d'ajouter de nouvelles locales.
- [ ] Ajouter `de` et `no` à `routing.locales` avec des catalogues complets et validés.
- [ ] Garder Google Translate uniquement pour les langues hors locales de premier rang.

## P3 — Migration Next.js et UI/UX

### Homepage owner-controlled

- [ ] Décomposer progressivement `app/[locale]/page.tsx` en composants de sections focalisés en conservant strictement les disclosures approuvées.
- [ ] Déplacer les textes localisables vers `messages/home/{locale}.json` sans pseudonymiser ni modifier les informations sensibles approuvées.
- [ ] Toute proposition qui change une identité, un caviardage ou une disclosure de `/` / `public/index.html` doit être présentée au propriétaire avant modification.
- [ ] Retirer chaque section legacy du fragment dès que son composant React atteint la parité.
- [ ] Vérifier responsive/mobile, accessibilité, liens, assets, metadata et SEO.
- [ ] Une fois la page native prête et explicitement validée, retirer le rewrite temporaire de `/` et rediriger `/index.html` vers `/`.

### Surfaces Next natives et pages publiques

- [ ] Finaliser les redirects legacy de `contact`, `email` et `link` vers leurs canonicals Next.
- [ ] Donner à chaque route Next native ses propres Open Graph/Twitter metadata au lieu d'un aperçu social générique hérité du layout.
- [ ] Harmoniser skip-link, top anchor, landmarks, icônes décoratives et navigation interne sur `contact`, `email` et `link`.
- [ ] Harmoniser cartes, boutons, spacing et typographie entre les surfaces Next natives.
- [ ] Migrer ensuite 404/pages légales puis les pages publiques structurées à faible risque.
- [ ] Différer les pages contenant un corpus familial sensible jusqu'à la phase finale de confidentialité.

## P4 — SEO et métadonnées

- [x] Canonicals et hreflang FR/EN des routes Next natives.
- [x] Sitemap hybride et robots alignés sur les routes actuellement indexables.
- [ ] Open Graph/Twitter complets et spécifiques pour chaque route Next native.
- [ ] Redirects permanents des anciennes URLs `.html` uniquement lorsque la route Next correspondante est validée.
- [ ] Vérifier les redirects et métadonnées avec Playwright sur le Preview exact.
- [ ] Préparer l'ajout DE/NO dans les alternates seulement après stabilisation des catalogues.
- [ ] Garder la homepage et son Open Graph/Twitter comme exception propriétaire : aucun changement sans accord explicite.

## P5 — Nettoyage technique, performance et CI

- [ ] Aligner package/lockfile et retirer les dépendances confirmées orphelines.
- [ ] Retirer progressivement les runtimes/scripts legacy après preuve d'absence de consommateurs.
- [ ] Supprimer les pages `.html` et assets orphelins après validation des redirects et de la parité Next.
- [ ] Réduire les téléchargements et jobs CI inutiles, notamment Snyk lorsque non configuré.
- [ ] Mesurer durée de `npm ci`, `npm run check`, `next build`, taille de cache et taille de sortie.
- [ ] Maintenir lint JS/TS/CSS, typecheck, unit tests, `next build`, Playwright Preview, accessibilité et tests SEO comme gates.

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
- [ ] **Migration 5 / P3+P4** — redirects contact/email/link, metadata sociales spécifiques et harmonisation des surfaces Next natives.
- [ ] **Migration 6 / P3** — 404/pages légales puis autres pages publiques structurées à faible risque.
- [ ] **Migration 7 / P5** — dépendances/runtimes legacy, assets orphelins et optimisation CI/performance.
- [ ] **Migration 8 / P3** — extraction progressive de sections homepage en conservant les disclosures approuvées, sans changement sensible non validé.
- [ ] **Migration finale / P6** — confidentialité hors homepage : pseudonymisation/caviardage du corpus restant et extension complète du privacy gate.

## Règles de maintenance de cette roadmap

- Chaque nouvelle dette de migration/refactoring doit être ajoutée ici avec priorité et, si possible, numéro de PR/issue.
- Une PR coche uniquement les éléments réellement vérifiés par CI/Preview/production.
- Ne jamais déplacer des données sensibles dans ce fichier pour documenter un défaut : décrire la catégorie de donnée, pas sa valeur.
- Supprimer les TODO obsolètes du code lorsqu'ils sont représentés ici ; garder dans le code uniquement les TODO locaux dont le contexte est nécessaire à l'implémentation.
