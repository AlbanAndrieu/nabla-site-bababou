# Roadmap — migration Next.js

> Source unique des travaux ouverts. Les procédures et signatures d'incident restent dans [`docs/operations.md`](operations.md) ; l'historique détaillé reste dans Git/PR.

## Principes

- Next.js/Vercel est la cible ; le legacy migre incrémentalement et n'est supprimé/redirigé qu'après preuve de parité contenu, comportement, rendu, SEO, accessibilité et routes.
- `fr`, `en`, `de`, `no` sont de premier rang ; `next-intl` est prioritaire et Google Translate reste fallback tant que la parité native manque.
- `/` / `public/index.html` restent owner-controlled et `public/404.html` reste la source visuelle protégée ; pas de changement de disclosure, pseudonymisation, caviardage ou architecture sans accord explicite.
- Les preuves routing/runtime/Preview portent toujours sur le SHA exact.
- PR petites et local-first ; toute validation non exécutée, dette ou warning différé reste ouvert.

## État courant

- [ ] GitHub-hosted runners indisponibles/quota contraint : ne pas relancer manuellement ; maximiser les preuves locales. Diagnostic dans `docs/operations.md`.
- [ ] **Renovate security** : vérifier Mend Renovate avec `Dependabot alerts: read`, Dependency Graph + Dependabot Alerts ON, Dependabot Security Updates OFF, puis observer le premier Dependency Dashboard et la première PR `security`.
- [ ] Synchroniser la stratégie Renovate/Dependabot dans Notion lorsque le workspace permet à nouveau la création de blocs.

## Acquis structurants

- [x] Runtime racine Next.js/Vercel, routage hybride, i18n FR/EN/DE/NO, policies et résultats de paiement stabilisés ; legacy conservé lorsqu'il reste nécessaire.
- [x] 404 protégée restaurée via `public/404.html` ; Preview exact-SHA, Playwright/ZAP, smoke production et DAST structurés.
- [x] Quality local-first : scope canonique, checkpoint P0 avec runtime guard, shell strict, draft preflight, publisher exact HEAD/base/toolchain et guards worktree/untracked/exec-bit/CI-skip.
- [x] UI primitives/responsive portés ; dépendances et runtimes manifestement orphelins retirés.
- [x] Renovate groupé/cadencé et remédiation Dependabot Alerts via label `security` ; documentation CI/Vercel/analytics/incidents consolidée dans `docs/operations.md`.

## P0 — Qualité, CI/CD et opérations

- [ ] Workstation : `bash scripts/agent-p0-check.sh`, puis `bash scripts/agent-quality-gate.sh --fix`, committer toute mutation et exécuter `QUALITY_FORCE_PUBLISH=1 bash scripts/agent-publish.sh`.
- [ ] Exécuter `opencode agent list` et confirmer `bababou` + `bababou-reviewer`.
- [ ] Au retour des runners, valider un guard serveur metadata-only contre les directives CI-skip et observer un vrai `master` rouge pour confirmer le follow-up automatique, sans provoquer d'incident.
- [ ] Prouver le chemin autonome événement Git → checkpoint `vercel-preview-*` → Preview Vercel exact-SHA.
- [ ] Réduire les warnings ZAP applicables et collecter plusieurs baselines vertes avant de rendre les budgets sécurité/performance bloquants.

## P1 — Homepage owner-controlled

- [ ] Décomposer progressivement `app/[locale]/page.tsx` et déplacer les textes vers `messages/home/{locale}.json` sans modifier les disclosures approuvées.
- [ ] Retirer chaque section legacy uniquement après parité React démontrée.
- [ ] Vérifier responsive/mobile, accessibilité, liens, assets, metadata et SEO.
- [ ] Après validation explicite de la homepage native, retirer le rewrite temporaire de `/` et rediriger `/index.html` vers `/`.

## P2 — UI, accessibilité et responsive

- [ ] Atteindre WCAG 2.2 AA pour texte/fond et contrôles non textuels/focus ; viser 7:1 sur les textes critiques lorsque pertinent.
- [ ] Migrer les consommateurs Next restants vers `Card`, `ActionLink`, `Button` et primitives partagées sans coupler le HTML legacy.
- [ ] Valider 320/375/768/1024/1440+ et reflow 200 % avec Chromium, puis multi-browser avant fermeture du volet visual regression.

## P3 — Routing, i18n et pages publiques

- [ ] Migrer les pages publiques structurées à faible risque, notamment `public/ca/**`, en conservant legacy + Google Translate jusqu'à parité.
- [ ] Ne publier aucune traduction juridique DE/NO générée automatiquement ; revue du contenu obligatoire.
- [ ] Bloqué : obtenir une source EN homologue pour `demande-explications-autorites-competentes` ; revoir explicitement `abduction-norway.html` / `abduction-germany.html` avant extraction i18n.
- [ ] Traiter `people-contacted.html` séparément en préservant D3/ARF/`people-cards.js`, arbre, cartes, traduction et preuves E2E.
- [ ] Conserver `public/test.html` tant que sa finalité ARF n'est pas réconciliée avec `/test`.
- [ ] Réutiliser l'inventaire build-time du hub comme source d'autorité ; différer le corpus familial sensible jusqu'à P6.

## P4 — SEO et métadonnées

- [ ] À chaque migration, vérifier canonical, hreflang, sitemap/robots, metadata sociales et comportement legacy ; la homepage/Open Graph/Twitter reste owner-controlled.

## P5 — Tooling, dépendances et nettoyage

- [ ] Valider le premier lot Renovate groupé avec le gate complet avant d'envisager un automerge ciblé de patch/minor devDependencies.
- [ ] Réconcilier dans un lot dédié `eslint`, `tsx`, `@types/node`, `typescript-eslint` et `postcss-selector-parser` après vérification des consommateurs et du lockfile.
- [ ] Retirer runtimes/scripts/assets/pages legacy orphelins uniquement après preuve d'absence de consommateurs et de parité.
- [ ] Continuer la comparaison structurelle avec `nabla-site-alban` pour les mécaniques communes, sans recopier ses choix de contenu ou de locale racine.

## P6 — Confidentialité finale hors homepage

- [ ] Auditer le corpus public restant hors homepage/index.
- [ ] Normaliser les pseudonymes juridiques (`the child`, `Mr A`, `Ms B`) et caviarder les données protégées sans perdre le sens juridique, chronologique ou probatoire.
- [ ] Étendre le privacy gate sans exposer les valeurs protégées dans logs/tests.
- [ ] Pour PDF/images, appliquer une redaction irréversible et supprimer couches/metadata cachées.
- [ ] Garder `/` et `public/index.html` hors hardening automatique : toute évolution de disclosure exige un accord explicite.

## Ordre des prochains lots

1. **P0** — preuve workstation du checkpoint local et publication exacte, puis preuve runner-backed quand disponible.
2. **P5** — réglages Mend/GitHub et première remédiation Renovate security réelle.
3. **P2/P3** — responsive/visual proof puis prochaine page documentaire à faible risque.
4. **P1** — homepage progressive sous contrôle explicite.
5. **P6** — confidentialité globale en dernier.

## Maintenance

- Conserver uniquement actions ouvertes et acquis structurants ; après merge, compacter les sous-tâches terminées.
- Garder incidents, signatures et procédures dans `docs/operations.md`, jamais les chronologies/runs dans la roadmap.
- Ne pas créer de `TODO.md`, `MIGRATION.md` ou roadmap parallèle.
