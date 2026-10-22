## Convergence quality / pre-commit depuis nabla-compose (22 octobre 2026)

- [x] Récupérer le contrat d'intégrité du manifeste de `nabla-compose` (PR #269), adapté à Bababou : hooks uniques, dépôts externes sans doublons, `rev` obligatoire et détection des clés YAML répétées, sans réseau.
- [x] Ajouter le hook local `precommit-integrity`, la validation précoce dans la CI et le contrôle strict de `scripts/agent-quality-gate.sh`. Les contrôles BetterLeaks, actionlint, zizmor, Semgrep, SCA, Playwright, ZAP restent bloquants.
- [x] Ajouter `just precommit-config-test` et `just loop` (L1 + intégrité + contrats rapides). **Ne pas confondre** ces contrôles locaux avec `just quality` ou les tests Preview au SHA exact.
- [x] Supprimer l'ébauche du deuxième Dockerfile Talos et les scripts/tests/doc associés, sans toucher au `Dockerfile` Nginx historique. Vercel utilise son intégration native Next.js, pas un Dockerfile.
- [ ] Après retour des crédits, valider sur le HEAD réel : `just precommit-config-test`, `just loop`, `just quality`, BetterLeaks puis Quality/Preview/ZAP. Les commits historiques `[skip ci]` de la PR restent incompatibles avec le garde-fou `QG_CI_SKIP_DIRECTIVE` tant qu'ils ne sont pas consolidés de manière revue.
- [ ] Aligner les stratégies non spécifiques du dépôt avec `nabla-compose` uniquement après mesure : ShellCheck natif, sévérité/format des logs, stages pre-commit et workflows. Ne pas copier les hooks TrueNAS/Compose ni modifier la confidentialité.
- **Pilotage des coûts commun** : réutiliser `nabla-compose/scripts/github-actions-usage.py` (PR #269) pour l'inventaire borné des Actions au lieu de dupliquer l'outil dans chaque site. Indicateurs partiels => non conclusifs, minutes wall-clock ≠ minutes facturées.

## Déploiement Talos — décision d'architecture

- [ ] Ne pas introduire de deuxième Dockerfile ou d'image Next.js sans décision d'architecture. Vercel déploie nativement Next.js et ne dépend pas du `Dockerfile` actuel, réservé au fallback statique Nginx.
- [ ] Avant tout déploiement sur Talos, choisir la stratégie **unique** de construction d'image (image existante à faire évoluer ou buildpack standard), puis valider le runtime Next.js, la confidentialité, l'accès privé, l'Ingress Traefik et les contrôles exact-SHA. Aucune modification du cluster ou de Vercel.

## Protection du budget CI — 21 octobre 2026

- [x] `scripts/ci/check-draft-workflows.mjs` bloque localement toute régression des garde-fous PR Draft sur Quality, Docker, Node 24 et Copilot. Vérification de la présence de `ready_for_review` ; contrôles sans réseau ni dépendances.
- [x] 5 tests Node autonomes (cas valides, job non protégé, déclencheur absent, fichier manquant, **scan des workflows du dépôt**) et vérification des 5 jobs réels. Ces tests font partie de `npm run test:unit` ; les tests applicatifs complets ne sont pas exécutés sans checkout. Les validations réelles de GitHub Actions restent suspendues volontairement.
- [ ] Lancer la CI uniquement après autorisation explicite de sortir la PR Draft ; ne pas supprimer les quality gates bloquantes.

## Suite locale sans crédits Actions — 21 octobre 2026

- [x] Les 4 scénarios TypeScript du pont Semantic Release sont repris dans un fichier de test natif `.mjs`, complétés par les versions ordonnées numériquement et le rejet d'une version invalide. Aucun `tsx` ni `npm ci` requis pour `just offline-release`.
- [x] Tests ciblés exécutés dans l'environnement de l'agent (Node 22, dépôts Git temporaires, faux client `gh`) : **6 scénarios réussis**, aucun appel réseau ni minute GitHub Actions. Cela ne valide pas l'intégralité du dépôt ni la version Node 26 épinglée.
- [ ] À la réactivation du budget : sortir la PR de draft pour déclencher la CI, sans modifier les contrôles bloquants. Ne pas merger automatiquement.

## Stabilisation local-first après fusion #234 — 21 octobre 2026

- [x] Correction du pont Semantic Release : un tag `vX.Y.Z` valide peut précéder la version de `package.json` sans bloquer la publication suivante ; les versions régressives, tags non ancêtres et releases non vérifiées restent rejetés.
- [x] Script `scripts/ci/release-tag-bridge.mjs` : mode `--check` sans écriture et mode `--apply` limité au workflow Release après contrôle exact-SHA et GitHub App dédiée.
- [x] Tests exécutés sur l'environnement de l'agent : 3 tests Node 22 contre des dépôts Git temporaires et un `gh` simulé (read-only, idempotence, version future, absence de preuve). Aucun runner GitHub Actions utilisé.
- [ ] Vérifier en CI GitHub après retour du budget uniquement lorsque la PR sera sortie de draft. Les versions Node 26/npm 12 réelles et la totalité du site/Preview ne sont pas couvertes par ce test ciblé.

## Local-first — PR #235 (21 octobre 2026)

- [x] Migration Semantic Release sécurisée : tolère `package.json` plus récent que le dernier `vX.Y.Z`, refuse un tag numérique plus récent que le dernier `vX.Y.Z` (historique divergent), exige l'ascendance du tag et la preuve de GitHub Release avant tout alias.
- [x] 4 tests Git/Node exécutés dans le conteneur agent sur dépôts temporaires + `gh` simulé ; script vérifié par `node --check`. Aucun `npm ci`, Playwright, ZAP, Biome ou Node 26 exécuté : **ne pas assimiler au quality gate complet**.
- [ ] Revalider Quality + Preview exact-SHA une fois les crédits rétablis et la PR passée de draft à normale, sans contourner les gates.

## Sécurité — contrôles PR rapides et audits master approfondis (18 octobre 2026)

### P0 — Parité ZAP avec Site Alban (21 octobre 2026)

- [x] Preview : adopter le scanner exit-code 0/1/2/3, différencier findings et panne technique, classer le no-report sans publier de log brut, exiger un JSON contenant au moins un site; statuts GitHub exact SHA inchangés.
- [x] Production : même validation stricte des rapports ; 401/403 d'accès, panne Docker/démarrage et scanner KO ne doivent pas être enregistrés comme vulnérabilités ; SARIF minimisé et upload bloquants maintenus.
- [x] Un scan Production bloqué par des findings (exit 1/2) conserve **uniquement** le SARIF minimisé pour le collecteur DefectDojo privé ; le statut DAST reste failure. Exit 3+, rapport invalide ou sanitizer échoué interdisent l'artefact. Le collecteur devra lire la preuve sans considérer le contrôle réussi.
- [x] Tests de contrat régressifs ZAP Preview et Production étendus. Le code est modifié sur la PR #234, **scan réel non effectué**.
- [ ] Les runs CI GitHub sur la PR échouent actuellement avant exécution des étapes (logs indisponibles / BlobNotFound) : diagnostiquer quota, runner, facturation et statut du compte hors dépôt ; **ne pas présenter comme problème corrigé par le code ni désactiver les gates**.
- [ ] Vérifier Preview exacte et Production DAST après rétablissement des runners ; aucun nouveau scan actif ni publication d'artefacts HTTP bruts.


- **PR, bloquant** : BetterLeaks v1.9.0 audite les commits `base..HEAD` (distinct du hook staged, vide après checkout) ; Semgrep SAST sur fichiers modifiés ; npm audit production HIGH/CRITICAL ; contrôle de code, tests, Playwright et ZAP baseline existants. Critères : aucun secret détecté ou vulnérabilité CRITICAL/HIGH de production ; les vulnérabilités HIGH déjà présentes dans la toolchain dev restent documentées, non « PASS full SCA ».
- **Master, hebdomadaire + déclenchement manuel** : `.github/workflows/security-deep.yml` : Trivy 0.74 fs vulnérabilités+licences+misconfigurations et SBOM CycloneDX avec dépendances de développement ; CodeQL JS/TS `security-extended` avec SARIF privé et sans imposer GitHub Code Scanning ; Semgrep full SAST ; Nuclei templates HTTP medium+ non intrusifs à 2 requêtes/s maximum (parité `nabla-site-alban`). Artifacts privés, expiration 3 jours, jamais de raw JSONL Nuclei.
- **DAST budgets** : ZAP passif Preview sur chaque déploiement nécessaire ; ZAP passif production sur déploiements et mardi/vendredi (au lieu de 7 nuits/semaine). Workflow `.github/workflows/zap-active-preview.yml` disponible **manuellement** uniquement après autorisation explicite et correspondance Preview/SHA, avec max 25 min et blocage HIGH ; **jamais automatiquement sur production**.
- **DefectDojo** : collecteur centralisé dans `nabla-compose` (aucun téléchargement ni import dans ce dépôt ; projections SARIF testées localement) ; fonctions de normalisation `scripts/security/defectdojo-report-sanitizers.mjs` (collecteur unique dans `nabla-compose`) et contrat `docs/security-defectdojo-ingestion.md` : **master-only**, Trivy HIGH/CRITICAL npm, SARIF Nuclei et ZAP dépersonnalisés en opt-in séparés ; pas de SBOM/licences/secrets/HTTP bruts, compte de service GH actions:read sur ce seul repo. Aucun accès DefectDojo interne ni import réel attesté ; déploiement collecteur dans `nabla-compose` reste à faire.
- **Limite de preuve** : ce lot met en place la CI, ne démontre pas à lui seul l'exécution de CodeQL/Nuclei/Trivy fs ni l'ingestion effective dans DefectDojo. Vérifier le nouveau HEAD, le bootstrap et les résultats de `master` avant de déclarer ces contrôles opérationnels.

# Roadmap — nabla-site-bababou

## Acquis P0 — convergence outillage inter-sites (fusion #234, 21 octobre 2026)

- **Base fusionnée** : [PR #234](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/234) ; **travail actuel** : [PR #235](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/235) en draft, commits `[skip ci]`, tests Git/Node locaux, aucune CI lancée. Les références Alban #238 sont historiques.
- [x] Portage de l'amélioration fusionnée dans Alban #227 : diagnostics de cycles pre-commit nommant les hooks, fichiers modifiés et passes, sans exporter les journaux bruts.
- [x] Parité de `scripts/agent-output-metrics.sh` avec Alban #238 : séparateur décimal déterministe `LC_ALL=C` et test sous locale française.
- [x] Intégrer `actionlint v1.7.12` et `zizmor v1.30.1 --offline` dans pre-commit et la CI (audit de tous les workflows avant bootstrap npm, bloquant). **Preuve sur le HEAD en cours requise** : les exceptions éventuelles doivent être justifiées et ciblées, jamais une désactivation globale.
- [x] Comparer `quality-gate.sh`, pre-commit, `justfile`, CI et contrats de tests : `justfile` devient le point d’entrée local canonique et `mise.toml` épingle `just` ; `Makefile` reste uniquement en compatibilité, sans suppression des contrôles confidentialité, BetterLeaks, Semgrep, SCA, Playwright ou ZAP.
- [x] Parité Renovate ciblée : `next` exclu du groupe runtime générique, versions majeures Next.js/ESLint Next groupées dans la règle dédiée ; toute mise à jour majeure exige toujours une approbation explicite via le Dependency Dashboard, sans automerge ni hausse du budget de PR. Tests de contrat ajoutés.
- [x] Migration npm 12.2.0 (version alignée avec Site Alban) : manifeste + lockfile + Mise, Quality, Copilot, Playwright, Node 24 et semantic-release. La vérification stricte `allowScripts`/`.npmrc` reste active ; les tests contractuels du runtime et de la CI sont mis à jour. **À attester par les jobs du nouveau SHA**, sans confondre CI et validation locale.
- [x] Vérification du npm épinglé centralisée dans `scripts/verify-mise-npm.sh`, utilisée depuis `just toolchain-check` et tous les workflows npm ; tests offline du fail-closed (version incorrecte, pin absent/invalide/dupliqué).
- [x] Release durcie : aucun fallback GITHUB_TOKEN pour écrire, credentials GitHub App dédiés obligatoires, permission workflow en lecture seule, vérification SHA master conservée, no-op explicitement documenté si les credentials App manquent. Aucune release déclenchée depuis cette PR.
- [x] Parité DAST Preview avec Site Alban : exécution ZAP isolée via `docker run` avec règles versionnées `.zap/rules.tsv`, statut bloquant sur SHA exact, agrégats uniquement ; aucun `action-baseline` ni artefact brut HTTP. Protection des données privées respectée sans divergent scanner.
- [x] Convergence Node 24 avec Alban : plancher Node dérivé de `package.json#engines.node`, sorties de tests bornées et artefact d’échec conservé 1 jour. Tests de contrat adaptés.
- [x] Convergence Semantic Release vers Alban : tags `vX.Y.Z`, `@semantic-release/npm` avec `npmPublish: false`, GitHub App seulement et freshness master. Les anciens tags numériques sont préservés ; bootstrap uniquement par alias vérifié contre une GitHub Release existante, sinon échec fermé. Aucune release déclenchée dans cette PR.
- [x] Production DAST : même scanner ZAP isolé que Preview/Site Alban ; seuls les résultats SARIF minimisés sont conservés pour le collecteur, sans rapport HTTP brut.
- [x] Correction du cas Semantic Release *no-op* : pas de vérification artificiellement bloquante si aucune nouvelle version n'est émise ; la cohérence tag/version est vérifiée avant toute mutation et l’alias numérique doit pointer vers un ancêtre du master validé.
- [x] Script maison `scripts/semantic-release-version.mjs` retiré : `@semantic-release/npm` est désormais le mécanisme commun pour la synchronisation des manifestes, avec `npmPublish: false`.
- [ ] Parité cross-repo à finaliser sur `nabla-site-alban` : reproduire la baseline production DAST, les exigences BetterLeaks PR le cas échéant et les règles de sécurité supplémentaires, plutôt que supprimer les protections Bababou. La confidentialité des données reste l’unique exception fonctionnelle intentionnelle.
- [x] Diagnostic GitHub Actions local-first : `just ci-diagnose <RUN_ID>` détecte les échecs pré-runner (`steps: null`), les vrais tests en erreur et les SHAs incohérents via deux appels API GET uniquement. Contrats de tests avec `gh` simulé, sans relancer de workflow ni publier d'information privée.
- [ ] **Budget GitHub Actions épuisé, confirmé par le propriétaire** : aucune exécution CI additionnelle ; les anciens runs #39556443405 ont échoué sans step. Préparer/valider localement et laisser la PR #235 en draft + `[skip ci]` jusqu'au renouvellement de crédit. Le diagnostic précis des anciens refus de runner n'est pas établi.
- [ ] Qualifier les autres écarts non pertinents à importer automatiquement : Node/npm et tooling expérimentaux (prek/hk), contexte source hors ligne, politiques BetterLeaks spécifiques, règles de publication privée et DAST ; privilégier la parité comportementale aux copies intégrales de scripts.
- **Preuve** : valider le P0 et les jobs GitHub sur le SHA exact de cette PR. L'échec Production DAST corrigé ne sera attesté qu'après son exécution réelle sur master.



> Source unique des travaux ouverts **et du contexte de reprise**. Les diagnostics restent dans [`docs/operations.md`](operations.md), les règles agent dans [`AGENTS.md`](../AGENTS.md), l'historique détaillé dans Git/PR.


## Diagnostic historique — PR #233 (fusionnée le 20 octobre 2026)

- **Archives de validation** : [PR #233](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/233), fusionnée ; les résultats du HEAD historique ci-dessous ne sont pas des preuves pour la PR #234.
- **Dernier HEAD intégralement validé** : `9c56f1d482121dafa6e88048d3b5ffa478f9761f` — [Quality and Security #39084115761](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/39084115761), [Node 24 #39084115759](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/39084115759), [Playwright Preview #39084318971](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/39084318971) (**191 tests réussis**) et [ZAP Preview #39084318959](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/39084318959) : **success**. Vercel déployé `READY` sur ce SHA. Les résultats ne valent pas pour un commit ultérieur.
- **P1/P2 validé sur `9c56f1d`** : scénario Playwright `tests/source-disclosure.spec.ts` : 403/404 exigés pour les chemins techniques (Git, secrets, GitHub Actions, manifests, scripts, Python). Inclus dans les **191 tests PASS** de la Preview. Cela ne prouve pas l'absence de toutes les fuites.
- **Dette ZAP** : 0 échec bloquant mais **9 catégories `WARN`** (dont CSP, cookies, CORS, ressources tierces/SRI/COEP, cache, commentaires suspects et signature Python). Trier avec les preuves exactes avant tout changement d'en-tête ; garder les règles `WARN` actives. Détails et limites dans [security-audit-coverage-ledger.md](security-audit-coverage-ledger.md).
- **SCA — constat et politique** : [CI #39156263209](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/39156263209) sur `fd8bd05` a confirmé **13 vulnérabilités (11 HIGH, 2 MODERATE)** via `npm audit` full, dans la chaîne transitive d'outils de développement (notamment `opencommit`/`axios`/`undici` et `braces`/`micromatch`/`fast-glob`). Ce contrôle full bloquant a révélé une dette existante. **Politique corrigée** : `npm audit --omit=dev --audit-level=high` **bloquant** pour la production sur chaque PR non draft / push master ; second `npm audit --json` **complet** traçable et résumé (dev inclus), échec si un résultat critique ou rapport invalide. Ne pas inventer d'absence de vulnérabilités dev ; résoudre sans `npm audit fix --force` ni rétrograder Stylelint. **Vérifier les nouveaux résultats CI avant de cocher PASS.** Snyk reste complémentaire conditionnel.
- **Toujours ouverts** : audit Cloudflare security-audit-skill en six phases et vérification indépendante ; preuve BetterLeaks staged/worktree/history sur un vrai checkout ; vérification locale L3. Le SAST Semgrep sur sources modifiées ne prouve pas un audit exhaustif.
- **Invariants** : `public/404.html` et son rendu legacy protégés ; Google Translate fallback conservé ; sources familiales privées non publiées ; pas de merge automatique ni de contournement des gates.

## Reprise rapide (sans historique redondant)

- Vérification P0 : `bash scripts/agent-p0-check.sh` dans un checkout valide ; le détail et la méthode de diagnostic restent dans `docs/operations.md`.
- Consulter le HEAD réel de [PR #234](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/234), ses statuts et sa base. Suivre le **premier échec exploitable**, puis la section ouverte correspondant au périmètre. Ne jamais merger automatiquement.
- Procédure d'agent : `AGENTS.md` puis skill `roadmap-local-first` ou `quality-follow-up` **à la demande**, pas de chargement du dossier entier. L1/L2/L3 local et CI remote sont des preuves différentes.
- Baselines, incidents Vercel/404 et erreurs de CI récupérables dans [`docs/operations.md`](operations.md), [récupération Vercel](vercel-github-baseline-recovery-2026-10-13.md) et runs GitHub. L'historique des lots terminés reste dans les PR/commits.
- Interdits maintenus : pas de directives CI skip, pas de suppression de `public/404.html`, pas de retrait legacy avant parité, Google Translate en fallback, pas de corpus familial privé dans les artefacts.

## Acquis structurants

- [x] Runtime Next.js/Vercel hybride, i18n FR/EN/DE/NO, legacy conservé lorsqu'il reste nécessaire.
- [x] 404 protégée via `public/404.html`, Route Handler/global-not-found et tests dédiés.
- [x] Quality local-first : preflight Git, P0 sans `node_modules`, gate agent, publisher exact-SHA et scope CI.
- [x] Preview exact-SHA, Playwright, ZAP et smoke production structurés.
- [x] Renovate groupé/cadencé ; Dependabot Alerts comme signal et Renovate comme remédiateur.
- [x] Betterleaks remplace Gitleaks ; `justfile` ajouté sans retirer le `Makefile`.
- [x] Publication sensible structurée : sources hors Git, audit/consolidation locale, manifeste et gate BLOCK/REWRITE/REVIEW.

## P0 — CI, qualité et agent

### Dette réellement ouverte

- [ ] **P0 qualité** : obtenir BetterLeaks staged/worktree/history et preuve locale L3 `agent-publish.sh` dans un vrai checkout avec Node/npm conformes ; une archive ou une CI verte n'est pas une preuve L3.
- [ ] **Mesure de performance de l'agent** : comparer latence et tokens à tâche/HEAD/toolchain/CI comparables ; `scripts/agent-output-metrics.sh` mesure des octets/lignes, pas les tokens du modèle. Réduire les appels redondants et la répétition des consignes, sans perdre de preuves.
- [ ] **Dagger — expérimentation opt-in** : vérifier exclusions et cache sur un moteur réel, traiter le hook `hadolint-docker` restant, benchmark froid/chaud et décider adopter/différer/rejeter. Jamais de socket Docker ou sources privées exposés ; pas de pipeline Dagger canonique avant parité.
- [ ] **Context7 MCP** : valider une vraie connexion OAuth/OpenCode et une requête documentaire ciblée sans secrets, PII ni dépendance de P0/quality à Internet.
- [ ] **DAST** : trier les neuf catégories ZAP WARN avec les preuves exactes ; ne durcir la politique bloquante qu'après vérification de la compatibilité du legacy.
- [ ] **Bot issues Quality** : dix `[quality-follow-up]` historiques (#183, #196, #212, #214, #217, #221, #224, #225, #228, #231). Aucune correction automatique validée dans leurs commentaires. Vérifier les correctifs fusionnés et la CI `master` appropriée **avant toute fermeture** ; voir l'index dans `docs/operations.md`.
- [ ] **Issue Quality automatisée** : après fusion, confirmer sur deux vrais runs Quality `master` verts consécutifs la clôture du registre bot intact ; vérifier qu'une modification manuelle empêche toute mutation automatique. Les dix tickets historiques restent à qualifier, sans fermer sur une seule CI de PR.

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

## Suivi du registre Quality (non bloquant)

- [ ] Après intégration du workflow, observer deux vraies CI successives `master` (push) avant toute clôture automatique des dix anciens tickets bot. Les issues touchées manuellement restent exclues ; ne pas créer de runs artificiels pour satisfaire ce critère.
