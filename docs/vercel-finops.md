# FinOps Vercel — Bababou (lecture seule)

**Préparation du 9 novembre 2026.** Ce dépôt partage les quotas de l'équipe Vercel
`albanandrieus-projects` avec `nabla-site-alban`, `checklist` et
`nabla-site-apache`.

Le site public ne doit pas héberger un proxy de facturation, un token Vercel
ou une page de métriques internes. L'analyse s'effectue **hors du runtime
Next.js**, sans invoquer de fonction ni modifier les paramètres du projet.

## Contrôles disponibles

`scripts/finops/vercel-usage-budget.mjs` est une copie du contrôle maintenu
dans [Site Alban, PR #295](https://github.com/AlbanAndrieu/nabla-site-alban/pull/295).
Il exige une quantité **Fluid Active CPU**, son unité et une fenêtre d'environ
30 jours. Il ignore les montants facturés en dollars et ne somme pas deux fois
`breakdown` et `grandTotal`.

```bash
# Contrat déterministe, hors réseau :
node --test unit-tests/vercelUsageBudget.test.mjs

# Depuis une workstation authentifiée Vercel :
vercel usage --scope albanandrieus-projects \
  --from 2026-10-11 --to 2026-11-09 --format json \
  | node scripts/finops/vercel-usage-budget.mjs --stdin

# Le code --strict retourne non-zéro à partir de WATCH (50 %).
vercel usage --scope albanandrieus-projects --format json \
  | node scripts/finops/vercel-usage-budget.mjs --stdin --strict
```

`--from` et `--to` sont des journées civiles du fuseau Pacific ;
éviter de confondre la période de facturation et la période de contrôle.
Le parseur rend **`WINDOW_UNVERIFIED`** si l'export ne prouve pas la
fenêtre requise ; **`NOT_MEASURED`** lorsque la quantité/unité est
absente ou inconnue. Une sortie JSON des **coûts** Vercel uniquement ne
permet pas de calculer le CPU.

Les API connectées du compte Hobby ont répondu `404 costs_not_found` pour
Billing Charges et `404 not_found` pour Observability. Dans ce cas utiliser
le [tableau de bord Usage](https://vercel.com/dashboard) pour relever les
heures CPU réelles, la mémoire provisionnée, les invocations et la ventilation
par projet. Les logs sans erreurs et la table SSG ne démontrent pas un gain
CPU quantifiable.

Documentation : https://vercel.com/docs/cli/usage et
https://vercel.com/docs/functions/usage-and-pricing.

## Smoke HTTP public, faible impact

Le script `scripts/finops/vercel-public-smoke.mjs` est identique à celui
de [Site Alban #297](https://github.com/AlbanAndrieu/nabla-site-alban/pull/297).
Il lance uniquement **6 requêtes HEAD séquentielles** vers des pages
publiques de `www.bababou.com` si `--live` est explicitement fourni.
Le test partagé couvre également 5 pages publiques du Site Alban.

```bash
node --test unit-tests/vercelPublicSmoke.test.mjs
node scripts/finops/vercel-public-smoke.mjs --live --site bababou
```

La liste est fermée (`/`, `/nre`, variantes EN/DE/NO et
`/evidence-access`) et les API privées/Stripe/OpenRAG sont exclues.
Le script retourne `BLOCKED_PLATFORM` si HTTP 402, sinon `PASS`
uniquement si toutes les routes sont HTTP 2xx. Un cache `HIT` ou
`MISS` n'est **pas** une mesure Fluid Active CPU ; les données réelles
restent à lire dans Vercel Usage.

## Roadmap et confidentialité

- Le build de production après #264 a confirmé `/fr/success`,
  `/en/success`, `/de/success` et `/no/success` en **SSG**.
- La surveillance de `Proxy (Middleware)` et des autres fonctions
  dynamiques reste prioritaire pour éviter une nouvelle saturation.
- Les données de demande documentaire et les preuves privées ne passent
  **pas** dans l'analyseur FinOps ; ne jamais joindre un export complet
  à un ticket public ou à un rapport OpenClaw.
- [nabla-openclaw](https://github.com/AlbanAndrieu/nabla-openclaw) pourra
  lire un **résumé expurgé** généré manuellement par la même logique de
  budget. Aucune automatisation live n'est activée dans Bababou.

## Extension du 10 novembre 2026 — intégration OpenClaw

Le parseur `analyzeUsage(document, { asOf })` accepte désormais une date de référence pour les collecteurs automatiques : il retourne **`STALE_USAGE`** si la dernière date de l'export dépasse 48 h (ou se trouve trop loin dans le futur). Il conserve la lecture historique sans `asOf`, sans réinterpréter les coûts comme des CPU-heures. Test unitaire dédié ajouté ; exécution de la gate exacte à confirmer.

Le dépôt [nabla-openclaw](https://github.com/AlbanAndrieu/nabla-openclaw) prépare `scripts/finops/check-vercel-team.mjs` : collecte **uniquement sur lancement explicite** (`--live`) ou lecture de fichier (`--input`), sortie expurgée, sans secrets et sans tâche planifiée. Il ne faut pas ajouter de token Vercel, d'API FinOps ni de rapport de facturation brut sur une page publique. Le quota est partagé entre les **quatre projets** Vercel ; des pages publiques SSG ne suffisent pas à le mesurer.
