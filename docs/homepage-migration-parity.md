# Parité de la homepage — migration Next.js

## Référence approuvée

- Source publique : `public/index.html`.
- Route publique actuelle : `/`, servie par la réécriture dans `proxy.ts`.
- Les routes locales `/en`, `/de` et `/no` convergent vers `/`.
- Le contenu, les disclosures et l'identité de la page publique restent sous contrôle du propriétaire.
- La migration n'autorise pas la publication de nouveaux documents familiaux ou juridiques.

## Prévisualisation non publique

- Route de travail : `/[locale]/home-preview` (`fr`, `en`, `de`, `no`).
- Drapeau serveur : `HOMEPAGE_PREVIEW_ENABLED=true`. Valeur absente ou différente : `notFound()`. Activer le drapeau avant de construire/démarrer le serveur de test ; un changement de variable après compilation peut nécessiter un nouveau build.
- SEO : `noindex, nofollow` et canonical `/`. Pas de déclaration sitemap ou hreflang pour la prévisualisation.
- La prévisualisation ne remplace pas `/`. Ne pas activer sur une production accessible au public avant revue.
- La prévisualisation contient le message de présentation neutre, les liens publics et quatre blocs de contenu anglais migrés de `public/index.html` : ouverture, contact, lettre et avis final. Les contrôles thème/impression sont maintenant natifs React ; le reste des scripts tiers n'est pas automatiquement activé.
- Les quatre blocs de contenu anglais sont balisés `lang="en"` sur les quatre routes. Ne pas publier de traduction non relue.

## Registre de parité avant bascule

| Fonction de la page approuvée | Source | État Next |
|---|---|---|
| Message principal et sections de la homepage | `public/index.html` | Blocs approuvés repris de manière partielle ; parité complète non attestée |
| Ouverture et deux paragraphes d'accueil | `public/index.html` → `components/home/LegacyOpeningSection.tsx` | Texte anglais conservé ; H1 de la source converti en H2 dans la prévisualisation ; tests de parité et d'ordre |
| Message « A Message from Your Papa » | `public/index.html` → `components/home/LegacyMessageSection.tsx` | 3 paragraphes anglais migrés, sans réécriture ; contrôle de parité sur les textes ; traduction approuvée en attente |
| Avis « If you are Éléonore » et texte de bas de message | `public/index.html` → `components/home/LegacyFoundWebsiteSection.tsx` | Texte anglais existant migré sans modification ; ordre du document conservé ; section statique sans `role="alert"` pour éviter une annonce non sollicitée |
| Contact et lien mailto | `public/index.html` → `components/home/LegacyContactSection.tsx` | Première section reprise à l'identique (titre, adresse et message) avec test de parité ; traduction validée encore à faire |
| Introduction aux ressources juridiques | `public/index.html` → `components/home/LegacyLegalResourcesSection.tsx` | Paragraphe public et lien `/for-fathers.html` migrés ; les cartes contenant des identifiants, des lieux et des assertions sur des tiers restent hors de la prévisualisation | 
| Navigation « People I contacted » et « Central Authorities » | `public/index.html` → `LegacyPeopleSection.tsx` | Titres, description et liens migrés ; page D3/ARF historique conservée | 
| Associations soutenues | `public/index.html` → `LegacyAssociationsSection.tsx` | Trois liens et trois SVG locaux restaurés en React ; texte accessible permanent et fallback monogramme en cas de 404 (navigateur NOT_RUN) | 
| Notice documentaire | `public/index.html` → `LegacyDisclosureSection.tsx` | Titre et deux paragraphes vérifiés à l'identique ; interaction native `details/summary`, cible tactile de 44 px, focus et survol ; navigateur NOT_RUN | 
| Navigation légale dans la prévisualisation | `public/index.html` → `LegacyFooterSection.tsx` | Cinq liens conservés, cibles vers `POLICY_PAGES.*.canonicalPath`, liste accessible et retour au contenu ; le footer Next global reste le seul pied de page du document | 
| Personnes contactées | `public/people-contacted.html`, D3/ARF | Lien conservé ; comportement interactif non migré |
| Informations pour les pères | `public/for-fathers.html` | Lien conservé ; contenu non migré |
| Flux RSS principal et dédié | `public/feed.xml`, `public/eleonore-feed.xml` | Flux existants conservés ; footer commun |
| Google Translate | `public/site-google-translate.js` | À conserver en fallback pour contenu sans traduction approuvée |
| Thème et impression | `public/theme-toggle.js`, `public/site-widgets.js` | Contrôles React sans dépendance tierce dans `HomePreviewControls.tsx` : clair, sombre, automatique, conservation `site-theme-preference`, réaction au thème système et `window.print()`. Pas de changement à `/` ; contrat Node intégré, Playwright ajouté mais **NOT_RUN**. |
| Anciennes dépendances de mise en page | jQuery, Popper, Bootstrap 4 | Les contrôles approuvés de la Preview utilisent React, CSS, `details/summary` et liens natifs ; aucune de ces trois bibliothèques n'est injectée dans la Preview. La parité navigateur reste `NOT_RUN`. |
| D3/ARF, personnes contactées | `public/people-contacted.html`, `arf.js`, `d3.v3.min.js` | Les liens vers la page historique restent présents. Déplacer le contenu nominatif vers React nécessite une revue spécifique ; **pas de suppression legacy**. |
| Anti-robot Turnstile | Script externe de `public/index.html` | La Preview approuvée n'a **pas** de formulaire soumis au serveur : le contact est un `mailto:`. Ne pas injecter Turnstile sans action serveur à protéger. |
| Traduction automatique | `public/site-google-translate.js` | Maintenue sur les pages legacy en attendant des traductions humaines relues. La Preview n'injecte pas Google et ne transmet pas son DOM à un service tiers sans choix explicite. |
| Widgets tiers | BetterStack, Axeptio, Intercom, Ko-fi | Pas de chargement automatique supplémentaire dans la Preview. La décision sur consentement, utilité et parité des intégrations restantes est encore ouverte. |
| Scripts et intégrations de la homepage | `scripts/quality/homepage-runtime-parity.mjs` | Contrôle source des 15 scripts approuvés. Les fonctionnalités `partial` ou `pending` ne sont pas considérées comme migrées ; les nouveaux scripts demandent une mise à jour du registre |
| Widgets, statut, anti-robots | `public/site-widgets.js`, Turnstile, scripts legacy | À inventorier avant remplacement |
| Page expérimentale et script Mixpanel historique | `public/test.html`, `public/index.js` | Utilisé par `/test.html` : ne pas supprimer sans décision sur ce comportement et sa collecte |
| Analytics et médias externes | `public/site-analytics.js`, scripts du HTML legacy | À valider sans augmenter la collecte |
| 404 et URLs HTML historiques | `public/404.html`, `next.config.mjs` | À conserver jusqu'aux tests exact-SHA |
| Canonical, hreflang, OG/Twitter, sitemap | HTML legacy et métadonnées Next | À vérifier par locale avant indexation |
| Responsive, WCAG 2.2 AA et navigateurs | Page legacy, tests Playwright | À valider sur rendu réel avant bascule |

## Contrats d'interface — preuves requises

Références : le skill versionné `.agents/skills/web-design-guidelines/SKILL.md` et les [règles Vercel](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md). Les états source (focus visible, survol, `text-wrap`, `scroll-margin`, cibles tactiles et `lang="en"`) disposent de contrôles dans `unit-tests/homepageMigrationContract.test.mjs`, `unit-tests/homepageAssociationsParity.test.mjs` et `unit-tests/mainContentRoute.test.mjs`.

Le header Next gère l'unique lien d'évitement avant la navigation. Les trois SVG des associations ont un monogramme local de repli si l'image échoue. Les tests Playwright correspondants sont dans `tests/home-preview.spec.ts` et `tests/accessibility-keyboard.spec.ts`.

**Limite :** lecture de source et contrats Node ne valent pas validation WCAG ou parité navigateur ; l'état des validations appartient au rapport de PR portant le SHA effectivement testé.

## Critères de bascule

1. Valider chaque section et son texte avec le propriétaire.
2. Vérifier le contenu sur quatre langues.
3. Vérifier les liens et comportements hérités.
4. Vérifier axe, clavier, contraste, zoom 200 % et reduced-motion.
5. Vérifier la navigation mobile et plusieurs navigateurs.
6. Vérifier canonical, hreflang, sitemap, robots et OpenGraph sur la cible.
7. Exécuter les tests de confidentialité sur la Preview exacte-SHA.
8. Exécuter Playwright et ZAP sur cette même Preview.
9. Approuver explicitement le remplacement de `/`.

Ne pas retirer `public/index.html` et ses ressources avant l'approbation. Ne pas supprimer Google Translate comme fallback.

## Inventaire et limites de parité

Exécuter `just homepage-runtime-parity` pour contrôler les 15 inclusions de scripts de `public/index.html`. Le contrat échoue en cas d'ajout, suppression, doublon ou modification des gardes `/`, `HOMEPAGE_PREVIEW_ENABLED`, `noindex` et de l'analytics partagé. Les états `partial` et `pending` décrivent **des comportements non validés**, pas des lots migrés.

D3/ARF, Turnstile, Google Translate, widgets, thème, analytics et médias tiers doivent faire l'objet de tests fonctionnels explicites avant bascule. Les cartes avec données personnelles, localisations ou affirmations sur des tiers restent exclues de la Preview jusqu'à [revue de publication](publication-redaction.md). Conserver le corpus public approuvé sans duplication.

Pour l'exécution des tests, les incidents et la recette Preview exact-SHA, consulter [operations.md](operations.md). Les travaux encore ouverts sont dans [roadmap.md](roadmap.md).
