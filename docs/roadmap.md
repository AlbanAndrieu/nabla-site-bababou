# Roadmap active — nabla-site-bababou

État au **25 octobre 2026**. La PR #245 est **fusionnée** sur `master`. Le site reste hybride : la homepage publique `/` utilise toujours `public/index.html`. La migration React est disponible uniquement via `/[locale]/home-preview` avec `HOMEPAGE_PREVIEW_ENABLED=true` (désactivé par défaut et `noindex`). **Aucune bascule publique sans approbation explicite.**

Ce document contient uniquement les **travaux ouverts** et leurs critères d'acceptation. Les réalisations sont dans le code et l'historique Git ; les procédures et incidents dans [operations.md](operations.md) ; la correspondance du contenu dans [homepage-migration-parity.md](homepage-migration-parity.md) ; la confidentialité dans [publication-redaction.md](publication-redaction.md).

## Ordre des priorités

**P1 Homepage → P2 Accessibilité → P3 i18n/pages → P4 SEO.** P0 sécurité, conformité de la CI et confidentialité restent des conditions obligatoires pour chaque publication. Conserver la PR de travail en Draft ; ne pas consommer volontairement des minutes GitHub Actions pour les itérations locales ; ne jamais affaiblir les gates.

## P1 — Parité fonctionnelle de la homepage React

- [ ] Comparer les **15 scripts** du HTML approuvé aux comportements réellement disponibles en React avec `just homepage-runtime-parity`. Ce contrôle ne prouve que la stabilité de l'inventaire : D3/ARF, Turnstile, Google Translate, thème, widgets et analytics demeurent à valider individuellement.
- [ ] Définir le sort de chaque interaction : migration React, adaptation sûre du script existant ou maintien de la route legacy. Conserver les consentements et ne pas augmenter la collecte analytics.
- [ ] Vérifier les liens, le contact, les flux RSS, les SVG d'associations (y compris échec 404), la navigation clavier et les scripts sur FR/EN/DE/NO. Les tests de source ne remplacent pas les vérifications en navigateur.
- [ ] Examiner **séparément** toute carte avec identifiant personnel, localisation, illustration sensible ou accusation. Ne rien recopier dans la Preview sans revue selon [publication-redaction.md](publication-redaction.md).
- [ ] Faire approuver la parité de contenu, le responsive et les interactions, puis seulement envisager le remplacement de `/`. Conserver `public/index.html` et la 404 tant que la bascule n'est pas autorisée.

## P2 — Accessibilité WCAG 2.2 AA

- [ ] Exécuter les tests axe, clavier, lecteurs d'écran, contraste, zoom à 200 %, débordement horizontal et réduction des animations sur les pages prioritaires FR/EN et sur la Preview opt-in.
- [ ] Vérifier la première tabulation vers le lien d'évitement pour les pages Next, y compris les alias HTML ; contrôler ensuite le focus et la cible `#main-content` avec Chromium, Firefox et WebKit.
- [ ] Vérifier le sélecteur de langue, les contrôles natifs en modes clair/sombre, les cibles tactiles de 44 px et les images de secours des associations.
- [ ] Ne clôturer un défaut WCAG qu'avec une preuve navigateur sur une version identifiable ; conserver les régressions statiques dans les tests.

## P3 — i18n et migration des pages

- [ ] Revoir les traductions FR/EN/DE/NO des textes de la homepage ; les extraits anglais déjà approuvés portent `lang="en"` et ne doivent pas être traduits automatiquement pour publication.
- [ ] Migrer les pages publiques simples en lots limités, en gardant leurs URL et fallbacks legacy. Ne pas supprimer `public/test.html` sans analyse de ses scripts/collecte.
- [ ] Traiter `people-contacted.html` à part : préserver D3/ARF, les liens et les vérifications de confidentialité.
- [ ] Conserver Google Translate comme recours pour les pages sans traduction humaine validée.
- [ ] Soumettre les textes juridiques DE/NO et toute nouvelle publication documentaire FR/EN à une validation explicite.

## P4 — SEO et découvrabilité

- [ ] Vérifier title, description, OpenGraph, Twitter, canonical et hreflang (FR/EN/DE/NO, `x-default`) sur les routes réellement publiées.
- [ ] Vérifier sitemap, robots.txt, RSS, redirections des anciennes URL, statuts 404 et absence d'indexation de la Preview et des pages techniques.
- [ ] Exécuter le smoke HTTP production en lecture seule sur le déploiement et le SHA réellement servis. Un statut Vercel `READY` ne valide ni les liens, ni l'accessibilité, ni la sécurité.

## P0 — Publication et sécurité (transversal, bloquant)

- [ ] Sur un checkout propre et un **HEAD exact**, exécuter `npm ci`, `just source-check`, `just offline-contracts`, `just p0`, `just quality` et `just publish` avec la toolchain supportée. Enregistrer les contrôles impossibles comme `NOT_RUN`.
- [ ] **Validation du build agent au HEAD** : exécuter `just agent-local-build` (préflight puis `npm run check`) dans un worktree isolé. Le préflight vérifie Node 26 de développement ou Node 24 de production, npm 12.2.1, la politique d'engines et les dépendances. **État actuel : BLOCKED** sur cet agent (Node 22/npm 10, DNS GitHub/npm indisponible, pas de checkout complet). Ne pas déclarer Next build PASS.
- [ ] Exécuter BetterLeaks (index, worktree, historique), SAST/SCA, contrôles de confidentialité, tests Playwright et ZAP ; aucune réduction des gates sans décision de sécurité.
- [ ] Valider la Preview exact-SHA, ses logs de build et ses protections d'accès, puis le comportement métier ; ne pas contourner l'authentification Vercel.
- [ ] Traiter les catégories ZAP WARN et la dette SCA documentées dans [security-audit-coverage-ledger.md](security-audit-coverage-ledger.md). Ne pas transposer un constat d'un ancien SHA à un nouveau.
- [ ] Qualifier les anciennes issues de Quality sur `master` à partir des runs réels ; respecter l'appropriation humaine et la règle des **deux derniers runs push master verts** avant clôture automatique. Voir [operations.md](operations.md).

## P5 — Refactoring et outillage (après blocages P1/P2)

Ces candidats proviennent d'une **revue de sources** ; ils ne sont pas tous des bugs démontrés.

- [ ] **Routes — recette runtime** : les listes des canoniques, des anciennes redirections HTML et des slugs des politiques sont mutualisées via `lib/mainContentRoute.mjs` entre Next, SEO et navigation clavier. Contrôle offline ajouté. Vérifier la compilation Next et les redirections/404 sur le SHA exact avant clôture.
- [ ] **i18n — recette runtime** : index juridique FR/EN/DE/NO déplacé vers les catalogues `messages/policy-index/*.json` avec 20/20 chaînes strictement inchangées, et chargeur `next-intl` central. Vérifier le rendu et les métadonnées sur les quatre langues en Preview avant clôture.
- [ ] **Politiques — recette runtime** : `lib/nativePolicyCatalog.ts` mutualise les URL et le choix du contenu entre l’index et les six pages détaillées. Vérifier avec `unit-tests/nativePolicyCatalog.test.ts`, les pages réelles et la confidentialité, sans changer le contenu juridique approuvé.
- [ ] **Widgets :** inventorier les responsabilités des grands scripts `public/site-widgets.js`, `public/site-analytics.js` et `public/theme-toggle.js` avant toute extraction de module. Préserver l'initialisation précoce du thème, le consentement et les intégrations legacy. Une garde locale analytics couvre désormais localhost, IPv6 loopback et 127.0.0.0/8 ; tests isolés 15/15 PASS, recette Playwright NOT_RUN.
- [ ] **Tests :** remplacer les assertions de code-source fragiles par des tests comportementaux lorsque les prérequis sont disponibles, sans supprimer les contrôles offline qui détectent une dérive à faible coût.
- [ ] **Toolchain :** stabiliser Node/npm et les lockfiles, évaluer les changements React/Next par lots indépendants. Garder `justfile` canonique et `Makefile` compatible.
- [ ] **Agent local-first :** compléter le skill avec l'isolation des worktrees, les scripts Bash enfants, une `.venv` propre par worktree et un cache de téléchargement partagé. Ne jamais exécuter `set -euo pipefail` dans un terminal interactif parent.
- [ ] **Dagger/Context7 :** valider le POC Dagger avec moteur et exclusions réels ; ne pas rendre Context7 dépendant du réseau dans les gates. Éviter tout outil recevant des documents privés.
- [ ] **Déploiement hors Vercel :** définir une image unique uniquement lors du chantier Talos/Kubernetes ; ne pas dédupliquer les Dockerfiles sans preuve des consommateurs.

## P6 — Confidentialité et publication

- [ ] Publier uniquement des lots explicitement approuvés via `config/publication-review.json` et `npm run privacy:publication`.
- [ ] Caviarder les informations sensibles dans le contenu **et** les métadonnées des PDF/images ; vérifier le rendu et l'absence de données récupérables.
- [ ] Ne pas publier les originaux, données de localisation, coordonnées privées, éléments facilitant des pressions familiales ou photos identifiables sans approbation.
- [ ] Évaluer Cloudflare `security-audit-skill` en lecture seule, sous périmètre autorisé. Intégrer uniquement des rapports nettoyés vers DefectDojo après validation.

## Critère de fin d'un lot

Vérifier le HEAD et le diff ; exécuter les tests ciblés disponibles ; classifier chaque preuve (L0/L1/L2/L3 ou `NOT_RUN`) ; consigner uniquement la dette **encore ouverte** ci-dessus ; conserver la PR Draft ; ne jamais fusionner ni promouvoir automatiquement. Les commandes et incidents de reprise sont dans [operations.md](operations.md).
