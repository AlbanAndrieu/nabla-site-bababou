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

## État de référence — 2026-08-25

### Terminé

- [x] Déploiement configuré comme projet Next.js/Vercel.
- [x] App Router et `next-intl` introduits.
- [x] Routage hybride : `/` sert temporairement `public/index.html` avant `next-intl` via `proxy.ts`.
- [x] Les fichiers statiques explicites de `public/` restent servis pendant la migration.
- [x] Canonicals et metadata Next corrigés pour Bababou et la locale française par défaut.
- [x] Routes françaises sans préfixe et routes anglaises sous `/en`.
- [x] Bridge progressif HTML -> React (`PublicHtmlFragment` / `htmlFromPublic`) avec tests unitaires.
- [x] L'index legacy sensible n'est pas allowlisté dans le bridge tant que son audit confidentialité n'est pas terminé.
- [x] Playwright Preview utilise le SHA et l'URL de déploiement exacts, le bypass Vercel et un fallback OIDC.
- [x] CI Next génère les types de routes avant le typecheck et conserve `public/**` comme source runtime pendant la phase hybride.
- [x] Script `scripts/vercel-ignore-build.sh` ajouté pour réduire les déploiements inutiles.
- [x] Sélecteur de langue généré depuis `routing.locales` au lieu d'options FR/EN maintenues à la main (#101).
- [x] Migration 2 / P1 intégrée à `master` : CI qualité, `next build`, Vercel Preview et contrats E2E stabilisés (#100/#102).
- [x] Catalogues i18n de premier rang conservés sous `messages/{locale}.json`, sans catalogue parallèle `messages/migration/*`.
- [x] Test de structure protégeant le `postinstall` legacy et l'emplacement des catalogues de base pendant la phase hybride.

### Blocages opérationnels actuels

- [ ] Configurer dans Vercel l'Ignored Build Step sur `bash scripts/vercel-ignore-build.sh` si ce n'est pas déjà fait.
- [ ] Vérifier le binding DNS/domaine de `bababou.com` et le rattachement au projet Vercel ; le domaine doit résoudre publiquement avant validation de production.
- [ ] Vérifier `/`, `/index.html`, `/en`, les routes Next déjà migrées et Playwright Preview sur le SHA exact après chaque changement de routage/runtime.

## P1 — Stabiliser et simplifier le runtime

Objectif : un seul chemin de build et de déploiement, aligné sur `nabla-site-alban`, sans casser le runtime legacy encore requis.

- [ ] Remplacer la version preview de Next.js par la version stable validée dans le repo de référence (`16.3.1` au 2026-08-25).
- [ ] Aligner `next` et `eslint-config-next` sur des versions compatibles et régénérer proprement `package-lock.json`.
- [ ] Borner les engines Node/npm sur le major supporté par CI/Vercel (`Node 24`, `npm 11`) au lieu de bornes uniquement minimales.
- [ ] Supprimer `express` et `@types/express` s'ils restent sans consommateur.
  - [x] Audit du code versionné : aucun import ESM, `require()` ou appel `express()` trouvé.
  - [ ] Retrait effectif à faire avec régénération atomique du lockfile dans Migration 2b.
- [ ] Retirer Wrangler et `wrangler.jsonc` une fois confirmé qu'aucun déploiement Cloudflare Workers n'est encore requis.
- [ ] Auditer les consommateurs de `dist/`, `index/dist/` et les assets copiés par `postinstall`.
  - [x] Audit initial du dépôt : `app/scripts/arf.js`, `app/resources/`, `dist/` et `index/dist/` ne sont pas versionnés sur la branche courante.
  - [x] `npm ci` exécute néanmoins le `postinstall` sans erreur dans la CI de Migration 2.
  - [ ] Vérifier les consommateurs externes/legacy et la génération attendue hors Git avant toute suppression.
- [x] **Conserver le `postinstall` actuel et `copyfiles` tant que l'audit n'est pas terminé.** Leur retrait doit être atomique avec la migration des consommateurs correspondants.
- [x] Ajouter un test de régression qui verrouille le `postinstall` legacy et les catalogues de base `messages/{locale}.json` pendant cette phase hybride.
- [ ] Supprimer les scripts redondants `build:n`, `start:n`, `build:v`, `start:v`, `dev:wrangler`, `start:wrangler`, `deploy:wrangler` seulement après retrait vérifié de leurs runtimes.
- [ ] Conserver à terme un seul couple nominal `build: next build` / `start: next start`.
- [x] Exécuter explicitement `next build` dans la CI GitHub de qualité afin de ne pas dépendre uniquement de Vercel pour valider la compilation.
- [ ] Mesurer l'impact sur taille d'installation/cache et durée de build.

Critères de sortie :

- `npm ci`, `npm run check` et `next build` verts ;
- aucune dépendance/runtime supprimé encore référencé ;
- Preview Vercel opérationnel ;
- aucun changement de rendu legacy non intentionnel.

## P2 — Finaliser l'architecture i18n et routing

- [ ] Nettoyer les derniers textes/labels copiés du site `nabla-site-alban`.
- [x] Générer le sélecteur de langue depuis `routing.locales` au lieu de maintenir les options à la main.
- [x] Conserver les catalogues de base sous `messages/{locale}.json` et éviter tout catalogue parallèle `messages/migration/*`.
- [ ] Introduire `i18n/messages.ts` uniquement lorsqu'un vrai domaine fonctionnel doit être extrait des catalogues de base, selon le pattern actuel de `nabla-site-alban` : loaders explicites par locale, composition des catalogues et rejet des namespaces de premier niveau dupliqués.
- [x] Introduire un skip-link Next partagé dont le composant possède directement la traduction `site.skipToMainContent`, suivant le pattern récent de `nabla-site-alban`.
- [x] Remplacer les types locaux de props de `email` et `link` par `PageProps<...>` généré par Next.
- [x] Centraliser la politique canonical des routes Next déjà natives : `/`, `/contact`, `/email`, `/link` pour FR et `/en/...` pour EN, sans extension `.html`.
- [x] Geler explicitement les semantics d'URL des pages encore legacy ; leur extension/prefixe ne change qu'au moment de leur migration vérifiée.
- [x] Générer les alternates de `email` et `link` depuis `routing.locales` avec `fr` comme `x-default`.
- [ ] Étendre la génération d'alternates depuis `routing.locales` aux autres routes Next au fur et à mesure de leur refactor.
- [ ] Stabiliser FR et EN avant d'ajouter de nouvelles locales.
- [ ] Ajouter `de` et `no` à `routing.locales` avec des catalogues complets et validés.
- [ ] Cibles : `/` = FR, `/en` = EN, `/de` = DE, `/no` = NO.
- [ ] Ajouter des tests de canonical, locale switcher et absence de boucles de redirection.
  - [x] Tests unitaires : canonical FR/EN des routes Next natives, absence de `.html`, `x-default` français et gel des URLs legacy.
  - [ ] Tests E2E : metadata canonical/hreflang rendues et absence de boucles sur chaque locale.
- [ ] Garder Google Translate uniquement pour les langues hors locales de premier rang.

### Règles i18n reprises du repo de référence

- Un composant serveur focalisé doit charger son namespace avec `getTranslations()` lorsqu'il peut posséder sa copy, plutôt que recevoir de nombreux textes localisés par props.
- Ne pas créer de dictionnaires de traduction locaux dans les composants.
- Les catalogues de base restent `messages/{locale}.json`. Un domaine volumineux peut ensuite devenir `messages/<domaine>/{locale}.json`, mais uniquement avec un loader/compositeur central dans `i18n/messages.ts` et un contrôle d'unicité des namespaces.
- La modularisation d'un catalogue doit transférer l'ownership d'un namespace : ne pas conserver durablement le même namespace simultanément dans le catalogue de base et le catalogue de domaine.
- Conserver les noms propres, noms de produits et identifiants canoniques non traduisibles comme tels ; ajouter des tests lorsqu'une valeur doit être identique entre locales.
- Les helpers de navigation, metadata et accessibilité communs doivent être partagés plutôt que dupliqués route par route.

## P3 — Migrer la page d'accueil

### Confidentialité avant migration

- [ ] Auditer `public/index.html` et ses assets/références avant toute injection dans React.
- [ ] Retirer ou généraliser les identifiants de documents officiels, coordonnées privées, localisations trop précises et données médicales/psychologiques non destinées à être publiées.
- [ ] Inspecter également metadata, JSON-LD, commentaires HTML, attributs, fichiers JSON et bundles générés.
- [ ] Ajouter un test de non-régression de confidentialité sans inscrire les valeurs sensibles elles-mêmes dans le test.

### Conversion progressive

- [ ] Décomposer `app/[locale]/page.tsx` en composants de sections focalisés.
- [ ] Déplacer les textes localisables vers `messages/{locale}.json`.
- [ ] Utiliser temporairement `PublicHtmlFragment` uniquement pour les sections auditées et non encore converties.
- [ ] Retirer chaque section legacy du fragment dès que son composant React atteint la parité.
- [ ] Préférer des composants serveur qui possèdent leurs traductions ; isoler en composants client uniquement les interactions nécessitant réellement le navigateur.
- [ ] Vérifier responsive/mobile, accessibilité, liens, assets, metadata et SEO.
- [ ] Faire passer les E2E sur le Preview exact.
- [ ] Une fois la page native prête, retirer le rewrite temporaire de `/`.
- [ ] Ajouter un redirect permanent `/index.html` -> `/` uniquement après le cutover.

## P4 — Migrer les pages restantes

Ordre recommandé :

1. routes simples et faible risque : contact, email, link, 404 et pages légales ;
2. pages publiques structurées ;
3. pages contenant des données familiales uniquement après industrialisation du privacy gate.

Pour chaque page :

- [ ] Créer la route Next localisée.
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
- [ ] privacy scan des sources et de la sortie générée ;
- [ ] détection de secrets ;
- [ ] suppression des derniers fichiers/runtimes statiques devenus inutiles.

## Découpage des prochaines PR

- [x] **Migration 2 / P1 — PR #100/#102** : rebase, CI `next build`, contrats E2E Next/Vercel, invariants hybrides et nettoyage du contexte Vercel ; `postinstall` conservé jusqu'à l'audit `dist/`.
- [ ] **Migration 2b / P1** — Next stable + engines bornés + suppression des dépendances confirmées orphelines + régénération atomique du lockfile.
- [ ] **Migration 3a / P2 — PR #105** — fondations routing/i18n : canonical hybride correct, alternates pilotés par `routing`, `PageProps` Next et primitives d'accessibilité partagées.
- [ ] **Migration 3b / P2** — i18n FR/EN propre + préparation DE/NO directement dans les catalogues de base ; appliquer progressivement l'ownership des traductions par composants et n'extraire des catalogues de domaine que lorsque leur taille le justifie.
- [ ] **Migration 4 / P3** — home Next progressive et privacy gate.
- [ ] **Migration 5 / P4a** — contact/email/link + redirects legacy.
- [ ] **Migration 6 / P4b** — autres pages publiques.
- [ ] **Migration 7 / P4c** — pages sensibles + privacy hardening.
- [ ] **Migration finale / P5** — suppression du fallback/runtime legacy et quality gate complet.

## Règles de maintenance de cette roadmap

- Chaque nouvelle dette de migration/refactoring doit être ajoutée ici avec priorité et, si possible, numéro de PR/issue.
- Une PR coche uniquement les éléments réellement vérifiés par CI/Preview/production.
- Ne jamais déplacer des données sensibles dans ce fichier pour documenter un défaut : décrire la catégorie de donnée, pas sa valeur.
- Supprimer les TODO obsolètes du code lorsqu'ils sont représentés ici ; garder dans le code uniquement les TODO locaux dont le contexte est nécessaire à l'implémentation.
