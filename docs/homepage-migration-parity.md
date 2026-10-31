# Parité des deux pages React — référence opérationnelle

**Périmètre actuel (31 octobre 2026)** : code fusionné par la [PR #253](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/253). Ce document décrit les fonctions à préserver et les écarts de recette, non l'historique détaillé de chaque PR. La [roadmap](roadmap.md) donne les priorités ouvertes ; la [procédure de bascule](homepage-react-cutover.md) est la seule source des étapes d'activation et de retour arrière.

## Sources de vérité

| Fonction | Source |
| --- | --- |
| Site public historique, contenu et exceptions contrôlées par le propriétaire | `public/index.html` et ses fichiers `public/assets/` |
| Routage hybride et ancien accueil `/` | `proxy.ts`, `lib/homeCutoverPolicy.mjs` |
| Home React pour Éléonore | `app/[locale]/home-preview/page.tsx`, `components/home/ChildHomeSections.tsx` |
| Future Home publique, inactive par défaut | `app/[locale]/page.tsx` |
| Aide parentale et traduction | `app/[locale]/abduction/page.tsx`, `components/home/AbductionResources.tsx` |
| Langues et cartes FR/EN/DE/NO | `lib/homeAudienceCopy.mjs`, `i18n/routing.ts` |
| Illustrations et fallback en cas d'échec | `components/home/GalleryCardMedia.tsx`, `components/home/LegacyStoryGallerySection.module.css` |
| Sélecteur de langue, clavier et navigation | `components/RouteHeader.tsx`, `lib/mainContentRoute.mjs` |
| Contrats | `unit-tests/homeAudienceSplit.test.mjs`, `unit-tests/homeAudienceUx.test.mjs`, `tests/home-preview.spec.ts` et `tests/home-preview-analytics-network.spec.ts` |

## Parcours à comparer en navigateur

| Locale | Home personnelle — 5 cartes | Abduction — 7 cartes |
| --- | --- | --- |
| FR | `/home-preview` | `/abduction` |
| EN | `/en/home-preview` | `/en/abduction` |
| DE | `/de/home-preview` | `/de/abduction` |
| NO | `/no/home-preview` | `/no/abduction` |

L'alias `/fr/home-preview` doit rediriger vers `/home-preview`. Tant que la bascule n'est pas approuvée, les racines `/en`, `/de` et `/no` suivent le comportement historique. Le retour Abduction → Home doit revenir à la Preview avant GO, puis à la Home native après GO.

## Contrat de contenu

**Home — 5 cartes** : « My Dear Daughter » avec l'ouverture historique et les deux paragraphes, « Patience and hope », « A long search », « Daddy loves you more than yesterday and less than tomorrow », « People I contacted ». Vérifier la disponibilité du contact et des liens d'archives ; le récit de la recherche doit rester **historique**, sans localiser actuellement l'enfant.

**Abduction — 7 cartes** : sensibilisation à l'enlèvement d'enfants, lien de contact pour parents, ressources pour les pères, appels aux traducteurs norvégiens/suédois et allemands, notice de traitement des documents, explication de confidentialité. Vérifier les associations et les liens vers NRE/autorités centrales. Le contenu ne doit pas tirer de conclusion juridique sur un dossier individuel.

**Rendu historique à préserver** : bloc « My Dear Daughter » avec hiérarchie et pictogramme ; image `miss-and-love-you-quote.jpeg` intégrale (ratio conservé) ; drapeaux des traductions non rognés, image de « A long search », mode clair/sombre et responsive. Les illustrations locales doivent présenter une alternative visuelle si un chargement échoue.

**Écarts de publication à arbitrer** : l'ancien index contient des références d'identité et des cartes cartographiques que l'utilisateur a demandé à retrouver. Elles **ne sont pas reproduites** dans les nouvelles pages : publication soumise à revue ciblée, protection de la vie privée et autorisation explicite ; le fait qu'un élément apparaisse dans l'ancien index ne constitue pas un accord pour le dupliquer. Les noms réels, documents et preuves nominatives des pages juridiques restent dans leur régime de publication d'origine.

## Fonctions historiques à conserver ou vérifier

- Pages publiques `/people-contacted.html`, `/for-fathers.html` et anciens alias NRE ; routes Next localisées `/nre` et `/central-authorities` avec préfixe de langue lorsqu'il s'applique.
- PDF/impression de la page `/en/central-authorities` ; boutons « Back to Home » et « Back to Top » des pages historiques ; liens vers RSS `/feed.xml` et `/eleonore-feed.xml`.
- Traduction native des deux pages ; pas de dépendance à Google Translate pour le corps React. Les documents HTML historiques ou les destinations tierces peuvent rester en anglais si cette limitation est annoncée.
- Conserver les scripts tiers strictement nécessaires sur les routes legacy, sans les importer automatiquement dans React. L'inventaire de quinze scripts et les contrats associés restent consultables dans `scripts/quality/homepage-runtime-parity.mjs` et ses tests.

## Recette et acceptation

Valider successivement **contenu**, images chargées (`naturalWidth > 0`), liens/ancres, traductions, clavier, modes d'affichage, réseau et SEO. Ne pas déduire la parité du nombre de tests de source ni de la présence d'un fichier dans GitHub. Les contrôles Playwright sur Chromium/Firefox/WebKit, WCAG 2.2 AA et la revue éditoriale demeurent ouverts selon la [roadmap](roadmap.md).

Pour l'exploitation, les seules instructions de bascule sont dans [homepage-react-cutover.md](homepage-react-cutover.md). Pour les signatures d'incidents non déductibles du code, utiliser [operations.md](operations.md).

