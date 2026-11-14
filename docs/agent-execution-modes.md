# Exécution des agents — workstation vs environnement isolé

`AGENTS.md` reste la politique canonique ; ce guide explique **comment exécuter** les contrôles et réduire le contexte, sans supprimer une gate.

## Choix par capacités, pas par nom de modèle

| Profil | Capacités réelles | Stratégie |
| --- | --- | --- |
| Claude Code sur workstation, avec checkout Git complet | CPU/RAM, Node/npm, mise, just, cache et navigateurs installés | `just agent-plan` puis tests ciblés/P0 et gate publication, sur la branche locale |
| Codex avec checkout et outils locaux | Seulement les capacités effectivement accessibles | Même stratégie locale dans les limites de son conteneur, pas de SSH implicite vers la workstation |
| Codex/API sans checkout, dépendances ou navigateur | GitHub connector, sources ciblées, CI et diff | L0, éventuellement L1 sur fixture isolée ; pas de build, secrets, E2E ou L3 inventés |
| Runner GitHub | Tests selon workflow/commit | Validation distante distincte ; aucun déclenchement juste pour obtenir un log de formatter |

Un refus DNS, un montage absent ou une commande indisponible n'autorise pas des tentatives infinies. `BLOCKED_NETWORK` et `MISSING_TOOL` restent des états valides, jamais PASS.

## Commandes canoniques

`just agent-plan` affiche un plan JSON et la capacité CPU/mémoire sans modifier le worktree. `just agent-isolated-plan` simule le profil isolé. `just agent-verify offline` effectue syntaxe/Git et audit docs ; `just agent-verify p0` lance le checkpoint P0 ; `just agent-verify publish` lance l'unique publication L3 après convergence et commit ; `just agent-verify browser` lance la recette homepage.

Les commandes `agent-verify` **ne téléchargent rien**, exigent un checkout complet et `just` ; publish/browser exigent en plus les dépendances verrouillées installées. Profil isolé : toute exécution est refusée. Le `--run` est explicite, sinon le module ne produit qu'un plan. Aucune installation `mise`/`npm`, aucun push et aucune modification de secrets ne sont automatiques.

## Budget des ressources workstation

`scripts/agent/capability-plan.mjs` calcule `PLAYWRIGHT_WORKERS` avec `os.availableParallelism()`, mémoire libre (et plafond cgroup v2 si disponible), réserve de 2 CPU et 1 GiB ; maximum local 4 workers. Sur machines limitées, 1 worker. `AGENT_WORKERS=2` peut réduire ce plafond mais pas le dépasser. La CI reste à 1 worker. Le budget concerne les navigateurs, **pas** le CPU Vercel facturé ; aucun gain non mesuré n'est annoncé.

Ne pas lancer simultanément deux builds Next / ZAP / Playwright complets par défaut. Utiliser les caches sûrs déjà présents. `just publish` réutilise une preuve exacte validée quand HEAD/base/toolchain ne changent pas ; éviter `just quality` puis `just publish` sans nécessité.

## Budget de contexte / diagnostic

1. Maintenir une seule ligne `PR@SHA | échec | fichiers | preuve | suite`.
2. Ouvrir seulement la section BB-xx, le diff et un skill spécialisé ; deux seulement si la confidentialité ou la publication le requiert.
3. CI : lire run → job → première step rouge → extrait de 10–20 lignes ; développer seulement en cas de blocage.
4. Ne pas répéter des polls d'un même run inchangé, ni recopier des logs entiers, des SHAs historiques ou les contenus détaillés des skills.
5. États explicites : `PASS` (test réellement exécuté), `FAIL`, `NOT_RUN`, `BLOCKED_NETWORK`, `MISSING_TOOL`. Un `READY` ou un test L0 n'est pas une recette E2E.

**Invariants** : publication familiale uniquement après `protect-family-privacy` ; données sensibles hors cloud public ; anciennes pages, pièces et 404 conservées jusqu'au GO ; SAST/SCA/DAST, BetterLeaks, privacy et protections de branches jamais neutralisés. PR Draft, aucun merge automatique.
