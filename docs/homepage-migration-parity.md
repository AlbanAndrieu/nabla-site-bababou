# Parité de la homepage — migration Next.js

## Référence approuvée

- Source publique : `public/index.html`.
- Route publique actuelle : `/`, servie par la réécriture dans `proxy.ts`.
- Les routes locales `/en`, `/de` et `/no` convergent vers `/`.
- Le contenu, les disclosures et l'identité de la page publique restent sous contrôle du propriétaire.
- La migration n'autorise pas la publication de nouveaux documents familiaux ou juridiques.

## Page de revue publique et non indexable

- Route accessible : `/home-preview` (fr, locale par défaut), `/en/home-preview`, `/de/home-preview`, `/no/home-preview`. `/fr/home-preview` redirige en 307 vers `/home-preview`.
- Aucun drapeau serveur n'est nécessaire pour consulter la route : le précédent verrou a été retiré à la demande du propriétaire, uniquement pour la revue de contenus déjà approuvés et non sensibles.
- SEO : `noindex, nofollow` et canonical `/`. Pas de déclaration sitemap ou hreflang pour la prévisualisation.
- La page de revue ne remplace pas `/`. Son HTML est public mais marqué `noindex, nofollow, nosnippet` (métadonnées et en-tête HTTP) et `Cache-Control: private, no-store`. Aucun contenu non approuvé ne doit être ajouté.
- La prévisualisation contient le message de présentation neutre, les liens publics et quatre blocs de contenu anglais migrés de `public/index.html` : ouverture, contact, lettre et avis final. Les contrôles thème/impression sont désormais partagés par le footer Next sur toutes les pages migrées, y compris la Preview ; le reste des scripts tiers n'est pas automatiquement activé.
- Les quatre blocs de contenu anglais sont balisés `lang="en"` sur les quatre routes. Ne pas publier de traduction non relue.

## Registre de parité avant bascule

| Fonction de la page approuvée | Source | État Next |
|---|---|---|
| Message principal et sections de la homepage | `public/index.html` | Structure React complète pour les contenus publiables ; textes sensibles caviardés, parité éditoriale intégrale non attestée |
| Ouverture et deux paragraphes d'accueil | `public/index.html` → `components/home/LegacyOpeningSection.tsx` | Texte anglais conservé ; H1 de la source converti en H2 dans la prévisualisation ; tests de parité et d'ordre |
| Message « A Message from Your Papa » | `public/index.html` → `components/home/LegacyMessageSection.tsx` | 3 paragraphes anglais migrés, sans réécriture ; contrôle de parité sur les textes ; traduction approuvée en attente |
| Avis « If you are Éléonore » et texte de bas de message | `public/index.html` → `components/home/LegacyFoundWebsiteSection.tsx` | Texte anglais existant migré sans modification ; ordre du document conservé ; section statique sans `role="alert"` pour éviter une annonce non sollicitée |
| Contact et lien mailto | `public/index.html` → `components/home/LegacyContactSection.tsx` | Première section reprise à l'identique (titre, adresse et message) avec test de parité ; traduction validée encore à faire |
| Introduction aux ressources juridiques | `public/index.html` → `components/home/LegacyLegalResourcesSection.tsx` | Paragraphe public et lien `/for-fathers.html` migrés ; les cartes contenant des identifiants, des lieux et des assertions sur des tiers restent hors de la prévisualisation | 
| Navigation « People I contacted » et « Central Authorities » | `public/index.html` → `LegacyPeopleSection.tsx` | Titres, description et liens migrés ; page D3/ARF historique conservée | 
| Associations soutenues | `public/index.html` → `LegacyAssociationsSection.tsx` | Trois liens et trois SVG locaux restaurés en React ; texte accessible permanent et fallback monogramme en cas de 404 (navigateur NOT_RUN) | 
| Notice documentaire | `public/index.html` → `LegacyDisclosureSection.tsx` | Titre et deux paragraphes vérifiés à l'identique ; interaction native `details/summary`, cible tactile de 44 px, focus et survol ; navigateur NOT_RUN | 
| Navigation légale dans la prévisualisation | `public/index.html` → `LegacyFooterSection.tsx` | Cinq liens conservés, cibles vers `POLICY_PAGES.*.canonicalPath`, liste accessible et retour au contenu ; le footer Next global reste le seul pied de page du document | 
| Appels aux traducteurs | `public/index.html` | Deux cartes dans la grille React commune `LegacyStoryGallerySection.tsx`, liens vers le contact ; accusations, données personnelles et lieux précis non recopiés. |
| Personnes contactées | `public/people-contacted.html`, D3/ARF | Lien conservé ; comportement interactif non migré |
| Informations pour les pères | `public/for-fathers.html` | Lien conservé ; contenu non migré |
| Flux RSS principal et dédié | `public/feed.xml`, `public/eleonore-feed.xml` | Flux existants conservés ; footer commun |
| Google Translate | `public/site-google-translate.js` | À conserver en fallback pour contenu sans traduction approuvée |
| Thème et impression | `public/theme-toggle.js`, `public/site-widgets.js` | Contrôles React partagés dans `components/SiteDisplayControls.tsx` via `app/components/Footer.tsx` : clair, sombre, automatique, conservation `site-theme-preference`, réaction au thème système et `window.print()`. Pas de changement à `/` ; contrat Node intégré, Playwright sur les pages Next et la Preview ajouté mais **NOT_RUN**. |
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

## Parité structurelle de la galerie — livraison de la PR #248

Le HTML historique présente un bandeau d'informations, une chronologie par pays et **dix cartes illustrées**. La page de revue React intègre maintenant :

- `LegacyFamilyFactsSection.tsx` : informations essentielles et contact, sans référence de passeport ni allégations sur des tiers.
- `LegacySiteAboutSection.tsx` : ancien volet About, accès Calendly et Ko-fi sous forme de liens activés volontairement, sans widgets externes chargés à l'ouverture.
- `LegacyJourneySection.tsx` : France → Norvège → Allemagne au niveau des pays, sans lieu précis, localisation actuelle présumée ni destination spéculative.
- `LegacyStoryGallerySection.tsx` : **dix cartes**, images locales pertinentes, appels aux traducteurs, liens internes et grille de 3/2/1 colonnes ; pas d'intégration tierce.
- `LegacyTranslatorHelpSection.tsx` est remplacé, pour éviter deux grilles de traducteurs superposées.

Ce travail **termine la parité des grandes structures publiques** (texte de présentation, contact, lettre, chronologie, grille, associations, documents, navigation et footer), **mais pas l'identité textuelle du corpus sensible**. La galerie précédente contenait un identifiant officiel de mineure, des références de localisation et des imputations sur des tiers ; ces contenus ne sont pas recopiés dans une nouvelle route publique. `public/index.html` reste consultable tant qu'une revue de publication n'autorise pas sa substitution. Ne pas décrire cette substitution rédactionnelle comme une copie littérale complète.

Pour les tests : `unit-tests/homepageGalleryParity.test.mjs`, `unit-tests/homepagePreviewLinks.test.mjs`, `tests/home-preview.spec.ts`. Les contrôles de source ne remplacent pas une recette Playwright réelle.

## Évolution de la PR #249

- Les **dix cartes** sont déclarées dans `lib/homeGalleryCatalog.mjs` et consommées par le composant React ; le même catalogue est vérifié par `homepage-preview-links.mjs`. Les ancres dynamiques, absentes des anciens contrôles statiques, sont maintenant auditées. `GalleryCardMedia.tsx` garantit un repli local sur erreur de chargement, sans nouvel appel réseau.
- Une navigation interne accessible dessert cinq sections de la homepage (récit, pays, cartes, contact, documents). Ses libellés utilisent `messages/homepage-preview/{fr,en,de,no}.json`, avec tests de complétude des locales et scénario navigateur.
- Le volet About conserve Calendly et Ko-fi **sous forme de liens explicites** sans widget chargé automatiquement.
- **Statut :** implémenté dans la PR en cours ; build Next et recette navigateur à vérifier au HEAD exact. Aucune suppression de `public/index.html`.

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

## Décisions sur les neuf scripts historiques absents de React

La présence d'un script dans `public/index.html` ne signifie pas qu'il faut le copier dans React. Le contrat `scripts/quality/homepage-runtime-parity.mjs` contrôle les quinze scripts d'origine et classe les neuf scripts jusque-là marqués « pending » :

| Décision | Scripts | Fonction garantie ou limite |
|---|---|---|
| **Conservé sur HTML historique** | `d3.v3.min.js`, `arf.js` | Le lien vers `/people-contacted.html` reste dans React ; le graphe et ses données ne sont pas dupliqués |
| **Conservé sur HTML historique** | `site-google-translate.js` | Texte source anglais déclaré avec `lang="en"` ; traductions humaines à relire avant publication |
| **Conservé sur HTML historique** | Widget BetterStack | Ne pas charger un tiers par défaut sur la Preview sans revue de consentement |
| **Non requis dans React** | `obs-connection.js` | Le fichier actuel est un placeholder sans effet (`void 0`) |
| **Non requis dans React** | Turnstile | Contact React par `mailto:` sans formulaire ni soumission serveur |
| **Non requis dans React** | jQuery, Popper et Bootstrap 4 | Navigation, disclosure et mise en page utilisent React, CSS et `details/summary` natifs |

**Important :** le nombre de scripts à décider passe à zéro, mais cela **ne valide pas** les textes sensibles, les parcours multilingues ni l'ergonomie des pages React. Les quatre dépendances conservées continuent de servir les routes historiques. La bascule de `/` requiert une validation de publication distincte.

## Inventaire et limites de parité

Exécuter `just homepage-runtime-parity` pour contrôler les 15 inclusions de scripts de `public/index.html`. Le contrat échoue en cas d'ajout, suppression, doublon ou modification des gardes `/`, `HOMEPAGE_PREVIEW_ENABLED`, `noindex` et de l'analytics partagé. Les états `partial`, `legacy-retained` et `not-required` documentent les limites de parité, les fonctionnalités conservées dans les anciennes pages et les scripts réellement dispensables. Ils ne constituent pas une validation de la migration des contenus.

D3/ARF, Turnstile, Google Translate, widgets, thème, analytics et médias tiers doivent faire l'objet de tests fonctionnels explicites avant bascule. Les cartes avec données personnelles, localisations ou affirmations sur des tiers restent exclues de la Preview jusqu'à [revue de publication](publication-redaction.md). Conserver le corpus public approuvé sans duplication.

Pour l'exécution des tests, les incidents et la recette Preview exact-SHA, consulter [operations.md](operations.md). Les travaux encore ouverts sont dans [roadmap.md](roadmap.md).
