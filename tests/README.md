# Tests navigateur — Playwright

Ce dossier contient les scénarios end-to-end du site hybride : homepage legacy, Preview React optionnelle, pages Next localisées, 404, thèmes, accessibilité, responsive et protections de confidentialité. L'orchestrateur est `playwright.config.ts` ; les commandes canoniques sont dans le [runbook](../docs/operations.md).

## Exécuter localement

```bash
npm test                    # Tous les projets Playwright
just a11y                   # Axe, Chromium et harness local dédié
npm run test:ui             # Playwright UI
npm run test:debug          # Inspecteur
npm run test:report         # Rapport du dernier run
```

Le Playwright standard utilise `http://127.0.0.1:3000` par défaut (port `PLAYWRIGHT_PORT` configurable). Il lance `npm run dev:test` localement, ou `npm run start:test` sous CI. `BASE_URL` cible une Preview existante sans lancer de serveur. Les projets déclarés sont Chromium, Firefox, WebKit, Mobile Chrome et Mobile Safari.

La page de revue `/home-preview` est disponible sans variable d'environnement, mais reste `noindex` et ne remplace pas `/`. Sur un déploiement Preview protégé, utiliser un accès Vercel autorisé, sans désactiver les protections.

## Preview protégée

`playwright.config.ts` exige un moyen d'accès autorisé lorsque `VERCEL_PREVIEW_PROTECTED=true` et `BASE_URL` est défini : `VERCEL_AUTOMATION_BYPASS_SECRET` ou `VERCEL_TRUSTED_OIDC_TOKEN`. Ne pas imprimer leur valeur ni la copier dans une PR ou un rapport. La validation doit porter sur **le SHA exact du déploiement**.

## Contrats et diagnostics

- Préférer les rôles, noms accessibles et locators stables aux sélecteurs CSS internes.
- Utiliser les assertions auto-attendues ; éviter les temporisations fixes et `networkidle` lorsque des scripts tiers chargent.
- Vérifier le statut HTTP, le `lang`, les cibles d'ancrage, le focus et les variantes de largeur.
- Pour un échec, lire la trace puis la capture, vérifier le SHA et l'authentification avant de modifier les tests.
- Les retries ne corrigent pas un test instable ; ils servent au diagnostic.
- Distinguer `NOT_RUN`, échec de lancement, challenge Vercel et assertion applicative.

La CI, la rétention des artefacts et l'ordre build/Preview/ZAP sont définis dans `.github/workflows/` : ne pas recopier leurs valeurs changeantes ici. La revue de sécurité et la publication privée restent obligatoires avant fusion.

Références : [roadmap](../docs/roadmap.md), [parité homepage](../docs/homepage-migration-parity.md), [documentation Playwright](https://playwright.dev/docs/intro).
