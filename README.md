# Structure minimale Next.js avec localisation

[![CI](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/workflows/ci.yml/badge.svg)](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/workflows/ci.yml)
[![Coverage Status](https://codecov.io/gh/AlbanAndrieu/nabla-site-bababou/branch/master/graph/badge.svg)](https://codecov.io/gh/AlbanAndrieu/nabla-site-bababou)
[![Vercel](https://vercel.com/api/v1/badges/)](https://vercel.com/albandrieu-nabla-site-bababou)
[![Known Vulnerabilities](https://snyk.io/test/github/AlbanAndrieu/nabla-site-bababou/badge.svg)](https://snyk.io/test/github/AlbanAndrieu/nabla-site-bababou)

Ce dépôt utilise Next.js, avec les pages localisées sous app/[locale]/.

- Pour migrer vos anciennes pages html/css/js, créez un fichier page.tsx correspondant dans app/[locale]/<slug>/
- Assets (images, js, css) à placer dans /public/

## Démarrer

```bash
npm install
npm run dev
```

## Qualité de code, CI/CD et Pull Requests

- Exécutez `npm run check` avant chaque commit pour valider lint (JS/TS/CSS), typecheck, unit tests et build Next.js.
- Les hooks pre-commit sur chaque commit : lint/format (biome, stylelint, prettier), secrets (gitleaks), yamllint, check case, trailing whitespace/EOL...
- Pour installer : `pre-commit install` — mettre à jour : `pre-commit autoupdate`
- Playwright : `npm test` (tests e2e)
- La CI Cloud (GitHub Actions) contrôle : lint, check, pre-commit, tests e2e, audit sécurité.
- À chaque Pull Request : une checklist PR template garantie la qualité, le passage CI, l’absence de secrets, la DOC à jour, etc.
- La CI bloque le merge si un check échoue.

## Localisation

- Les langues sont configurées dans next.config.mjs.
- Ajoutez vos traductions dans /messages et /i18n.

## Pages test / not-found

- app/[locale]/test/page.tsx : page de test, vérification.
- app/[locale]/not-found/page.tsx : page d'erreur localisée.

## Pour aller plus loin

- Inspirez-vous de nabla-site-alban pour la migration des pages.
- Voir le README d’alban pour la documentation et la structure qualité complète.
