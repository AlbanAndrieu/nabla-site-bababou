# Roadmap d'ingénierie — Site Bababou

**Réconciliée le 16 novembre 2026 ; lecture de l'état WAF Vercel ajoutée le 21 novembre.** Complément d'exécution de la [roadmap générale](roadmap.md) : **mêmes identifiants `BB-xx`, aucun second backlog**. Priorités et arbitrages sont exclusivement dans `docs/roadmap.md`. La référence post-fusion est `master@c1bdb4338bc1` ; toute validation de livraison doit être liée à son **SHA exact**, pas à cette référence historique.

## Ordre de travail approuvé

**BB-02 → BB-03 → BB-04 → BB-05 → BB-08 → BB-09**, puis BB-01/06/07/10/11. Le GO BB-04 requiert les contrôles préalables des contenus publiés BB-01, du budget BB-08 et de l'accessibilité/SEO BB-09, même si leur chantier complet est programmé plus tard.

## Protocole commun de livraison

Sur un checkout Git complet, isolé et en branche non protégée : `just toolchain-check`, `just docs-audit`, `just offline-l1`, `just offline-contracts`, puis les tests ciblés ; avant publication : `just p0`, `just quality-fix` si nécessaire, `just quality`, `just publish`, et enfin Preview, Playwright/axe, BetterLeaks, SAST/SCA/DAST suivant le scope. Ne jamais transformer une commande non exécutée en PASS. Voir [operations.md](operations.md) pour les niveaux L0–L3 et [script-ownership.md](script-ownership.md) pour le point d'entrée canonique.

| ID | Dépendances / travaux à produire | Critère vérifiable de clôture |
| --- | --- | --- |
| BB-02 | Valider la résolution du refus CodeQL `actions: read` au scope job après erreur GitHub `Resource not accessible by integration` (run 43868983937, 16/11/2026) ; solution runtime Docker ZAP #282 **fusionnée**, deux scans production valides le 17/11 (H0 M4 L4 I5) ; exploiter les quatre règles 10038, 10098, 10099, 90003 ; calibrer la CSP partielle, CORS, SRI et le plafond du crawler à 1 requête/s ; préparer le durcissement WAF sans confondre `log` avec `deny` ; l'utilisateur natif `zap` (uid=1000, HOME de l'image), un dossier de rapports temporaire 0770 appartenant au runner et au groupe 1000, précontrôle d'écriture sans secrets, sans produire ni publier les logs bruts ; échec confirmé sur Production DAST 43828120463 et 43943032647 (16/11/2026), sans désactiver les gates ; poursuivre CI Quality 43617606381 (QG_AUTOFIX_REQUIRED : saut de ligne final superflu dans `docs/code-hotspots.md`, normalisé dans #279), Post-merge 43617740843 (échec de vérification toolchain npm/Node), Production DAST 43617683573 (`PRODUCTION_ZAP_NO_REPORT`, exit 3 au démarrage) puis validations complètes | Rerun ZAP valide déjà obtenu 17/11, findings moyens à qualifier ; CodeQL avec autorisation toujours à prouver ; logs et correctifs exact-SHA, quality, privacy, secrets, SAST/SCA/DAST et navigateur sans passe-droit ; preuve WAF (règle, action, événement, rollback) |
| BB-03 | #270 **fusionnée** : recetter six cartes, AVIF, footer et quatre locales sur le code intégré | Preview exact-SHA, Playwright/axe, mobile/liens et confidentialité ; PR corrective Draft si besoin |
| BB-04 | Après BB-02/03, test verrou/SSG/SEO/rollback avec minimum BB-01, BB-08 et BB-09 ; ne pas activer Production | `just home-cutover-verify`, budget, a11y, accord GO explicite, smoke et rollback |
| BB-05 | Parité `/people-contacted` React **déjà fusionné** vs HTML ARF, `<details>`, cartes/liens ; garder les scripts historiques avant audit | Parité navigateur/axe/mobiles, données ARF conservées, GO distinct avant redirection |
| BB-08 | `just vercel-runtime-audit`, `just vercel-runtime-test`, CPU Fluid Active réel/mémoire/invocations dans Usage ; baseline minimale avant BB-04 | Mesures datées, écarts, seuils 50/75/90 %, sinon `NOT_MEASURED` |
| BB-09 | Codes CSS/SVG fusionnés #279 et traitement 404 #281 ; recetter les sept CSS historiques supprimés du layout Next et les trois CSS Font Awesome ; migrer les icônes TSX en SVG natifs et neutraliser la dépendance JS des widgets, avec impression native lisible même en mode sombre, suppression des anciennes classes Contact et migration des sélecteurs hors du CSS global ; contrôler chaque import CSS relatif pour éviter une nouvelle erreur Turbopack ; vérifier le retrait fusionné du CSS 404 orphelin et les polices système sans requêtes Google Fonts, avec contrat réseau et recette visuelle 404 ; palette native en parité avec les variables du thème historique, isoler contact dans un CSS Module et migrer le skip-link ; ajouter un CSS natif minimal et des tests Playwright Chromium–Firefox–WebKit, WCAG 2.2 AA, zoom, clavier, SEO/canonical/hreflang ; 3 nouvelles synthèses React de revue (`for-fathers`, `abduction-norway`, `abduction-germany`) sous noindex ; inventorier le contenu et les pièces sensibles des archives avant toute transcription/redirect | Absence de requêtes vers les sept CSS historiques et Font Awesome CSS/JS sur les routes React, compatibilité mobile/thèmes/impression ; rapport exact-SHA par route/localisation ; parité éditoriale et liens vérifiés, revue privacy et décision humaine avant indexation/redirection ; archives originales préservées |
| BB-01 | Inventaire en lecture seule des médias PDF/Office sous `public/`, liens documentaires, métadonnées et exposition CDN ; soumettre les décisions de publication sans modifier d'originaux | Liste classifiée (autorisé public / à caviarder / privé), arbitrage explicite, absence de fuite après éventuel retrait et purge |
| BB-06 | Croiser `data/nre-evidence.public.json`, `docs/nre-visit-ledger.md`, références `SITE-DOC-*` et 4 langues ; tester les PDF sources vs les HTML approuvés | Dates/heures documentées sans transformer une déclaration en fait judiciaire, tests NRE et autorités, impressions et focus contrôlés |
| BB-07 | Après BB-01, séparer corpus privé TrueNAS/Docling/OpenRAG et public Vercel ; tunnel, Access/MFA, ACL par pièce, revue humaine, durée courte et révocation | Tests refus sans session, signature JWT/iss/aud/exp, 401/403, absence de cache/lien public, caviardage irréversible, GO explicite |
| BB-10 | Inventaire `scripts/README.md` relié à `script-ownership.md` ; benchmark [inter-sites](code-hotspots.md) ; extraire progressivement les données de `homeAudienceCopy.mjs` (599 lignes) et `publicPolicies.ts` (569), puis classer les styles NRE 1 082 lignes avec BB-09. Ne toucher ni aux textes approuvés ni à la frontière confidentialité, et conserver les quality gates. | `just docs-audit`, `just code-footprint-test`, inventaire d'exports/références, tests exact-SHA des textes FR/EN/DE/NO et privacy, qualité locale ; aucun gain CPU annoncé avant mesure Vercel |
| BB-11 | Contrôle de la transcription JSX de la page approuvée `ca/demande-explications-autorites-competentes-fr.html` : 13 IDs, texte strictement identique, destinataires et liens PDF ; footer Contact/Calendly/GitHub | Contrat de parité textuelle, Playwright/axe/impression, contrôle des anciennes URL puis décision humaine avant redirection ou retrait d’archive |

## Séquences techniques par lot

### BB-01 — confidentialité et diffusion

Lire [publication-redaction.md](publication-redaction.md), [sitewide-document-access.md](sitewide-document-access.md) et [nre-evidence-openrag-access.md](nre-evidence-openrag-access.md). Comparer liens/objets **déjà accessibles**, scanner les métadonnées en environnement privé autorisé, rapporter les décisions en privé. Aucun retrait ni réécriture automatique d'un PDF, d'un document familial ou de l'ancien index.

### BB-02 — preuve de qualité

**Historique dépassé par les scans du 17/11 :** run Production DAST `43943032647` sur `master@c1bdb433` : précontrôle Vercel PASS, ZAP `exit 3` sans JSON ; PR Draft #282 propose un runtime Docker natif non privilégié, sans preuve de rerun. Run Security Deep `43868983937` : CodeQL refus d'accès Actions sur ancien SHA ; nouveau droit `actions: read` dans `master` sans exécution de validation. Smoke post-déploiement `43943032584` PASS ; Playwright Preview SKIPPED. Aucune des deux erreurs DAST/CodeQL ne doit être marquée résolue avant le rerun exact-SHA.

Réaliser les contrôles ciblés avant L3 ; pour les incidents CI suivre `workflow → job → step → première erreur`. Les indicateurs `skipped`, un déploiement `READY`, un test de structure et un log sans erreur ne sont pas interchangeables. Rejouer les vérifications après rebase/merge si le SHA change.

### BB-02 — contrôle WAF observé le 21 novembre 2026

Lecture seule de `nabla-site-bababou` (`prj_9eUAYmWQtHFIRKIOBYsumhU3QLU0`) via API Vercel, configuration `active` : `firewallEnabled=true`, protection des bots `challenge`, catégories CRS `gen`, `sqli`, `xss`, `rce` avec `active=true` et action `log` ; `rules=[]`, `ips=[]`. Les catégories `sd`, `sf`, `java`, `ma`, `rfi`, `php`, `lfi` restent inactives. La configuration était datée du 4 août : vérifier la fraîcheur et les événements, ne pas inférer un blocage SQLi/XSS/RCE ni une limite de débit à partir de cette lecture. Documentation de remédiation : [security-zap-waf-remediation.md](security-zap-waf-remediation.md).

**Raccordement H04 / Compose :** le module [`terraform/vercel-waf`](https://github.com/AlbanAndrieu/nabla-compose/tree/master/terraform/vercel-waf) de [Compose #433](https://github.com/AlbanAndrieu/nabla-compose/pull/433) est **déjà codé et fusionné, non appliqué**. Il demande SQLi/XSS/RCE `deny`, `gen=log`, bots `challenge` et **une règle** 300 requêtes/60 s/IP sur trois domaines publics, hors Preview. Le propriétaire du HCL et de l'état Garage reste Compose, et non Bababou. **Stop plan/forfait :** OWASP géré est documenté Enterprise par Vercel ; forfait et droits du projet sont `UNVERIFIED`. Le rate limit est disponible sur tous les plans, sous réserves de quota. Suivre le runbook Compose : inventaire, `import` préalable, `plan` et diff contrôlés, contrôle de l'éligibilité OWASP, GO dédié avant apply, surveillance événements/429 et rollback. Ici, exécuter **seulement** les tests applicatifs, `just waf-snapshot-test`, `just waf-snapshot-inventory <fichier>` et `just waf-snapshot-verify <fichier>` (exit 2 tant que non prouvé) sur un JSON de configuration conservé hors dépôt en 0600. Ne pas extrapoler `anomalies=[]` en absence de faux positifs. Le ZAP passif reste ≤1 req/s, sans bypass global GitHub Actions.

### BB-03 / BB-04 / BB-05 / BB-11 — parcours React

#270 est fusionnée le 14 novembre 2026 : la carte courte, les 3 liens du footer et deux nouvelles pages React sont préparées, tandis que les archives `.html` restent publiées. Les 13 messages français sont repris sans traduction ni modification du texte. La bascule `/` est une **décision distincte** ; son protocole exhaustif vit uniquement dans [homepage-react-cutover.md](homepage-react-cutover.md), et la matrice de fonctionnalités dans [homepage-migration-parity.md](homepage-migration-parity.md). Ne pas recopier ici la procédure de GO ni supprimer `public/index.html`.

### BB-06 / BB-07 — preuves et accès

Pour les déclarations NRE, distinguer les dates source, les occurrences générées à vérifier, les contacts effectifs et les heures estimées ; ne pas reconstituer des durées inconnues. Une page `/ca/*.html` approuvée est directement consultable ; **seul un document source** justifie une action de demande. La passerelle privée nécessite un modèle d'autorisation revu **avant** tout lancement.

### BB-08 — FinOps réel

Utiliser [vercel-finops.md](vercel-finops.md), `just vercel-runtime-audit` (artefacts du build, adapté de Site Alban) et les scripts `scripts/finops/`, sans exposer de token ni créer d'endpoint Vercel. `WINDOW_UNVERIFIED`, `STALE_USAGE` et `NOT_MEASURED` ne sont pas des valeurs CPU.

### BB-09 / BB-10 — industrialisation

Établir le tableau des routes i18n restant à couvrir, aligner les contrats qui doivent être communs avec Site Alban (quality gates, pre-commit, exact-SHA, security baselines) et conserver les protections propres à la confidentialité familiale. Le [répertoire des scripts](script-ownership.md) identifie les wrappers qui sont des alias et ceux qui ont une responsabilité distincte : ne pas supprimer une gate parce que son nom est voisin d'une autre.

## Qualification de l'état

- `CODE_MERGED` : changement identifié dans Git ; n'établit pas la validation.
- `PREPARED` : documentation/architecture/contrat présents sans recette complète.
- `PASS` : preuve reproductible sur SHA et environnement indiqués.
- `FAIL` : défaut observé ; `BLOCKED` : environnement/accès empêche la preuve ; `NOT_RUN` : pas d'exécution.
- `DONE` : critère de clôture et autorisation humaine satisfaits. Déplacer ensuite la trace dans l'archive ou se référer à la PR, sans garder un second item actif.

Pour la nouvelle étape BB-02, se référer exclusivement à [ZAP/WAF : triage et durcissement progressif](security-zap-waf-remediation.md). Ni le « Success » du job ni la simple présence d'une CSP minimale ne permettent de fermer les quatre alertes historiques.
