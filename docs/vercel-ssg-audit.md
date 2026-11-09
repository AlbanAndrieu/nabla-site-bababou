# Audit de prérendu Vercel — routes publiques Bababou

**Préparation du 8 novembre 2026 — aucune preuve de publication en production.**

Le passage Next.js à `dynamic = "force-static"` indique une intention de génération
statique : seul un **build réussi** et son `.next/prerender-manifest.json` peuvent
prouver le prérendu effectif. Le SSR n'est **pas désactivé globalement**.

## Portée contrôlée par la PR #260

- `/nre`, autorités centrales et ses deux pages dérivées ;
- les 6 politiques `/policy/[policy]` définies dans `lib/mainContentRoute.mjs` ;
- `/home-preview`, qui doit **rester non indexable** ;
- les 4 locales `fr/en/de/no` avec français sans préfixe canonique ;
- `proxy.ts`, les routes privées et la bascule éditoriale `/` restent inchangés.

L'audit du manifeste distingue **prérendu**, **revalidation ISR** et **absence de
prérendu**. Il ne prétend pas établir qu'aucune autre route ne consomme des
fonctions serveur, ni que les en-têtes Vercel sont corrects.

## Reproduire sur un checkout complet

```bash
node --test unit-tests/vercelNode24Layout.test.mjs
npm run check:prebuild
npm run build
node scripts/verify-next-prerender.mjs .next/prerender-manifest.json
npm run check:postbuild
```

- `SSG_PASS` : toutes les variantes attendues possèdent une entrée de
  prérendu avec `initialRevalidateSeconds = false`.
- `SSG_FAIL` (code 1) : route absente ou en ISR. Examiner la sortie Next.js
  du **même SHA** ; ne jamais masquer le défaut.
- `SSG_NOT_VERIFIED` (code 2) : build ou manifeste indisponible. Ceci
  n'est **pas** un succès.

Un build local ne prouve pas que la version est servie par Vercel. Conserver
les preuves `HEAD + toolchain + manifest`, puis seulement après reprise du
compte comparer la version déployée, `Functions`, `Fluid Active CPU`, les
en-têtes HTTP et les parcours clavier/FR/EN/DE/NO.

## Sécurité et publication

L'équipe Vercel Hobby est suspendue (HTTP 402 observé dans les contrôles DAST
du 6 novembre). La demande de réactivation est envoyée, non confirmée.
**Aucun nouveau déploiement** ne doit être assimilé à un état READY tant que
le service ne répond pas à nouveau.

La page NRE ne contient que le contenu public approuvé : aucun document
OpenRAG privé, URL sensible, numéro d'identité ni pièce brute ne doit être
publié via le build. Le registre probatoire en préparation est suivi par la
[PR #262](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/262)
et la [roadmap canonique](roadmap.md).

## Critère de fin

1. Audit SSG exact-SHA PASS en local, sans régression `home-preview`.
2. Tests unitaires, confidentialité, SAST et accessibilité pertinents PASS.
3. Après réactivation, recettes HTTP et navigation réelles, puis métriques CPU
   attribuées aux routes ; aucun gain CPU non mesuré ne doit être annoncé.
