# Roadmap consolidée — migration Next.js

> Source unique pour les TODO, migrations et refactorings encore actifs du projet.
> Ne pas créer de nouveau `TODO.md`, `MIGRATION.md` ou roadmap parallèle : ajouter les travaux ici et lier la PR correspondante.

## Principes

- Next.js/Vercel est le runtime cible.
- La migration reste incrémentale : les pages statiques de `public/` continuent de fonctionner jusqu'à leur remplacement explicite.
- Une route legacy n'est redirigée définitivement vers Next qu'après parité fonctionnelle, visuelle, SEO, accessibilité et tests E2E.
- Les locales de premier rang sont `fr`, `en`, puis `de` et `no`. Google Translate reste un complément, pas une source de routes canonicales.
- Les données familiales sensibles doivent être auditées et assainies avant toute copie du HTML legacy vers JSX, messages i18n, metadata, JSON-LD ou artefacts générés.
- Les PR de migration doivent rester petites et supprimer une dette legacy mesurable plutôt que créer une seconde implémentation durable.
- Respecter autant que possible la structure et le nommage stabilisés dans `nabla-site-alban` ; documenter explicitement les divergences nécessaires au mode hybride Bababou.
- Suivre les patterns du `master` courant de `nabla-site-alban`, pas un ancien snapshot : helpers partagés, types de routes Next natifs, ownership i18n par les composants et tests de contrat doivent être portés lorsqu'ils s'appliquent à Bababou.
- Ne pas recopier aveuglément les politiques propres au repo de référence : `nabla-site-alban` a l'anglais à la racine, alors que Bababou conserve le français comme `defaultLocale` non préfixée.
- Un contrôle de confidentialité doit échouer sans réimprimer la valeur protégée ; les logs ne doivent exposer que le fichier, la ligne et la catégorie de finding.

## État de référence — 2026-08-26

### Terminé

- [x] Déploiement configuré comme projet Next.js/Vercel.
- [x] App Router et `next-intl` introduits.
- [x] Routage hybride : `/` sert temporairement `public/index.html` avant `next-intl` via `proxy.ts`.
- [x] Les fichiers statiques explicites de `public/` restent servis pendant la migration.
- [x] Canonicals et metadata Next corrigés pour Bababou et la locale française par défaut.
- [x] Routes françaises sans préfixe et routes anglaises sous `/en` pour les surfaces Next natives.
- [x] Le home reste volontairement mono-canonical sur `/` tant que P3 n'est pas terminé ; `/fr` et `/en` ne publient pas de faux home Next.
- [x] Bridge progressif HTML -> React (`PublicHtmlFragment` / `htmlFromPublic`) avec tests unitaires.
- [x] L'index legacy sensible n'est pas allowlisté dans le bridge tant que son cutover React n'est pas validé.
- [x] Playwright Preview est conçu pour utiliser le SHA et l'URL de déploiement exacts, le bypass Vercel et un fallback OIDC.
- [x] CI Next génère les types de routes avant le typecheck et conserve `public/**` comme source runtime pendant la phase hybride.
- [x] Script `scripts/vercel-ignore-build.sh` ajouté pour réduire les déploiements inutiles.
- [x] Sélecteur de langue généré depuis `routing.locales` au lieu d'options FR/EN maintenues à la main (#101).
- [x] Migration 2 / P1 intégrée à `master` : CI qualité, `next build`, contrats E2E Next/Vercel et invariants hybrides (#100/#102).
- [x] Migration 3a / P2 intégrée : politique canonical hybride, alternates, `PageProps` générés et primitives d'accessibilité partagées (#105).
- [x] Migration 3b / P2 intégrée : catalogues runtime focalisés `site`, `contact`, `email`, `link`, nettoyage des surfaces Next actives et sitemap hybride (#106).
- [x] Les anciens `messages/{locale}.json` ne sont plus chargés par le runtime Next ; les namespaces déjà migrés ont été retirés de ces catalogues legacy.
- [x] Test de structure protégeant le `postinstall` legacy tant que ses consommateurs ne sont pas audités.

### Blocages opérationnels actuels

- [ ] Configurer dans Vercel l'Ignored Build Step sur `bash scripts/vercel-ignore-build.sh` si ce n'est pas déjà fait.
- [ ] Vérifier le binding DNS/domaine de `bababou.com` et le rattachement au projet Vercel ; le domaine doit résoudre publiquement avant validation de production.
- [ ] Vercel doit de nouveau accepter un Preview ; les derniers statuts reçus indiquent `Deployment was blocked` malgré un `next build` GitHub vert.
- [ ] Vérifier `/`, `/index.html`, les routes Next déjà migrées et Playwright Preview sur le SHA exact après chaque changement de routage/runtime.

## P1 — Stabiliser et simplifier le runtime

Objectif : un seul chemin de build et de déploiement, aligné sur `nabla-site-alban`, sans casser le runtime legacy encore requis.

- [x] Remplacer l'ancienne version preview de Next.js par une version stable ; le projet utilise désormais Next `16.3.2`.
- [ ] Aligner explicitement `next` et `eslint-config-next` dans le manifeste/lockfile et vérifier leur résolution effective.
- [ ] Borner les engines Node/npm au major supporté par CI/Vercel (`Node 24`, `npm 11`) au lieu de bornes uniquement minimales.
- [ ] Supprimer `express` et `@types/express` s'ils restent sans consommateur.
  - [x] Audit du code versionné : aucun import ESM, `require()` ou appel `express()` trouvé.
  - [ ] Retrait effectif à faire avec régénération atomique du lockfile dans Migration 2b.
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
- [ ] Éliminer le warning Turbopack de `htmlFromPublic.ts` : le chemin dynamique trace actuellement plus de 11 000 fichiers alors que l'allowlist ne contient que quelques documents.
- [ ] Éviter le pull de l'image Docker Snyk lorsque `SNYK_TOKEN` est vide ; aujourd'hui l'image est téléchargée même si le scan final est ensuite skipped.
- [ ] Mesurer l'impact sur taille d'installation/cache et durée de build après ces optimisations.

Critères de sortie :

- `npm ci`, `npm run check` et `next build` verts ;
- aucune dépendance/runtime supprimé encore référencé ;
- Preview Vercel opérationnel ;
- aucun changement de rendu legacy non intentionnel.

## P2 — Finaliser l'architecture i18n et routing

- [ ] Nettoyer les derniers textes/labels copiés du site `nabla-site-alban` qui subsistent dans les catalogues legacy non chargés.
  - [x] Les surfaces Next actives ne rendent plus le chrome professionnel copié.
  - [x] `contactPage`, `email` et `linkPage` n'existent plus en double dans les catalogues legacy.
- [x] Générer le sélecteur de langue depuis `routing.locales` au lieu de maintenir les options à la main.
- [x] Composer les catalogues runtime via `i18n/messages.ts` avec loaders explicites par locale et rejet des namespaces de premier niveau dupliqués.
- [x] Extraire les domaines runtime sous `messages/site`, `messages/contact`, `messages/email` et `messages/link`.
- [x] Introduire un skip-link Next partagé dont le composant possède directement la traduction `site.skipToMainContent`.
- [x] Remplacer les types locaux de props de `email` et `link` par `PageProps<...>` généré par Next.
- [x] Centraliser la politique canonical des routes Next déjà natives : `/contact`, `/email`, `/link` pour FR et `/en/...` pour EN, sans extension `.html`.
- [x] Geler explicitement les semantics d'URL des pages encore legacy ; leur extension/prefixe ne change qu'au moment de leur migration vérifiée.
- [x] Générer les alternates des routes Next natives depuis `routing.locales` avec `fr` comme `x-default`.
- [ ] Stabiliser FR et EN sur un Preview réel avant d'ajouter de nouvelles locales.
- [ ] Ajouter `de` et `no` à `routing.locales` avec des catalogues complets et validés.
- [ ] Cibles après migration du home : `/` = FR, `/en` = EN, `/de` = DE, `/no` = NO.
- [ ] Finaliser les tests de canonical, locale switcher et absence de boucles de redirection.
  - [x] Tests unitaires : canonical FR/EN des routes Next natives, absence de `.html`, `x-default` français et gel des URLs legacy.
  - [x] Tests Playwright écrits : metadata canonical/hreflang de `contact`, `email`, `link` et noindex de la route technique.
  - [ ] Exécution E2E sur le Preview exact : bloquée tant que Vercel refuse le déploiement.
- [ ] Garder Google Translate uniquement pour les langues hors locales de premier rang.

### Règles i18n reprises du repo de référence

- Un composant serveur focalisé doit charger son namespace avec `getTranslations()` lorsqu'il peut posséder sa copy, plutôt que recevoir de nombreux textes localisés par props.
- Ne pas créer de dictionnaires de traduction locaux dans les composants.
- Un domaine volumineux peut devenir `messages/<domaine>/{locale}.json`, avec un loader/compositeur central dans `i18n/messages.ts` et un contrôle d'unicité des namespaces.
- La modularisation d'un catalogue doit transférer l'ownership d'un namespace : ne pas conserver durablement le même namespace simultanément dans le catalogue legacy et le catalogue de domaine.
- Conserver les noms propres, noms de produits et identifiants canoniques non traduisibles comme tels ; ajouter des tests lorsqu'une valeur doit être identique entre locales.
- Les helpers de navigation, metadata et accessibilité communs doivent être partagés plutôt que dupliqués route par route.

## P3 — Migrer la page d'accueil

### Confidentialité avant migration

- [ ] Finaliser l'audit de `public/index.html` et de tous ses assets avant toute injection dans React.
  - [x] Audit textuel de la home, de ses attributs/commentaires/metadata/JSON-LD et de ses références à risque élevé.
  - [x] Suppression d'un artefact de document officiel et de deux artefacts de localisation devenus orphelins.
  - [ ] Revue visuelle manuelle des photos/binaires restantes avant de recopier une section qui les utilise dans React.
- [x] Retirer ou généraliser dans la home actuelle les identifiants de documents officiels, coordonnées privées, institutions/localisations trop précises détectés par le gate.
- [x] Ajouter `scripts/privacy-gate.ts` avec lecture de la policy privée sans dupliquer les valeurs protégées dans le code ou les tests (#107).
- [x] Ajouter des tests de non-régression avec uniquement des valeurs synthétiques ; les logs ne révèlent jamais la valeur trouvée.
- [x] Exécuter le privacy gate sur les sources utilisées par Next et la home legacy avant le build.
- [x] Exécuter un second privacy gate après `next build` sur `.next/server` et `.next/static`, avec parsing structuré des source maps et exclusion du code tiers `node_modules`.
- [x] La CI GitHub de #107 valide source privacy scan + `next build` + generated-output privacy scan sur le même SHA.
- [ ] Étendre ultérieurement le gate à l'ensemble des documents legacy publics au fur et à mesure de leur migration ; #107 protège d'abord la home et les sources Next.

### Conversion progressive

- [ ] Décomposer `app/[locale]/page.tsx` en composants de sections focalisés.
- [ ] Déplacer les textes localisables vers un catalogue `messages/home/{locale}.json` possédé par la home native.
- [ ] Utiliser temporairement `PublicHtmlFragment` uniquement pour les sections auditées et non encore converties.
- [ ] Retirer chaque section legacy du fragment dès que son composant React atteint la parité.
- [ ] Préférer des composants serveur qui possèdent leurs traductions ; isoler en composants client uniquement les interactions nécessitant réellement le navigateur.
- [ ] Vérifier responsive/mobile, accessibilité, liens, assets, metadata et SEO.
- [ ] Faire passer les E2E sur le Preview exact.
- [ ] Une fois la page native prête, retirer le rewrite temporaire de `/`.
- [ ] Ajouter un redirect permanent `/index.html` -> `/` uniquement après le cutover.

## P4 — Migrer les pages restantes

Ordre recommandé :

1. routes simples et faible risque : redirects legacy de contact/email/link, 404 et pages légales ;
2. pages publiques structurées ;
3. pages contenant des données familiales uniquement après extension du privacy gate.

Pour chaque page :

- [ ] Créer ou finaliser la route Next localisée.
- [ ] Atteindre la parité de contenu/rendu/comportement.
- [ ] Vérifier confidentialité, accessibilité, SEO/canonical et E2E.
- [ ] Ajouter le redirect permanent de l'ancienne URL `.html` vers la route Next.
- [ ] Supprimer la page legacy devenue sans consommateur et ses assets orphelins.

## P5 — Quality gate de fin de migration

- [ ] lint JS/TS ;
- [ ] lint CSS ;
- [ ] typecheck ;
- [ ] unit tests ;
- [ ] `next build` ;
- [ ] Playwright Preview ;
- [ ] accessibilité/axe sur les routes principales ;
- [ ] tests SEO : canonical, hreflang, redirects, sitemap/robots ;
- [ ] privacy scan de toutes les sources publiques et de la sortie générée ;
  - [x] fondation source + build en place pour les sources Next et la home (#107) ;
- [ ] détection de secrets ;
- [ ] suppression des derniers fichiers/runtimes statiques devenus inutiles.

## Découpage des prochaines PR

- [x] **Migration 2 / P1 — PR #100/#102** : rebase, CI `next build`, contrats E2E Next/Vercel, invariants hybrides et nettoyage du contexte Vercel ; `postinstall` conservé jusqu'à l'audit `dist/`.
- [ ] **Migration 2b / P1** — alignement package/lockfile + engines bornés + suppression des dépendances confirmées orphelines + retrait vérifié des runtimes legacy.
- [x] **Migration 3a / P2 — PR #105** — fondations routing/i18n : canonical hybride correct, alternates pilotés par `routing`, `PageProps` Next et primitives d'accessibilité partagées.
- [x] **Migration 3b / P2 — PR #106** — ownership i18n focalisé, nettoyage des surfaces Next actives, footer/header et sitemap hybride.
- [ ] **Migration 4a / P3 — PR #107** — privacy gate source + build et assainissement préalable de la home ; code validé par CI, merge/Preview encore à finaliser.
- [ ] **Migration 4b / P3** — première extraction native de sections home, sans cutover de `/`.
- [ ] **Migration 5 / P4a** — redirects legacy contact/email/link + pages légales/404.
- [ ] **Migration 6 / P4b** — autres pages publiques.
- [ ] **Migration 7 / P4c** — pages sensibles + privacy hardening étendu.
- [ ] **Migration finale / P5** — suppression du fallback/runtime legacy et quality gate complet.

## Règles de maintenance de cette roadmap

- Chaque nouvelle dette de migration/refactoring doit être ajoutée ici avec priorité et, si possible, numéro de PR/issue.
- Une PR coche uniquement les éléments réellement vérifiés par CI/Preview/production.
- Ne jamais déplacer des données sensibles dans ce fichier pour documenter un défaut : décrire la catégorie de donnée, pas sa valeur.
- Supprimer les TODO obsolètes du code lorsqu'ils sont représentés ici ; garder dans le code uniquement les TODO locaux dont le contexte est nécessaire à l'implémentation.
