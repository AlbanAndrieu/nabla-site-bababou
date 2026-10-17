# Roadmap — nabla-site-bababou

> Source unique des travaux ouverts **et du contexte de reprise**. Les diagnostics restent dans [`docs/operations.md`](operations.md), les règles agent dans [`AGENTS.md`](../AGENTS.md), l'historique détaillé dans Git/PR.

### Suite P2 → P4 — PR #233, 17 octobre 2026

- **P0 CI** : `CI (Quality and Security)` réussie sur `96f6add7` (run `39067493305`). En draft, seules les validations Git-only de préflight sont obligatoires ; les gates complètes et la Preview security sont `skipped`. Ne pas les qualifier de PASS avant la sortie du draft et une exécution exacte.
- **P3/P4** : nouveau scénario `tests/localized-seo.spec.ts` sur les routes `/contact`, `/en/contact`, `/de/contact`, `/no/contact` : statut HTTP 200, langue HTML, canonical et OpenGraph même origine/chemin, locale OG et Twitter Card ; vérifie les réponses réelles au lieu de s'appuyer exclusivement sur les métadonnées du code source.
- **À exécuter** : `npx playwright test tests/localized-seo.spec.ts tests/legacy-404-accessibility.spec.ts` sur un serveur de test local ou une Preview déployée exacte-SHA ; puis axes WCAG, contrastes, qualité complète, BetterLeaks, SAST et ZAP. Ne pas lancer ZAP hors Preview Vercel protégée ou en production.
- La 404 HTML versionnée, la confidentialité des données familiales et le fallback Google Translate ne changent pas. Aucun merge automatique.

### Actualisation P2–P4 — PR #233 et Site Alban #230/#231 (17 octobre 2026)

- Les **10 dernières PR créées** de `nabla-site-alban` sont désormais **#231, #230, #229, #228, #227, #226, #224, #222, #221 et #220**. Le tableau historique ci-dessous est un précédent relevé ; le lot courant ajoute #230/#231 et sort #219/#217 de la fenêtre de dix.
- **P2 / #231** : `app/[locale]/layout.tsx` déclare `<meta name="text-scale" content="scale" />`, tandis que `app/reset.css` revient à `font-size: 100%` pour éviter la double application de `env(preferred-text-scale)`. `unit-tests/textScaleContract.test.ts` vérifie le contrat ; le scénario Playwright CDP 200 % existant est maintenu.
- **P2 / #230** : retenir le découpage des gros composants et la séparation des helpers sans copier les composants homelab ; poursuivre uniquement sur les composants Bababou dépassant effectivement les budgets de taille. Les garde-fous de publication restent canoniques.
- **P2 / #228** : le focus clavier et le reduced motion 404 et le test axe de contraste ont été ajoutés dans le lot antérieur.
- **P3/P4** : les contrôles localisés OpenGraph/hreflang et le sitemap restent en place ; ne pas modifier le contenu familial legacy ni désactiver Google Translate fallback.
- **P0 CI, correctif de la dette** : les huit anciens commits `[skip ci]` rendaient impossible le préflight (`QG_CI_SKIP_DIRECTIVE`). La branche a été reconstruite en un commit de consolidation `8703f340` depuis `master@2406fefc`, avec mise à jour protégée par le SHA attendu. Les règles n'ont pas été modifiées.
- **Preuve exacte et datée** : workflow GitHub Quality and Security **#39067425541** marqué `success` sur `01f4f5a7d9366bae16e9fb0650b839733810c6af` ; Node 24 production compatibility `skipped`. Les tests Playwright Preview, ZAP et vérifications manuelles doivent être qualifiés séparément.
- Ne pas confondre ce succès avec la validation de tout SHA ultérieur. Aucun merge automatique.

### Transfert sélectif des 10 dernières PR de nabla-site-alban — 17 octobre 2026

Référence : [PR #217 à #229, les 10 dernières créées](https://github.com/AlbanAndrieu/nabla-site-alban/pulls?q=is%3Apr+sort%3Acreated-desc). **Ne pas cherry-pick les évolutions d'infrastructure ou données d'un autre site**.

| PR source | Enseignement | Décision pour Bababou |
| --- | --- | --- |
| #229 | Dépendances groupées avec délai de maturation de sept jours | À évaluer dans un lot dépendances distinct : ne pas modifier le lockfile sans exécution des tests |
| #228 | Contraste WCAG mesuré par axe, styles sémantiques plutôt que classes legacy | **Adapté P2** : focus fort et axe `color-contrast` sur 404 ; reduced motion |
| #227 | Identifier hook/fichiers responsables des oscillations de formateurs | À étudier P0 séparément ; ne pas recopier scripts de qualité divergents |
| #226 | AGENTS.md canonique, skills dédupliqués, secrets sans valeurs en clair | Revue documentaire ultérieure, préserver règles privacy existantes |
| #224 | Réduction du scope Nuclei et de la consommation CI | Ne pas introduire de scan supplémentaire sur Bababou tant que ZAP Preview n'est pas validé |
| #222 | Distinction santé technique / exposition interne | Non applicable à la surface publique de Bababou |
| #221 | Source OPML unique + génération déterministe et tests sans réseau | Principe repris dans les contrôles i18n/SEO ; pas de migration RSS sans besoin |
| #220 | DORA / CTID / FreshRSS et secrets de publication | Non applicable à la roadmap P2–P4 du site familial |
| #219 | Séparer audit générique Cloudflare du contrôle opérationnel de compte | Déjà suivi en P1 ; pas de fausse attestation d'audit |
| #217 | Ne pas interpréter un 403 Cloudflare Access comme origine disponible | Règle conservée pour les sondes futures, sans intégration homelab |

**Livré dans #233** :
- `app/globals.css` : focus visible contrasté et arrêt des animations 404 en mode réduction des mouvements, scoped à `next-global-not-found` ;
- `tests/legacy-404-accessibility.spec.ts` : contrôle réel `Tab`, axe `color-contrast`, et `prefers-reduced-motion` ;
- `unit-tests/siteSocialMetadata.test.ts` : canonical, OpenGraph et hreflang vérifiés pour quatre locales.

**Dette bloquante** : `scripts/agent-quality-gate.sh` refuse explicitement tout commit `[skip ci]` dans la plage de la PR (`QG_CI_SKIP_DIRECTIVE`). Les commits initiaux de #233 contiennent cette directive. **Ne pas contourner la règle** : avant publication/merge, reconstruire proprement la branche sur master sans ces directives, puis exécuter les gates sur le nouveau HEAD. Les scans et tests ne sont pas attestés sur ce lot.

### Lot de suivi P2–P4 — PR #233 (17 octobre 2026)

- **P2** : `tests/legacy-404-accessibility.spec.ts` utilise désormais un vrai `Tab` au lieu de `.focus()`, vérifie `:focus-visible`, un indicateur de focus et la visibilité du lien sur le viewport. Contrat à exécuter sur Chromium/Firefox/WebKit et configurations mobiles avant d'affirmer la parité.
- **P3** : `unit-tests/siteSocialMetadata.test.ts` vérifie les valeurs produites par `localizedSiteMetadata()` pour `fr/en/de/no`, y compris titres, descriptions, image alt et locales OpenGraph ; aucun contenu de la homepage legacy n'a été modifié.
- **P4** : le même test vérifie `localizedPageMetadata("contact", "de", ...)` : canonical, URL OpenGraph et hreflang alignés. Les contrôles du sitemap restent distincts.
- **Preuves manquantes** : lint, typecheck, tests unitaires, build Next, Playwright local/Preview (dont clavier et mobile), BetterLeaks, Semgrep, ZAP. Ne pas fusionner avant ces contrôles. Commits `[skip ci]` à la demande de l'utilisateur.

## Nouvelle PR P2 → P4 — 17 octobre 2026

- Base de départ : `master@2406fefc30fdadf6eef985ff6b2b15c87edc11f5` ; la PR #232 ne figure plus parmi les PR ouvertes. Nouvelle branche `feat/p2-p4-accessibility-i18n-social-20261017`.
- **P2** : nouveau scénario Playwright `tests/legacy-404-accessibility.spec.ts`, réponse 404 vérifiée, titre, lien retour et navigation au clavier/visibilité mobile. `public/404.html` demeure inchangé.
- **P3** : textes de métadonnées sociales allemand et norvégien de première classe dans `lib/siteSocialMetadata.ts` ; le contenu de la page d'accueil legacy n'est pas modifié, et le fallback Google Translate reste en place.
- **P4** : contrat du sitemap renforcé : canoniques uniques, alternates `fr/en/de/no/x-default`, même origine HTTPS, pas de query ni de fragment sur les alternates.
- **Validation différée** : `npm run lint`, `npm run test:unit`, build Next, Playwright desktop/mobile sur Vercel Preview, BetterLeaks, Semgrep et ZAP. Les commits portent `[skip ci]` ; ne pas assimiler l'absence de CI à une gate verte.
- Aucun merge automatique. Ne jamais supprimer une page HTML legacy ni remplacer la 404 historique sans preuve de parité.

## Reprise immédiate — nouveau chat

- [x] **P0 — Baseline de production rétablie (preuve GitHub du 14/10/2026)** : sur `master@a0de8d9fdb31d646dffffd7dcb8a9beec380c932`, les trois statuts **Vercel / Production Post-deploy Smoke / Production DAST** sont `success`. L'incident historique `git_info_fail` de `73b8cca` est documenté dans [`vercel-github-baseline-recovery-2026-10-13.md`](vercel-github-baseline-recovery-2026-10-13.md) mais ne constitue plus un blocage P0 sur cette base. **Revérifier la base exacte et la CI à chaque PR** ; aucun statut synthétique.

Un nouveau chat doit pouvoir repartir de **ce fichier + `AGENTS.md` + l'état live GitHub** sans demander de compactage.

1. Identifier la PR ouverte la plus récente sur GitHub. **#230 a été fusionnée le 13 octobre 2026** ; ne pas supposer qu'une PR est encore ouverte. En l'absence de PR, créer une branche depuis le HEAD courant de master et ouvrir une PR draft.
2. Lire son **HEAD exact**, sa mergeability et les derniers workflows avant toute modification.
3. Tout job rouge pertinent est corrigé **avant** le lot suivant ; ne jamais relancer manuellement un workflow uniquement pour obtenir du vert.
4. Boucle local-first : ciblé → `just p0` (`bash scripts/agent-p0-check.sh`) → `just quality-fix` → revue du diff → `just quality` / `just publish-status` si l'environnement exécutable est disponible.
   Skill de référence : `.agents/skills/local-first-quality/SKILL.md` (adapté de `nabla-compose#251`) ; distinguer systématiquement preuves locales L0/L1/L2/L3 et preuves CI sur HEAD exact.
5. Ne jamais merger automatiquement ; descriptions de PR en français ; jamais `--no-verify`.
6. `justfile` complète le `Makefile`, qui reste conservé.
7. **Betterleaks v1.9.0** remplace Gitleaks comme scanner exécuté ; policy canonique : `.betterleaks.toml`.
8. Next.js/Vercel reste la cible ; ne retirer le legacy qu'après parité contenu/comportement/rendu/SEO/accessibilité/routes. Google Translate reste fallback.
9. `public/404.html` reste la source visuelle protégée ; pas de réécriture React sans accord explicite.
10. Corpus familial/juridique : originaux hors Git ; **Mr A**, **Mme B / Ms B**, **l'enfant / the child** ; santé/catégories spéciales sur approbation explicite ; données financières du père bloquées ; références judiciaires conservées quand utiles à la vérification.


### Lot P2 du 17 octobre 2026 — parité de la 404 protégée

- `unit-tests/htmlFromPublic.test.ts` couvre désormais les invariants structurels du rendu de `public/404.html` : titre principal et secondaire, lien explicite vers l'accueil, animation `cloak__wrapper`/`@keyframes swing`, retrait du footer legacy.
- `public/404.html` n'est pas modifié ; aucune suppression ou redirection legacy sans preuve de parité.
- **À valider avant merge** : `npm run test:unit`, `npm run lint`, Playwright sur la Preview Vercel et contrôle visuel/accessibilité réel. Ces contrôles n'ont pas été exécutés ici ; `[skip ci]` reste demandé.
- Suite P2 : ajouter des scénarios clavier/mobile à la Preview ; P3 : compléter l'inventaire des routes et traductions manquantes, en conservant Google Translate comme fallback ; P4 : audit des métadonnées/OG exact-route.

### Lot P1 du 17 octobre 2026 — sans accès aux machines

- Rebase vérifié contre `master@a0de8d9` : `behind_by=0`, aucun nouveau commit de base à intégrer ; ne pas réécrire l'historique pour un rebase vide.
- Ajout d'un test spécifique : le symlink de métadonnées Git `.git` doit produire `SYMLINK` même si les vrais répertoires et fichiers pointeurs worktree sont autorisés.
- `docs/security-audit-coverage-ledger.md` précise les critères de clôture : syntaxe Bash, tests Node ciblés, vérification du checkout public à SHA fixé, puis audit complet en sandbox et validation indépendante, avec preuves expurgées.
- Aucun test local, aucun audit dynamique ni exécution du skill n'a été confirmé ; `[skip ci]` reste appliqué aux commits de préparation, sans désactiver les contrôles.

### Préparatifs P1 — sans TrueNAS/workstation (16 octobre 2026)

- Rebase vérifié : `master@a0de8d9` est exactement le merge-base de la PR #232 ; `behind_by=0`, `ahead_by=10` au contrôle initial. **Aucune réécriture nécessaire tant que master reste identique**.
- Acquisition explicite et épinglée du skill public : `bash scripts/prepare-security-audit-skill.sh --fetch-verify /tmp/bababou-audit-upstream` (répertoire inexistant requis). Alternative offline : `--verify-existing <checkout>`. Cette étape vérifie SHA Git attendu et 22 blobs, mais **n'exécute pas les six phases de l'audit**.
- Un environnement isolé, des artefacts expurgés et une validation indépendante restent indispensables avant d'ouvrir des findings. Ne pas transmettre de fichiers familiaux/privés au skill, à une API distante ou aux logs.
- En l'absence d'accès aux machines de l'utilisateur : préparer les scripts, tests et critères d'acceptation dans cette PR avec `[skip ci]` ; laisser les résultats locaux, Playwright, BetterLeaks, Semgrep et ZAP à `not-run` sur le dernier HEAD.

### Reprise du 16 octobre 2026 — PR #232, mode sans CI

- PR ouverte : [#232](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/232), branche `docs/roadmap-next-execution-2026-10-14`. **Ne pas merger**.
- Échec exact-HEAD `b7747a8` : le job `quality` a passé le contrôle des fichiers modifiés, puis `npm run lint` a échoué sur quatre références à `Buffer` non importé dans `unit-tests/verifySecurityAuditSkill.test.mjs`.
- Correctif `5e94d17` : import explicite depuis `node:buffer` ; message `[skip ci]` à la demande de l'utilisateur. **Aucune validation CI ni quality gate locale confirmée sur ce nouveau SHA**. `[skip ci]` n'est pas une preuve de succès.
- Pour les prochains lots, privilégier les vérifications locales ciblées, puis les commits `[skip ci]` tant que cette consigne reste active ; **ne jamais désactiver les gates** BetterLeaks, SAST, Playwright, ZAP ou contourner les protections de branche.
- **Ordre de reprise** : P0 tester localement ESLint et le test du vérificateur ; P1 vérifier le checkout épinglé Cloudflare et exécuter les six phases avec findings validés et preuves expurgées ; P2 parité/accessibilité legacy ; P3 migration Next/i18n ; P4 SEO/OpenGraph. Ne pas marquer P1 terminé à partir du seul contrôle d'intégrité.

### Passage de relais — 14 octobre 2026

- La PR **#230 est fusionnée** ; ne plus publier de commits sur son ancienne branche.
- Branche de reprise depuis `master@a0de8d9fdb31d646dffffd7dcb8a9beec380c932`, dans une **nouvelle PR draft**.
- Les workflows `Playwright Tests`, `Production DAST` et `Post-merge Quality Follow-up` ont réussi sur ce SHA ; `OWASP ZAP Preview` est marqué `skipped` et ne doit pas être annoncé comme un scan exécuté.
- **Statuts de baseline vérifiés sur `master@a0de8d9` le 14/10** : Vercel, Production Post-deploy Smoke et Production DAST tous `success` (API des commit statuses GitHub). Qualifier séparément la CI exact-HEAD de la PR #232 : aucun run Quality & Security de cette branche n'était visible au relevé initial.
- **P1 Cloudflare :** registre documentaire `docs/security-audit-coverage-ledger.md` restauré dans la PR #232 et revue source-first disponibles ; les six phases du skill et les findings validés restent à faire.

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
- [x] Éviter la compression redondante de l'artefact `tar.gz` exact-HEAD (`compression-level: 0` dans `upload-artifact`) tout en conservant le SHA, la rétention et le contrôle d'intégrité.
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
  - [x] figer l'image Docker du hook Hadolint sur la version pré-commit, sans image mutable `:latest` ; contrôle bloquant conservé, contrat de non-régression ajouté.
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
- [x] Borner **aussi en mémoire** l’extraction des erreurs de pre-commit (`QUALITY_ERROR_LINES`) avec test sur 10 000 lignes, sans perdre la dernière erreur et sans modifier le verdict des hooks.
- [x] Classer les scripts offline comme maintenance-only dans les politiques CI/Preview/baseline ; mutualiser ces politiques.
- [x] Vérifier les erreurs `git diff` et les espaces des commits existants (`BASE...HEAD`) dans la gate offline.

- [x] P1/P3/P4 : les métadonnées n'annoncent plus des homepages localisées inexistantes ; canonical legacy `/` conservée jusqu'à parité.
- [x] P2 : libellé accessible de la navigation footer traduit en FR/EN, avec contrat de régression.

## P0 — Baseline de production Vercel non sain (11/10/2026)

- [ ] **Bloquant CI** : `scripts/verify-production-baseline.sh` refuse le commit `73b8cca53349928f14ef262ba16ce2113a988b23` (`PROD_BASE_UNHEALTHY`, contexte `Vercel=failure`). L'API Vercel associe ce SHA à `dpl_78nerRgqZcGwTf2H98RgPej4Dbb6`, état `ERROR`, code `git_info_fail`.
- [ ] Diagnostiquer et corriger le déploiement Vercel en échec `git_info_fail` : **liaison du projet à `AlbanAndrieu/nabla-site-bababou` confirmée via Vercel**, donc ne pas présumer qu'une reconnexion GitHub est nécessaire. Examiner plutôt les permissions et informations Git du déploiement en échec ; ne pas contourner le garde en choisissant une ancienne version `READY`.
- [ ] Obtenir **une preuve exacte-SHA** d'un déploiement de production valide, puis les statuts `Production Post-deploy Smoke` et `Production DAST` requis par la gate. Le déploiement `f218b877` est `CANCELED`, donc non probant.
- [ ] Revalider la CI du HEAD de la PR uniquement après correction de cette cause ; ne pas relancer pour obtenir du vert, ne pas assouplir `verify-production-baseline.sh`.

Ce blocage est **distinct** des contrôles du skill Cloudflare. Si l'infrastructure empêche sa résolution dans l'environnement de l'agent, poursuivre les tâches hors déploiement sans prétendre que la CI est verte.

## P1 — Audit Cloudflare security-audit-skill

- [x] Identifier upstream, licence MIT et commit `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` ; procédure et limites : [`docs/security-audit-skill.md`](security-audit-skill.md). **Installation locale et checksum d'archive toujours à faire** ; ne pas confondre le skill générique de code avec un audit du compte Cloudflare.
- [x] Ajouter un vérificateur hors réseau pour les **22 fichiers upstream officiels** et **six tests unitaires** ; le contrôle rejette aussi les liens symboliques et la traversée de répertoires. Les tests sont branchés sur P0 et `npm run test:unit` ; **vérification d'un checkout upstream réel non exécutée**.
- [ ] Exécuter un audit **local-first, incrémental, en lecture seule et sur périmètre autorisé** : Cloudflare Access, Tunnel/DNS, Vercel Preview, headers, cookies et endpoints publics. Exclure corpus privé, secrets et données familiales. **Étape source-first partielle documentée** : [`docs/security-audit-source-review-2026-10-12.md`](security-audit-source-review-2026-10-12.md), 2 observations à valider, aucun finding confirmé ; les six phases du skill ne sont pas exécutées.
- [x] Créer le registre documentaire [`security-audit-coverage-ledger.md`](security-audit-coverage-ledger.md), présent dans la branche courante, avec preuves et lacunes P0–P4. [ ] Valider ensuite les contrôles réels sur HEAD exact et produire le `coverage-ledger.json` conforme à l'upstream ; ne jamais assimiler la checklist à une preuve d'exécution.
- [ ] Réconcilier les constats avec STRIDE/DSOMM et les contrôles SAST, Betterleaks, Playwright et ZAP, sans contournement.
- [ ] Clore après reproduction locale, revue des faux positifs et preuves vérifiables.

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
2. **P0 agent/tooling** : Betterleaks → Dagger spike → Context7 ; puis audit Cloudflare P1 en lecture seule.
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
