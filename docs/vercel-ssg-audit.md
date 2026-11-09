# Audit de prérendu Vercel — routes publiques Bababou

**Preuve de publication du 9 novembre 2026 — prérendu confirmé dans le build Vercel, CPU non mesuré.**

Le passage Next.js à `dynamic = "force-static"` indique une intention de génération
statique : seul un **build réussi** et son `.next/prerender-manifest.json` peuvent
prouver le prérendu effectif. Le SSR n'est **pas désactivé globalement**.

## Portée contrôlée par la PR #260 (fusionnée)

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

L'équipe Vercel Hobby a été réactivée et le nouveau déploiement de production est **READY** : `dpl_6LPdgycLzEXKLyCQXmzQk49Lxm2F` sur `master@4e1a2b14538e2e4f5b3a2454690e12156c5ed5bc`. La table des routes du build confirme `/fr/success`, `/en/success`, `/de/success`, `/no/success` comme **SSG (●)** après fusion de [#264](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/264). Les checks qualité/Node24 restent à remédier et le CPU réel n'a pas été mesuré.

La page NRE ne contient que le contenu public approuvé : aucun document
OpenRAG privé, URL sensible, numéro d'identité ni pièce brute ne doit être
publié via le build. Le registre probatoire public est suivi par la
[PR #262 fusionnée](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/262)
et la [roadmap canonique](roadmap.md), mais Cloudflare Access demeure inactif et les preuves privées ne sont pas publiées.

## Critère de fin

1. Audit SSG exact-SHA PASS en local, sans régression `home-preview`.
2. Tests unitaires, confidentialité, SAST et accessibilité pertinents PASS.
3. Après reprise, recettes HTTP et navigation réelles ; mesurer les consommations de l'équipe dans **Vercel Usage** : Fluid Active CPU, Provisioned Memory, invocations et Top Paths. L'API connectée a retourné `404 costs_not_found` pour Billing et `404 not_found` pour Observability. La collecte CLI JSON proposée dans [Site Alban #295](https://github.com/AlbanAndrieu/nabla-site-alban/pull/295) reste à valider sur un export réel ; **aucun gain CPU non mesuré ne doit être annoncé**.
