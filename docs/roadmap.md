# Roadmap — nabla-site-bababou

État au 24 octobre 2026. **PR #242 fusionnée ; PR #245 en Draft** et basée sur le dernier `master`. La page publique demeure legacy jusqu'à une approbation explicite.

La priorité de développement est **P1 parité → P2 accessibilité → P3 i18n → P4 SEO**. L'audit HTTP read-only reste distinct. La quality gate complète est **reportée**, pas supprimée ni considérée comme réussie. Aucun GitHub Actions payant, déploiement ou merge automatique.

## Reprise rapide

- Source approuvée de la homepage : `public/index.html`. `proxy.ts` conserve `/` sur cette source.
- Source de parité et critères de bascule : [homepage-migration-parity.md](homepage-migration-parity.md).
- `/[locale]/home-preview` prépare les quatre langues. Drapeau serveur `HOMEPAGE_PREVIEW_ENABLED=true`, **désactivé par défaut**. Route non indexable. Ne pas activer publiquement sans revue.
- Exécuter les tests ciblés qui restent accessibles en local. Ne pas présenter le build Next.js, la validation WCAG ou la qualité complète comme réussis sans preuve.
- La validation visuelle est reportée sur instruction du propriétaire. Continuer les migrations React et les tests statiques dans la PR Draft. Garder les contrôles navigateur et WCAG comme critères distincts avant toute bascule publique.
- Incidents, signatures de panne et reprise GitHub : [operations.md](operations.md). Contrats de confidentialité : [publication-redaction.md](publication-redaction.md).
- Consignes agents : [local-first-quality](../.agents/skills/local-first-quality/SKILL.md), `AGENTS.md`.

## P1 — Homepage Next.js (priorité active)

- [x] Conserver la homepage legacy et ses routes pendant la migration.
- [x] Créer un premier rendu Next.js opt-in et `noindex` ; conserver le contact, les liens legacy et les flux RSS.
- [x] Migrer la section de contact publique en React. Conserver les phrases anglaises approuvées. Ajouter `lang="en"` et un contrôle de parité entre HTML et JSX.
- [x] Migrer le titre public « Éléonore (Bababou) — If you are reading this » et les deux paragraphes d'ouverture dans `LegacyOpeningSection.tsx`. Conserver le texte approuvé et adapter les niveaux de titres au H1 existant de la prévisualisation.
- [x] Migrer les trois paragraphes du message « A Message from Your Papa » dans un composant React sémantique. Conserver le texte anglais approuvé avec `lang="en"` et tester la parité avec `public/index.html`.
- [x] Migrer l’avis « If you are Éléonore » et la phrase de bas de message dans `LegacyFoundWebsiteSection.tsx`. Conserver leur texte anglais et leur ordre ; vérifier la parité avec `public/index.html`. Ne pas traiter le texte statique comme une alerte temps réel pour le lecteur d’écran.
- [x] Préparer les critères de parité dans `docs/homepage-migration-parity.md`.
- [x] Migrer le paragraphe public de présentation du cadre juridique et son lien vers `/for-fathers.html` dans `LegacyLegalResourcesSection.tsx`, sans dupliquer les cartes contenant identifiants, localisations ou accusations.
- [x] Porter les sections publiques non sensibles complémentaires dans React : navigation People contacted / Central Authorities, associations, notice documentaire native `details/summary`, et footer politique/accessibilité.
- [x] Corriger la navigation légale de la prévisualisation : utiliser les URL canoniques de `lib/policyPages.ts`, une section sémantique, une liste responsive, des cibles 44 px et un focus visible. Tests Node locaux 4/4, contrôle des routes et de l'ordre du clavier dans Playwright (NOT_RUN navigateur). Les URL `.html` publiques restent compatibles.
- [x] Corriger les liens de ressources dupliqués dans la prévisualisation React. Conserver les liens dans leurs sections approuvées. Afficher les deux flux RSS. Contrat Node ciblé : 2/2 tests PASS sur des fichiers exacts récupérés de GitHub ; tests navigateur et build : NOT_RUN.
- [ ] Réconcilier les cartes illustrées sensibles individuellement après revue de confidentialité ; ne pas recopier les identifiants personnels ni les localisations.
- [x] Inventorier les 15 scripts approuvés de la homepage ; ajouter `just homepage-runtime-parity` et un contrat de non-régression. 5/5 tests Node ciblés PASS ; exécution sur checkout complet NOT_RUN.
- [ ] Confirmer la parité fonctionnelle des scripts legacy (D3/ARF, widgets, analytics, Google Translate, connexion, thème et Turnstile) avant de basculer `/`.
- [ ] Traiter séparément les sections avec identifiants personnels, informations de localisation ou accusations sur des tiers. Exiger une revue de confidentialité avant toute duplication dans les composants publics.
- [ ] Mesurer la parité du contenu, des scripts et du rendu à plusieurs largeurs d'écran.
- [ ] Remplacer `/` et retirer le fallback seulement après revue explicite du propriétaire et validation du rendu final.

## P2 — Accessibilité WCAG 2.2 AA

- [x] **Skills installés et versionnés** : `frontend-design` et `web-design-guidelines` sont disponibles dans le workspace utilisateur et publiés sur la branche de PR. L'installation seule ne valide pas l'interface.
- [x] **Outillage reproductible** : les liens symboliques des skills, `skills-lock.json` et `mise.lock` sont inclus dans la PR #245.
- [x] **P2 sélecteur de langue** : name="locale" et autoComplete="off" préservent le choix contrôlé par la navigation React.
- [x] **P2 thème** : color-scheme light/dark suit les attributs data-theme explicites ; rendu réel navigateur NOT_RUN.
- [x] **Convergence Alban #255** : contrôle des attributs JSX dupliqués (TS17001) via TypeScript pour app/ et components/, tests ciblés et just source-check avec npm installé.
- [ ] **Validation au HEAD** : exécuter le contrôle source sur un checkout complet sous Node 24/npm 12 puis build, Playwright, axe et ZAP. Les preuves partielles ne sont pas une validation L3.
- [x] **Revue statique Vercel Web Interface Guidelines** : lire les règles actuelles de `vercel-labs/web-interface-guidelines/main/command.md` et auditer la prévisualisation React, le header et le footer. Aucune conformité WCAG navigateur n'est attestée.
- [x] **P2 clavier — homepage prévisualisation** : placer l'unique lien d'évitement en première position dans le header Next, avant les contrôles. Test clavier ajouté dans Playwright (NOT_RUN navigateur).
- [ ] **P2 clavier — autres pages** : inventorier les liens d'évitement et les cibles main avant toute généralisation. Ne pas introduire de doublons.

- [x] Définir pour la prévisualisation une structure `main`/titres, un lien d'évitement, un focus visible, des cibles tactiles et le respect de `prefers-reduced-motion`.
- [x] Appliquer les règles Vercel Web Interface Guidelines aux liens, titres et ancres de la prévisualisation. Ajouter les tests source et Playwright responsive (320/375/768/1280 px). La validation navigateur réelle reste à faire.
- [x] Conserver le disclosure documentaire natif avec un focus visible et une cible tactile de 44 px. Contrôler les deux paragraphes publiés : 6/6 vérifications statiques, 4 tests locaux des styles et de la structure ; rendu navigateur NOT_RUN.
- [ ] Vérifier au rendu réel les routes prioritaires FR/EN avec axe, lecteur d'écran et clavier.
- [x] Le bouton Next de retour en haut respecte désormais `prefers-reduced-motion`. Test source ciblé PASS ; navigateur NOT_RUN.
- [ ] Vérifier contraste, zoom 200 %, absence de défilement horizontal, erreurs de formulaire et focus.
- [ ] Vérifier les vues mobile/tablette et les navigateurs Chromium, Firefox et WebKit.
- [ ] Corriger les défauts prouvés dans les composants partagés ; conserver les protections de la 404 legacy.

## P3 — Langues et pages publiques

- [x] Préparer un catalogue `homepagePreview` complet pour FR/EN/DE/NO, intégré à `next-intl`.
- [ ] Comparer les textes de la homepage aux originaux approuvés. Faire valider les traductions.
- [ ] Migrer les pages publiques simples par petits lots ; conserver leurs URL et fallbacks legacy.
- [ ] Conserver Google Translate pour le contenu sans traduction i18n approuvée.
- [ ] Consolider les pages documentaires FR/EN seulement à partir des sources privées auditées.
- [ ] Faire revoir les textes juridiques DE/NO avant toute publication.
- [ ] Migrer `people-contacted.html` à part, sans perdre D3/ARF ; conserver `public/test.html` jusqu'à décision sur son usage.

## P4 — SEO et découvrabilité

- [x] Garder le canonical `/` et `noindex, nofollow` sur la prévisualisation ; ne pas l'ajouter au sitemap.
- [ ] Vérifier les métadonnées title, description, OpenGraph et Twitter après chaque migration.
- [ ] Vérifier canonical, hreflang FR/EN/DE/NO, x-default et les redirects des URL legacy.
- [ ] Vérifier sitemap Next/legacy, robots.txt, pages techniques non indexables et 404.
- [ ] Valider les nouvelles URL et les métadonnées de la homepage avant son indexation.

## Audit production — 24 octobre 2026

- [x] Vérifier le statut GitHub : la PR #242 est fusionnée ; ne pas continuer sur sa branche comme si elle était ouverte.
- [x] Ajouter `scripts/production-home-smoke.sh` (GET read-only, routes EN/FR/DE/NO, pages legacy, politiques, RSS, robots ; code de sortie en échec si réponse différente de 200 ou erreur réseau).
- [ ] **Bloqué par DNS dans l'environnement agent** : `curl` renvoie `Could not resolve host: bababou.com` pour `/`, `/en`, `/for-fathers.html`, `/feed.xml`. L'outil de consultation Web ne peut pas ouvrir les URL non plus. **Aucun résultat de disponibilité en production n'est confirmé** ; ne pas affirmer que le site fonctionne ou qu'il est en panne.
- [x] Consulter Vercel : dernier déploiement production `dpl_5tG2o87GafcsGKFw4ENNUepSDGoz` en état `READY` sur le commit `bc3694b8aa3b91baa1dc4f40cb606b430ef46e9e` (fusion #242). Ce statut atteste le déploiement réussi, pas le bon fonctionnement de chaque route ni de `bababou.com`.
- [ ] Exécuter le smoke dans un environnement disposant du DNS public ; vérifier en plus les headers et le comportement de la réécriture `/`.

## P0 — Contrôles de sécurité reportés temporairement

Ne pas supprimer, désactiver ou contourner les protections dans le code. Le **report** concerne uniquement l'exécution de la quality gate complète pendant cette phase de développement.

- [ ] Exécuter `npm ci`, le build Next.js, `just offline-contracts`, `just offline-pr` et `just p0` sur un checkout réel avec les versions Node/npm attendues.
- [ ] Exécuter `just quality` et la publication locale L3 sur le HEAD exact.
- [ ] Exécuter BetterLeaks staged/worktree/history, SAST/SCA, scans de confidentialité et contrôles de publication documentaire.
- [ ] Valider Preview exacte-SHA, Playwright et ZAP avant Ready/merge ; ne pas lancer de workflow payant maintenant.
- [ ] Réévaluer l'écart Vercel Node 24/npm 11 contre npm 12 exigé sans affaiblir `strict-allow-scripts`.
- [ ] Trier les neuf catégories ZAP WARN historiques. Les preuves figurent dans [security-audit-coverage-ledger.md](security-audit-coverage-ledger.md).
- [ ] Qualifier les dix issues bot historiques avec [operations.md](operations.md). Ne clôturer automatiquement qu'après deux vrais runs `master` verts et sans modification manuelle.

## P5 — Dépendances et outillage (après P1–P4)

- [ ] Valider les premiers lots Renovate groupés et les correctifs des vulnerability alerts.
- [x] Comparer la PR `nabla-site-alban#255` et reprendre la protection JSX TS17001 et la commande source-check ; exclure le code TrueNAS/OWNER spécifique à Site Alban.
- [ ] Tester React 19.3.1 et le lockfile npm 12, sans mélange avec les migrations fonctionnelles.
- [ ] Évaluer Dagger sur moteur réel (cache, exclusions, hadolint) puis choisir une seule autorité de pipeline.
- [ ] Valider Context7 MCP sans secrets ni dépendance réseau dans P0.
- [ ] Aligner le skill `local-first-quality` avec les règles pertinentes de Site Alban #255 : script Bash enfant plutôt que `set -euo pipefail` dans un terminal interactif ; worktrees isolés ; caches de téléchargement partagés, mais `.venv`/`node_modules` propres au worktree ; SHA distant vérifié avant écriture. Mise à jour directe du skill bloquée lors de ce lot.
- [ ] Mesurer coût et latence des agents sur tâches/HEAD comparables.
- [ ] Retirer code, scripts et assets orphelins seulement après preuve d'absence de consommateurs.
- [ ] Avant Talos, décider d'une stratégie d'image unique. Vercel ne dépend pas du Dockerfile fallback actuel.

## P6 — Confidentialité et publication (sur approbation)

- [ ] Publier uniquement par petits lots via `config/publication-review.json` et `npm run privacy:publication`.
- [ ] Consolider les e-mails en pages canoniques FR/EN. Ne pas publier les exports originaux.
- [ ] Conserver les pseudonymes approuvés dans les documents officiels et les références nécessaires à la vérification.
- [ ] Exiger la source vérifiée et l'accord explicite pour toute donnée sensible.
- [ ] Bloquer les détails opérationnels ou financiers facilitant une pression sur la famille.
- [ ] Caviarder irréversiblement PDF/images, y compris texte, OCR et métadonnées ; ne pas publier de photo identifiable sans approbation.
- [ ] Ne pas modifier automatiquement le contenu de `/` ou `public/index.html`.

## Sécurité Cloudflare / DAST (planification)

- [ ] Exécuter `cloudflare/security-audit-skill` en lecture seule sur un périmètre autorisé (Access, Tunnel/DNS, Vercel Preview, cookies et headers).
- [ ] Confronter les constats vérifiés à STRIDE/DSOMM, BetterLeaks, SAST et ZAP.
- [ ] Intégrer les rapports nettoyés au collecteur DefectDojo de `nabla-compose` après validation, sans données privées ni HTTP brut.

## Critère de fin d'un lot

1. Vérifier le HEAD et la base de la PR.
2. Examiner le diff des fichiers modifiés.
3. Exécuter les tests ciblés disponibles.
4. Enregistrer les contrôles non exécutés comme `NOT_RUN`.
5. Mettre à jour cette roadmap sans recopier l'historique Git.
6. Conserver la PR Draft.
7. Ne pas fusionner automatiquement.

Les résultats antérieurs à ce HEAD ne sont pas des validations du HEAD courant. Les diagnostics restent dans `docs/operations.md`.
