# Structure minimale Next.js avec localisation

Ce dépôt utilise Next.js, avec les pages localisées sous app/[locale]/.

- Pour migrer vos anciennes pages html/css/js, créez un fichier page.tsx correspondant dans app/[locale]/<slug>/
- Assets (images, js, css) à placer dans /public/

## Démarrer

```bash
npm install
npm run dev
```

## Localisation

- Les langues sont configurées dans next.config.mjs.
- Ajoutez vos traductions dans /messages et /i18n.

## Pages test / not-found

- app/test/page.tsx : page de test, vérification.
- app/[locale]/not-found/page.tsx : page d'erreur localisée.

## Pour aller plus loin

- Inspirez-vous de nabla-site-alban pour la migration des pages.
- Voir le README d’alban pour la documentation.
