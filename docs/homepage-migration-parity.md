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
- La prévisualisation contient le message de présentation neutre, les liens publics et quatre blocs de contenu anglais migrés de `public/index.html` : ouverture, contact, lettre et avis final.
- Les quatre blocs de contenu anglais sont balisés `lang="en"` sur les quatre routes. Ne pas publier de traduction non relue.

## Registre de parité avant bascule

| Fonction de la page approuvée | Source | État Next |
|---|---|---|
| Message principal et sections de la homepage | `public/index.html` | Migration progressive. Texte d'accueil et autres sections à porter après revue |
| Ouverture et deux paragraphes d'accueil | `public/index.html` → `components/home/LegacyOpeningSection.tsx` | Texte anglais conservé ; H1 de la source converti en H2 dans la prévisualisation ; tests de parité et d'ordre |
| Message « A Message from Your Papa » | `public/index.html` → `components/home/LegacyMessageSection.tsx` | 3 paragraphes anglais migrés, sans réécriture ; contrôle de parité sur les textes ; traduction approuvée en attente |
| Avis « If you are Éléonore » et texte de bas de message | `public/index.html` → `components/home/LegacyFoundWebsiteSection.tsx` | Texte anglais existant migré sans modification ; ordre du document conservé ; section statique sans `role="alert"` pour éviter une annonce non sollicitée |
| Contact et lien mailto | `public/index.html` → `components/home/LegacyContactSection.tsx` | Première section reprise à l'identique (titre, adresse et message) avec test de parité ; traduction validée encore à faire |
| Introduction aux ressources juridiques | `public/index.html` → `components/home/LegacyLegalResourcesSection.tsx` | Paragraphe public et lien `/for-fathers.html` migrés ; les cartes contenant des identifiants, des lieux et des assertions sur des tiers restent hors de la prévisualisation | 
| Navigation « People I contacted » et « Central Authorities » | `public/index.html` → `LegacyPeopleSection.tsx` | Titres, description et liens migrés ; page D3/ARF historique conservée | 
| Associations soutenues | `public/index.html` → `LegacyAssociationsSection.tsx` | Trois liens publiés migrés ; images historiques non nécessaires aux liens fonctionnels | 
| Notice documentaire | `public/index.html` → `LegacyDisclosureSection.tsx` | Titre et deux paragraphes vérifiés à l'identique ; interaction native `details/summary`, cible tactile de 44 px, focus et survol ; navigateur NOT_RUN | 
| Navigation légale dans la prévisualisation | `public/index.html` → `LegacyFooterSection.tsx` | Cinq liens conservés, cibles vers `POLICY_PAGES.*.canonicalPath`, liste accessible et retour au contenu ; le footer Next global reste le seul pied de page du document | 
| Personnes contactées | `public/people-contacted.html`, D3/ARF | Lien conservé ; comportement interactif non migré |
| Informations pour les pères | `public/for-fathers.html` | Lien conservé ; contenu non migré |
| Flux RSS principal et dédié | `public/feed.xml`, `public/eleonore-feed.xml` | Flux existants conservés ; footer commun |
| Google Translate | `public/site-google-translate.js` | À conserver en fallback pour contenu sans traduction approuvée |
| Thèmes et animations | `public/theme-toggle.js`, CSS legacy | À vérifier sous clavier, contraste et reduced-motion |
| Scripts et intégrations de la homepage | `scripts/quality/homepage-runtime-parity.mjs` | Contrôle source des 15 scripts approuvés. Les fonctionnalités `partial` ou `pending` ne sont pas considérées comme migrées ; les nouveaux scripts demandent une mise à jour du registre |
| Widgets, statut, anti-robots | `public/site-widgets.js`, Turnstile, scripts legacy | À inventorier avant remplacement |
| Page expérimentale et script Mixpanel historique | `public/test.html`, `public/index.js` | Utilisé par `/test.html` : ne pas supprimer sans décision sur ce comportement et sa collecte |
| Analytics et médias externes | `public/site-analytics.js`, scripts du HTML legacy | À valider sans augmenter la collecte |
| 404 et URLs HTML historiques | `public/404.html`, `next.config.mjs` | À conserver jusqu'aux tests exact-SHA |
| Canonical, hreflang, OG/Twitter, sitemap | HTML legacy et métadonnées Next | À vérifier par locale avant indexation |
| Responsive, WCAG 2.2 AA et navigateurs | Page legacy, tests Playwright | À valider sur rendu réel avant bascule |

## Revue Vercel Web Interface Guidelines (24 octobre 2026)

- Référence : [web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) et [règles source](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md).
- La commande `npx skills use` a échoué dans l'agent avec `EAI_AGAIN` (DNS npm). Le contenu complet du skill et de ses règles a été lu via GitHub. Aucun répertoire `supporting-files` n'est indiqué par ce fichier source.
- `app/[locale]/home-preview/page.module.css` : améliorer le survol des liens, l'alignement des ancres et l'équilibre typographique des titres.
- `components/home/LegacyContactSection.module.css` : ajouter le retour visuel au survol, le touch-action et le scroll-margin pour les ancres.
- `components/home/LegacyMessageSection.tsx` : structure `section` + `blockquote` + titres cohérents. Conserver le texte approuvé même lorsque sa ponctuation ne suit pas les règles typographiques génériques.
- Vérifications ciblées : texte source identique, focus-visible présent et absence de `transition: all` ou `outline: none`.
- **NOT_RUN** : build complet, axe, contraste réel, lecteur d'écran et tests multi-navigateurs. La revue du code ne prouve pas la conformité WCAG.

## Audit interface — Vercel Web Interface Guidelines

Source de référence : `vercel-labs/agent-skills/skills/web-design-guidelines/SKILL.md` ; règles : `vercel-labs/web-interface-guidelines/command.md` (consultées le 24 octobre 2026).

- `app/[locale]/home-preview/page.module.css` : focus visible, liens avec état hover, `text-wrap: balance` et marges d'ancrage vérifiés sur la source.
- `components/home/LegacyContactSection.module.css` : lien mailto avec cible tactile, focus visible et hover vérifiés sur la source.
- `components/home/LegacyMessageSection.tsx` : structure sémantique et langue `en` vérifiées sur la source.
- `unit-tests/homepageMigrationContract.test.mjs` : corriger le contrôle du lien mailto après son extraction du composant `page.tsx` ; la route ne porte plus ce lien directement.
- État : revue **statique**, pas d'audit WCAG 2.2 AA réussi. Les vérifications clavier, lecteur d'écran, contraste, zoom et navigateurs restent nécessaires.

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

## État de fin de migration des sections sûres — 24 octobre 2026

Les blocs textuels publics sans données sensibles ont été portés dans la prévisualisation React, sans changer la page publique. La migration **complète** du HTML historique n'est pas attestée : les cartes contenant données personnelles ou accusations demandent une revue de publication ; D3/ARF, Turnstile, widgets, thème, traduction automatique, analytics et intégrations tierces doivent obtenir une équivalence testée avant bascule. Aucun test visuel, navigateur ou quality gate complète exécuté lors de ce lot.

## Contrat source des scripts — 24 octobre 2026

- Exécuter `just homepage-runtime-parity` pour comparer les inclusions de scripts de `public/index.html` au registre versionné.
- Le contrôle échoue si un script est ajouté, supprimé ou dupliqué sans réconciliation, ou si `/`, `noindex`, le drapeau de Preview ou la frontière analytics changent.
- Les 15 scripts connus comprennent Font Awesome, connexion, Turnstile, thème, Google Translate, analytics, D3, ARF, jQuery, Popper, Bootstrap, annonce de statut et widgets.
- L’état `partial` décrit seulement une partie du comportement ; `pending` signifie qu’aucune parité n’est revendiquée.
- Tests Node ciblés sur fixtures : 5/5 PASS. Les fichiers testés portent les empreintes SHA des fichiers publiés. Exécution sur le checkout complet et navigateur : NOT_RUN.
