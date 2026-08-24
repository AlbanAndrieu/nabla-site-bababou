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

## État de référence — 2026-08-23

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

### Blocages opérationnels actuels

- [ ] Rétablir la capacité de build Vercel : le dernier `master` est actuellement refusé pour `build-rate-limit`.
- [ ] Configurer dans Vercel l'Ignored Build Step sur `bash scripts/vercel-ignore-build.sh` si ce n'est pas déjà fait.
- [ ] Vérifier le binding DNS/domaine de `bababou.com` et le rattachement au projet Vercel ; le domaine doit résoudre publiquement avant validation de production.
- [ ] Dès qu'un Preview peut être créé, vérifier `/`, `/index.html`, `/en`, les routes Next déjà migrées et Playwright Preview.

## P1 — Stabiliser et simplifier le runtime

Objectif : un seul chemin de build et de déploiement, aligné sur `nabla-site-alban`.

- [ ] Remplacer la version preview de Next.js par la version stable validée dans le repo de référence.
- [ ] Aligner `next` et `eslint-config-next` sur des versions compatibles et régénérer proprement `package-lock.json`.
- [ ] Borner les engines Node/npm sur le major supporté par CI/Vercel (`Node 24`, `npm 11`) au lieu de bornes uniquement minimales.
- [ ] Supprimer `express` et `@types/express` s'ils restent sans consommateur.
- [ ] Retirer Wrangler et `wrangler.jsonc` une fois confirmé qu'aucun déploiement Cloudflare Workers n'est encore requis.
- [ ] Supprimer `copyfiles` et l'ancien `postinstall` de copie vers `dist/` lorsque tous les assets nécessaires sont servis depuis `public/` ou importés par Next.
- [ ] Supprimer les scripts redondants `build:n`, `start:n`, `build:v`, `start:v`, `dev:wrangler`, `start:wrangler`, `deploy:wrangler` après retrait de leurs runtimes.
- [ ] Conserver un seul couple nominal `build: next build` / `start: next start`.
- [ ] Mesurer l'impact sur taille d'installation/cache et durée de build.

Critères de sortie :

- `npm ci`, `npm run check` et `next build` verts ;
- aucune dépendance/runtime supprimé encore référencé ;
- Preview Vercel opérationnel ;
- aucun changement de rendu legacy non intentionnel.

## P2 — Finaliser l'architecture i18n

- [ ] Nettoyer les derniers textes/labels copiés du site `nabla-site-alban`.
- [ ] Générer le sélecteur de langue depuis `routing.locales` au lieu de maintenir les options à la main.
- [ ] Stabiliser FR et EN avant d'ajouter de nouvelles locales.
- [ ] Ajouter `de` et `no` à `routing.locales` avec des catalogues complets et validés.
- [ ] Cibles : `/` = FR, `/en` = EN, `/de` = DE, `/no` = NO.
- [ ] Générer alternates/hreflang depuis la configuration de routing.
- [ ] Ajouter des tests de canonical, locale switcher et absence de boucles de redirection.
- [ ] Garder Google Translate uniquement pour les langues hors locales de premier rang.

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

- [ ] **Migration 2 / P1** — runtime cleanup + Next stable + roadmap consolidée.
- [ ] **Migration 3 / P2** — i18n FR/EN propre + préparation DE/NO.
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
