# Roadmap — nabla-site-bababou

> Source unique des travaux ouverts **et du contexte de reprise**. Les diagnostics restent dans [`docs/operations.md`](operations.md), les règles agent dans [`AGENTS.md`](../AGENTS.md), l'historique détaillé dans Git/PR.

## Reprise immédiate — nouveau chat

Un nouveau chat doit pouvoir repartir de **ce fichier + `AGENTS.md` + l'état live GitHub** sans demander de compactage.

1. Identifier la PR ouverte la plus récente sur GitHub. Suivi actif : **#227** (`fix/offline-scope-parity-followup`) ; revérifier le HEAD et la CI.
2. Lire son **HEAD exact**, sa mergeability et les derniers workflows avant toute modification.
3. Tout job rouge pertinent est corrigé **avant** le lot suivant ; ne jamais relancer manuellement un workflow uniquement pour obtenir du vert.
4. Boucle local-first : ciblé → `just p0` (`bash scripts/agent-p0-check.sh`) → `just quality-fix` → revue du diff → `just quality` / `just publish-status` si l'environnement exécutable est disponible.
5. Ne jamais merger automatiquement ; descriptions de PR en français ; jamais `--no-verify`.
6. `justfile` complète le `Makefile`, qui reste conservé.
7. **Betterleaks v1.9.0** remplace Gitleaks comme scanner exécuté ; policy canonique : `.betterleaks.toml`.
8. Next.js/Vercel reste la cible ; ne retirer le legacy qu'après parité contenu/comportement/rendu/SEO/accessibilité/routes. Google Translate reste fallback.
9. `public/404.html` reste la source visuelle protégée ; pas de réécriture React sans accord explicite.
10. Corpus familial/juridique : originaux hors Git ; **Mr A**, **Mme B / Ms B**, **l'enfant / the child** ; santé/catégories spéciales sur approbation explicite ; données financières du père bloquées ; références judiciaires conservées quand utiles à la vérification.

### Snapshot technique de reprise

- `master` contient Betterleaks + `justfile` via #220 ; `Makefile` est conservé.
- #223 a été mergée le 10 octobre 2026. La preuve Preview #886 a confirmé que Next `afterFiles` ne suffit pas sur Vercel pour les `*.html` absents : 180 tests Playwright verts, 3 échecs 404, tandis que Vercel et ZAP sont verts.
- La Preview #889 a prouvé que **`handle: error` est trop tardif** : les `*.html` absents sont déjà capturés par le segment dynamique Next (`x-matched-path: /[locale]`) avant la phase d'erreur. Le correctif courant utilise **`handle: miss` + `check: true`** : redirects et fichiers valides se résolvent d'abord, puis les `*.html` absents passent par `/__legacy-html-not-found__` avant les routes dynamiques Next.
- **Ne jamais considérer ce snapshot comme une preuve courante** : relire le HEAD/CI live au début du prochain lot.
- Les sources privées `.private-publication-source/**` et `.redaction-work/**` ne doivent jamais être envoyées à un service externe ou ajoutées à Git.

## Acquis structurants

- [x] Runtime Next.js/Vercel hybride, i18n FR/EN/DE/NO, legacy conservé lorsqu'il reste nécessaire.
- [x] 404 protégée via `public/404.html`, Route Handler/global-not-found et tests dédiés.
- [x] Quality local-first : preflight Git, P0 sans `node_modules`, gate agent, publisher exact-SHA et scope CI.
- [x] Preview exact-SHA, Playwright, ZAP et smoke production structurés.
- [x] Renovate groupé/cadencé ; Dependabot Alerts comme signal et Renovate comme remédiateur.
- [x] Betterleaks remplace Gitleaks ; `justfile` ajouté sans retirer le `Makefile`.
- [x] Publication sensible structurée : sources hors Git, audit/consolidation locale, manifeste et gate BLOCK/REWRITE/REVIEW.

## P0 — CI, qualité et agent

### Boucle local-first — état courant

- [x] P0 hors réseau : contrats Semgrep, `just offline-l1` avec vérification exhaustive (>200 fichiers), limites et erreurs Git explicites, `shfmt` natif et sortie compacte.
- [x] Skill de maintenance : reprise par snapshot d'artefact **exact-HEAD** seulement s'il existe déjà, conformément à `nabla-site-alban` ; fallback API ciblée si DNS indisponible, sans déclencher de CI ni inventer une validation locale.
- [x] Image Docker corrigée (`pcre2>=10.49-r0`, Trivy HIGH bloquant) et Playwright Preview validé sur `5261267` (10 octobre 2026).
- [x] Quality gate, Semgrep, tests, build Next, Node 24, Docker/Trivy, Vercel, Playwright et ZAP **verts sur le HEAD `5261267`** ; revérifier tout nouveau HEAD avant merge.
- [x] Baisser les budgets de sortie : 12 lignes P0/quality locales, 20 lignes préflight CI, 36 lignes de patch autofix par défaut (`QUALITY_DIFF_LINES=0` pour tout voir), et résumer les sondes HTTP production (`PRODUCTION_SMOKE_VERBOSE=1` pour le détail). Les codes d'erreur, résultats de scan, SARIF et statuts bloquants restent conservés.
- [x] Semgrep validé avec le venv isolé et la contrainte Pydantic lors de la CI Quality & Security verte sur `5261267`.
- [x] Outil de mesure des lignes/octets des logs sans divulguer leur contenu : `bash scripts/agent-output-metrics.sh avant.log après.log`.
- [ ] Comparer à périmètre, durée, toolchain et SHA comparables ; ne pas extrapoler les tokens à partir des octets.
- [x] Snapshot source de CI sur le SHA exact `5261267` récupéré via connecteur, intégrité SHA-256 vérifiée ; 31/31 tests ciblés et syntaxe Bash/JS validés localement malgré le DNS bloqué.
- [ ] Prouver Betterleaks (staged/worktree/history), P0 exact toolchain et L3 publication sur un **vrai checkout Git** ; l'archive source ne contient pas `.git` et ne remplace pas ces preuves.

- [x] CI et Preview exact-SHA `5261267` réussies, incluant fallback legacy HTML, tests reflow/Playwright et ZAP ; maintenir la preuve à chaque changement de runtime.
- [ ] **Betterleaks** : hook pre-commit natif Go v1.9.0 (sans Docker) ; exécuter d'abord `just secrets-config`, puis valider `just secrets-staged`, `just secrets-worktree`, `just secrets-history` sur un vrai checkout ; `.betterleaks.toml` impose Betterleaks >= v1.9.0 et l'ancien scanner Gitleaks n'est jamais exécuté.
- [ ] **Dagger CI — spike local-first v0.21.10** :
  - [x] wrapper partagé `scripts/dagger-ci.sh` + aliases Just + workflow opt-in `dagger-spike.yml`, sans déclenchement PR/push automatique ;
  - [x] mêmes cibles local/GitHub : `p0`, `quality-preflight`, `test` (unit), `build`, avec Node 26.8.2/npm 11.17.0 ;
  - [x] sources privées/secrets exclus avant transfert ; aucun socket Docker ni mode privilégié ;
  - [x] rejeter les cibles inconnues avant toute invocation de Dagger, avec test hors réseau pour `--help` et les arguments non autorisés ;
  - [x] étendre les exclusions Dagger aux fichiers d'environnement et aux clés locales, avec test de transfert des arguments sur CLI simulé ;
  - [ ] vérifier l'efficacité réelle des filtres sur un moteur Dagger avant d'affirmer la confidentialité du transfert ;
  - [ ] rendre le **full quality** portable : `shfmt-docker` est remplacé par le hook natif précompilé `shfmt`; supprimer ensuite la dépendance restante à `hadolint-docker` avant d'exposer le full quality comme cible Dagger ;
  - [x] journaliser le temps d'exécution de chaque cible Dagger (`DAGGER_TARGET`, `DAGGER_WALL_SECONDS`) et vérifier la sortie avec un CLI simulé hors réseau ;
  - [x] fournir `just dagger-benchmark` en mode explicitement opt-in : deux échantillons identiques, aucune hypothèse implicite sur le cache, test de dispatch sans Dagger réel ;
  - [ ] exécuter le spike sur un vrai runtime Dagger, mesurer froid/chaud, cache, réseau et traces, puis décider **adopter / différer / rejeter** ;
  - [ ] si adopté, GitHub Actions devient surtout déclencheur du pipeline Dagger ; sinon supprimer proprement le spike.
- [ ] **Context7 MCP — documentation actuelle pour l'agent** ([docs officielles](https://context7.com/docs/overview)) :
  - [x] configuration OpenCode distante via OAuth, sans clé/API secret versionné ;
  - [x] docs locales/versionnées prioritaires, Context7 seulement pour compléter les API externes mouvantes ;
  - [x] règle agent : ne jamais envoyer corpus privé, secrets, logs sensibles ou fichiers ignorés à Context7 ;
  - [x] Context7 reste **non bloquant** : P0/quality doivent fonctionner offline sans lui ;
  - [ ] valider une connexion réelle avec `opencode mcp list` / authentification OAuth puis une requête documentaire ciblée avant de considérer l'intégration terminée.
- [x] Chaîne Git → checkpoint `vercel-preview-*` → Vercel → Playwright/ZAP **exact-SHA** attestée pour `5261267`.
- [ ] Réduire les warnings ZAP applicables ; rendre les budgets bloquants seulement après plusieurs baselines vertes.
- [x] Garder les sorties quality compactes ; verbose uniquement pour diagnostic.
- [x] Classer les scripts offline comme maintenance-only dans les politiques CI/Preview/baseline ; mutualiser ces politiques.
- [x] Vérifier les erreurs `git diff` et les espaces des commits existants (`BASE...HEAD`) dans la gate offline.

- [x] P1/P3/P4 : les métadonnées n'annoncent plus des homepages localisées inexistantes ; canonical legacy `/` conservée jusqu'à parité.
- [x] P2 : libellé accessible de la navigation footer traduit en FR/EN, avec contrat de régression.

## P1 — Homepage owner-controlled

- [ ] Décomposer `app/[locale]/page.tsx` et déplacer progressivement les textes vers i18n sans changer les disclosures approuvées.
- [ ] Retirer chaque fragment legacy seulement après parité React + responsive/accessibilité/SEO prouvée.
- [ ] Retirer le rewrite temporaire de `/` uniquement après validation explicite de la homepage native.

## P2 — UI / accessibilité

- [ ] Clore WCAG 2.2 AA sur les routes prioritaires : axe FR/EN, clavier, contraste, 200 %, reduced-motion, aucun scroll horizontal.
- [ ] Migrer les consommateurs Next restants vers les primitives UI partagées.
- [ ] Étendre ensuite viewport + multi-browser avant fermeture de la visual regression.

## P3 — Routing / i18n / pages publiques

- [ ] Migrer les pages publiques structurées à faible risque en gardant legacy + Google Translate jusqu'à parité.
- [ ] Consolider FR/EN de `demande-explications-autorites-competentes` depuis les sources privées auditées avant publication.
- [ ] Aucune traduction juridique DE/NO générée automatiquement sans revue.
- [ ] Traiter `people-contacted.html` séparément en préservant D3/ARF/`people-cards.js` et les preuves E2E.
- [ ] Conserver `public/test.html` tant que sa finalité ARF n'est pas réconciliée avec `/test`.

## P4 — SEO / métadonnées

- [ ] À chaque migration : canonical, hreflang, sitemap/robots, metadata sociales et compatibilité legacy.
- [ ] Homepage/OpenGraph/Twitter restent owner-controlled.

## P5 — Tooling / dépendances

- [ ] Valider Mend Renovate : Dependabot Alerts read-only, Security Updates GitHub désactivé, première vraie PR `security` et premier lot groupé.
- [x] Vérifier par contrat P5 que `eslint`, `tsx`, `@types/node`, `typescript-eslint` et `postcss-selector-parser` conservent leurs spécifications identiques entre `package.json` et la racine de `package-lock.json`, avec résolution présente.
- [ ] Réconcilier les versions de ces dépendances avec les dépôts apparentés et actualiser le lockfile uniquement après validation de la compatibilité ; le contrat précédent ne prouve pas la parité inter-dépôts.
- [ ] Après Dagger, ne conserver **qu'une** autorité de pipeline ; pas de logique CI dupliquée shell + Dagger.
- [ ] Retirer runtimes/scripts/assets/pages orphelins seulement après preuve d'absence de consommateurs.

## P6 — Confidentialité / publication documentaire

- [ ] Publier par petits lots via `config/publication-review.json` + `npm run privacy:publication`, jamais les originaux.
- [ ] Consolider les chaînes d'emails en pages canoniques FR/EN plutôt que publier chaque export.
- [ ] Normaliser **Mr A**, **Mme B / Ms B**, **l'enfant / the child** ; pas de `Bababou` dans les documents officiels/juridiques.
- [ ] Santé/psychologie/catégories spéciales : source vérifiée + approbation explicite avant publication.
- [ ] Bloquer les données financières/opérationnelles du père qui faciliteraient pression/coercition ; garder le fait juridique et utiliser « disponible sur demande » si nécessaire.
- [ ] Préserver les références judiciaires/administratives utiles à la vérification externe.
- [ ] PDF/images : caviardage irréversible + suppression texte/OCR/metadata ; photo identifiable de l'enfant non publiée sans validation explicite.
- [ ] `/` et `public/index.html` restent hors hardening automatique.

## Ordre de travail

1. **P0 CI courante**.
2. **P0 agent/tooling** : Betterleaks → Dagger spike → Context7.
3. **P5** dépendances/Renovate.
4. **P2/P3** accessibilité puis migration documentaire.
5. **P1** homepage sous contrôle explicite.
6. **P6** publication sensible par petits lots.

## Definition of Done d'un lot

- CI précédente inspectée ; tout rouge pertinent corrigé d'abord.
- Patch minimal ; aucune modification utilisateur écrasée.
- Tests ciblés puis gate local le plus complet disponible réellement exécutés.
- Betterleaks pour les secrets ; pas d'exécution Gitleaks.
- Diff relu après auto-fixes.
- Preuve exacte SHA pour build/Preview quand nécessaire.
- Roadmap compactée : le terminé devient un acquis ou reste seulement dans Git.
- Aucun merge automatique.

## Maintenance

- Garder uniquement **reprise + acquis + actions ouvertes**.
- Incidents/logs/chronologies → `docs/operations.md` et Git/PR.
- Après chaque merge, actualiser le snapshot de reprise.
- Ne pas créer de `TODO.md`, `MIGRATION.md` ou roadmap parallèle.
