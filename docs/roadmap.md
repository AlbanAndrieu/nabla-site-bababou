# Roadmap active — Site Bababou

**Consolidation : 8 novembre 2026.** Référence vérifiée : `master@b24338ae5dd4e382618fe4ed95bba20a8c9121b9`. Les preuves anciennes (31 octobre, SHA `714adef` et Preview `624dc24f`) sont historiques et ne valident pas la production actuelle. L'équipe Vercel Hobby est suspendue : HTTP 402 confirmé sur la production ; demande de réactivation anticipée envoyée, issue inconnue.

## P0 — Réduction CPU Vercel et suites de PR (blocage plateforme)

| PR / composant | État au 8 novembre | Prochaine preuve exigée |
| --- | --- | --- |
| [#260](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/260) — SSG NRE, autorités centrales, politiques et prévisualisation | **Draft, non fusionnée** ; `force-static` dans le code, audit `scripts/verify-next-prerender.mjs` ajouté | `npm run build` puis audit du manifeste `.next/prerender-manifest.json`, test Node 24 exact-SHA ; aucune fuite NRE |
| [#261](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/261) — DAST 402 | **Draft, non fusionnée** ; le [run #42208333773](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/42208333773) obtient HTTP 402 avant ZAP | Contrat, `actionlint` et DAST réel après restauration ; **pas de PASS sans rapport** |
| [#262](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/262) — Registre NRE/OpenRAG | **Draft, non fusionnée** ; schéma public seulement, 0 pièce privée liée | Revue juridique/privacy + tests i18n, aucune connexion ou exposition OpenRAG directe |
| Publication Vercel | **BLOCKED** par suspension Hobby (du 3 novembre, reprise annoncée le 3 décembre sauf intervention support) | Vérifier la réponse du support, SHA exact, absence de SSR public non nécessaire, CPU avant/après, sécurité HTTP réelle |

**Décision :** ne pas assimiler la fusion d'une PR, un `READY` ancien ou un test structurel à une publication réussie. Ne pas activer automatiquement le remplacement de `/` ; le verrou éditorial exact-SHA demeure obligatoire. Ne pas dégrader les contrôles de confidentialité pour réduire les coûts.

## État réel et règles

- **Production par défaut** : `/` est encore réécrite vers `public/index.html` par `proxy.ts` si le verrou `isHomeCutoverEnabled()` n'est pas approuvé. La présence du code React fusionné ne signifie pas que sa publication sur `/` a été autorisée.
- **Deux parcours React de revue** : `/home-preview` (5 cartes, messages personnels) et `/abduction` (7 cartes, ressources pour parents, traduction, associations et notice). Versions préfixées `/en`, `/de` et `/no` ; français sans préfixe. Textes principaux natifs FR/EN/DE/NO dans `lib/homeAudienceCopy.mjs`.
- **Protection déclarée dans le code** : `noindex, nofollow, nosnippet` et `private, no-store` pour les pages de revue ; les en-têtes et les redirections doivent encore être vérifiés par HTTP réel sur le SHA candidat.
- **Confidentialité** : aucun nouveau numéro d'identité d'enfant, document d'identité, lien de localisation précise ou accusation nominative ne doit être copié depuis la homepage historique dans les nouvelles pages sans analyse de publication et décision explicite. La page historique reste propriétaire de ses exceptions ; voir `.agents/skills/protect-family-privacy/SKILL.md`.
- **Méthode** : `justfile` est l'entrée canonique. Tests locaux d'abord, PR Draft tant que les preuves requises manquent, aucune fusion automatique ; ne pas affaiblir les quality gates ni déclencher inutilement des workflows GitHub Actions.

## Travail restant — ordre P1 → P5

| Priorité | À faire | Condition de clôture |
| --- | --- | --- |
| **P1 — Parité et revue éditoriale** | Comparer les **5 cartes Home et 7 cartes Abduction**, textes, images non rognées, lettre « My Dear Daughter », « A long search », drapeaux, associations, ancres, liens, thème clair/sombre, mobile et impression avec le site historique. Arbitrer explicitement la demande de rétablissement des anciennes cartes liées à l'identité et à des lieux précis ; ne pas publier par défaut. | Recette visuelle des **8 parcours FR/EN/DE/NO**, images réellement chargées, écarts documentés et approbation éditoriale de la copie exacte. |
| **P2 — Accessibilité WCAG 2.2 AA** | Exécuter Playwright + axe sur Chromium, Firefox et WebKit : navigation clavier, focus, contraste, reflow à 320 px, zoom 200 %, mouvement réduit, thèmes, lecture des `details`, parcours sur mobile et lecteur d'écran. | Aucune violation bloquante, cas résiduels enregistrés avec preuve et validation manuelle des parcours critiques. |
| **P3 — i18n et pages historiques** | Contrôler le sélecteur FR/EN/DE/NO et les liens Home ↔ Abduction avant/après bascule ; relire humainement les quatre versions (juridique et texte personnel). Vérifier les destinations NRE, autorités centrales, `people-contacted.html`, `for-fathers.html`, les boutons Back/Home/Top et le « Print to PDF » de `/en/central-authorities`. | Aucune route cassée, contenu cible en bonne langue, fonctions héritées conservées ou écarts acceptés. |
| **P4 — SEO, sécurité et confidentialité de publication** | Tester HTTP `200/307/404`, `lang`, canonical/hreflang, sitemap, robots, métadonnées OG/Twitter, cache et en-têtes `noindex` des deux revues ; auditer requêtes réseau, SPA, Service Workers/WebSockets et absence de télémétrie non prévue. Vérifier **le verrou de bascule exact-SHA au build et au runtime**, notamment son comportement avec le prérendu Next.js. | Rapport exact-SHA sans exposition involontaire, règles SEO cohérentes et bascule/rollback réellement démontrés en environnement de test autorisé. |
| **P5 — Gates et dette technique** | Sur checkout complet : `just homepage-validation`, `just p0`, `just quality`, BetterLeaks, SAST/SCA, ZAP et publication selon la procédure du dépôt. Traiter séparément la PR dépendance #254 après vérification des impacts. Investiguer le warning npm `Unknown env config "cache-dir"` lorsque reproductible. | Quality gates exigées `PASS` ou dérogation explicitement approuvée ; SHA, environnement et preuves consignés. |

**Décision de mise en ligne : NO-GO pour le remplacement de `/`**, tant que P1–P4 et les gates de publication nécessaires ne sont pas démontrés et approuvés. La fusion de #253 ne constitue pas cette approbation.

## Preuves existantes — sans extrapolation

| Preuve | Portée |
| --- | --- |
| [PR #253 fusionnée](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/253) ; SHA de tête `624dc24f` | Modifications de migration et traduction intégrées dans `master`. |
| Vercel Preview `dpl_BQq3gJ8vhpNgmci9LNwP7b3Faohp` : `READY` sur `624dc24f` | Compilation Next.js/TypeScript et déploiement de **ce SHA seulement**. |
| 14 contrats ciblés Node `PASS` dans le sandbox du lot P1–P4 | Contrats de contenu/structure, **pas** toutes les suites, et **pas** exécution navigateur. |
| Contrôles Playwright/axe multi-navigateurs, sécurité complète, HTTP post-merge, revue éditoriale | **NOT_RUN / NOT_VERIFIED ici** ; ne pas annoncer `PASS` sur la base du build Vercel. |
| `master@714adef` examiné le 31/10 | Vérification du code et de la documentation, **pas** preuve d'exécution en production. |

Les anciens rapports de PR, leurs commits et leurs logs restent retrouvables dans Git. Ne pas les republier comme état actuel.

## Exécution et transmission

Sur une branche non protégée et un checkout complet, sélectionner les vérifications correspondant au diff :

```bash
just offline-l1
just offline-contracts
just homepage-validation-list
just homepage-validation
just p0
just quality
```

Ne lancer une recette navigateur que si les binaires et la cible autorisée sont disponibles. `NOT_RUN` ou `BLOCKED` ne signifie jamais `PASS`. Garder le handoff concis : **PR@SHA | blocage | fichiers | preuve | prochaine action**.

**Documents pérennes** : [parité et écarts](homepage-migration-parity.md) · [GO/NO-GO et rollback](homepage-react-cutover.md) · [opérations et incidents](operations.md) · [confidentialité](publication-redaction.md) · [couverture sécurité](security-audit-coverage-ledger.md).


## Architecture probatoire NRE / OpenRAG — préparation du 8 novembre 2026

**Début de réalisation dans une PR Draft séparée après fusion de #258** : `data/nre-evidence.public.json` contient uniquement les déclarations publiques initiales (contacts répétés, plaintes signalées FR/NO/DE), sans fichier de preuve lié, et `docs/nre-evidence-openrag-access.md` décrit la chaîne de confiance et les contrôles nécessaires.

| Priorité | Travail restant | Critère de réussite |
| --- | --- | --- |
| **P0 — registre public contrôlé** | Vérifier les 4 entrées initiales, leur schéma fail-closed, l'affichage multilingue et les tests de confidentialité. | Tests Node/Playwright et privacy gate exact-SHA ; aucune API OpenRAG ni preuve privée embarquée. |
| **P1 — inventaire privé et ingestion** | Sur l'infrastructure personnelle, recenser les originaux, empreintes, types, dates, juridictions et pièces ; exécuter Docling en local, OCR et conserver la provenance page. | Original inchangé, copie caviardée distincte, chaîne de conservation et journaux vérifiables. |
| **P2 — OpenRAG interne** | Vérifier le mode réel d'authentification OpenRAG/OpenSearch, la confidentialité des chunks, les ACL, l'isolation du corpus familial et les secrets. Interdire tout accès direct d'un tiers. | Accès croisé impossible ; clés et données privées jamais dans le navigateur ou le build public. |
| **P3 — accès sur demande** | Déployer une passerelle privée derrière Cloudflare Tunnel + Access, IdP MFA, justification et approbation temporaire, avec autorisation par référence et version de document. | Démontrer `401` anonyme, `403` hors périmètre, révocation/expiration, audit, caviardage et refus par défaut. |
| **P4 — synchronisation publique manuelle** | Produire à partir d'OpenRAG des références non sensibles, avec revue juridique et humaine avant PR ; ne jamais synchroniser automatiquement originaux/chunks. | Concordance des pièces/pagination, aucun identifiant protégé, contrôle éditorial et publication autorisée. |

Ne pas mettre en production les endpoints privés ni activer de partage de documents sans validation explicite de la politique d'accès et tests du scénario de révocation. Les points P1–P4 sont **préparés uniquement**, pas exécutés sur TrueNAS/Cloudflare/OpenRAG.
