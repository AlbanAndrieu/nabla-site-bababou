# Roadmap active — nabla-site-bababou

**Mise à jour : 25 octobre 2026, après fusion de #246.** `master@d07ede9fe34e0076f8578b9c13e294c0ca9ce74c` est associé à un déploiement Vercel de production `READY` (Node 24). **Cela confirme le déploiement, pas la recette complète du site.** Les requêtes automatisées sur le domaine et sur le déploiement exact ont reçu **HTTP 429 / Vercel Security Checkpoint** ; le résultat des routes est donc **non vérifié**, et non « en panne ».

La homepage publique `/` utilise toujours `public/index.html`. La Preview React `/[locale]/home-preview` reste opt-in (`HOMEPAGE_PREVIEW_ENABLED=true`), `noindex` et interdite à la publication sans approbation. Les migrations des registres de routes, du fournisseur de politiques, des traductions de l'index juridique et des tests Node 22/npm 10 **sont fusionnées** : ne pas les traiter comme des fonctionnalités à réimplémenter.

**Ordre de travail : P0 sécurité/validation, puis P1 homepage → P2 accessibilité → P3 i18n/pages → P4 SEO.** Les refactorings complémentaires viennent ensuite. Cette roadmap garde seulement les décisions et travaux **ouverts**. Les procédures sont dans [operations.md](operations.md), les contrats de parité dans [homepage-migration-parity.md](homepage-migration-parity.md), et la politique de publication dans [publication-redaction.md](publication-redaction.md).

## P0 — Confidentialité, sécurité et vérification de production

- [ ] **Revue prioritaire de l'existant public** : vérifier avec le propriétaire la nécessité de publier des identifiants officiels d'une mineure, des indications de localisation et des affirmations nominatives sur des tiers dans `public/index.html` et les métadonnées/assets. Ne pas reproduire ces valeurs dans les rapports, prompts, tests ou issues. Préparer une version minimisée/caviardée uniquement après arbitrage explicite ; contrôler le DOM, les images, les flux et les documents liés. L'approbation passée du HTML n'est pas une preuve de minimisation actuelle.
- [ ] **Recette HTTP autorisée au SHA exact** : diagnostiquer le `429` Vercel Security Checkpoint sans désactiver WAF ni Deployment Protection ; obtenir un accès de test approuvé pour `/`, `/policy`, `/en/policy`, `/de/policy`, `/no/policy`, les routes de contact, les anciennes URL `.html`, la 404, `robots.txt`, `sitemap.xml` et les deux flux RSS. Distinguer challenge d'accès, échec DNS, code applicatif et erreur de déploiement.
- [ ] **Build et gates exact-SHA** : utiliser `just agent-local-tests` sous Node 22/npm 10 pour les contrats sans dépendances ; garder `just agent-local-build` et `npm ci` sous la toolchain verrouillée pour le build Next. Exécuter `just p0`, `just quality`, BetterLeaks, SAST/SCA, contrôles de confidentialité, Playwright/axe et ZAP avant de certifier une publication. `READY` et quelques tests Node ne valent pas L3.
- [ ] **Dette sécurité restante** : traiter uniquement les findings ZAP/SCA toujours présents, selon [security-audit-coverage-ledger.md](security-audit-coverage-ledger.md). Ne pas assimiler l'absence de logs runtime à une preuve de sécurité ; les workflows GitHub manquants restent `NOT_RUN`.
- [ ] **Issues Quality master** : trier les incidents historiques uniquement avec les deux derniers runs `push master` réussis et sans modifier les issues reprises manuellement. Conserver la procédure dans [operations.md](operations.md).

## P1 — Homepage React : parité et approbation

- [ ] Établir, à partir de `just homepage-runtime-parity`, le comportement de chacun des **15 scripts legacy** ; traiter D3/ARF, Turnstile, Google Translate, consentement, thème, widgets et analytics. Un inventaire source intact ne prouve aucune parité interactive.
- [ ] Vérifier le contenu **approuvé**, les liens, les trois icônes d'association et leurs fallbacks, le contact, les RSS, le responsive et les interactions sur la Preview. Exclure les cartes sensibles jusqu'à la revue P0.
- [ ] Remplacer `/` seulement après parité fonctionnelle et visuelle, validation de confidentialité, tests navigateur et approbation explicite. Conserver `public/index.html` et la 404 jusqu'à cette décision.

## P2 — WCAG 2.2 AA

- [ ] Valider au clavier et avec axe/lecteur d'écran les pages FR/EN/DE/NO et la Preview : premier lien d'évitement, `#main-content`, sélection de langue, focus, images de secours et formulaires.
- [ ] Vérifier contraste, thème clair/sombre, zoom 200 %, débordements, cibles tactiles, `prefers-reduced-motion` et Chromium/Firefox/WebKit ; fournir une preuve navigateur au SHA exact, non uniquement des tests de source.

## P3 — i18n et pages publiques

- [ ] Faire relire les contenus et textes juridiques des quatre langues. Les **20 chaînes** de l'index des politiques sont déjà migrées à l'identique vers `messages/policy-index/*.json` : vérifier leur rendu et leurs métadonnées, ne pas recommencer la migration.
- [ ] Migrer progressivement les pages publiques restantes, en conservant les URL/fallbacks existants ; préserver `people-contacted.html` (D3/ARF) et `public/test.html` tant que leurs comportements ne sont pas validés.
- [ ] Conserver Google Translate comme recours pour les pages non traduites et ne jamais publier une traduction automatique de documents sensibles sans revue.

## P4 — SEO, liens et découvrabilité

- [ ] Contrôler title, description, canonical, OpenGraph, Twitter, hreflang et `x-default` sur les pages réellement servies dans les quatre langues.
- [ ] Vérifier sitemap, robots, RSS, redirections legacy, 404 et `noindex` de la Preview après obtention d'une recette HTTP non bloquée par le challenge Vercel.

## P5 — Refactoring complémentaire et agents

- [ ] Isoler progressivement les responsabilités de `public/site-widgets.js`, `public/theme-toggle.js` et `public/site-analytics.js`, en conservant l'application du thème avant peinture, le consentement et les garde-fous de télémétrie. Éviter toute nouvelle dépendance réseau nécessaire aux gates.
- [ ] Remplacer les contrats source fragiles par des tests de comportement lorsque possible, tout en gardant les gardes offline local-first. Maintenir `justfile` canonique et `Makefile` compatible.
- [ ] Harmoniser le skill d'agent : worktrees isolés, environnement mutable par worktree, cache de téléchargement réutilisable, pas de `set -euo pipefail` dans le terminal interactif parent. **Demander à l'opérateur d'installer lui-même** les skills tiers `web-design-guidelines`, `frontend-design` et `security-audit-skill` avant usage. Évaluer Dagger/Context7 sans faire transiter de documents privés.
- [ ] L'image de déploiement Kubernetes et les services d'infrastructure relèvent de la roadmap **nabla-compose**, pas de Bababou. Ne pas ouvrir de chantier de Dockerfile ici sans preuve d'un consommateur.

## Critère de fin d'un lot

Vérifier le HEAD exact et la protection des contenus ; exécuter les contrôles compatibles avec le runtime disponible ; marquer `NOT_RUN` ou `BLOCKED` sans transformer une preuve L0/L1 en build certifié. PR d'agent en Draft tant que les crédits CI sont indisponibles ; aucun merge, désarmement de sécurité ou déploiement automatique. Conserver les incidents irremplaçables dans le runbook, pas les listes de tâches terminées.
