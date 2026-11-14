# Scripts Bababou — index d'exécution

L'interface canonique est le [justfile](../justfile). La liste des propriétaires, alias, protections et conditions de retrait est maintenue **uniquement** dans [docs/script-ownership.md](../docs/script-ownership.md). Cet index de proximité reprend le modèle de [nabla-site-alban #303](https://github.com/AlbanAndrieu/nabla-site-alban/pull/303), sans reproduire son catalogue homelab.

| Objectif | Commande courte | Statut de la preuve |
| --- | --- | --- |
| Plan local sans effet de bord | `just agent-plan` / `just agent-isolated-plan` | L0, aucune exécution de test |
| Validation locale bornée | `just agent-verify offline|p0|publish|browser` | Ressources CPU/RAM, checkout et outils contrôlés |
| Convergence documentaire | `just docs-audit` | L1 source hors réseau |
| Contrats rapides | `just offline-contracts` | L1, pas de build |
| Contrôles P0 | `just p0` | Vérification ciblée |
| Build, sécurité et publication | `just quality` puis `just publish` | L3 sur HEAD exact uniquement |
| Parité et activation accueil | `just home-cutover-verify` | Nécessite build + navigateurs + décision GO |
| Audit SSG, ISR et fonctions | `just vercel-runtime-audit` / `just vercel-runtime-test` | Lecture artefacts ; CPU non mesuré |
| CPU Vercel réel | `node scripts/finops/vercel-usage-budget.mjs --help` | Export Usage daté indispensable |

## Scripts conservés et archivation

- **Déjà convergé :** les contrôles de suppression massive, modes exécutables, énumération Git NUL-safe, Playwright et garde privacy sont dans le dépôt ; ne pas importer leurs variantes Alban dépendantes du homelab.
- **À maintenir distincts :** smoke public, contrôle de publication SHA, scans de secrets et vérification privacy, parce qu'ils attestent des invariants différents.
- **Archives :** seuls les documents d'anciennes roadmaps et les incidents utiles sont rangés dans `docs/archive/`. Ne pas déplacer un HTML/PDF public ou supprimer une commande encore invoquée par `.github/workflows` et les tests sans preuve d'équivalence et approbation.
- **Prêt à revoir :** la migration des deux pages React est dans la PR #270 ; aucune suppression des scripts ARF/D3 ni redirection des originaux avant recette et GO.

Référence commune : `scripts/audit-vercel-runtime.mjs` adapte l'audit d'artefacts Site Alban sans importer ses routes internes ni estimer le CPU. L'état `NOT_RUN` n'est jamais un PASS.
