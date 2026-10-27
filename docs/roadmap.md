# Roadmap active — Site Bababou

**Mise à jour : 27 octobre 2026 · [PR #250](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/250) fusionnée · [PR #251](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/251) Draft.**

**État de clôture :** P2/P3 — styles et contrôles de source livrés ; P4 — sitemap statique nettoyé et import Next durci ; P1 — structure React disponible mais revue éditoriale et décision de publication en attente ; P2–P4 — validations navigateur HTTP 429 non réalisées ; P5 — warning npm `cache-dir` non résolu. Ne pas confondre compilation Vercel READY et validation d'une page servie.

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
- [ ] Vérifier les comportements non migrés des 15 scripts historiques avec `just homepage-runtime-parity`. Conserver D3/ARF, Turnstile et Google Translate sur les pages legacy ; n'ajouter aucune collecte ni script tiers automatique à React.
- [ ] Faire la **revue éditoriale et de confidentialité** selon [publication-redaction.md](publication-redaction.md) : identifier les données officielles de mineure, localisations précises et assertions nominatives à ne pas republier. Valider les substitutions neutres avant de remplacer `/`.
- [ ] Après les validations P1–P4 et les gates de publication, obtenir une approbation explicite pour la bascule. **Ne pas supprimer `public/index.html`** ni les anciens documents avant cette décision.

## P2 — Accessibilité

- [ ] **Sélecteur de thème en haut à droite** : le contrôle Light/Dark/Auto commun à NRE et aux autres pages Next.js est fixé dans le coin supérieur droit et reprend les **segments arrondis** de la homepage historique (track/segments en pilule, état actif et tokens de couleur existants). Sur mobile, les trois segments deviennent des cercles de 44 px et restent accessibles. Le header réserve de la place au sélecteur de langue. L'impression reste dans le footer. Tests Playwright de géométrie/arrondi/interaction rédigés : **NOT_RUN**. Le changement de thème conserve maintenant un état mémoire temporaire si `localStorage` est bloqué, afin de synchroniser l'apparence et `aria-pressed`. Le test de rayon du rail accepte les variations de zoom/rem.

- [ ] Exécuter la suite Playwright sur **les quatre Preview** : axe WCAG 2.2 AA, clavier/focus et reflow 200 % (les scénarios sont déjà ajoutés à `tests/accessibility-*.spec.ts`). Corriger uniquement les échecs constatés.
- [ ] **Contraste du focus** : le contour partagé `--ui-focus-ring` utilise maintenant `--ui-text-primary` au lieu du bleu pâle `#9ec5fe` (faible contraste sur fond clair), en modes clair et sombre. Les contrôles de thème/impression utilisent déjà cette couleur. Contrat source ajouté ; **recette navigateur NOT_RUN**.
- [ ] **Contraste des segments actifs** : la vérification de tokens WCAG couvre maintenant le texte et le fond du segment sélectionné (en plus du segment inactif). Les scénarios de non-chevauchement et de forme vérifient aussi **320 px**, 375 px, 768 px et 1280 px. Playwright **NOT_RUN**.
- [ ] Compléter par une revue lecteur d'écran et contraste clair/sombre, tailles tactiles et images de secours ; valider sur Chromium, Firefox, WebKit et mobile.

## P3 — Traductions et pages

- [ ] **Parité du chrome HTML/Next** : le sélecteur Light/Dark/Auto et l'impression partagent leurs tokens entre pages Next ; les actions Retour accueil / Retour haut sont alignées sur `components/ui/Action.module.css` dans les **16 pages HTML avec footer** (dont homepage `/`, pages D3 et anciennes URL conservées). Le troisième lien « Central Authorities » utilise le style `outline`. Contrats source, inventaire HTML récursif et Playwright ajoutés, **NOT_RUN**. La page HTML de test charge désormais le thème, les styles et l'impression communs ; les actions « Retour en haut » sont traduites sur les pages FR. Aucun remplacement de la homepage historique.

- [ ] Vérifier la navigation FR/EN/DE/NO, les ressources juridiques et les métadonnées des pages migrées. Les extraits familiaux anglais conservent `lang="en"` ; ne jamais les traduire automatiquement pour publication.
- [ ] Planifier la migration des pages encore servies en HTML, après inventaire de leurs fonctionnalités et consentements. Conserver `people-contacted.html` (D3/ARF), `for-fathers.html` et `test.html` jusqu'à parité prouvée.

## P4 — SEO et confidentialité d'indexation

- [ ] Vérifier sur une Preview autorisée les canoniques, hreflang et `x-default`, métadonnées sociales, `robots.txt`, `sitemap.xml`, RSS, 404 et redirections historiques. 
- [ ] Contrôler l'exclusion de toutes les variantes `home-preview` du sitemap, y compris lors d'un import XML legacy. Un garde-fou source prend maintenant en compte les alias percent-encodés ; **les contrôles HTTP `noindex/nofollow/nosnippet` et `private/no-store` sont ajoutés à Playwright, mais restent NOT_RUN**.

- [x] **Nettoyer le sitemap hérité au niveau de la source** : sur 16 entrées XML actives, 14 désignaient des fichiers effectivement présents, une annonçait un document absent et une pointait vers un autre domaine. Le fichier public conserve uniquement les 14 URL publiables ; les commentaires qui révélaient des chemins de documents non publiés ont été retirés (historique Git conservé). L'import Next refuse aussi les fichiers absents, chemins hors `public/` et symlinks sortants. Tests P4 ajoutés (exécution complète **NOT_RUN**). Les URL Next sont ajoutées à part depuis leur registre.

## P5 — Qualité et simplification

- [ ] **Supprimer le warning `cache-dir` restant** : l’installation de npm 12.2.1 est confirmée par la Preview exacte-SHA (`READY`, 81/81 pages) et `EBADENGINE` a disparu. L’avertissement npm `Unknown env config "cache-dir"` persiste. Identifier sa source Vercel sans désactiver les autres contrôles.
- [ ] Refactorer uniquement les scripts legacy encore utilisés (`site-widgets.js`, `theme-toggle.js`, `site-analytics.js`) ; préserver consentement et télémétrie existants.
- [ ] Préférer des tests comportementaux aux regex de source lorsqu'un vrai navigateur est disponible. Garder `justfile` canonique et `Makefile` compatible.
- [ ] Demander à l'opérateur d'installer lui-même les skills tiers `web-design-guidelines`, `frontend-design` et `security-audit-skill`. Évaluer Dagger/Context7 seulement avec des sources non privées et sans chantier d'agent disproportionné.

## Barrières de publication

**Local-first :** `just agent-local-tests` fonctionne sous Node 22/npm 10 pour les contrats sans dépendances ; le build complet requiert la toolchain verrouillée (Node 24/npm 12). Avant toute fusion/bascule, exécuter `just p0`, `just quality`, confidentialité/publication, BetterLeaks, SAST/SCA, Playwright/axe et ZAP sur le **SHA final**, sans désactiver les gates.

**Accès Vercel :** un statut `READY` confirme la compilation, pas les réponses HTTP ni WCAG. Le checkpoint Vercel 429 a historiquement bloqué les sondes : utiliser un accès de test autorisé, sans désactiver WAF/Deployment Protection.

**Gouvernance :** PR en Draft, pas de merge ou de promotion automatique ; ne pas qualifier de PASS un contrôle `NOT_RUN`. Les procédures sont dans [operations.md](operations.md), l'inventaire de parité dans [homepage-migration-parity.md](homepage-migration-parity.md) et les règles de confidentialité dans [publication-redaction.md](publication-redaction.md).
