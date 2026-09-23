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
- Un agent ne peut pas déclarer un travail terminé tant que chaque reliquat, dette découverte, warning différé ou validation non exécutée qui demande encore une action projet n'est pas représenté par un item non coché de cette roadmap ; un merge malgré un gate non bloquant en échec ne solde jamais ce reliquat.

## Ordre d'exécution prioritaire — décision du 2026-08-26

1. **Migration Next.js** : réduire la dette hybride sur les routes déjà natives, puis migrer les pages publiques à faible risque.
2. **UI/UX et accessibilité** : harmoniser chrome, composants, responsive, navigation clavier, contraste mesurable et design system.
3. **SEO et métadonnées** : canonicals, redirects, hreflang, sitemap/robots, Open Graph et Twitter/X par route.
4. **Nettoyage technique** : supprimer progressivement code, scripts, dépendances et assets legacy devenus sans consommateur.
5. **Performance et CI** : réduire tracing, builds, téléchargements inutiles et coûts de validation.
6. **Confidentialité finale hors homepage** : pseudonymisation/caviardage du corpus restant, extension du gate et vérification irréversible des documents/assets concernés.

## État de référence — 2026-09-13

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

- [ ] Rétablir l'exécution des runners GitHub-hosted de la PR #197 avant merge : les runs Quality `35458746357`, Docker `35458746354` et Node 24 `35458746363` échouent actuellement avant toute étape (`runner_id=0`, `steps=[]`), y compris après relance. Ne pas classer ce signal comme une régression applicative ni contourner les gates ; vérifier quota/facturation/provisionnement GitHub Actions côté compte si le symptôme persiste, puis rejouer les trois workflows.
- [x] Vérifier le binding DNS/domaine de `bababou.com` et le rattachement au projet Vercel.
  - [x] Vérification Vercel API du 2026-09-08 : le projet `nabla-site-bababou` publie bien les alias `www.bababou.com` et `bababou.com`, ainsi que les domaines `*.vercel.app`.
  - [x] Le déploiement production post-#168 est `READY` sur le SHA exact `234f847b0cf760162f7b0d69a5da0a2247fd843b`; HTTPS atteint bien Vercel sur `www.bababou.com`.
  - [x] Les probes automatisées non authentifiées peuvent recevoir le Vercel Security Checkpoint (`HTTP 429`, `x-vercel-mitigated: challenge`) ; ce signal ne doit plus être interprété comme un domaine détaché ni comme un succès applicatif.
- [ ] Vérifier `/`, `/index.html`, les routes Next déjà migrées et Playwright Preview sur le SHA exact après chaque changement de routage/runtime.
  - [x] Câbler un smoke production léger sur `vercel.deployment.success` pour `master`/`production`, sans `npm ci` ni navigateur : `/`, `/index.html`, `/test` FR/EN/DE/NO, `/test.html`, `/contact` et `/policy` sont vérifiés sur le deployment URL exact avec bypass/OIDC.
  - [x] Sonder séparément `https://www.bababou.com/` et classer `HTTP 429` / `x-vercel-mitigated: challenge` comme Security Checkpoint informatif lorsque le deployment exact est sain.
  - [x] Observer le premier smoke production post-merge : #170 a déployé `cdf0dfa` en `READY` avec les alias `www.bababou.com` / `bababou.com`; Vercel ne remonte aucun runtime 4xx/5xx sur ce déploiement et la homepage publique répond. Le run Playwright #521 a néanmoins false-fail sur le `HTTP 307` du rewrite protégé `/ → /index.html`, pas sur une panne applicative.
  - [x] Corriger le smoke pour accepter uniquement ce `307` attendu vers `/index.html`, après avoir exclu les redirects d'authentification Vercel ; `/index.html` reste ensuite vérifié séparément en `200`.
  - [x] Observer le smoke post-#171/#172 : Playwright #523 a révélé un second faux échec, le header `x-vercel-set-bypass-cookie: true` provoquant lui-même un `307 Location: /` de handshake Vercel. Retirer ce header du smoke production et conserver le bypass header-only + OIDC ; le handshake cookie reste réservé au préflight Preview qui le gère explicitement.
  - [x] Observer le smoke suivant après ce correctif : le merge #190 `9bf8d4f3826e20989247c5fb79bdc3806307d99a` est vert sur `Vercel`, `Production Post-deploy Smoke` et `Production DAST` (`H0 M4 L4 I5`). Le contrôle opérationnel est donc stabilisé sur une vraie évolution runtime.

## P1 — Stabiliser et simplifier le runtime

Objectif : un seul chemin de build et de déploiement, aligné sur `nabla-site-alban`, sans casser le runtime legacy encore requis.

- [x] Remplacer l'ancienne version preview de Next.js par une version stable ; le projet utilise désormais Next `16.3.4` (Active LTS), au-delà du minimum `16.3.3` de la security release d'août 2026.
- [x] Aligner explicitement `next` et `eslint-config-next` dans le manifeste/lockfile et vérifier leur résolution effective (#123), puis converger vers `16.3.4` comme `nabla-site-alban`.
- [x] Séparer le runtime de développement/CI du runtime Vercel : #185 aligne dev/agents/CI principale sur Node `26.8.2` Current tout en conservant Vercel `24.x` comme cible de compatibilité production ; `package.json#engines.node` devient `>=24.11.0 <27` et npm reste `>=11.17.0 <12`.
  - [x] Synchroniser proprement les métadonnées `engines` racine de `package-lock.json` avec le manifeste via npm 11.17, sans changement du graphe de dépendances.
  - [x] Ajouter un check Node 24 ciblé et peu coûteux (`v24.11.0`, `npm ci`, tests unitaires seulement), skippé en Draft et sans dupliquer Next/Docker/SAST/DAST.
  - [x] Au checkpoint Ready de #185, prouver la Quality complète sous Node 26 et la compatibilité Node 24 avant publication : Quality #613, Node 24 #12, Vercel exact-SHA, Playwright, ZAP et Docker/Trivy ont tous été validés sur le HEAD `7560c77c33ea0769d6c306049d0b20bdf504ff94`.
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
- [ ] Garder Google Translate comme fallback lorsque la traduction i18n native demandée n'existe pas ou n'a pas encore atteint la parité ; `next-intl` reste prioritaire lorsqu'une traduction native FR/EN/DE/NO existe.
  - [x] Dédupliquer le bootstrap Google Translate legacy : `site-google-translate.js` reste l'unique runtime qui possède le mount, le callback et le chargement externe ; conserver `google-translate-config.js` comme shim de compatibilité pour les anciennes pages/caches, sans second loader Google direct (#171).
  - [x] Retirer ensuite l'implémentation Google Translate dupliquée de `site-widgets.js` : toutes les pages legacy traduisibles possèdent désormais le bootstrap dédié, la seule page `site-widgets.js` sans ce script est la 404 minimal-chrome qui interdit la traduction ; supprimer aussi l'option Next `noGoogleTranslate` devenue sans consommateur (#171).
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
- [x] Harmoniser cartes, boutons, spacing, typographie et reflow entre les surfaces Next natives (#162, #190, #191).
  - [x] Appliquer globalement la préférence de thème `light|dark|auto` dès le layout Next, avant les runtimes page-specific, sans charger les widgets legacy (#160).
  - [x] Porter les tokens de contraste clair au niveau WCAG AA pour liens, boutons primaires et segments de thème inactifs, avec contrat déterministe light/dark (#160).
  - [x] Porter le design-system sémantique d’Alban #105–#107 : aliases `--ui-*`, `Container` responsive, `RouteHeader`, `Footer` et `ContactHero` scindés en CSS Modules, avec contrôles 44 px et focus visible sans dépendance Bootstrap sur ce chrome Next.
  - [x] Migrer le lot Bootstrap `card`/grid/actions des surfaces Next natives `email`, `policy` (index + six pages), `success`, `cancel`, `contact`, `link` et `test` vers `ActionLink`, `Container`, `ContentLayout` et `Surface`, avec contrat de non-régression (#162).
  - [x] #190 valide le responsive sur 320/375 px, tablette portrait/paysage et desktop, y compris textes allemands plus longs, safe-area, contrôles 44 px, CTA, footer et absence d'overflow horizontal ; Preview exact-SHA, Playwright 137/137 et ZAP sont verts.
  - [x] #191 ajoute le respect `prefers-reduced-motion` et valide sur Preview exact-SHA le reflow à 200 % de texte sur 320 px pour `/contact`, `/de/contact` et `/policy`; Playwright #561 est vert à 138/138 et ZAP #39 reste `H0 M4 L4 I5`.
- [ ] Porter le contraste texte/fond du site au niveau WCAG 2.2 AA et empêcher les régressions clair/sombre.
  - [x] #193 introduit un layer `legacy-contrast.css` limité aux pages HTML `page-dark` afin de reprendre la priorité sur les utilitaires Bootstrap chargés après `theme.css`, sans créer un second thème pour les routes Next.
  - [x] #193 ajoute un test navigateur de ratio calculé `>= 4.5:1` pour le texte normal de `people-contacted.html` en thèmes clair et sombre, ainsi qu'un contrôle de contraste de la surface Next atteinte depuis `central-authorities.html`.
  - [x] #193 valide le correctif contraste sur la Preview Vercel du SHA exact `2922cca88218868b6f7ed1ee08e9b562c0106964` ; les statuts `Playwright Preview E2E` et `OWASP ZAP Preview` sont verts et le contrôle reste dans le gate navigateur.
  - [ ] Auditer les autres pages legacy utilisant `page-dark` avec `bg-light`, `bg-white`, `text-light`, `text-muted` ou `text-secondary`, corriger les couples sous les seuils et couvrir les variantes `light|dark|auto`.
  - [ ] Étendre les contrôles aux composants non textuels/focus qui exigent au moins `3:1`, et viser `7:1` sur les textes critiques lorsque cela ne dégrade pas la hiérarchie visuelle.
  - [x] #193 porte le contrat stabilisé dans le skill de migration : seuils WCAG 2.2 AA, thèmes `light|dark|auto`, ratio calculé par le navigateur et interdiction de masquer une transition de contraste par une attente artificielle.
- [ ] Poursuivre les pages publiques structurées à faible risque en conservant le fallback legacy jusqu'à preuve de parité.
  - [x] Exception 404 : `public/404.html` reste la source protégée, consommée par `global-not-found`; la 404 React localisée de #118 n'est plus le comportement cible (#139).
  - [ ] Finaliser dans #197 le cas Vercel des URLs legacy inexistantes `*.html` (ex. `/people-contactedsss.html`) : elles doivent répondre HTTP 404 tout en rendant exactement la présentation protégée de `public/404.html`. #195 a restauré le principe mais son Preview exact-SHA a encore rendu le document d'erreur Next générique pour ces deux cas ; #197 déplace le fallback au niveau `vercel.json` vers le renderer 404 explicite et doit être validée par Playwright avant merge.
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
    - [x] #193 migre `central-authorities`, `central-authorities-failures` et `nre` vers des routes Next natives FR/EN/DE/NO ; les preuves exact-SHA Vercel, Playwright et ZAP sont vertes sur le HEAD validé avant merge.
    - [x] #194 migre le hub documentaire legacy `ca/index.html` vers `/central-authorities-documents` : l'inventaire est dérivé au build des fichiers réellement présents sous `public/ca/**`, les liens fantômes ne sont plus recopiés et les documents historiques restent servis dans leur langue/source d'origine.
    - [ ] Prochain lot documentaire : migrer progressivement les pages HTML de `public/ca/**` qui n'ont ni JS métier ni rendu graphique complexe, en commençant par les paires FR/EN clairement homologues.
      - [ ] Pour chaque document migré, conserver le fichier legacy comme référence jusqu'à preuve de parité contenu/comportement/SEO/accessibilité + Preview exact-SHA + Playwright/ZAP ; retirer ou rediriger ensuite seulement l'URL publique legacy.
      - [ ] Ne pas fabriquer automatiquement de traduction DE/NO pour les pièces juridiques/historiques : publier une locale native uniquement lorsque son contenu a été relu ; tant que la parité native n'existe pas, conserver le document source et le fallback Google Translate legacy.
      - [ ] Réutiliser l'inventaire build-time du hub comme source d'autorité afin qu'une migration ou suppression de fichier mette à jour la liste sans second catalogue manuel.
    - [ ] `abduction-norway.html` et `abduction-germany.html` restent derrière le lot documentaire : techniquement simples mais juridiquement/familialement sensibles, ils nécessitent une revue de contenu explicite avant extraction i18n et avant toute évolution de disclosure.
    - [ ] `people-contacted.html` reste legacy pour le moment à cause de son rendu D3/ARF et de `people-cards.js` ; migrer séparément sans perdre l'arbre, les cartes, le fallback Google Translate ni les preuves E2E.
    - [ ] Conserver `public/test.html` tant que sa finalité/contenu legacy ne sont pas réconciliés avec `/test`; l'audit post-#167 confirme que ce legacy charge le corpus ARF, donc aucune suppression/redirection avant la phase P6 et une preuve de parité complète.
      - [x] Localiser la surface Next `/test` en FR/EN/DE/NO via un domaine `messages/test`, y compris ses metadata noindex, sans importer le corpus legacy.
      - [x] Ajouter un contrat de coexistence qui exige `public/test.html` et ses signaux ARF (`d3.v3.min.js`, `arf.js`, `index.js`, association) et interdit tout redirect `/test.html` tant que la parité n'est pas démontrée.
      - [x] Ajouter une couverture Playwright FR/EN/DE/NO/noindex pour la surface Next et vérifier que `/test.html` reste un fallback ARF distinct.
      - [x] Exécuter cette couverture sur un checkpoint Vercel du SHA exact avant toute nouvelle déclaration de parité ou suppression legacy : #190 l'a validée dans Playwright Preview 137/137 et #191 la reconfirme dans la suite exacte 138/138. Cette preuve ne vaut pas parité ARF et n'autorise pas la suppression de `public/test.html`.
      - [x] Durcir le préflight Playwright afin qu'un `HTTP 429` ou `x-vercel-mitigated: challenge` soit identifié comme Vercel Security Checkpoint et rejeté avant les tests, au lieu d'être pris pour un accès valide.
    - [x] Inventorier les HTML legacy racine post-#167 : l'inventaire initial n'identifiait pas de nouvelle cible faible risque immédiate ; #193 requalifie explicitement `central-authorities`, `central-authorities-failures` et `nre` après extraction structurée, tandis que `404.html`, `index.html`, `contact.html`, `people-contacted.html` et `test.html` conservent leurs contraintes spécifiques.
- [ ] Différer les pages contenant un corpus familial sensible jusqu'à la phase finale de confidentialité.

## P4 — SEO et métadonnées

- [x] Canonicals et hreflang FR/EN/DE/NO des routes Next natives.
- [x] Sitemap hybride et robots alignés sur les routes actuellement indexables.
- [x] Open Graph/Twitter complets et spécifiques pour chaque route Next native (#116).
- [x] Redirects permanents des anciennes URLs `.html` pour `contact`, `email`, `link`, `success` et `cancel` après migration des routes Next correspondantes (#116, #140).
- [x] #193 finalise canonicals/hreflang/sitemap et redirects de `central-authorities`, `central-authorities-failures` et NRE ; `nre-fr.html` converge vers `/nre` et `nre-en.html` vers `/en/nre` sans doublon legacy dans le sitemap généré.
- [x] #194 ajoute le hub `/central-authorities-documents` au catalogue SEO/hreflang et retire le doublon `ca/index.html` du sitemap public.
- [x] Vérifier les redirects et métadonnées avec Playwright sur le Preview exact (#116).
- [x] Restaurer `/feed.xml` et ajouter le feed de contact dédié avec découverte RSS Next ; garder l’identité approuvée confinée au XML dédié et scanner explicitement les deux feeds via le privacy gate (#163).
- [x] Ajouter DE/NO dans les alternates après stabilisation des catalogues, y compris pour les six policies nativement localisées (#129, #130, #131, #134, #136).
- [ ] Garder la homepage et son Open Graph/Twitter comme exception propriétaire : aucun changement sans accord explicite.

## P5 — Nettoyage technique, performance et CI

### Checkpoint post-#182 et lot Node #185

- [x] #182 a été mergée sur `master` au SHA `1330279fae1db3006221d6d191173ea22d361614`; Vercel, `Production Post-deploy Smoke` et `Production DAST` sont verts sur cette baseline production.
- [x] La baseline DAST production post-#182 est `H0 M4 L4 I5`, contre `H0 M4 L6 I5` avant #182 : les LOW passent réellement de 6 à 4 sans masquer artificiellement les alertes restantes.
- [x] Docker CI #72 sur le merge SHA est verte : build, smoke du fallback et Trivy ont réellement tourné avec succès.
- [x] Diagnostiquer la Quality `master` #594 (`34668252882`) : elle est rouge sur trois contrats unitaires devenus obsolètes après #182 ; #185 corrige ces trois régressions. La baseline exploitable reste `npm ci=18s`, `node_modules=693 MiB`; `full_checks`, Next build et `.next` sont `n/a` car les tests unitaires ont arrêté le job avant build.
- [ ] Collecter plusieurs nouvelles baselines complètes et vertes avant toute promotion des budgets CI warning-only vers des seuils bloquants.
- [x] #181 est fermée sans merge : son travail Tailwind/PostCSS est superseded par #182, donc aucun rebase artificiel n'est requis.
- [x] Terminer #185 en Draft à faible coût puis, au checkpoint Ready, exécuter Quality Node 26, compatibilité Node 24, Docker/Trivy, Vercel exact-SHA, Playwright et ZAP sans merge automatique : toutes ces preuves sont vertes sur `7560c77c33ea0769d6c306049d0b20bdf504ff94`.

- [x] Aligner package/lockfile et retirer les dépendances confirmées orphelines (#123).
  - [x] Retirer `stripe`, `@stripe/stripe-js` et `@stripe/react-stripe-js` devenus sans consommateur après la migration/suppression des surfaces checkout (#144).
  - [x] Finaliser le retrait de `tailwindcss` et `@tailwindcss/postcss` : #182 retire les deux dépendances, `postcss.config.mjs` et remplace Preflight par `app/reset.css`; le checkpoint #185 puis les Preview exact-SHA #190/#191 valident build, Playwright et ZAP sans régression CSS.
- [ ] Retirer progressivement les runtimes/scripts legacy après preuve d'absence de consommateurs.
  - [x] Retirer les scaffolds Next orphelins non publiés `app/components/Hero.tsx`, les deux anciens `LocaleSwitcher.tsx` et `i18n/navigation.ts` après preuve d'absence d'import ; `RouteHeader` reste l'unique owner du switcher FR/EN/DE/NO et `/` continue d'être réécrit vers `public/index.html` (#168).
  - [x] Conserver OpenCommit sur décision explicite du propriétaire : wrapper/config et scripts `oco` / `opencommit` restaurés, dev-only et hors runtime (#150).
  - [x] Utiliser GitHub Actions comme CI principale et des annotations ESLint GitHub pour le workflow courant, tout en conservant `.gitlab-ci.yml` et son formatter comme fallback réactivable.
  - [x] Formaliser la policy npm 11.17+ d'installation : scripts transitoires actuellement bloqués explicitement refusés via `allowScripts`, mode `strict-allow-scripts` activé et `.npmrc` ajouté aux déclencheurs Quality.
  - [x] Réconcilier le contrat supply-chain après Dependabot #151 : `esbuild` `0.28.2` est la version transitive revue et explicitement attendue par le test d'installation, au lieu de laisser un merge dependency invalider Quality.
  - [x] Retirer le reliquat racine `.assetsignore` de l'ancien pipeline Cloudflare Workers/assets : #182 confirme l'absence de consommateur versionné, supprime le fichier, classe ce metadata path maintenance-only et a validé ce retrait par Quality ainsi qu'un checkpoint Vercel/Playwright/ZAP exact-SHA.
- [x] Retirer le bridge HTML des policies et le composant `PublicHtmlFragment` devenu orphelin ; conserver `htmlFromPublic` uniquement pour l'exception 404 imposée par la policy du repo.
  - [x] Retirer `sanitize-html` et son wrapper `check:sanitize-html` après preuve que `htmlFromPublic` n'en dépend plus ; élaguer les 12 entrées lockfile devenues exclusivement orphelines.
- [ ] Supprimer les pages `.html` et assets orphelins après validation des redirects et de la parité Next.
  - [x] Après gate #141 vert, retirer `public/success.html`, `public/cancel.html` et l'ignore Stylelint `public/checkout.css` devenu sans fichier ; verrouiller leur absence par contrat unitaire.
  - [x] Retirer les routes/catalogues fantômes confirmés, `lib/htmlRoutes.config.mjs` et l'ancien générateur FR après preuve d'absence de consommateur ; conserver les CTA homepage orphelins comme dette explicite jusqu'au cutover contrôlé (#142).
- [x] Réduire les téléchargements et jobs CI inutiles.
  - [x] Ajouter un gate agent-first inspiré de `nabla-compose#132` : préflight Git sans dépendances avant `npm ci`, garde de fraîcheur/troncature/bit exécutable, workflow `--fix` → check → `--publish`, sortie compacte et pre-push dédié, sans dupliquer le gate Nabla canonique.
  - [x] Porter dans #177 le Follow-up post-merge de `nabla-site-alban#173` : classifier les échecs, rejouer automatiquement les fixes déterministes jusqu'à convergence, arrêter les échecs sans mutation, exposer `quality:agent:*`, réaligner le gate canonique `--publish` et rendre obligatoire l'enregistrement des reliquats dans cette roadmap avant toute déclaration de fin de travail.
  - [ ] Automatiser dans #178 le Follow-up après un `master` rouge : réutiliser/ouvrir une issue par SHA, tenter uniquement les mutations déterministes sur le delta du commit fautif, refuser les chemins inattendus/destructions, n'ouvrir une PR qu'après `quality:agent` + `quality:agent:publish`, puis dispatcher explicitement `ci.yml`; conserver ZAP strictement derrière `vercel.deployment.success` et le préflight d'accès Preview.
    - [x] Implémentation et contrats statiques ajoutés dans #178, y compris le refus d'écraser une branche de remediation existante et l'inscription du nouveau workflow dans les path filters Quality.
    - [ ] Après merge de #178, observer le premier `master` réellement rouge sans provoquer volontairement une panne de production et confirmer de bout en bout issue dédupliquée → correctif déterministe éventuel → PR automatique → CI explicitement dispatchée ; si GitHub refuse la création de PR avec `GITHUB_TOKEN`, documenter/configurer le mécanisme d'autorisation avant de considérer ce chemin opérationnel comme validé.
  - [x] Sur les PR en draft, limiter Quality au préflight Git sans installer Node/npm ni construire Next ; `ready_for_review` relance automatiquement le gate complet, afin que l'itération agent ne consomme une build qu'au checkpoint de publication.
  - [x] #179 rend le chemin agent réellement local-first : formatter/linter/security avant les checks npm/Next coûteux, `--fix` convergent, preuve locale liée au HEAD/base/toolchain réutilisable par `--publish`/pre-push et `QUALITY_FORCE_PUBLISH=1` pour forcer une validation complète.
    - [x] Vérifier la santé de la base production avant `npm ci`, en exigeant Vercel + `Production Post-deploy Smoke` + `Production DAST`; n'autoriser un fallback vers un parent que pour un hop semantic-release prouvé version/changelog-only et borné.
    - [x] Revalider ensuite `https://www.bababou.com` par smoke live léger avant installation des dépendances.
    - [x] Conserver les scopes maintenance-only sans Semgrep, Next build, dependency scan, Vercel Preview, Playwright ni ZAP inutiles.
    - [x] Rendre explicite l'ownership du cache npm (`package-manager-cache: false` + `actions/cache`) et ajouter des budgets CI warning-only, sans transformer les variations de performance en échec Quality.
    - [x] Checkpoint distant `ad440fc8e3911c9813e0a5a0972bab0e1b79d004` validé : Quality #472 et Copilot Setup #88 verts. En environnement API-only, aucune exécution workstation locale n'est revendiquée.
  - [x] Snyk ne prépare plus/pull plus son image Docker lorsque `SNYK_TOKEN` est absent.
  - [x] Remplacer le cache npm implicite de `setup-node` par `actions/cache` sur `~/.npm` dans les workflows qui installent le projet ; pinner npm depuis `$RUNNER_TEMP` dans tous les workflows GitHub afin que le npm embarqué ne lise pas `.npmrc` avant npm 11.17, tout en conservant `strict-allow-scripts` et le cache.
  - [x] Rendre les caches npm/pre-commit/Next best-effort : une panne du backend GitHub Cache ne doit jamais rendre Quality rouge ; séparer restore/save, préchauffer les hooks pre-commit sur cache miss et réutiliser `.next/cache` entre builds afin d'éviter les compilations systématiquement froides.
  - [x] Pinner les GitHub Actions des chemins critiques Quality/Copilot sur les SHA immuables correspondant aux versions revues, avec contrat empêchant le retour de références flottantes dans ces workflows.
  - [x] Étendre le pinning SHA à tous les workflows GitHub actifs (Docker, Playwright, Vercel Preview et Release déjà conforme) et étendre le contrat pour empêcher toute nouvelle référence distante flottante.
  - [x] Rendre les caches npm et Chromium du workflow Playwright best-effort afin qu'une panne GitHub Cache ne transforme pas un Preview fonctionnel en faux échec E2E.
  - [x] Retirer le workflow GitHub MegaLinter dormant, encore câblé sur l'ancien `main`, plutôt que réactiver un job lourd et redondant ; conserver `.mega-linter.yml` aligné sur `master` uniquement pour le fallback `.gitlab-ci.yml`.
  - [x] #185 fait de Node `26.8.2` Current la source de vérité dev/agents/CI via `.nvmrc`, mise et direnv, tout en conservant Vercel Node `24.x` comme cible de compatibilité production explicite et testée séparément.
  - [x] Réconcilier le fallback Docker statique avec le repo réel : `master`, image Bababou, contexte limité à `public/`, BuildKit cache + Trivy, publication GHCR sur les changements du fallback et Docker Hub uniquement en opt-in manuel ; supprimer la dette `pgclient`/`PG_MAJOR`/Node inutile sans en faire le runtime principal.
  - [x] Mettre à niveau la base du fallback de `nginx:1.27-alpine` vers la stable `nginx:1.30.4-alpine-slim` avant d'envisager un gate Trivy bloquant ; l'ancienne base exposait des findings HIGH/CRITICAL corrigés dans des packages plus récents.
  - [x] Vérifier le SARIF après upgrade : 34 findings HIGH/CRITICAL sur l'ancienne base → 0 sur `nginx:1.30.4-alpine-slim`, puis activer `exit-code: 1` pour rendre le scan HIGH/CRITICAL bloquant sur le fallback Docker.
  - [x] Basculer le fallback vers l'image officielle `nginxinc/nginx-unprivileged:1.30.4-alpine-slim`, exposer 8080 et ajouter un smoke test CI prouvant un runtime non-root ainsi que le service de `/` et du `public/404.html` protégé.
  - [x] #182 aligne Docker CI sur le cycle Draft/Ready : les PR Draft ne consomment plus Buildx/build/smoke/Trivy ; Trivy conserve désormais un SARIF d'échec 7 jours et alimente Code Scanning avant l'enforcement HIGH/CRITICAL. Quality Draft #576 et Docker #55 ont prouvé le skip réel.
  - [x] Preuve post-merge #182 sur `1330279fae1db3006221d6d191173ea22d361614` : Docker CI #72 est verte ; build, smoke étendu du fallback et scan Trivy ont réellement réussi, avec conservation SARIF d'échec et enforcement naturellement skippés puisque le scan est sain.
  - [x] Les Preview Vercel ne déclenchent plus deux suites Playwright concurrentes et le chemin conservé réutilise le cache Chromium (#121).
  - [x] Ajouter un OWASP ZAP Baseline GitHub sur le même `vercel.deployment.success`, filtré strictement sur `vercel-preview-pr-*` et le SHA exact de la PR ; le scanner reçoit le Protection Bypass via `ZAP_AUTH_HEADER_*`, cible uniquement l'URL `*.vercel.app` de Preview et publie le statut `OWASP ZAP Preview`.
  - [x] Pinner `zaproxy/action-baseline` v0.15.0 sur SHA immuable et l'image ZAP sur `2.17.0`; désactiver l'ouverture automatique d'issues.
  - [x] Automatiser le checkpoint `vercel-preview-pr-<N>` après Quality verte pour les PR internes ready et deploy-relevant ; attendre ensuite les statuts exact-SHA `Playwright Preview E2E` et `OWASP ZAP Preview` dans un job dédié, tout en conservant le workflow on-demand comme fallback manuel (#174).
  - [ ] Stabiliser le **déclenchement autonome Vercel** de ces checkpoints : #191 prouve qu'un `git push` du checkpoint depuis Quality avec `GITHUB_TOKEN` peut créer/mettre à jour la ref sans qu'aucun déploiement Vercel ne soit enregistré ; republier le même SHA via une identité GitHub utilisateur/connector a immédiatement déclenché le Preview exact, Playwright et ZAP. Ne pas supposer qu'un simple remplacement par l'API GitHub sous le même `GITHUB_TOKEN` suffit : conserver le fail-fast 2 minutes et prouver un mécanisme autonome supporté de bout en bout avant de solder cette dette.
  - [x] Stabiliser `git.deploymentEnabled` avec les deux catch-all `"*": false` et `"**": false` : `*` couvre les refs simples et `**` ferme aussi les branches contenant `/`, qui restaient sinon non couvertes et donc autorisées par défaut. Conserver `master` et `vercel-preview-*` à `true` ; les règles positives gagnent lorsqu’elles chevauchent un catch-all. #174 a prouvé qu’un checkpoint `vercel-preview-pr-174` déclenche bien un vrai Preview Vercel via `git push`, tandis qu’un head `ci/...` ne doit plus consommer un build séparé.
  - [x] Premiers dispatchs ZAP réels sur `vercel-preview-pr-174` observés : #2/#3 ont échoué avant le scanner parce que `repository_dispatch` charge la définition du workflow depuis `master`. Supprimer la dépendance à l'API Pull Requests : valider à la place que la branche checkpoint Git pointe exactement sur `DEPLOYED_SHA` avec `contents: read`; aucun finding applicatif ZAP n'a été produit par ces runs.
  - [x] Documenter l'exception bootstrap GitHub : `repository_dispatch` charge la définition ZAP de `master`. Les PR uniquement `.github/**` / `.zap/**` restent donc maintenance-only (Quality + Semgrep + contrats, sans build Vercel inutile) et le nouveau `workflow_dispatch` permet un replay manuel sur une Preview existante ; lorsqu'une même PR contient aussi un changement applicatif deploy-relevant, Playwright valide le SHA exact et le statut ZAP est explicitement deferred jusqu'à ce que la définition devienne `master`.
  - [x] Aligner le coût Preview sur `nabla-site-alban#168` : les changements uniquement workflows / `.zap/**` ne forcent plus un déploiement applicatif Vercel ; le gate exact-SHA reste obligatoire dès qu'un fichier réellement déployable est modifié.
  - [x] Porter les améliorations sécurité de `nabla-site-alban#168/#169` dans #175 : Semgrep changed-source avant le build avec SARIF + artefact, ZAP Preview rejouable manuellement, fallback OIDC Trusted Source, statut enrichi avec compteurs H/M/L/I, et DAST production indépendant quotidien/post-déploiement.
  - [x] Publier un statut `Production Post-deploy Smoke` depuis le smoke léger existant afin de préparer le futur gate de santé de la base `master` sans dupliquer les probes.
  - [x] Observer au moins une baseline `Production Post-deploy Smoke` et une baseline `Production DAST` vertes sur un `master` post-#175 avant de rendre ces deux statuts obligatoires au début de chaque PR, comme dans `nabla-site-alban#169`.
    - [x] Baseline saine observée sur `7f43739e4b7c71746c85e3bfc8536a5675fb2f43` : Vercel success, `Production Post-deploy Smoke` success et `Production DAST` success (`H0 M4 L6 I5`).
    - [x] #179 a exécuté le nouveau gate en début de PR et reconnu uniquement le hop `7f43739... → 6cfd2db...` comme semantic-release version/changelog-only avant de valider la baseline puis le smoke live.
  - [x] Collecter la première baseline ZAP effectivement scannée sur une Preview Vercel réelle avec la définition post-#175 : #177 a produit un rapport réel `H0 M4 L6 I5`; les deux alertes bloquantes `10020`/`10021` ont été corrigées sans affaiblir la policy et le nouveau scan a `FAIL-NEW: 0`.
    - [ ] Trier puis réduire les warnings ZAP restant réellement applicables (notamment CSP, SRI, cookies, cache et cross-origin) sans casser le corpus hybride ni le fallback Google Translate ; toute promotion WARN→FAIL doit être justifiée par la baseline et validée sur Preview exact-SHA.
      - [x] #182 retire la feuille Font Awesome cdnjs 7.0.1 redondante des HTML qui possèdent déjà le bundle local 7.1.0, et rend les redirects locale-root `/en|/de|/no → /` explicites avant `next-intl` pour cibler les causes observées de dépendance tierce et de Big Redirect sans modifier le fallback Google Translate.
      - [x] Rejouer OWASP ZAP sur un HEAD Ready exact après #182 et comparer la baseline : #190 puis #191 confirment `H0 M4 L4 I5`, `FAIL-NEW=0` et `Big Redirect` PASS. Les sujets CSP/cache/cross-origin/SRI/cookie restant sont volontairement visibles et restent à trier sans suppression cosmétique.
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
  - [x] Instrumentation conservée après retour à `build: next build` : le wrapper `run-next-build.mjs` retiré n’est plus nécessaire, Quality chronomètre directement l'unique `npm run build` entre les phases pré/post-build.
  - [x] Première comparaison #146 → #147 : `npm ci` 31 → 24 s, `node_modules` 1112 → 1041 MiB, `next build` 19,6 → 18,2 s et `.next` 69 → 66 MiB.
  - [x] Deuxième baseline #148 : 808 paquets, `npm ci` 20 s, `node_modules` 918 MiB, `npm run check` 31 s, `next build` 14,0 s et `.next` 66 MiB.
  - [x] Baseline post-merge #158 à cache `master` froid : `npm ci` 22 s, `node_modules` 723 MiB, cache npm 207 MiB, `npm run check` 42 s, `next build` 19,3 s et `.next` 66 MiB ; aucun warning npm pré-pin.
  - [x] Baseline post-merge #167 / Quality #354 : cache npm hit, cache Next initial de `master` absent, `npm ci` 15 s, `node_modules` 723 MiB, cache npm 207 MiB, `npm run check` 44 s, `next build` 19,5 s et `.next` 67 MiB ; ce run amorce le cache Next propre à `master`.
  - [x] Baseline post-merge #168 / Quality #367 : 168/168 tests, cache npm hit, cache Next miss après changement de clé/runtime, `npm ci` 10 s, `node_modules` 723 MiB, cache npm 207 MiB, checks 23 s, `next build` 6,5 s et `.next` 72 MiB.
  - [x] Après les baselines #158/#167/#168 et la baseline post-#178, définir dans #179 des budgets **warning-only** avec marge : `npm ci` > 30 s, `node_modules` > 800 MiB, `npm run check` > 60 s, `next build` > 30 s et `.next` > 80 MiB. Ils restent informatifs et ne sont pas des gates bloquants.
  - [x] Baseline maintenance-only #179 : `npm ci` 17 s, `node_modules` 723 MiB, cache npm 234 MiB (hit), lint/CSS/unit tests 12 s, 230/230 tests ; Next build non mesuré car volontairement skippé pour ce scope.
  - [x] Baseline runtime #190 / Quality #644 : `npm ci` 19 s, `node_modules` 693 MiB, cache npm 234 MiB, checks complets 46 s, `next build` 15,6 s et `.next` 63 MiB ; tous les budgets warning-only sont verts.
  - [x] Baseline runtime #191 / Quality #646 : `npm ci` 19 s, `node_modules` 693 MiB, checks complets 48 s, `next build` 16,3 s et `.next` 63 MiB ; tous les budgets warning-only restent verts.
  - [ ] Continuer à collecter les baselines post-merge avant toute promotion éventuelle d'un budget vers un seuil bloquant.
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
  - [x] #193 : `central-authorities`, `central-authorities-failures` et NRE migrés, avec contraste, redirects, sitemap et preuves exact-SHA Playwright/ZAP validés avant merge.
  - [x] #194 : hub documentaire `ca/index.html` migré vers `/central-authorities-documents` avec inventaire build-time du corpus réellement présent.
  - [x] #197/#198 : fallback Vercel des `*.html` inexistants vers la 404 statique protégée avec vrai HTTP 404 ; #198 durcit aussi HEAD, noindex et no-store sans changer `public/404.html`.
  - [ ] Lot suivant proposé : pages documentaires `public/ca/**` sans JS complexe, par paires FR/EN homologues et sans traduction juridique automatique ; ensuite seulement `abduction-norway.html` / `abduction-germany.html` après revue de contenu.
  - [ ] `people-contacted.html` reste une migration séparée à cause de D3/ARF/`people-cards.js`, même si son contraste est déjà durci.
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
  - [x] Converger avec le cleanup agent/tooling d’Alban #133 : Copilot Setup piloté par `.nvmrc` et adapters VS Code/Cursor/Next.js/Security réduits vers `AGENTS.md`, sans anciennes instructions Vercel CLI/Git Flow/sitemap ; #182 réaligne ensuite `.nvmrc` sur Node 24 LTS après EOL de Node 25.
  - [x] Sortir la toolchain semantic-release du graphe npm normal comme Alban #133 : 4 dépendances directes et 412 entrées lockfile retirées, versions pinées et téléchargées uniquement dans le job release.
  - [x] Retirer les scaffolds Next homepage/locale orphelins et leur helper de navigation après preuve d'absence de consommateurs (#168).
  - [x] Retirer le wrapper de build métrique `scripts/run-next-build.mjs` et aligner le manifeste sur `build: next build` / `start: next start`, tout en gardant une mesure CI sans build dupliqué (#168).
  - [x] Élaguer la distribution Font Awesome complète vendorizée : les pages legacy ne consomment que `js/fontawesome.js`, `js/solid.js` et `js/brands.js`; conserver ces trois fichiers et la licence aux mêmes URLs, retirer 5 681 fichiers CSS/SCSS/metadata/sprites/SVG/webfonts non servis (~26,3 MB) et verrouiller ce sous-ensemble par contrat (#170).
  - [x] Élaguer aussi le bundle CSS Font Awesome : conserver uniquement `fontawesome.css`, `brands.css`, `solid.css` et les deux webfonts réellement référencées; retirer 19 variantes/minifiés/shims/fonts non chargés (~405 KB) avec contrat sur les consommateurs Next + legacy (#170).
  - [x] Corriger le déclencheur Docker PR pour inclure `public/**` comme le trigger `push master`, puis étendre le smoke fallback aux trois bundles Font Awesome conservés afin qu'un asset public supprimé par erreur échoue avant merge (#170).
  - [x] Sortir le convertisseur JPG/Pillow de `public/assets/` vers `scripts/`, conserver son défaut `public/assets` et le wrapper existant, afin que le tooling de maintenance ne soit plus servi comme asset HTTP (#170).
  - [x] Retirer `scripts/run-install.sh` et `scripts/run-test.sh` après audit : aucun consommateur externe, le premier réinstallait des packages Font Awesome hors manifeste et le second dupliquait des sous-ensembles Playwright déjà couverts par les scripts npm canoniques (#170).
  - [x] Conserver `public/google-translate-config.js` comme shim de compatibilité qui délègue vers `site-google-translate.js`; ne pas réintroduire de loader Google direct ni supprimer le fallback tant qu'il existe du contenu/langues sans traduction i18n native paritaire (#171).
  - [x] Dédupliquer le runtime traduction entre `site-widgets.js` et `site-google-translate.js`, avec ownership runtime unique, shim de compatibilité conservé et contrat garantissant le fallback Google Translate sur les consommateurs legacy sans parité i18n (#171).
  - [x] #179 : quality gate local-first, base production saine avant npm, smoke live, budgets CI warning-only, cache npm explicitement possédé et fast path maintenance-only validés sur le checkpoint distant.
  - [x] #182 : héritage de baseline production durci, SARIF Semgrep succès dédupliqué, baseline CI versionnée, `.assetsignore` retiré, Node/runtime documenté et coût Docker Draft supprimé.
  - [x] #182 : retrait de Node 25 EOL et passage transitoire à Node 24 LTS ; #185 supersède cette cible comme source de vérité dev/agents/CI avec Node `26.8.2`, tout en conservant Node 24.x comme compatibilité Vercel production.
  - [x] #182 : dette de checkpoint Ready reclassifiée post-merge : Vercel production, smoke, DAST et Docker/Trivy sont prouvés sur `1330279fae1db3006221d6d191173ea22d361614`, avec DAST `H0 M4 L4 I5` ; la validation navigateur/CSS restante a été ensuite prouvée au checkpoint exact #185 puis reconfirmée par #190/#191.
  - [x] Finaliser Tailwind/PostCSS : retrait code/lock/config présent depuis #182, reset projet et contrats validés ; #185 puis #190/#191 fournissent la preuve Ready + Preview exact-SHA/Playwright/ZAP sans régression CSS/build.
  - [ ] Retrait des runtimes/scripts/assets legacy restants après preuve d'absence de consommateurs externes.
  - [ ] Stabiliser le déclenchement autonome des checkpoints Vercel depuis Quality, conformément à la dette opérationnelle #191 décrite dans P5.
    - [x] #199 extrait la publication exacte `vercel-preview-pr-<n>` dans un helper local réutilisable : seed sur la base, déplacement exact-SHA protégé par `--force-with-lease`, validation d’ascendance et tests Git locaux. Le gate agent local réutilise aussi le fast-path maintenance de la CI (`lint` + CSS + unit tests, sans `next build` inutile) afin de maximiser la validation workstation quand Actions est indisponible ; le classifieur inclut désormais les suppressions de fichiers runtime et adopte un défaut conservateur (chemin inconnu ou diff vide ⇒ gate complet), afin qu’un delete ou une nouvelle surface de déploiement ne contourne jamais le build. Ce fallback ne remplace pas Quality/Playwright/ZAP runner-backed ; le parent reste donc ouvert.
- [ ] **Parité structurelle nabla-site-alban — structure/technologies/comportements identiques, contenu distinct.**
  - [x] Runtime : Node 26.8.2 pour dev/agents et Node 24.11.0 pour la compatibilité production Vercel.
  - [x] Plateforme : fallback Docker non-root identique et hardening Next partagé (`poweredByHeader=false`, headers sécurité).
  - [x] Quality local : garde de taille baseline-aware de `nabla-site-alban#186`, avant npm, sans dépendance tierce.
  - [x] Cohérence des scopes : les mêmes scripts quality/checkpoint sont maintenance-only dans le gate local, la CI Preview et l’héritage de baseline production.
  - [ ] **P0 après #199** — extraire les mécaniques communes vers `scripts/lib/agent-quality-support.sh` et séparer la preuve de publication via `scripts/agent-publish.sh`, comme Alban.
    - [ ] Implémentation post-#199 : publisher exact HEAD/base/toolchain, build local uniquement pour un scope deploy-relevant, pre-push réutilisant la preuve, base de PR résolue depuis le HEAD courant de `master`, et pre-commit canonique placé avant baseline réseau/Semgrep/npm. Les échecs observés sur #199 étaient des démarrages runner avec `steps=null` ; conserver cet item ouvert tant que le gate local complet et une exécution runner-backed n'ont pas confirmé le nouveau chemin.
    - [x] #201 : classifieur aligné sur Alban (`scripts/ci-scope.sh`, sans shim legacy) avec interface `BASE HEAD`, sorties `maintenance_only`/`application`/`sast`/`build` et extension Bababou `dependencies` pour Snyk. Implémentation mergée ; la preuve runner-backed reste indisponible (`steps=null`) et le P0 parent reste ouvert jusqu'au passage du gate workstation complet.
    - [ ] **Post-#201 / P0 quality parity** — extraire la classification release/maintenance de la baseline production dans `scripts/lib/production-baseline-classification.sh` pour la tester sans réseau ; réutiliser le publisher exact-SHA dans le Preview on-demand ; verrouiller les bits exécutables des scripts critiques et corriger toute mutation déterministe de formatter détectée localement. Garder ouvert tant que le gate workstation complet n'est pas vert.
    - [ ] **P0 CI policy parity (#192 Alban)** — le préflight local rejette désormais les directives GitHub `[skip ci]`/`skip-checks: true` sur les commits de PR, en plus de la règle agent. Ajouter ensuite le guard metadata-only `pull_request_target` équivalent lorsque les runners GitHub redeviennent disponibles, afin d'obtenir la même preuve serveur sans ajouter aujourd'hui un job impossible à valider.
    - [ ] **#203 / P0 Preview scope parity** — séparer le scope sécurité du scope déploiement comme Alban #194/#195 : `.github/**` reste `sast=true` mais devient `application=false` / `build=false` / `preview_required=false`; `ci-scope.sh` est l'autorité unique du Preview automatique (`preview_required`, `zap_bootstrap`), tandis que le Preview on-demand conserve un classifier API séparé avant checkout du code PR.
      - [x] Implémentation rebasée sur #202/#204 : classifier de baseline conservé policy-only et Preview-safe, helper exact-SHA réutilisé, raw force-push/`forceCheckpoint` interdits, bits exécutables et fingerprint toolchain verrouillés par contrats ; `sast` reste source-aware afin de ne pas lancer Semgrep sans cible sur les dépendances ou politiques shell ; le preflight sans dépendances contrôle aussi `git diff --check` et la syntaxe Bash des scripts modifiés avant tout bootstrap npm/pre-commit.
      - [ ] Validation workstation obligatoire avant Ready/merge : `bash scripts/agent-quality-gate.sh --fix`, commit du diff convergé, puis `QUALITY_FORCE_PUBLISH=1 bash scripts/agent-publish.sh`; ne pas déclencher de rerun GitHub Actions tant que le quota runner n'est pas rétabli.
  - [ ] **P1 UI primitives** — ajouter `Button`, étendre `ActionLink` avec `outlineSecondary`, `outlineInfo`, `inverted`, puis porter les contrats `actionPrimitives` / `cardPrimitive` de #183 ; conserver le contenu Bababou inchangé.
    - [x] #204 implémentation : primitives, tokens et contrats portés sans migration de contenu.
    - [ ] #204 validation : exécuter `agent-quality-gate.sh --fix` puis `agent-publish.sh` sur le checkout workstation complet avant de fermer P1.
  - [ ] **P2 responsive / Bootstrap** — appliquer les patterns #184/#190/#191 : CSS Modules/layout natif, `Card`/`ActionLink`/`Button`, réduction progressive des classes Bootstrap sur les pages Next prioritaires.
    - [x] #204 implémentation : chrome responsive partagé de #184 porté sur `RouteHeader` avec contrat `responsiveChromeContract`, sans migration de contenu.
    - [ ] #204 validation : confirmer les breakpoints 320/375/768/1024/1440+ et le reflow 200 % via Playwright avant de considérer ce sous-lot terminé.
    - [ ] Lot suivant : migrer progressivement les consommateurs Next restants vers les primitives partagées, en gardant le corpus HTML legacy autonome.
  - [ ] **P3 visual regression** — porter le contrat light/dark/auto de `nabla-site-alban#189` avec routes prioritaires Bababou, contraste >= 4.5:1 et absence d’overflow horizontal.
  - [ ] **P4 tooling** — maintenir Next/React/next-intl/TypeScript/ESLint/tsx et scripts npm alignés ; documenter explicitement les seules divergences justifiées par le contenu ou les intégrations.
  - [ ] **P5 404/routing parity** — comparer périodiquement le comportement `*.html`/404 aux évolutions Alban #188 sans remplacer la stratégie filesystem nécessaire au corpus legacy Bababou.
- [ ] **Migration 8 / P3** — extraction progressive de sections homepage en conservant les disclosures approuvées, sans changement sensible non validé.
  - [ ] Au cutover Next de `/`, remplacer les raster legacy restants par `next/image` avec formats modernes WebP/AVIF, tailles responsives et une image sociale dédiée ~1200×630 ; conserver des budgets de poids/CLS explicites.
- [ ] **Migration finale / P6** — confidentialité hors homepage : pseudonymisation/caviardage du corpus restant et extension complète du privacy gate.

## Règles de maintenance de cette roadmap

- Chaque nouvelle dette de migration/refactoring doit être ajoutée ici avec priorité et, si possible, numéro de PR/issue.
- Une PR coche uniquement les éléments réellement vérifiés par CI/Preview/production.
- Avant de déclarer un travail terminé, l'agent doit vérifier que tout reliquat nécessitant encore une action projet est représenté par un item non coché ici ; une dette seulement mentionnée en chat, dans un log CI, un artefact éphémère ou une description de PR n'est pas considérée comme enregistrée.
- Ne jamais déplacer des données sensibles dans ce fichier pour documenter un défaut : décrire la catégorie de donnée, pas sa valeur.
- Supprimer les TODO obsolètes du code lorsqu'ils sont représentés ici ; garder dans le code uniquement les TODO locaux dont le contexte est nécessaire à l'implémentation.
