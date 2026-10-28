# Roadmap active — Site Bababou

**Mise à jour : 28 octobre 2026 · [PR #250](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/250) et [PR #251](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/251) fusionnées · [PR #252](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/252) Draft, contrôles navigateur.**

**État de clôture :** P2/P3 — 8/8 contrats Node et 28/28 vérifications Chrome HTML locales PASS ; P4 — 9/9 tests Node de sitemap PASS ; P1 — 7/7 tests Node des scripts PASS, 9 dépendances documentées (4 conservées sur HTML historique, 5 non requises en Preview), aucune dépendance script sans décision ; la parité éditoriale et la revue de publication restent ouvertes ; build Vercel exact SHA READY avec 81/81 pages. Restent la recette des routes Next/Preview à travers le checkpoint Vercel HTTP 429, les scans sécurité, la revue humaine de confidentialité et la décision de bascule `/`. L'avertissement npm `cache-dir` est non bloquant.

## Situation et périmètre

La route `/` sert toujours `public/index.html`. La homepage React est consultable sur `/home-preview`, `/en/home-preview`, `/de/home-preview` et `/no/home-preview` ; `/fr/home-preview` redirige vers la version française non préfixée. Ces routes sont publiques pour revue, mais **noindex, nofollow, no-store**. Aucun feu vert de bascule ni de publication de nouvelles données personnelles n'est implicite.

**Une seule file de travaux ouverts : P1 → P2 → P3 → P4 → P5.** Ne pas rouvrir ici les migrations de catalogues/routes déjà fusionnées, ni les déploiements TrueNAS/Kubernetes qui relèvent de `nabla-compose`.

| Priorité | Objectif restant | Condition de fin |
| --- | --- | --- |
| **P1 — Homepage** | Recette de parité React et décision de publication | 13 sections, 10 cartes et ressources validées sur navigateur au SHA exact ; revue de confidentialité approuvée |
| **P2 — WCAG 2.2 AA** | Exécuter les tests automatisés et la revue manuelle | axe, clavier, focus, contraste, zoom 200 %, reduced-motion et responsive validés sur Chromium/Firefox/WebKit |
| **P3 — i18n/pages** | Vérifier FR/EN/DE/NO et les pages publiques non migrées | Traductions humaines relues ; liens, anciennes URL et interactions conservés |
| **P4 — SEO** | Contrôler les réponses réelles et la découvrabilité | Canonical, hreflang, OG/Twitter, robots, sitemap, RSS, redirections et 404 validés |
| **P5 — Maintenance** | Supprimer les dettes démontrées, réduire les contrats fragiles | Build et tests reproductibles ; documentation sans doublon ; pas de régression legacy |

## P1 — Homepage React

Le footer Next partagé fournit maintenant **l’unique** bouton « retour en haut » (FR/EN/DE/NO). Les deux liens redondants de la Preview ont été supprimés. La copie « About » identifie Bababou sans reprendre l'ancien index d'un autre domaine. Les contrats de documentation ont été remis en cohérence avec les rubriques actuelles.

- [ ] Comparer visuellement `/` et les quatre Preview : ordre des 13 sections, navigation, 10 cartes/6 images, fallbacks, ancres, responsive, liens, RSS, thème, impression et volet About (liens Calendly/Ko-fi à activation volontaire). Les contrats source sont ajoutés ; **ce ne sont pas des preuves navigateur**.
- [x] **Statuer sur les 15 scripts historiques** avec `just homepage-runtime-parity` : six scripts ont déjà un équivalent partiel sur Next (icônes, thème, analytics, widgets), quatre sont maintenus sur HTML historique (traduction, D3, ARF, BetterStack), cinq n'ont pas d'utilité sur la Preview React (`obs-connection.js` est vide ; Turnstile sans formulaire serveur ; jQuery, Popper et Bootstrap remplacés par React/CSS). Aucun script tiers supplémentaire ni formulaire non protégé n'est ajouté à la Preview. Ce classement ne dispense pas de la recette navigateur ni de la revue de confidentialité.
- [ ] Faire la **revue éditoriale et de confidentialité** selon [publication-redaction.md](publication-redaction.md) : identifier les données officielles de mineure, localisations précises et assertions nominatives à ne pas republier. Valider les substitutions neutres avant de remplacer `/`.
- [ ] Après les validations P1–P4 et les gates de publication, obtenir une approbation explicite pour la bascule. **Ne pas supprimer `public/index.html`** ni les anciens documents avant cette décision.

## P2 — Accessibilité

- [ ] **Sélecteur de thème en haut à droite** : le contrôle Light/Dark/Auto commun à NRE et aux autres pages Next.js est fixé dans le coin supérieur droit et reprend les **segments arrondis** de la homepage historique (track/segments en pilule, état actif et tokens de couleur existants). Sur mobile, les trois segments deviennent des cercles de 44 px et restent accessibles. Le header réserve de la place au sélecteur de langue. L'impression reste dans le footer. Tests Playwright de géométrie/arrondi/interaction rédigés : **NOT_RUN**. Le changement de thème conserve maintenant un état mémoire temporaire si `localStorage` est bloqué, afin de synchroniser l'apparence et `aria-pressed`. Le test de rayon du rail accepte les variations de zoom/rem.

- [ ] Exécuter la suite Playwright sur **les quatre Preview** : axe WCAG 2.2 AA, clavier/focus et reflow 200 % (les scénarios sont déjà ajoutés à `tests/accessibility-*.spec.ts`). Corriger uniquement les échecs constatés.
- [ ] **Contraste du focus** : le contour partagé `--ui-focus-ring` utilise maintenant `--ui-text-primary` au lieu du bleu pâle `#9ec5fe` (faible contraste sur fond clair), en modes clair et sombre. Les contrôles de thème/impression utilisent déjà cette couleur. Contrat source ajouté ; **recette navigateur NOT_RUN**.
- [ ] **Contraste des segments actifs** : la vérification de tokens WCAG couvre maintenant le texte et le fond du segment sélectionné (en plus du segment inactif). Les scénarios de non-chevauchement et de forme vérifient aussi **320 px**, 375 px, 768 px et 1280 px. Playwright **NOT_RUN**.
- [ ] Compléter par une revue lecteur d'écran et contraste clair/sombre, tailles tactiles et images de secours ; valider sur Chromium, Firefox, WebKit et mobile.

## P3 — Traductions et pages

- [ ] **Parité du chrome HTML/Next** : 16 footers HTML harmonisés avec les actions Next (primaire/secondaire/outline), styles indépendants du chargement de Bootstrap grâce à `box-sizing: border-box`. **8/8 contrats Node PASS** et **28/28 vérifications Chrome locales PASS** sur sept pages HTML en clair/sombre à 320/1280 px. Les tests Playwright réutilisables couvrent aussi 375 px mais leur exécution complète contre les routes Next reste **NOT_RUN**. Le troisième lien « Central Authorities » conserve le style contour. La page de test charge les styles communs, les boutons FR sont traduits ; pas de remplacement de `/`.

- [x] **Contrôles communs localisés** : les libellés, noms accessibles et infobulles du sélecteur Light/Dark/Auto et du bouton Print/PDF utilisent maintenant les catalogues `site.displayControls` FR/EN/DE/NO. Aucun `lang="en"` imposé sur les pages non anglophones. **2/2 contrats Node PASS** dans un sandbox Node 24 et build Vercel exact-SHA READY ; tests navigateur Next et multilingues **NOT_RUN**.
- [ ] Vérifier la navigation FR/EN/DE/NO, les ressources juridiques et les métadonnées des pages migrées. Les extraits familiaux anglais conservent `lang="en"` ; ne jamais les traduire automatiquement pour publication.
- [ ] Planifier la migration des pages encore servies en HTML, après inventaire de leurs fonctionnalités et consentements. Conserver `people-contacted.html` (D3/ARF), `for-fathers.html` et `test.html` jusqu'à parité prouvée.

## P4 — SEO et confidentialité d'indexation

- [ ] Vérifier sur une Preview autorisée les canoniques, hreflang et `x-default`, métadonnées sociales, `robots.txt`, `sitemap.xml`, RSS, 404 et redirections historiques. 
- [ ] Contrôler l'exclusion de toutes les variantes `home-preview` du sitemap, y compris lors d'un import XML legacy. Un garde-fou source prend maintenant en compte les alias percent-encodés ; **les contrôles HTTP `noindex/nofollow/nosnippet` et `private/no-store` sont ajoutés à Playwright, mais restent NOT_RUN**.

- [x] **Nettoyer le sitemap hérité au niveau de la source** : sur 16 entrées XML actives, 14 désignaient des fichiers effectivement présents, une annonçait un document absent et une pointait vers un autre domaine. Le fichier public conserve uniquement les 14 URL publiables ; les commentaires qui révélaient des chemins de documents non publiés ont été retirés (historique Git conservé). L'import Next refuse aussi les fichiers absents, chemins hors `public/` et symlinks sortants. Tests P4 ajoutés (exécution complète **NOT_RUN**). Les URL Next sont ajoutées à part depuis leur registre.

- [x] **Bloquer l'analytics des pages de revue React** : `public/site-analytics.js` cesse toute initialisation directe sur `/home-preview` et ses variantes FR/EN/DE/NO, même avec le mode `full` ou une URL doublement encodée. Les files Vercel Web Analytics (`va`) et Speed Insights (`si`) reçoivent en outre un filtre `beforeSend` qui refuse les événements de la Preview lors des transitions SPA. **7/7 tests Node PASS** : script réellement exécuté dans une VM et événements Vercel simulés, sans émission réseau. Les autres pages gardent leurs statistiques. Audit réseau en navigateur réel **NOT_RUN**.

## P5 — Qualité et simplification

- [ ] **Supprimer le warning `cache-dir` restant** : l’installation de npm 12.2.1 est confirmée par la Preview exacte-SHA (`READY`, 81/81 pages) et `EBADENGINE` a disparu. L’avertissement npm `Unknown env config "cache-dir"` persiste. Identifier sa source Vercel sans désactiver les autres contrôles.
- [ ] Refactorer uniquement les scripts legacy encore utilisés (`site-widgets.js`, `theme-toggle.js`, `site-analytics.js`) ; préserver consentement et télémétrie existants.
- [ ] Préférer des tests comportementaux aux regex de source lorsqu'un vrai navigateur est disponible. Garder `justfile` canonique et `Makefile` compatible.
- [ ] Demander à l'opérateur d'installer lui-même les skills tiers `web-design-guidelines`, `frontend-design` et `security-audit-skill`. Évaluer Dagger/Context7 seulement avec des sources non privées et sans chantier d'agent disproportionné.

## Barrières de publication

**Local-first :** `just agent-local-tests` fonctionne sous Node 22/npm 10 pour les contrats sans dépendances ; le build complet requiert la toolchain verrouillée (Node 24/npm 12). Avant toute fusion/bascule, exécuter `just p0`, `just quality`, confidentialité/publication, BetterLeaks, SAST/SCA, Playwright/axe et ZAP sur le **SHA final**, sans désactiver les gates.

**Accès Vercel :** un statut `READY` confirme la compilation, pas les réponses HTTP ni WCAG. Le checkpoint Vercel 429 a historiquement bloqué les sondes : utiliser un accès de test autorisé, sans désactiver WAF/Deployment Protection.

**Gouvernance :** PR en Draft, pas de merge ou de promotion automatique ; ne pas qualifier de PASS un contrôle `NOT_RUN`. Les procédures sont dans [operations.md](operations.md), l'inventaire de parité dans [homepage-migration-parity.md](homepage-migration-parity.md) et les règles de confidentialité dans [publication-redaction.md](publication-redaction.md).

## Reprise après la fusion de #251 — 28 octobre 2026

La PR #251 a été fusionnée le 28 octobre 2026 à **07:57 UTC**. Le dernier commit de sa branche est `8538b4a790bc58544b906e21207337e7770f3fc4` (filtre `beforeSend` pour Vercel Analytics/Speed Insights) ; le merge sur `master` est `16982977d7d786d1612b1ec6c689d9faa34ce40f`. Le SHA `0826d5eb` de la synthèse précédente n'est plus le dernier état. **Ne pas réouvrir #251 ni annoncer sa version Draft.**

La [PR #252](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/252) est un suivi **Draft** limité aux preuves manquantes. Elle introduit `tests/home-preview-analytics-network.spec.ts` : quatre tests navigateur observent les requêtes vers Vercel Insights/Speed Insights et les domaines analytics sur les quatre Preview, y compris avec `?nablaEnableThirdParty=1`. Ils confirment aussi que le document Next et le script partagé se chargent, afin de ne pas considérer une page vide comme une preuve d'absence de tracking.

**Preuves :** analyse syntaxique TypeScript du nouveau scénario **PASS** ; exécution Playwright, inspection des requêtes réelles, transition SPA complète, axe, Firefox/WebKit, revue humaine et BetterLeaks/SAST/SCA/ZAP **NOT_RUN**. L'impossibilité de cloner le dépôt et l'absence d'un navigateur Playwright opérationnel dans cet environnement empêchent de présenter les contrôles comme exécutés. La Preview Vercel a précédemment répondu HTTP 429 ; ne jamais contourner WAF/Deployment Protection.

Reprise locale, sans Actions GitHub :

```bash
just agent-local-tests
npx playwright test tests/home-preview-analytics-network.spec.ts --project=chromium
npx playwright test tests/home-preview-analytics-network.spec.ts --project=firefox --project=webkit
npx playwright test tests/home-preview.spec.ts tests/accessibility-axe.spec.ts tests/next-seo.spec.ts
just p0
just quality
```

En cas d'échec, corriger le code ou le scénario démontré, conserver **NOT_RUN** pour les autres gates. Ne pas remplacer `/`, publier de nouvelles données familiales ni fusionner sans approbation explicite.

## Reprise des validations — 28 octobre 2026 (après fusion #251)

- **Base de référence :** PR #251 fusionnée, commit de fusion `16982977d7d786d1612b1ec6c689d9faa34ce40f`. Production Vercel `dpl_BBeytuULchKitzZodQoKWq7eSmay` READY. La PR #252 reste Draft : aucun remplacement de `/`.
- **Vérification HTTP réelle : BLOQUÉE.** Trois sondes Vercel authentifiées sur la production (`/home-preview`, `/en/home-preview`, `/robots.txt`) ont reçu **429 Vercel Security Checkpoint**, sans réponse applicative exploitable. Il ne s'agit ni d'un PASS SEO ni d'un échec confirmé du serveur Next. Le WAF et les protections ne sont pas modifiés.
- **Exécution navigateur Next : NOT_RUN.** Le dépôt est privé et son clonage sans identifiants dans un sandbox Vercel a échoué ; un navigateur Chromium est disponible dans l'environnement isolé, mais aucun checkout complet avec ses dépendances n'est accessible. Les scénarios de confidentialité réseau de `tests/home-preview-analytics-network.spec.ts`, axe et Firefox/WebKit restent à exécuter sur le SHA final.
- **Anomalie SEO corrigée dans #252 :** `lib/homePreviewSeoPolicy.mjs` ne détectait pas les alias doublement encodés, contrairement au garde analytics qui gère jusqu'à trois niveaux. Harmonisation du filtre et ajout de `unit-tests/homePreviewSeoPolicyEncoding.test.mjs` aux commandes locales `test:unit` et `test:agent-local`. **3/3 tests Node PASS** sur la copie isolée exacte des deux nouveaux fichiers, avec `node --check` sur les deux ; **suite intégrale NOT_RUN**. Aucun nouveau contenu n'est publié.

### Décision de bascule `/` — NO-GO

| Barrière | Preuve nécessaire | État |
| --- | --- | --- |
| Parité fonctionnelle React | Rendu et interactions des quatre Preview, comparaison à `/`, liens, galerie, impression, thème | NOT_RUN en navigateur Next |
| Accessibilité | axe WCAG 2.2 AA, clavier, zoom 200 %, Chromium/Firefox/WebKit et revue lecteur d'écran | NOT_RUN |
| SEO / indexation | HTTP 200/307/404 réels, canonical, hreflang, X-Robots-Tag, no-store, RSS et sitemap | BLOCKED 429 |
| Qualité et sécurité | `just p0`, `just quality`, BetterLeaks, SAST/SCA, ZAP au SHA final | NOT_RUN |
| Publication / vie privée | Revue éditoriale explicite des textes et images relatifs à une mineure | EN ATTENTE |

**Décision :** ne pas basculer `/`, ne pas supprimer `public/index.html`, ne pas contourner le WAF, ne pas fusionner automatiquement. Les tests automatisés présents ne constituent pas une attestation de conformité ou de confidentialité effective tant qu'ils ne sont pas exécutés contre un environnement rendu et autorisé.
