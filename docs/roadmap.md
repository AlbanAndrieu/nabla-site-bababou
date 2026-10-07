# Roadmap — nabla-site-bababou

> Source unique des travaux ouverts et du contexte de reprise. Les procédures/diagnostics restent dans [`docs/operations.md`](operations.md), les règles agent dans [`AGENTS.md`](../AGENTS.md), l'historique détaillé dans Git/PR.

## Reprise rapide — nouvelle discussion

Une nouvelle discussion peut reprendre avec **ce fichier + `AGENTS.md` + l'état live de la PR**, sans reconstituer l'historique du chat.

1. Travailler sur la PR active **#218** / branche `feat/publication-redaction-guard` tant qu'elle est ouverte.
2. Avant chaque nouveau lot, lire le **HEAD distant exact** et sa CI. Si un job est rouge, corriger d'abord sa cause ; ne pas lancer de rerun manuel pour obtenir artificiellement une preuve.
3. Rester **local-first** : ciblé → `just p0` → `just quality-fix` → revue du diff → `just publish-check` / `just publish-status` quand un checkout exécutable est disponible. Une commande non exécutée n'est jamais une preuve.
4. Ne jamais merger automatiquement. Descriptions de PR en français. Ne jamais utiliser `--no-verify`.
5. Conserver `Makefile` ; le `justfile` est la façade additive pour les tâches agent/locales.
6. **Betterleaks remplace Gitleaks comme scanner exécuté** ; la configuration `.gitleaks.toml` reste temporairement le format de policy compatible Betterleaks.
7. Next.js/Vercel reste la cible. Le legacy n'est retiré qu'après parité prouvée contenu/comportement/rendu/SEO/accessibilité/routes. Google Translate reste fallback tant que l'i18n native n'est pas complète.
8. `public/404.html` reste la source visuelle protégée. Ne pas la réécrire en React sans accord explicite.
9. Pour le corpus familial/juridique, les originaux restent hors Git. Appliquer le skill `protect-family-privacy` : **Mr A**, **Mme B / Ms B**, **l'enfant / the child** ; santé/catégories spéciales sur approbation explicite ; données financières du père bloquées ; références judiciaires conservées lorsqu'elles permettent la vérification.

### État technique à reprendre

- Betterleaks + `justfile` sont déjà intégrés ; `Makefile` est conservé.
- Le chemin exact-SHA Vercel → Playwright/ZAP existe ; les derniers échecs étaient concentrés sur la 404 legacy et un test de text-scale.
- Le dernier correctif remplace le routage Vercel legacy `routes + handle: filesystem` par un `rewrite` vers le Route Handler 404 et rend le test 200 % text déterministe. **Preuve Preview exact-SHA encore à obtenir sur le HEAD courant.**
- La PR ne peut pas être repassée en Draft via le connecteur actuel (permission refusée) : utiliser le scope CI pour éviter les jobs coûteux inutiles.

## Acquis structurants

- [x] Runtime Next.js/Vercel, routage hybride et i18n FR/EN/DE/NO ; pages legacy conservées quand nécessaires.
- [x] 404 protégée via `public/404.html`, global-not-found et tests dédiés.
- [x] Quality local-first : preflight Git, P0 sans `node_modules`, gate agent, publisher exact-SHA, scope CI.
- [x] Preview exact-SHA, Playwright, ZAP et smoke structurés.
- [x] Renovate groupé/cadencé ; Dependabot Alerts utilisé comme signal, Renovate comme remédiateur.
- [x] Betterleaks choisi à la place de Gitleaks ; `justfile` ajouté sans retirer le `Makefile`.
- [x] Publication privée structurée : source hors Git, audit local, consolidation, manifeste de revue et gate BLOCK/REWRITE/REVIEW.

## P0 — Qualité, CI/CD et agent

- [ ] **Clore la CI courante** : obtenir la preuve exact-SHA que le fallback legacy `*.html` rend la 404 protégée avec statut 404, `noindex`, `no-store`, sans casser les HTML existants ; confirmer également le reflow 200 % non flaky.
- [ ] **Betterleaks** : valider `betterleaks git --pre-commit --staged --redact --config .gitleaks.toml` sur un index Git réel, puis retirer les dernières mentions opérationnelles de Gitleaks sans casser la compatibilité de policy.
- [ ] **Dagger CI — spike local-first** :
  - initialiser un workspace Dagger minimal et versionné ;
  - exposer des checks `p0`, `quality`, `test`, `build` en **réutilisant les scripts existants**, sans dupliquer leur politique ;
  - prouver qu'un même check s'exécute localement et dans GitHub Actions sur le même SHA ;
  - exploiter cache/traces Dagger uniquement si cela réduit réellement le coût/temps ;
  - ne transmettre aucun secret implicite au pipeline ;
  - done : parité locale/CI démontrée et rollback simple vers les scripts shell.
- [ ] **Context7 MCP — contexte documentaire agent** :
  - ajouter Context7 à la configuration MCP de l'agent (OAuth ou clé via environnement, jamais commitée) ;
  - l'utiliser pour les docs **versionnées et actuelles** de Next.js/Vercel/Playwright/Node/Dagger/Betterleaks et autres dépendances ;
  - conserver les docs Next locales installées comme première source pour la version réellement présente ; Context7 complète lorsqu'une doc locale manque ou qu'un outil externe est concerné ;
  - ne jamais envoyer le corpus privé `.private-publication-source/**` ou `.redaction-work/**` à un service documentaire externe ;
  - done : configuration + contrat agent documentés et testés sans rendre Context7 obligatoire pour les gates offline.
- [ ] Prouver le chemin autonome Git → checkpoint `vercel-preview-*` → Vercel → Playwright/ZAP exact-SHA, y compris le fallback de dispatch si le statut Playwright tarde.
- [ ] Réduire les warnings ZAP applicables et collecter plusieurs baselines vertes avant de rendre les budgets sécurité/performance bloquants.
- [ ] Garder les sorties quality compactes par défaut ; mode verbose uniquement pour diagnostic.

## P1 — Homepage owner-controlled

- [ ] Décomposer progressivement `app/[locale]/page.tsx` et déplacer les textes vers les catalogues i18n sans modifier les disclosures approuvées.
- [ ] Retirer chaque fragment legacy uniquement après parité React démontrée.
- [ ] Valider responsive, accessibilité, liens, assets, metadata/SEO avant retrait du rewrite temporaire de `/`.

## P2 — UI, accessibilité et responsive

- [ ] Clore WCAG 2.2 AA sur les routes prioritaires : axe FR/EN, clavier, contraste, 200 % text, reduced-motion et absence de scroll horizontal.
- [ ] Migrer les consommateurs Next restants vers les primitives UI partagées.
- [ ] Étendre ensuite la matrice viewport/multi-browser avant de fermer la visual regression.

## P3 — Routing, i18n et pages publiques

- [ ] Migrer les pages publiques structurées à faible risque, notamment `public/ca/**`, en conservant legacy + Google Translate jusqu'à parité.
- [ ] Ne publier aucune traduction juridique DE/NO générée automatiquement.
- [ ] Consolider FR/EN de `demande-explications-autorites-competentes` depuis les sources privées auditées avant publication.
- [ ] Traiter `people-contacted.html` séparément en préservant D3/ARF/`people-cards.js`, arbre, cartes, traduction et preuves E2E.
- [ ] Conserver `public/test.html` tant que sa finalité ARF n'est pas réconciliée avec `/test`.

## P4 — SEO et métadonnées

- [ ] À chaque migration : canonical, hreflang, sitemap/robots, metadata sociales et compatibilité legacy.
- [ ] Homepage/OpenGraph/Twitter restent owner-controlled.

## P5 — Tooling, dépendances et nettoyage

- [ ] Valider Mend Renovate : Dependabot Alerts read-only, Security Updates GitHub désactivé, première vraie PR `security` et premier lot groupé.
- [ ] Réconcilier `eslint`, `tsx`, `@types/node`, `typescript-eslint`, `postcss-selector-parser` et lockfile.
- [ ] Après le spike Dagger, décider explicitement **adopter / différer / rejeter** ; ne pas maintenir deux pipelines concurrents.
- [ ] Retirer runtimes/scripts/assets/pages legacy uniquement après preuve d'absence de consommateurs et de parité.

## P6 — Confidentialité et publication documentaire

- [ ] Publier le corpus récupéré par petits lots via `config/publication-review.json` + `npm run privacy:publication` ; jamais d'originaux non caviardés dans Git.
- [ ] Consolider les chaînes d'emails en pages canoniques FR/EN plutôt que publier chaque export séparément.
- [ ] Normaliser **Mr A**, **Mme B / Ms B**, **l'enfant / the child** ; ne pas utiliser `Bababou` dans les documents officiels/juridiques.
- [ ] Santé/psychologie/catégories spéciales : revue source + approbation explicite avant publication.
- [ ] Bloquer les données financières/opérationnelles du père susceptibles de faciliter pression ou coercition ; conserver le fait juridique et utiliser « disponible sur demande » si nécessaire.
- [ ] Préserver les références judiciaires/administratives utiles à la vérification externe.
- [ ] PDF/images : caviardage irréversible, suppression texte/OCR/metadata cachés ; photo identifiable de l'enfant non publiée sans validation explicite.
- [ ] Garder `/` et `public/index.html` hors hardening automatique.

## Ordre de travail

1. **P0 CI courante** — aucun nouveau lot tant que le HEAD live a un échec expliqué/non corrigé.
2. **P0 agent/tooling** — Betterleaks → Dagger spike → Context7 MCP, chacun en lot fini et réversible.
3. **P5** — dépendances/Renovate après stabilisation de la preuve locale.
4. **P2/P3** — accessibilité puis migration documentaire à faible risque.
5. **P1** — homepage sous contrôle explicite.
6. **P6** — publication sensible par petits lots revus.

## Definition of Done d'un lot

- CI précédente inspectée avant modification ; tout rouge pertinent corrigé d'abord.
- Patch minimal et cohérent, aucun changement utilisateur écrasé.
- Tests ciblés puis gate local le plus complet disponible réellement exécutés.
- Betterleaks utilisé pour les secrets ; pas de Gitleaks exécuté.
- Diff final relu après les auto-fixes.
- Preuve exacte SHA pour build/Preview quand le scope l'exige.
- Documentation/roadmap compactée : le fait terminé passe dans « Acquis structurants » ou disparaît si Git suffit comme historique.
- Aucun merge automatique.

## Maintenance de cette roadmap

- Garder uniquement **état de reprise + actions ouvertes + acquis structurants**.
- Ne pas recopier les incidents, logs ou chronologies : `docs/operations.md` et Git/PR les portent.
- Après chaque merge, mettre à jour « Reprise rapide » et compacter les actions closes.
- Ne pas créer de `TODO.md`, `MIGRATION.md` ou roadmap parallèle.
