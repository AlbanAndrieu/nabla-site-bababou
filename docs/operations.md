# Opérations et diagnostic

> Runbook unique pour CI, Vercel, Preview, production et analytics.
> La roadmap garde seulement les travaux ouverts ; l'historique détaillé reste dans Git/PR.

## 1. Contrat opérationnel

- **GitHub Actions** valide le dépôt ; `.github/workflows/` est l'autorité.
- **Vercel Git integration** déploie le projet Next.js racine.
  Aucun second projet npm sous `app/` ni Vercel CLI local n'est requis.
- `master` publie la production ; les Preview contrôlées utilisent `vercel-preview-*`.
- Le contrat build/routing est défini par `vercel.json`, `package.json`, `proxy.ts`,
  `next.config.mjs` et `scripts/vercel-ignore-build.sh`.
- Toute preuve Preview/runtime doit viser le **SHA exact**.

## 2. Validation locale avant publication

Checkpoint P0 sans `node_modules` :

```bash
bash scripts/agent-p0-check.sh
# diagnostic complet uniquement si nécessaire
bash scripts/agent-p0-check.sh --verbose
```

**Budgets de sortie par défaut :** `QUALITY_LOG_TAIL=12`, `P0_LOG_TAIL=12`, patch autofix `QUALITY_DIFF_LINES=36` (0 = patch complet). CI préflight : 20 lignes au maximum ; les erreurs restent bloquantes. `PRODUCTION_SMOKE_VERBOSE=0` résume les cinq probes HTTP en une ligne de succès, tandis que `=1` affiche chaque probe. Les erreurs HTTP/auth/challenge restent visibles quel que soit le mode. Ces paramètres limitent la sortie console, pas les contrôles effectués.

Le mode par défaut compacte la sortie du preflight et des contrats Node. En cas d'échec,
il affiche seulement les tests/assertions utiles avec un nombre de lignes borné par
`P0_LOG_TAIL` ; `--verbose` conserve la sortie native pour l'investigation.

Convergence puis preuve exacte :

```bash
bash scripts/agent-quality-gate.sh --fix
# inspecter puis committer toute mutation déterministe
QUALITY_FORCE_PUBLISH=1 bash scripts/agent-publish.sh
```

`agent-p0-check.sh` inclut le preflight Git-only et 28 contrats offline de scope, baseline,
toolchain, agents, CI/Preview, accessibilité et Vercel, avec les gardes Node `>=24.11 <27` / npm `>=11.17 <12`.
Le strict gate lui applique aussi shfmt, shell lint et bashate.
`agent-publish.sh` refuse `master`/detached HEAD et lie la preuve au HEAD, à la base,
au toolchain et au lockfile installés. `bash scripts/agent-publish.sh --status` audite la
preuve sans relancer le gate.
Ne jamais revendiquer un build, browser check ou scan non exécuté.

Audit accessibilité ciblé, borné à Chromium :

```bash
npm run test:a11y
BASE_URL=https://<preview-exact-sha> npm run test:a11y
```

Le premier mode valide le serveur local ; le second réutilise la même suite contre une
Preview exacte sans démarrer de serveur local. En local, `npm run test:a11y` passe par
`scripts/run-a11y-local.sh` : le harness refuse un `next-env.d.ts` déjà sale, nettoie
`.next` et `test-results`, choisit un port loopback libre à chaque exécution
(`PLAYWRIGHT_PORT` reste un override explicite), désactive la réutilisation d'un serveur
Playwright existant puis restaure `next-env.d.ts` à la sortie. Le wrapper
`run-next-clean.sh` reste la garde générique des commandes Next.

## 3. Preview et production

Pour un changement deploy-relevant : valider localement, obtenir un commit propre, puis laisser
Quality classifier le scope. Après Quality verte, `ci.yml` publie automatiquement
`vercel-preview-pr-<n>` au **SHA exact** ; Vercel doit atteindre `READY` avant
Playwright/ZAP. `Vercel Preview (On Demand)` reste un fallback opérateur. Après merge,
contrôler `Vercel`, `Production Post-deploy Smoke` et `Production DAST`.

Les changements documentation/maintenance peuvent être ignorés par
`scripts/vercel-ignore-build.sh`. Un checkpoint `vercel-preview-*` doit construire.

## 4. Signatures d'incident

### Runner GitHub non alloué

```text
runner_id=0
steps=[] ou steps=null
aucun log de step
```

Échec avant exécution du code : quota, facturation ou provisioning runner. Ne pas modifier
le code ni relancer manuellement lorsque les crédits sont indisponibles ; maximiser les
preuves locales et conserver la preuve runner-backed comme dette.

### Vercel Security Checkpoint

```text
HTTP 429
x-vercel-mitigated: challenge
```

Si le deployment exact est sain, ce signal indique un challenge Vercel et non une panne
applicative. Vérifier séparément deployment exact et binding du domaine.

### Homepage hybride et bypass

- `/` peut répondre `307` vers `/index.html` ; valider ensuite `/index.html` en `200`.
- `x-vercel-set-bypass-cookie: true` peut produire un handshake `307 Location: /`.
- Le smoke production utilise bypass header-only + OIDC ; le cookie reste au preflight Preview.

### Checkpoint Git sans Preview

Une ref `vercel-preview-*` créée ne prouve pas qu'un deployment existe. Vérifier
**événement Git → deployment Vercel**, pas seulement la branche ; une identité automatisée
peut pousser la ref sans déclencher Vercel.

### Preview `READY` mais Playwright/ZAP rouge

Vérifier dans l'ordre : SHA, URL exacte, trace/screenshot ou alerte, routing/bypass, puis
seulement le code applicatif. Une ancienne Preview verte n'est jamais une preuve pour un
nouveau SHA.

## 5. Diagnostic progressif

Inspecter dans l'ordre : workflow/deployment → job → step → extrait de log/artifact →
logs complets seulement si nécessaire. Si CI est saine mais Vercel échoue, privilégier
les logs build/runtime et la configuration du projet plutôt qu'un déploiement CLI.

## 6. Analytics et Speed Insights

`public/site-analytics.js` charge directement :

```text
/_vercel/insights/script.js
/_vercel/speed-insights/script.js
```

Le dépôt n'utilise ni `@vercel/speed-insights` ni Vercel CLI local. Les scripts distants
restent désactivés sur localhost ordinaire sauf override explicite. Le contrat navigateur
est couvert par `tests/site-analytics.spec.ts`.

Pour valider : activer Web Analytics/Speed Insights dans Vercel, déployer via Git integration,
vérifier les deux endpoints sur le deployment attendu puis les données après trafic, avec la
politique de consentement/confidentialité.

## 7. Secrets et sécurité

Le hook pre-commit utilise **Betterleaks v1.9.0** via son hook Go natif
pour la détection de secrets ; aucun daemon/socket Docker n'est requis par Betterleaks. Le fichier `.betterleaks.toml` est la policy canonique et conserve les allowlists revues. Betterleaks est le seul scanner de secrets exécuté. Le nom `REPOSITORY_GITLEAKS` subsiste uniquement comme identifiant historique du linter désactivé dans MegaLinter ; aucun binaire/hook Gitleaks n'est exécuté. `detect-private-key` et Secretlint restent des protections complémentaires.

Le `justfile` est désormais **le point d’entrée canonique** :
`just preflight`, `just p0`, `just quality-fix`, `just quality`,
`just publish`, `just publish-status`, `just workflow-audit`,
`just secrets-config`, `just secrets-staged`, `just secrets-worktree`,
`just secrets-history`. Les scripts npm/Bash, Mise et pre-commit restent les
mécanismes sous-jacents. Le `Makefile` est conservé pour la compatibilité
(`just legacy-help`), sans devenir la source des quality gates.

`just secrets-staged` analyse uniquement l'index Git : les sources
familiales et juridiques dans `.private-publication-source/**` et
`.redaction-work/**` ne doivent jamais être ajoutées à l'index ni
publiées dans les logs et artefacts CI.

- ne jamais committer credentials, tokens ou `.vercel/` ;
- ajouter un secret seulement si un workflow versionné le consomme ;
- appliquer le moindre privilège et retirer les secrets sans consommateur ;
- traiter logs/artifacts comme surfaces de divulgation ;
- ne pas ajouter de credentials Vercel CLI tant que Git integration reste le mécanisme.

## 8. Dagger CI spike

Le POC Dagger est **opt-in** et épingle Dagger `v0.21.10`. Le même wrapper
`scripts/dagger-ci.sh` est appelé localement via `just dagger-*` et par
`.github/workflows/dagger-spike.yml` (workflow manuel/réutilisable uniquement).

Cibles actuelles :

- `dagger-p0` : snapshot Git isolé + `agent-p0-check.sh` ;
- `dagger-quality-preflight` : preflight dependency-free uniquement ;
- `dagger-test` : `npm ci` + tests unitaires ;
- `dagger-build` : `npm ci` + build Next de production.

Le source transféré vers l'engine exclut explicitement `.git/**`,
`.private-publication-source/**`, `.redaction-work/**`, les fichiers
`.env.*` privés, `.vercel/**`, `node_modules/**` et les sorties générées.
Le spike n'utilise ni `--privileged` ni socket Docker hôte.

Le **full quality gate n'est pas revendiqué dans Dagger** : le pre-commit canonique
contient encore `shfmt-docker` et `hadolint-docker`. Avant adoption, migrer ces
deux hooks vers des exécutions natives ou démontrer une autre solution sans
Docker-in-Docker. Ensuite seulement comparer temps à froid/chaud, cache, réseau
et lisibilité des traces, puis décider adopter/différer/rejeter.

## 9. Références

- `AGENTS.md` — politique agent/local-first ;
- `docs/roadmap.md` — travaux ouverts et acquis structurants ;
- `.github/vercel-deployment-instructions.md` — contrat Vercel concis ;
- `SECURITY.md` — supply-chain et sécurité ;
- `docs/publication-redaction.md` — publication/caviardage du corpus familial et juridique ;
- validation locale :
  `scripts/agent-p0-check.sh`, `scripts/agent-quality-gate.sh`, `scripts/agent-publish.sh`.

## Incident durable — quality-follow-up master (septembre–octobre 2026)

**Signature** : une exécution `CI (Quality and Security)` après push sur `master` échoue sur `Enforce canonical changed-file quality gate` (formatter/pré-commit), ou `Run canonical project checks` (tests/lint/build). Le workflow `post-merge-quality-follow-up.yml` crée une issue `[quality-follow-up] master <sha> is red` via `github-actions[bot]`. Son job de remédiation `success` **ne signifie pas** que la correction ou la gate est verte : contrôler les champs `Deterministic diff`, `Strict validation` et `Remediation PR` dans le commentaire.

Issues historiques à trier (aucune PR de correction automatiquement validée) :
- **Pré-commit/formatter** : [#228](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/228), [#225](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/225), [#224](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/224), [#217](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/217), [#212](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/212).
- **Contrats npm/lint/build** : [#231](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/231), [#221](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/221), [#214](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/214), [#196](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/196), [#183](https://github.com/AlbanAndrieu/nabla-site-bababou/issues/183). #196 : diff déterministe préparé, mais gate stricte échouée.

**Diagnostic** : ouvrir l'issue → failed run/job/step → premier diagnostic concret dans les logs → identifier un commit correctif **fusionné** et la CI ultérieure sur `master` du même périmètre. N'ajouter un commentaire de clôture et ne fermer qu'avec ces preuves ; à défaut laisser ouvert. Un run Preview/ZAP vert ou une CI de PR verte ne suffit pas pour solder un incident de quality `master`.

**Incident historique de routage HTML** : les Previews #886/#889 ont montré que Next `afterFiles` et `handle: error` ne récupéraient pas les `*.html` legacy absents, déjà absorbés par `/[locale]`. Le contrat actuel utilise `handle: miss` et `check: true` pour router vers `/__legacy-html-not-found__` avant la route dynamique. Conserver les tests de non-régression et vérifier les headers `x-matched-path` en cas de réapparition.

### Suivi Quality après merge — limitation du bruit GitHub

Le workflow `.github/workflows/post-merge-quality-follow-up.yml` réutilise désormais **une issue de triage ouverte**, `[quality-follow-up] unresolved master Quality failures`, plutôt qu'une nouvelle issue par SHA. Son exécution est sérialisée sur `master` ; chaque commentaire enregistre **son propre SHA et l'URL de la CI échouée**, puis l'issue reste ouverte si une remédiation manque. Cela regroupe les notifications, **pas les causes racines** : chaque échec doit être diagnostiqué indépendamment. Une nouvelle panne après clôture réouvre le registre. Les dix anciennes issues restent conservées jusqu'à une correction et une validation `master` attestées ; ne pas les clôturer par ancienneté.

Dans `ci.yml`, BetterLeaks garde sa commande de compilation épinglée `go install ...@v1.9.0` et son **verdict bloquant**. Seuls les modules Go et objets intermédiaires sont mis en cache pour économiser les téléchargements/compilations répétés sur PR ; **jamais le binaire BetterLeaks prêt à exécuter**. Le cache n'est pas une dispense de scan, et un cache indisponible n'affaiblit pas l'analyse.

### Master Quality : propriété des issues et clôture vérifiable

Workflow réel de Bababou : `post-merge-quality-follow-up.yml` (le nom `master-red-remediation.yml` ne correspond pas à ce dépôt). La remédiation sur un push `master` rouge garde son chemin de PR draft, sans merger. Les nouveaux échecs sont rassemblés dans le registre `[quality-follow-up] unresolved master Quality failures`, sans une issue par SHA. La description est créée une seule fois, chaque échec est tracé par commentaire. Un marqueur identifie les seules issues que l'automatisation possède ; **aucune issue historique n'est réouverte automatiquement**. Toute intervention humaine détectée dans les événements ou commentaires retire l'issue du périmètre des mutations automatisées.

L'issue du registre est fermée seulement si les **deux plus récents** runs du workflow Quality, événement `push`, branche `master`, sont tous les deux terminés avec `success`; un run plus récent en cours, ignoré, annulé ou rouge bloque la clôture. Les issues historiques #183–#231 restent ouvertes tant que cette condition et une revue des preuves ne sont pas satisfaites. Le mécanisme ne modifie ni labels ni descriptions d'issues existantes ; le nettoyage manuel conserve les liens de runs. Éviter les polls répétitifs et les workflows de vérification artificiels.

### Consolidation différée des anciennes issues bot

Les dix tickets historiques `[quality-follow-up] master <SHA> is red` ne sont **pas** considérés corrigés sur la seule base d'un récent succès de PR/Vercel. Ils sont candidats à une clôture administrative `not_planned` (historique supersédé), seulement quand les **deux dernières exécutions CI push master** sont toutes deux `completed/success`. Le workflow préserve un commentaire de clôture donnant les deux liens CI et SHAs. Les tickets réutilisables actuels reçoivent `completed` sous la même condition. Si un ticket présente un commentaire/événement d'un acteur autre que le bot, des labels, assignés ou une milestone, il est **intouchable**, même si la CI est verte. Une issue fermée n'est jamais réouverte.
