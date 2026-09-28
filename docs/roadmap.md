# Roadmap — migration Next.js

> Source unique pour les **travaux encore ouverts**. Les incidents et procédures de diagnostic sont dans [`docs/operations.md`](operations.md). Les détails historiques restent accessibles dans les PR et l’historique Git ; ils ne sont plus répétés ici.

## Principes non négociables

- Next.js/Vercel est le runtime cible ; la migration du corpus legacy reste incrémentale.
- Ne supprimer aucune page `.html`, asset ou redirect legacy avant preuve de parité contenu, comportement, rendu, SEO, accessibilité et routes.
- `fr`, `en`, `de`, `no` sont les locales de premier rang ; `next-intl` est prioritaire et **Google Translate reste le fallback** lorsqu’une traduction native n’a pas atteint la parité.
- `/` et `public/index.html` restent owner-controlled : aucun changement de disclosure, pseudonymisation ou caviardage sans accord explicite.
- `public/404.html` reste la source visuelle protégée de la 404 ; ne pas la réécrire en React sans accord explicite.
- Une validation non exécutée, un warning différé ou une dette découverte reste représenté par une case ouverte.
- PR petites et local-first ; ne pas consommer de runners GitHub pour compenser une preuve locale manquante.

## État courant

- [ ] **Runners GitHub-hosted indisponibles/quota contraint** : `runner_id=0` avec `steps=[]|null` signifie échec d’infrastructure avant exécution. Ne pas relancer manuellement ; valider localement et conserver la preuve runner-backed comme dette. Voir `docs/operations.md`.
- [ ] Pour toute modification routing/runtime, valider `/`, `/index.html`, les routes Next concernées et le Preview **sur le SHA exact**.
- [ ] **#208 Renovate security** : installer/vérifier Mend Renovate avec `Dependabot alerts: read`, conserver Dependency Graph + Dependabot Alerts, désactiver Dependabot Security Updates, puis observer le premier Dependency Dashboard et la première PR `security` Renovate.
- [ ] Synchroniser la stratégie Renovate/Dependabot dans Notion dès que le workspace permet à nouveau la création de blocs.

## Acquis structurants — compact

- [x] Runtime racine Next.js/Vercel stabilisé ; déploiement via Vercel Git integration, sans second projet `app/`, Wrangler ni Vercel CLI.
- [x] Routage hybride, i18n FR/EN/DE/NO, policies et résultats de paiement migrés ; legacy conservé lorsqu’il reste nécessaire.
- [x] 404 protégée restaurée via `public/404.html`, y compris le fallback legacy consolidé par #197.
- [x] Preview exact-SHA, Playwright/ZAP, smoke production et DAST structurés ; incidents connus regroupés dans `docs/operations.md`.
- [x] Quality local-first : scope canonique, draft preflight, publisher exact HEAD/base/toolchain, worktree/untracked/exec-bit/CI-skip guards (#179, #203, #206, #207).
- [x] UI primitives, responsive chrome et contrats visuels/structurels portés depuis `nabla-site-alban` (#191, #204, #205).
- [x] Dépendances/runtimes manifestement orphelins retirés ; Node dev/CI et cible Vercel explicitement séparés.
- [x] Renovate version updates groupées/cadencées depuis #207 ; #208 étend Renovate aux remédiations issues des Dependabot Alerts avec label `security` et budget dédié.
- [x] Documentation opérationnelle consolidée : CI, Vercel, analytics et incidents utilisent désormais `docs/operations.md` au lieu de pages/runbooks dispersés.

## P0 — Qualité, CI/CD et opérations

- [ ] Sur workstation, exécuter `bash scripts/agent-quality-gate.sh --fix`, committer le diff convergé, puis `QUALITY_FORCE_PUBLISH=1 bash scripts/agent-publish.sh` avant de déclarer les lots quality/tooling prêts.
- [ ] Exécuter `opencode agent list` et confirmer `bababou` + `bababou-reviewer` sur workstation.
- [ ] Lorsque les runners reviennent, ajouter/valider le guard serveur metadata-only équivalent au rejet local `[skip ci]` / `skip-checks: true` sans créer un job coûteux supplémentaire.
- [ ] Observer le premier vrai `master` rouge pour confirmer le follow-up automatique issue → correctif déterministe éventuel → PR → CI, sans provoquer volontairement d’incident.
- [ ] Stabiliser le déclenchement autonome des checkpoints Vercel depuis Quality : prouver le chemin événement Git → Preview Vercel de bout en bout, pas seulement la création de ref.
- [ ] Réduire progressivement les warnings ZAP réellement applicables (CSP, SRI, cookies, cache, cross-origin) ; ne promouvoir WARN→FAIL qu’après baseline exact-SHA.
- [ ] Collecter plusieurs baselines vertes supplémentaires avant de rendre les budgets CI/performance bloquants.

## P1 — Homepage owner-controlled

- [ ] Décomposer progressivement `app/[locale]/page.tsx` en sections focalisées sans changer les disclosures approuvées.
- [ ] Déplacer les textes localisables vers `messages/home/{locale}.json` sans pseudonymisation implicite.
- [ ] Retirer une section legacy uniquement lorsque son composant React atteint la parité.
- [ ] Vérifier responsive/mobile, accessibilité, liens, assets, metadata et SEO.
- [ ] Après validation explicite de la homepage native, retirer le rewrite temporaire de `/` et rediriger `/index.html` vers `/`.

## P2 — UI, accessibilité et responsive

- [ ] Porter le contraste texte/fond à WCAG 2.2 AA et auditer les pages legacy `page-dark` utilisant `bg-light|bg-white|text-light|text-muted|text-secondary`.
- [ ] Étendre les contrôles aux composants non textuels/focus (>= 3:1) et viser 7:1 sur les textes critiques lorsque pertinent.
- [ ] Migrer progressivement les consommateurs Next restants vers `Card`, `ActionLink`, `Button` et les primitives partagées sans coupler le corpus HTML legacy.
- [ ] Valider 320/375/768/1024/1440+ et reflow 200 % avec Playwright ; exécuter Chromium puis la matrice multi-browser avant de fermer le volet visual regression.

## P3 — Routing, i18n et pages publiques

- [ ] Conserver Google Translate sur le legacy tant que la route native équivalente n’a pas atteint la parité ; réduire le fallback au fil des migrations.
- [ ] Migrer les pages publiques structurées à faible risque en gardant le legacy jusqu’à preuve complète.
- [ ] Migrer progressivement `public/ca/**` sans JS métier complexe, en commençant par les paires FR/EN homologues.
- [ ] Ne pas générer automatiquement de traduction juridique DE/NO ; publier une locale native uniquement après revue du contenu.
- [ ] Bloqué : obtenir/valider une source EN homologue avant migration de `demande-explications-autorites-competentes`.
- [ ] `abduction-norway.html` / `abduction-germany.html` nécessitent une revue explicite du contenu avant extraction i18n ou évolution de disclosure.
- [ ] `people-contacted.html` reste un lot séparé à cause de D3/ARF/`people-cards.js` ; préserver arbre, cartes, Google Translate et preuves E2E.
- [ ] Conserver `public/test.html` tant que sa finalité ARF n’est pas réconciliée avec `/test`.
- [ ] Réutiliser l’inventaire build-time du hub comme source d’autorité pour éviter un second catalogue manuel.
- [ ] Différer le corpus familial sensible jusqu’à P6.

## P4 — SEO et métadonnées

- [ ] Conserver la homepage et son Open Graph/Twitter comme exception propriétaire : aucun changement sans accord explicite.
- [ ] À chaque migration de route, vérifier canonical, hreflang, sitemap/robots, metadata sociales et comportement legacy avant redirect définitif.

## P5 — Tooling, dépendances et nettoyage

- [ ] Valider le premier lot Renovate groupé avec le gate complet avant d’envisager un automerge ciblé de patch/minor devDependencies.
- [ ] Réconcilier dans un lot dédié `eslint`, `tsx`, `@types/node`, `typescript-eslint` et `postcss-selector-parser` après vérification des consommateurs et du lockfile.
- [ ] Retirer progressivement runtimes/scripts legacy et assets/pages `.html` orphelins seulement après preuve d’absence de consommateurs et de parité.
- [ ] Continuer la comparaison structurelle avec `nabla-site-alban` pour les mécaniques communes, sans recopier ses choix de contenu ou son schéma de locale racine.

## P6 — Confidentialité finale hors homepage — à faire en dernier

- [ ] Auditer tout le corpus public restant hors homepage/index.
- [ ] Normaliser les pseudonymes juridiques vers `the child`, `Mr A`, `Ms B` lorsque le contexte l’exige.
- [ ] Caviarder les données protégées sans supprimer l’information nécessaire au sens juridique, chronologique ou probatoire.
- [ ] Étendre le privacy gate sans exposer les valeurs protégées dans logs/tests.
- [ ] Pour PDF/images concernés, appliquer une redaction irréversible et supprimer couches/metadata cachées.
- [ ] Garder `/` et `public/index.html` hors hardening automatique : toute évolution de disclosure nécessite un accord explicite.

## Ordre conseillé des prochains lots

1. **#208 / P5** — finaliser Renovate security + validations locales + réglages Mend/GitHub.
2. **P0** — fermer les preuves workstation et le déclenchement Vercel autonome avant d’élargir l’automatisation.
3. **P2/P3** — responsive/visual proof puis prochaine page publique documentaire à faible risque.
4. **P1** — extraction progressive homepage uniquement avec conservation stricte des disclosures.
5. **P6** — confidentialité globale en dernier.

## Maintenance de la roadmap

- Ajouter uniquement les actions encore ouvertes ou les acquis structurants qui changent l’architecture.
- Après merge, compacter les sous-tâches terminées en une ligne d’acquis ; ne pas conserver les numéros de runs et chronologies d’incident ici.
- Conserver les signatures de diagnostic et runbooks dans `docs/operations.md`.
- Ne pas créer de `TODO.md`, `MIGRATION.md` ou roadmap parallèle.
