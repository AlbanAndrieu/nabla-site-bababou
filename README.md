# Structure minimale Next.js avec localisation

[![CI](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/workflows/ci.yml/badge.svg)](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/workflows/ci.yml)
[![Coverage Status](https://codecov.io/gh/AlbanAndrieu/nabla-site-bababou/branch/main/graph/badge.svg)](https://codecov.io/gh/AlbanAndrieu/nabla-site-bababou)
[![Vercel](https://vercel.com/api/v1/badges/)](https://vercel.com/albandrieu-nabla-site-bababou)
[![Known Vulnerabilities](https://snyk.io/test/github/AlbanAndrieu/nabla-site-bababou/badge.svg)](https://snyk.io/test/github/AlbanAndrieu/nabla-site-bababou)
[![Changelog](https://img.shields.io/badge/changelog-md-blue)](CHANGELOG.md)

Ce dépôt utilise Next.js, avec les pages localisées sous `app/[locale]/`.

- Pour migrer les anciennes pages HTML/CSS/JS, créez la route correspondante sous `app/[locale]/<slug>/`.
- Les assets statiques restant nécessaires pendant la migration sont servis depuis `public/`.
- La source unique pour les travaux actifs est [`docs/roadmap.md`](docs/roadmap.md) ; le runbook CI/Vercel, les incidents connus et leur diagnostic sont regroupés dans [`docs/operations.md`](docs/operations.md).

## Démarrer

```bash
mise install
just install
just dev
```

## Qualité de code, CI/CD et Pull Requests

- Utilisez `just` comme interface canonique : `just check` valide lint (JS/TS/CSS), typecheck, tests unitaires, publication privée et build Next.js. `just quality-fix` puis `just publish` préparent et contrôlent la publication.
- Les hooks pre-commit sur chaque commit : lint/format (biome, stylelint, prettier), secrets (Betterleaks), yamllint, check case, trailing whitespace/EOL...
- Pour installer les hooks : `just hooks` — actualiser leurs versions explicitement avec `mise run hooks-update` ; auditer tous les workflows avec `just workflow-audit`.
- Playwright : `npm test` (tests e2e).
- La CI Cloud (GitHub Actions) contrôle : lint, check, pre-commit, tests e2e, audit sécurité.
- À chaque Pull Request, la checklist du template vérifie la qualité, le passage CI, l'absence de secrets et la documentation.
- La CI bloque le merge si un check requis échoue.

## Localisation

- Les langues et la stratégie de préfixe sont configurées dans `i18n/routing.ts`.
- Ajoutez les traductions dans `messages/` et la configuration associée dans `i18n/`.

## Pages test / not-found

- `app/[locale]/test/page.tsx` : page de test/vérification.
- `app/[locale]/not-found/page.tsx` : page d'erreur localisée.

## Migration

La migration reste incrémentale : Next.js/Vercel est le runtime cible tandis que les pages de `public/` restent disponibles jusqu'à leur remplacement et validation. Le plan, les priorités et les critères de sortie sont maintenus uniquement dans [`docs/roadmap.md`](docs/roadmap.md).

Pour les patterns déjà stabilisés (App Router, i18n, Preview Vercel, Playwright et retrait progressif du legacy), `nabla-site-alban` sert de dépôt de référence.
