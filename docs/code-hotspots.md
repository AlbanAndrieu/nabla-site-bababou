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
