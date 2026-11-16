# Audit du volume de code — Site Bababou

**Référence : arbre Git master du 14 novembre 2026 (SHA ae5f8f1f502a), volumes de blobs en KiB.** Les volumes ne sont pas une mesure du code exécuté ni des coûts Vercel. La nouvelle commande locale fournit les lignes physiques exactes au SHA examiné. Markdown, documents privés et fichiers PDF/Office ne sont pas inclus.

## Emplacements principaux

| Source | KiB avant exclusion de Pingendo | Analyse |
| --- | ---: | --- |
| public/ HTML/CSS/JS | 705,2 | Dont **147,4 KiB** de Pingendo/Bootstrap dans wireframe.css ; environ 557,8 KiB hors ce seul bundle |
| unit-tests/ | 645,6 | Contrats de qualité, périmètre important mais à conserver |
| scripts/ | 224,3 | Agents, CI, vérification sécurité, FinOps |
| app/ | 193,8 | Routes React/Next.js, dont NRE |
| messages/ | 177,4 | FR/EN/DE/NO, volume éditorial |
| lib/ | 172,6 | Domaine NRE, contenus légaux, accueil |
| .github/ (YAML/JSON) | 162,6 | CI/CD et sécurité |
| tests/ | 157,6 | Tests navigateur |
| components/ | 156,9 | Composants React et CSS modules |

**Attention :** public/wireframe.css représente **8 566 lignes** d'un ancien bundle Pingendo/Bootstrap v4.1.3. Il ne faut ni l'appeler code métier ni le supprimer sans inventaire des consommateurs et recette clavier/contraste/browsers.

## Sujets les plus concentrés (heuristique de chemins)

- **CI / qualité / sécurité** : workflow ci.yml de **42,8 KiB**, workflows post-merge, DAST/ZAP et scripts de publication. Priorité BB-02.
- **Accueil / migration React** : homeAudienceCopy.mjs de **28,1 KiB**, HTML historique index.html de **25,7 KiB** ; contrats SEO/privacy/SSG avant la bascule BB-04.
- **Autorités centrales / documents** : public/ca/demande-explications-autorites-competentes-fr.html de **57,6 KiB** ; archive judiciaire à conserver ; parité des treize correspondances BB-11.
- **NRE / visites** : app/[locale]/nre/page.module.css de **31,5 KiB et 1 082 lignes**, sections.tsx de **17,9 KiB**, tests/nre.spec.ts de **22,6 KiB** ; BB-06/09. Ne pas chevaucher la PR NRE en cours.
- **Politiques** : lib/publicPolicies.ts de **31,5 KiB / 569 lignes**, lib/legalPolicies.ts de **26,6 KiB / 497 lignes** ; séparer données des vues sans altérer les textes approuvés.

## Mesurer avant/après (BB-10)

- just code-footprint : affiche octets, lignes et classements par emplacement et sujet.
- just code-footprint 30 : affiche trente fichiers au lieu de quinze.
- node scripts/quality/source-footprint.mjs --json : rapport exploitable et horodatable dans un suivi de PR.
- node scripts/quality/source-footprint.mjs --include-third-party : inspecte séparément les gros bundles, si nécessaire.
- just code-footprint-test : tests locaux du classificateur et des frontières Git.

Les lignes proviennent uniquement des **fichiers Git suivis du worktree**, hors bundles tiers par défaut ; le rapport indique son SHA et le statut dirty. Aucun fichier non suivi, document PDF/Office, chemin privé ou contenu n'est exporté. Les sujets sont calculés depuis le chemin et peuvent comporter un groupe « Other ». Le baseline GitHub ci-dessus mesure des **octets**, pas des lignes inventées.

**Ordre recommandé :** résoudre BB-02 et les validations React BB-03, étudier ensuite le découplage du CSS hérité, puis les gros modules de politique/NRE. Maintenir les archives et les protections de publication en attendant le GO explicite.

## Comparaison inter-sites et recommandations BB-09 / BB-10 (14/11/2026)

Mesure **en octets de code source Git**, sans `public/`, documents, images, `node_modules`, messages i18n, skills ou fichiers générés ; mêmes exclusions pour les deux dépôts. Arbres de référence **Site Alban `ee020438bce9`** et **Bababou `f520bba6e70f`** ; ces chiffres mesurent les fichiers Git, **pas les lignes de code exécutées ni la consommation Vercel**.

| Répertoire | Site Alban | Bababou | Lecture |
| --- | ---: | ---: | --- |
| `app/` | 257 fichiers / 988 515 octets | 49 / 202 088 | Alban : forte concentration homelab et architecture |
| `unit-tests/` | 267 / 891 473 | 180 / 665 856 | Contrats utiles à conserver, dédoublonnage seulement après preuve |
| `lib/` | 98 / 401 360 | 22 / 178 381 | Bababou : politiques et textes d'accueil regroupés |
| `scripts/` | 56 / 237 007 | 52 / 229 658 | Volume proche ; mutualiser **les procédures**, pas les gates de confidentialité |
| `tests/` | 35 / 119 038 | 36 / 165 123 | Bababou investit davantage en tests navigateur |
| `components/` | 34 / 56 568 | 67 / 168 063 | Bababou : composants des documents et accueil |
| **Total sources suivies** | **760 / 2 715 015 octets** | **419 / 1 632 069 octets** | Comparaison indicative, pas score de qualité |

**Candidats de refactoring sur Bababou, sans modifier les pièces publiées** :

1. **BB-09 / PR #279** : `app/[locale]/nre/page.module.css` (**1 082 lignes**) ; segmenter par responsabilités (calendrier NRE, cartes, adaptation mobile, impression), après captures Playwright FR/EN/DE/NO, axe, RTL éventuel et comparaison CSS. La PR #279 retire d'abord Pingendo des seules routes React : ne pas mélanger ces changements avant sa recette.
2. **BB-10** : `lib/homeAudienceCopy.mjs` (**599 lignes**) ; séparer données de rédaction, variants i18n et sélecteurs de composants, avec invariants sur les titres, liens et traduction sans toucher aux dossiers privés.
3. **BB-01 / BB-10** : `lib/publicPolicies.ts` (**569 lignes**), `lib/legalPolicies.ts` (**497 lignes**) et `lib/privacyPolicy.ts` ; séparer structure et présentation **sans changer un seul énoncé juridiquement approuvé**. Vérifier les exports, les textes, l'indexation et la publication avant toute migration.
4. **BB-02 / BB-10** : maintenir les tests de confidentialité, `scripts/privacy-gate.ts` et `scripts/agent-quality-gate.sh`; réduire les doublons seulement avec tests de comportement et vérification des consommateurs.

**Coordination actualisée au 15 novembre 2026 :** la [PR #278](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/278) a été fusionnée le 14 novembre. La [PR #279](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/279) reste ouverte, en Draft, pour isoler CSS React et imprimer correctement en mode sombre. Recontrôler SHA/base et conflits avant fusion ; **aucun auto-merge**.

Les tailles exactes dépendent du SHA et des exclusions. `just code-footprint` sur une workstation avec checkout fournit la mesure locale avant/après. Les tests L3 et navigateur restent `NOT_RUN` tant qu'aucun rapport exact-SHA n'a été produit.


## Font Awesome — migration React préparée dans #279

L'inventaire Git contient **104 945 octets** répartis entre
`fontawesome.css`, `brands.css` et `solid.css`, et **214 376 octets**
de WOFF2. Les **sept autres styles historiques** précédemment importés
dans le layout totalisent **223 234 octets**. Le volume brut cumulé des
**dix CSS désormais déliés du layout React** est donc **328 179 octets
(320,5 Kio)**. Ce n'est ni un gain réseau mesuré ni une réduction de
consommation CPU Vercel : cache, compression et CSS bundlé doivent être
mesurés sur une Preview exact-SHA.

Dans la PR #279, le header, le footer, Contact, les liens, les pages
de paiement et les **pictogrammes** des correspondances publiées ont
été migrés vers `components/ui/Icon.tsx`, SVG locaux décoratifs.
Les pages juridiques conservent exactement leurs textes et leurs
pièces originales. Le layout React n'inclut plus les trois CSS
Font Awesome. Le script client `SiteWidgetsScript` transmet
`data-no-font-awesome`, une option déjà prise en charge par le
`public/site-widgets.js` conservé, et les deux boutons flottants
gardent un pictogramme natif de repli.

**Avant merge :** exécuter Node24/npm12, Stylelint, typecheck,
build, tests unitaires de non-réintroduction, Playwright FR/EN/DE/NO,
clavier, contraste, 320 px, impression, privacy/security, et analyser
les requêtes CSS/JS/WOFF2. Les HTML et ressources historiques
`public/` restent **inchangés**, utilisables pour rollback.
Statut d'exécution exact-SHA : **NOT_RUN**.

**404 hors ligne :** `app/404.module.css` n'avait plus de consommateur ; la source unique reste `public/404.html` pour Next et le fallback HTML. La 404 utilise désormais des polices système, un pictogramme SVG local et l'option `data-no-font-awesome` déjà supportée par le script historique. Le titre, le contenu, le statut 404, le lien d'accueil et les animations restent conservés. Une recette visuelle est requise avant fusion.
