# Roadmap générale — Site Bababou

**Réconciliation du 14 novembre 2026 — statut post-fusion : `master@a5b7e2ad01ff`.** Ce document contient **seulement les décisions et livrables ouverts**. La [roadmap d’ingénierie](engineering-roadmap.md) décrit les critères techniques, les commandes et les dépendances des mêmes identifiants `BB-xx` ; elle n'a pas son propre ordre de priorité. [Historique conservé](archive/roadmap-through-2026-11-13.md).

## État attesté et limites

- **Fusionné dans `master`** : migration préparatoire React, NRE et calculs prudents (#256, #258, #266), prérendu SSG NRE/juridique/paiement (#259, #260, #264), registre probatoire public et guide de demande (#262, #263, #268), contrôles FinOps et smoke (#265, #267), correction HTML public ≠ document source (#269). **Fusionné ne signifie pas validé en navigateur ni en production**.
- **PR [#270](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/270) fusionnée le 14 novembre 2026** : illustration et petite carte « Personnes contactées », nettoyage de l'accueil, sixième carte et routes React des contacts et de la demande d’explications. La fusion ne prouve pas la parité navigateur, ni la redirection des anciennes URL HTML.
- **Homepage `/`** : toujours régie par `public/index.html` tant que les autorisations SHA-bound et le contrôle navigateur ne sont pas réunis. La préparation #266 et l'approbation éditoriale ne valent pas GO technique.
- **Documents privés** : aucune passerelle protégée Docling/OpenRAG/Cloudflare Access active. Un fichier déjà sous `public/` demeure public, même accompagné d'un pictogramme 🔒.
- **Validation et CPU** : Vercel Preview historique #270 `9df3ff37` READY avant fusion ; qualité GitHub, Node 24, Trivy et Playwright navigateur **à requalifier sur le SHA fusionné** (les échecs ou absences de preuve précédents ne prouvent pas le statut courant). La consommation **Fluid Active CPU réelle** reste à mesurer ; ni `skipped`, ni `READY`, ni SSG n'attestent un PASS global ou des économies facturées.

## Sujets à prioriser

**Ordre approuvé le 14 novembre 2026 : BB-02 → BB-03 → BB-04 → BB-05 → BB-08 → BB-09**, suivi de BB-01/06/07/10/11. L'ordre est maintenu sans abaisser les prérequis de confidentialité, d'accessibilité, de coût et de validation. Une tâche n'est achevée qu'avec la preuve et la décision décrites dans la roadmap d'ingénierie.

| ID | Proposition | Livrable encore attendu | Situation / décision |
| --- | --- | --- | --- |
| **BB-02** | **Rang 1 · Qualité et sécurité** | Corriger le job CodeQL (permissions de lecture Actions), les erreurs d'autofix, de test npm et de scanner ZAP, puis prouver toutes les gates au SHA final | **FAIL vérifié le 16/11/2026** · CodeQL configuration GitHub et ZAP démarrage ; correction CodeQL préparée, preuve de rerun requise ; aucune gate désactivée |
| **BB-03** | **Rang 2 · Recette PR #270** | Vérifier les six cartes, AVIF, footer, liens et traductions FR/EN/DE/NO | **CODE_MERGED** ; #270 fusionnée le 14/11, parcours navigateur/axe à valider sur SHA exact |
| **BB-04** | **Rang 3 · Bascule React** | Tester verrou SHA, SSG, 4 langues, SEO, rollback et prérequis transverses | **NO-GO** avant BB-02/BB-03 et minimum BB-01/08/09 ; activation humaine séparée |
| **BB-05** | **Rang 4 · Contacts React** | Recetter la parité React `/people-contacted` ↔ HTML historique, source ARF, liens/clavier | **CODE_MERGED** dans #270 ; archive conservée, redirection et archivage non autorisés |
| **BB-08** | **Rang 5 · FinOps Vercel** | Audit SSG/ISR/fonctions puis mesures réelles CPU/mémoire/invocations et seuils 50/75/90 % | **NOT_MEASURED** pour CPU ; baseline minimale nécessaire avant BB-04 |
| **BB-09** | P2 · homogénéité | Écarter le bundle Pingendo du runtime React ; finaliser WCAG 2.2 AA, SEO/i18n FR/EN/DE/NO ; recetter les nouvelles synthèses React `for-fathers` / `abduction-norway` / `abduction-germany` et poursuivre les transcriptions intégrales après revue privée des pièces | **PREPARED** · 3 routes React de revue non indexables, archives inchangées ; dix feuilles CSS historiques/tiers retirées du layout React, icônes SVG natives, impression native à palette papier indépendante du mode sombre, contact CSS Module avec carte isolée du global ; police Google Fonts de la 404 encore externe (migration locale après parité) ; tests navigateur non attestés |
| **BB-01** | P0 · publication | Inventorier et classifier les PDF/Office et données sensibles déjà publics ; arbitrer caviardage, maintien ou retrait | **Ouvert** · décision humaine obligatoire avant tout retrait |
| **BB-06** | P1 · preuves | Revoir NRE (dates, contacts effectifs, heures), pages sources et `SITE-DOC-*` dans les quatre langues | **Implémentation partielle fusionnée** · vérification probatoire/UX restante |
| **BB-07** | P2 · accès privé | Construire ingestion privée Docling/OpenRAG et contrôle Cloudflare Access/MFA, ACL par pièce, approbation, révocation | **Non activé** · GO de sécurité et de publication requis |
| **BB-10** | P2 · dette d’ingénierie | Comparer les volumes avec Site Alban ; refactorer l'accueil (`homeAudienceCopy.mjs`, 599 lignes), les politiques (`publicPolicies.ts`, 569 lignes), puis le CSS NRE (1 082 lignes, coordination BB-09), sans retoucher les énoncés approuvés ni les gates privacy | **En cours dans #278** · [audit et benchmark inter-sites](code-hotspots.md), tests de non-régression exact-SHA et recette BB-09 encore nécessaires |
| **BB-11** | P1 · migration juridique | Vérifier la transcription React du fil « Demande d’explications » : 13 messages, texte identique, destinataires, PDF, footer 3 liens | **PREPARED dans #270** · archive approuvée maintenue ; navigateur, impression et GO de redirection en attente |

## Prochaines étapes — ordre approuvé (sans déploiement implicite)

1. **BB-01** : quel périmètre d'originaux publics peut être audité, puis éventuellement retiré ou caviardé ? Aucune pièce n'est retirée automatiquement.
2. **BB-03 / BB-04 / BB-05 / BB-11** : recetter les 3 liens du footer et les 2 routes React fusionnées via #270, puis décider séparément les redirections et la bascule `/` après les gates complètes.
3. **BB-07** : autoriser seulement la conception, ou également la mise en œuvre de Cloudflare Access et de la passerelle privée.
4. **BB-08** : fournir une lecture Vercel Usage de la période facturée pour transformer `NOT_MEASURED` en mesure et fixer des seuils.

## Documents canoniques, sans duplication

- [Roadmap d'ingénierie](engineering-roadmap.md) : définition de terminé, commandes, dépendances, ordre d'exécution technique.
- [Runbook d'exploitation](operations.md) et [répertoire des scripts](script-ownership.md) : procédures et interfaces d'exécution.
- [Parité React](homepage-migration-parity.md) et [GO/NO-GO](homepage-react-cutover.md) : seule procédure de bascule/rollback.
- [Publication sûre](publication-redaction.md), [accès aux sources](sitewide-document-access.md), [preuve privée](nre-evidence-openrag-access.md) : frontières de confidentialité.
- [NRE](nre-visit-ledger.md) et [FinOps](vercel-finops.md) : règles métier et mesures.
- [Audit de volume et comparaison avec Site Alban](code-hotspots.md) : base chiffrée, hotspots, livrables BB-09/BB-10, coordination avec #279.
- [Archive du backlog précédent](archive/roadmap-through-2026-11-13.md) : traces historiques, jamais autorité active.

**Règle de clôture :** chaque `BB-xx` est marqué terminé seulement lorsque les changements existent dans la branche prévue, les contrôles applicables sont prouvés sur le SHA exact, et les validations éditoriales/de publication requises sont explicites. Conserver `FAIL`, `BLOCKED` et `NOT_RUN` comme tels. Pas de merge, d'activation ni de suppression automatique.
