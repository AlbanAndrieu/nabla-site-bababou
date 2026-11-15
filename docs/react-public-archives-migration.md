# Migration React des archives publiques : contacts et demande d’explications

**13 novembre 2026 — code préparé dans la PR #270 ; diffusion publique ancienne conservée pour rollback.** La [roadmap générale](roadmap.md) et la [roadmap d’ingénierie](engineering-roadmap.md) sont les références des priorités et critères communs. Ce document ne constitue pas un troisième backlog.

## Routes et frontières

| Page historique toujours présente | Nouvelle route React | Parité attendue |
| --- | --- | --- |
| `/people-contacted.html` | `/people-contacted`, `/en/people-contacted`, `/de/people-contacted`, `/no/people-contacted` | illustration, pays/groupes et cartes de contacts, liens externes autorisés, accès clavier à l'arbre |
| `/ca/demande-explications-autorites-competentes-fr.html` | `/ca/demande-explications-autorites-competentes-fr` et préfixes de locale | **13 messages** avec les mêmes ancres `email-*`, texte français strictement inchangé, destinataires, références PDF et liens de droit |

Les deux routes sont des pages Next `force-static`, sans requêtes à OpenRAG/TrueNAS ni endpoints SSR. Tant que la recette n’est pas complète, les anciennes URL `.html` demeurent accessibles et les nouvelles routes ne sont **pas promues en canonicals indexables**. La correspondance juridique n’est **pas traduite automatiquement** : la transcription française est étiquetée `lang=fr` sur chaque variante. Le site conserve le choix de langue pour le chrome public, mais pas pour les citations et correspondances.

### Contacts : une seule source de données

- `public/arf.json` reste la source publique versionnée ; `lib/peopleContactedPublic.ts` collecte uniquement des entrées existantes, échappe tous les textes via React et rejette les URLs non HTTP(S) ou avec identifiants intégrés.
- Un arbre HTML natif `<details>` remplace la dépendance runtime D3 v3. L'arborescence, les cartes regroupées par pays/institution et leurs liens demeurent consultables, y compris sans JavaScript client. Les appréciations dans `comment` sont des **déclarations du propriétaire**, pas des faits judiciaires.
- Les fichiers historiques `public/arf.js`, `public/people-cards.js`, `public/d3.v3.min.js` et `public/people-contacted.html` ne doivent **pas être supprimés** avant la recette de parité visuelle et fonctionnelle ; ils constituent le repli et peuvent être référencés ailleurs.

### Demande d'explications : fidélité probatoire

- `components/documents/PublishedAuthorityCorrespondence.tsx` est une **transcription JSX native**, produite depuis le contenu central du fichier HTML publié ; elle conserve exactement les textes, 13 identifiants `email-2026-*`, le tableau des destinataires et les documents/législations référencés. Les chemins relatifs des PDF ont été convertis en chemins publics absolus sous `/ca/`. Aucun `dangerouslySetInnerHTML` ni `iframe`.
- La feuille de style historique `public/ca/email-style.css` est réutilisée dans la route React par un `@import` **relatif au fichier source** (`../../../../public/ca/email-style.css`) pour que Turbopack la résolve au build. L’archive HTML continue de la charger publiquement via `/ca/email-style.css` ; aucun duplicata de règles n'est maintenu. Le contrat `publicReactMigrations.test.mjs` vérifie cette résolution et bloque les imports absolus de type URL HTTP.
- Le composant doit rester une photographie fidèle de la source approuvée. Les corrections éditoriales ou la publication de nouvelles pièces passent d'abord par une revue humaine ; ne pas modifier un témoignage ou un échange pour obtenir un meilleur rendu.
- Les originaux PDF référencés sont déjà publics. **Migrer leur page de présentation ne les rend pas privés** ; voir `publication-redaction.md` et `sitewide-document-access.md`.

## Footer commun

Le même trio de liens existe sur le footer partagé React de `home-preview`, sur les deux nouvelles pages et sur le footer HTML de `demande-explications-autorites-competentes-fr.html` :

- **Contact** : lien vers la route Next localisée (ou `/contact` sur l'archive).
- **Calendly** : `https://calendly.com/alban-andrieu`.
- **GitHub** : `https://github.com/AlbanAndrieu/nabla-site-bababou`.

Les liens externes sont protégés avec `rel="noopener noreferrer"`, avec intitulés accessibles. Ne pas republier les liens RSS dans le footer.

## Critères exact-SHA et procédure d'activation

Sur Node 24/npm 12, exécuter :

```bash
just docs-audit
node --test unit-tests/publicReactMigrations.test.mjs
npm run typecheck
npm run build
npm exec --no -- playwright test tests/react-migrations.spec.ts tests/people-contacted.spec.ts
just p0
just quality
```

Vérifier le manifeste de pré-rendu, les quatre langues, la navigation au clavier, 320/375 px, l'impression, les 13 ancres et les **textes identiques** du fil légal. Réécrire les tests historiques `tests/people-contacted.spec.ts` vers la route React **seulement lorsque le basculement est approuvé** ; garder une preuve de l'archive HTML avant suppression.

Après GO explicite et un déploiement Preview du SHA exact :
1. Ajouter des redirections permanentes uniquement depuis les deux anciennes URL `.html` vers les routes React approuvées, avec tests de canonicals, PDFs et liens historiques.
2. Revalider toutes les URL référencées depuis `central-authorities-documents`, le footer, les pages de contact et les anciennes cartes.
3. Retirer `d3.v3.min.js`, `arf.js`, `people-cards.js` **uniquement** lorsque l’inventaire des consommateurs prouve qu’ils n’ont plus d’autre usage.
4. Archiver les fichiers HTML originaux hors `public/` après accord éditorial et vérification des caches/indexations ; ne jamais supprimer ni modifier silencieusement une pièce probatoire.

**Statut : PREPARED, pas DONE.** Des tests statiques ou une build `READY` ne suffisent pas à valider la parité de rendu.


## Nouvelles routes React en revue — lot des trois articles historiques

Les contenus de `public/for-fathers.html`, `public/abduction-norway.html`
et `public/abduction-germany.html` sont proposés sous forme de **synthèses
React structurées**, **pas de transcriptions intégrales** :

| Archive historique maintenue | Routes de revue Next.js FR / EN / DE / NO |
| --- | --- |
| `/for-fathers.html` | `/for-fathers`, `/en/for-fathers`, `/de/for-fathers`, `/no/for-fathers` |
| `/abduction-norway.html` | `/abduction-norway` et variantes localisées |
| `/abduction-germany.html` | `/abduction-germany` et variantes localisées |

Pour `for-fathers`, les liens et illustrations des trois associations déjà approuvées sont réutilisés par le composant commun `LegacyAssociationsSection` : aucun duplicata éditorial des URLs ou ressources n'est créé.

Les pages de revue utilisent `force-static`, les catalogues
`messages/legacy-articles/{fr,en,de,no}.json`, des sections natives
accessibles, des liens vers les textes officiels et les pages Next existantes.
Elles sont accessibles depuis la route de revue `/abduction`.

**Protection avant GO :** `robots: noindex, nofollow`, header
`X-Robots-Tag: noindex, nofollow, nosnippet` et `Cache-Control: private,
no-store`, aucune entrée dans `NEXT_CANONICAL_SLUGS` ni le sitemap,
**aucune redirection des archives**. Les URL historiques et leurs originaux
restent inchangés. Une archive accessible sous `public/` reste publique.

**Parité non atteinte :** les transcriptions légales complètes, les pièces
listées dans les dossiers Norvège et Allemagne et les passages d'opinion de
l'article pour les parents ne sont pas automatiquement transposés ou
retraduits. La synthèse attribue les déclarations au propriétaire et évite
toute nouvelle conclusion judiciaire. Ne pas annoncer une migration
finalisée, retirer un document, ni activer une redirection avant l'inventaire
de l'ensemble du contenu, la vérification des droits de publication et
l'accord éditorial explicite.

Contrôles à effectuer sur le SHA final : test `routeRegistryContract.test.mjs`,
test navigateur `tests/legacy-article-review.spec.ts` FR/EN/DE/NO,
`npm run typecheck`, `npm run build`, privacy, axe, impression,
comparaison de contenu et de liens des trois archives, puis gate
`just publish`. En cas d'absence de checkout/outils, état **NOT_RUN**.

## Isolation CSS des routes React (BB-09)

**État préparé dans la PR #279, sous réserve des validations exact-SHA.**
Le layout Next `app/[locale]/layout.tsx` ne charge plus les sept
feuilles historiques suivantes :

| Ancienne feuille publique | Taille brute Git | Remplacement React |
| --- | ---: | --- |
| `wireframe.css` | 150 966 octets | `app/reset.css`, `app/native-foundation.css`, CSS Modules |
| `landing-sections.css` | 11 434 octets | `app/[locale]/contact/page.module.css` et CSS Modules existants |
| `style.css` | 9 921 octets | CSS Modules et composants Next existants |
| `theme.css` | 30 540 octets | `app/native-theme.css` (palette uniquement), `app/design-tokens.css` |
| `print.css` | 10 420 octets | `app/native-print.css` (A4, contrôle PDF, impression) |
| `site-content-page.css` | 2 275 octets | CSS Modules et fondation native |
| `page-layouts.css` | 7 678 octets | CSS Module `/contact`, reset natif |

Ces tailles sont des octets de fichiers bruts, **pas des économies
réseau, de CPU Vercel ou de bande passante démontrées**.

### Architecture

- Les quatre palettes (clair par défaut, sombre système, clair manuel,
  sombre manuel) restent synchronisées avec les variables originales
  de `public/theme.css` ; un contrat compare les définitions exactes.
- La page React `/contact` dispose d'une grille, de cartes, de focus
  et de styles imprimables dans son module CSS dédié ; les libellés
  et les coordonnées publiées sont inchangés.
- Le lien d'évitement clavier du chrome Next et les styles de
  typographie/listes/liens sont dans `app/native-foundation.css`.
- Les archives HTML, `public/index.html` et les sept fichiers CSS
  restent **inchangés et accessibles** pour les vérifications et le rollback.
- `print.css`, `site-content-page.css` et `page-layouts.css`
  ont été retirés du layout React. Les deux feuilles de mise en page
  ciblaient `body.site-content-page`, absent des routes Next ; les classes React
  nécessaires restent dans des CSS Modules. `app/native-print.css`
  fournit A4, styles d'impression, masquage du chrome, et le bouton
  `print-button` injecté par `public/site-widgets.js` sur `/email`.
- Seuls les trois CSS **Font Awesome** restent chargés par le layout Next ;
  les archives HTML continuent d'utiliser leurs feuilles et leur JS historiques.
  Leur retrait exige une migration des icônes et une recette visuelle.

### Critères de validation avant merge et publication

`unit-tests/cssToolchain.test.ts` vérifie la parité des palettes et
l'absence de liens vers les anciens CSS. `tests/native-react-css.spec.ts`
contrôle les requêtes réseau, la typographie, les liens contact,
les modes clair/sombre et l'impression. Les tests de contraste, impressions, thèmes auto,
accessibilité axe, 320 px et quatre langues restent requis :

```bash
node --import tsx --test unit-tests/cssToolchain.test.ts
npm run lint:css
npm run typecheck
npm run build
npm exec --no -- playwright test tests/native-react-css.spec.ts tests/priority-theme-visual.spec.ts
just p0
just quality
just publish
```

**Pas de GO automatique pour la homepage** : les contrôles qualité,
confidentialité, SEO, CPU Vercel et Preview exact-SHA doivent être
attestés. État actuel de la validation d'exécution : `NOT_RUN`.
