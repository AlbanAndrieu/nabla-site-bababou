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

Le mode par défaut compacte la sortie du preflight et des contrats Node. En cas d'échec,
il affiche seulement les tests/assertions utiles avec un nombre de lignes borné par
`P0_LOG_TAIL` ; `--verbose` conserve la sortie native pour l'investigation.

Convergence puis preuve exacte :

```bash
bash scripts/agent-quality-gate.sh --fix
# inspecter puis committer toute mutation déterministe
QUALITY_FORCE_PUBLISH=1 bash scripts/agent-publish.sh
```

`agent-p0-check.sh` inclut le preflight Git-only et 26 contrats offline de scope, baseline,
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
`.next` et `test-results`, utilise le port isolé 3103, désactive la réutilisation d'un
serveur Playwright existant puis restaure `next-env.d.ts` à la sortie. Le wrapper
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

- ne jamais committer credentials, tokens ou `.vercel/` ;
- ajouter un secret seulement si un workflow versionné le consomme ;
- appliquer le moindre privilège et retirer les secrets sans consommateur ;
- traiter logs/artifacts comme surfaces de divulgation ;
- ne pas ajouter de credentials Vercel CLI tant que Git integration reste le mécanisme.

## 8. Références

- `AGENTS.md` — politique agent/local-first ;
- `docs/roadmap.md` — travaux ouverts et acquis structurants ;
- `.github/vercel-deployment-instructions.md` — contrat Vercel concis ;
- `SECURITY.md` — supply-chain et sécurité ;
- validation locale :
  `scripts/agent-p0-check.sh`, `scripts/agent-quality-gate.sh`, `scripts/agent-publish.sh`.
