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

## Diagnostic de disponibilité (opt-in et faible impact)

Le script `scripts/finops/vercel-public-smoke.mjs` est partagé avec
Site Alban : il teste uniquement les pages publiques attendues, par
requêtes `HEAD` séquentielles, délai maximal de 5 secondes par requête.
Il n'exécute aucune requête sans l'option `--live` :

```bash
node --test unit-tests/vercelPublicSmoke.test.mjs
node scripts/finops/vercel-public-smoke.mjs --live --site bababou
# Également possible : --site alban
```

Le script teste actuellement `/`, `/nre`, `/en/nre`, `/de/nre`,
`/no/nre` et `/evidence-access` ; aucun endpoint propriétaire,
Stripe, OpenRAG ou Cloudflare privé n'est interrogé. Le code `402`
produit `BLOCKED_PLATFORM`, jamais un PASS DAST. Les en-têtes
`x-vercel-cache` ne sont pas équivalents au CPU facturé.

**Ne pas** ajouter ce script à une boucle de polling ni publier les
statistiques d'usage de l'équipe sur le site public. Exécuter les
mesures CPU et invocations depuis le dashboard ou l'export CLI autorisé.

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
