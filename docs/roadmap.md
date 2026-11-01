# Roadmap active — Site Bababou

**Consolidation : 31 octobre 2026.** Source de référence : `master@714adef448f398e270d4b0004a3214975b71ff8a`, inspectée dans GitHub. La [PR #253](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/253) est **fusionnée** ; la [PR #254](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/254) (dépendance `follow-redirects`) est ouverte et indépendante de cette roadmap. La compilation `READY` obtenue sur l'ancien SHA `624dc24f` n'est **pas** une recette de production du `master` courant.

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

