# Opérations et diagnostic

> Runbook unique pour CI, Vercel, Preview, production et analytics. La roadmap ne conserve que les actions ouvertes ; les incidents connus et leurs signatures de diagnostic sont regroupés ici.

## 1. Architecture opérationnelle

- **GitHub Actions** valide le dépôt ; `.github/workflows/` est l’autorité sur les workflows réellement actifs.
- **Vercel Git integration** déploie le projet Next.js racine ; aucun second projet npm sous `app/` et aucun Vercel CLI local ne sont requis.
- `master` publie la production ; les Preview contrôlées utilisent les branches `vercel-preview-*`.
- `vercel.json`, `package.json`, `proxy.ts`, `next.config.mjs` et `scripts/vercel-ignore-build.sh` définissent le contrat build/routing.
- Une preuve de Preview n’est valide que pour le **SHA exact** qu’elle déploie.

## 2. Validation locale avant publication

Chemin rapide sans `node_modules` :

```bash
bash scripts/agent-quality-gate.sh --preflight

bash scripts/agent-p0-check.sh
```

Convergence et preuve locale complète :

```bash
bash scripts/agent-quality-gate.sh --fix
# inspecter puis committer toute mutation déterministe
QUALITY_FORCE_PUBLISH=1 bash scripts/agent-publish.sh
```

`bash scripts/agent-p0-check.sh` chaîne le preflight Git-only et les cinq contrats Node de la boucle local-first, sans `node_modules`. `scripts/agent-publish.sh` est la preuve locale de publication : elle lie le résultat au HEAD, à la base, au toolchain et au lockfile installés. Ne jamais revendiquer un build, un browser check ou un scan non exécuté.

## 3. Flux Preview et production

Pour une modification deploy-relevant :

1. valider localement et obtenir un commit propre ;
2. laisser Quality classifier le scope ;
3. publier le checkpoint `vercel-preview-pr-<n>` lorsque le Preview est requis ;
4. confirmer que Vercel déploie le **SHA exact** et atteint `READY` ;
5. valider Playwright et ZAP sur cette URL exacte ;
6. après merge, contrôler les statuts production (`Vercel`, `Production Post-deploy Smoke`, `Production DAST`).

Les changements documentation/maintenance peuvent être volontairement ignorés par `scripts/vercel-ignore-build.sh`. Un checkpoint `vercel-preview-*` doit au contraire toujours construire.

## 4. Triage des incidents connus

### GitHub Actions : aucun runner alloué

Signature :

```text
runner_id=0
steps=[] ou steps=null
aucun log de step
```

Interprétation : échec **avant exécution du code**, typiquement quota, facturation ou provisioning GitHub-hosted runner. Ne pas modifier le code pour « corriger » ce signal et ne pas relancer manuellement les workflows lorsque les crédits sont indisponibles. Maximiser les preuves locales, puis conserver la preuve runner-backed comme dette.

### Vercel Security Checkpoint sur le domaine public

Signature possible :

```text
HTTP 429
x-vercel-mitigated: challenge
```

Si le deployment URL exact est sain, ce signal indique un challenge Vercel sur la sonde publique ; il ne prouve ni une panne applicative ni un domaine détaché. Vérifier séparément le deployment exact et le binding du domaine.

### Rewrite protégé de la homepage

`/` peut répondre par le `307` attendu vers `/index.html` pendant la phase hybride. Le smoke doit vérifier la destination et contrôler `/index.html` séparément en `200`; un `307` attendu n’est pas une panne.

### Handshake de bypass Vercel

Le header `x-vercel-set-bypass-cookie: true` peut provoquer un `307 Location: /` de handshake. Le smoke production utilise le bypass header-only + OIDC ; le handshake cookie reste réservé au préflight Preview qui sait le gérer.

### Checkpoint branch créée mais aucun Preview

Une ref `vercel-preview-*` créée ou mise à jour ne garantit pas qu’un déploiement existe. Un push effectué avec une identité GitHub automatisée peut être accepté par Git sans déclencher Vercel alors qu’une publication par identité utilisateur/connector déclenche le Preview. Conserver le fail-fast de détection et vérifier **événement Git → déploiement Vercel**, pas seulement l’existence de la branche.

### Preview `READY` mais Playwright/ZAP rouge

Vérifier dans cet ordre :

1. SHA du deployment ;
2. URL exacte ;
3. traces/screenshots Playwright ou alertes ZAP ;
4. comportement routing/bypass ;
5. seulement ensuite les changements applicatifs.

Une ancienne Preview verte n’est jamais une preuve pour un nouveau SHA.

## 5. Diagnostic progressif

Pour éviter le bruit et les téléchargements inutiles :

1. statut workflow/deployment ;
2. job ;
3. step ;
4. extrait de log ou artifact pertinent ;
5. logs complets uniquement si nécessaire.

Pour un problème Vercel avec CI saine, privilégier les logs build/runtime Vercel et la configuration du projet au lieu de réintroduire un déploiement CLI.

## 6. Analytics et Speed Insights

`public/site-analytics.js` possède l’intégration navigateur et charge directement les endpoints plateforme :

```text
/_vercel/insights/script.js
/_vercel/speed-insights/script.js
```

Le dépôt n’utilise pas `@vercel/speed-insights` ni un Vercel CLI local. Les scripts distants restent désactivés sur localhost ordinaire sauf override projet explicite. Le contrat navigateur est couvert par `tests/site-analytics.spec.ts`.

Pour valider l’intégration : activer Web Analytics / Speed Insights dans le projet Vercel, déployer via Git integration, vérifier les deux scripts `/_vercel/` sur le deployment attendu, puis vérifier les données côté Vercel après trafic. Respecter la politique de consentement/confidentialité.

## 7. Secrets et sécurité

- ne jamais committer credentials, tokens ou `.vercel/` ;
- ajouter un secret uniquement lorsqu’un workflow versionné le consomme ;
- appliquer le moindre privilège et supprimer les secrets devenus sans consommateur ;
- traiter logs et artifacts comme des surfaces de divulgation ;
- ne pas ajouter de credentials Vercel CLI tant que Git integration reste le mécanisme de déploiement.

## 8. Références

- `AGENTS.md` — règles d’exécution agent/local-first ;
- `docs/roadmap.md` — uniquement travaux ouverts et acquis structurants ;
- `.github/vercel-deployment-instructions.md` — contrat de déploiement concis ;
- `SECURITY.md` — contrôles supply-chain et sécurité ;
- `scripts/agent-quality-gate.sh` / `scripts/agent-publish.sh` — validation locale.
