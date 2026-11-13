# Roadmap générale — Site Bababou

**Réconciliation du 13 novembre 2026 — référence : `master@2ebb293691d1`.** Ce document contient **seulement les décisions et livrables ouverts**. La [roadmap d’ingénierie](engineering-roadmap.md) décrit les critères techniques, les commandes et les dépendances des mêmes identifiants `BB-xx` ; elle n'a pas son propre ordre de priorité. [Historique conservé](archive/roadmap-through-2026-11-13.md).

## État attesté et limites

- **Fusionné dans `master`** : migration préparatoire React, NRE et calculs prudents (#256, #258, #266), prérendu SSG NRE/juridique/paiement (#259, #260, #264), registre probatoire public et guide de demande (#262, #263, #268), contrôles FinOps et smoke (#265, #267), correction HTML public ≠ document source (#269). **Fusionné ne signifie pas validé en navigateur ni en production**.
- **PR [#270](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/270) Draft** : illustration et petite carte « Personnes contactées », nettoyage de l'accueil et sixième carte sur sa branche. `master` conserve pour l'instant la version précédente. les nouvelles routes React des contacts et de la demande d’explications sont **préparées dans #270**, mais les URLs HTML publiques n’ont pas basculé.
- **Homepage `/`** : toujours régie par `public/index.html` tant que les autorisations SHA-bound et le contrôle navigateur ne sont pas réunis. La préparation #266 et l'approbation éditoriale ne valent pas GO technique.
- **Documents privés** : aucune passerelle protégée Docling/OpenRAG/Cloudflare Access active. Un fichier déjà sous `public/` demeure public, même accompagné d'un pictogramme 🔒.
- **Validation et CPU** : état exact-SHA des gates Node 24/npm 12, Playwright, AppSec et consommation **Fluid Active CPU réelle** à mesurer ; ni `skipped`, ni `READY`, ni SSG n'attestent un PASS global ou des économies facturées.

## Sujets à prioriser

Les niveaux ci-dessous sont des **propositions**, à confirmer par le propriétaire. Une tâche n'est achevée qu'avec la preuve et la décision décrites dans la roadmap d'ingénierie.

| ID | Proposition | Livrable encore attendu | Situation / décision |
| --- | --- | --- | --- |
| **BB-01** | P0 · publication | Inventorier et classifier les PDF/Office et données sensibles déjà publics ; arbitrer caviardage, maintien ou retrait | **Ouvert** · décision humaine obligatoire avant tout retrait |
| **BB-02** | P0 · intégrité | Revalider qualité, secrets, privacy, SAST/SCA, accessibilité et DAST sur le SHA candidat puis après fusion | **À vérifier** · anciennes gates rouges/ignorées ne prouvent pas l'état courant |
| **BB-03** | P1 · expérience | Recetter la PR #270 : petite carte, AVIF, footer Contact/Calendly/GitHub et quatre langues | **Draft** · build et tests exact-SHA requis avant fusion |
| **BB-04** | P1 · décision de release | Préparer puis décider la bascule `/` React, avec verrou, SEO, rollback et budget Vercel | **NO-GO technique** · activation Production séparée |
| **BB-05** | P1 · migration | Recetter la route React `/people-contacted` : ARF versionné, arbre clavier, cartes regroupées et liens localisés ; décider le traitement de l’ancienne URL | **PREPARED dans #270** · ancienne page HTML conservée, parité navigateur en attente |
| **BB-06** | P1 · preuves | Revoir NRE (dates, contacts effectifs, heures), pages sources et `SITE-DOC-*` dans les quatre langues | **Implémentation partielle fusionnée** · vérification probatoire/UX restante |
| **BB-07** | P2 · accès privé | Construire ingestion privée Docling/OpenRAG et contrôle Cloudflare Access/MFA, ACL par pièce, approbation, révocation | **Non activé** · GO de sécurité et de publication requis |
| **BB-08** | P1 · FinOps | Mesurer le CPU Vercel équipe/projet et surveiller les routes dynamiques après réduction SSR ; seuils opérateur | **Scripts fusionnés** · valeurs CPU `NOT_MEASURED` |
| **BB-09** | P2 · homogénéité | Finaliser WCAG 2.2 AA, SEO/i18n FR/EN/DE/NO, liens cassés et contrôles multi-navigateurs sur les pages restantes | **À recetter** · preuves post-migration incomplètes |
| **BB-10** | P2 · dette d’ingénierie | Converger CI, scripts et diagnostics avec Site Alban, sans assouplir les protections | **En cours** · `justfile` canonique, archives et contrat documentaire préparés |
| **BB-11** | P1 · migration juridique | Vérifier la transcription React du fil « Demande d’explications » : 13 messages, texte identique, destinataires, PDF, footer 3 liens | **PREPARED dans #270** · archive approuvée maintenue ; navigateur, impression et GO de redirection en attente |

## Décisions à prendre avant l'exécution suivante

1. **BB-01** : quel périmètre d'originaux publics peut être audité, puis éventuellement retiré ou caviardé ? Aucune pièce n'est retirée automatiquement.
2. **BB-03 / BB-04 / BB-05 / BB-11** : recetter les 3 liens du footer et les 2 routes React dans #270, puis décider séparément leur fusion et les redirections après les gates complètes.
3. **BB-07** : autoriser seulement la conception, ou également la mise en œuvre de Cloudflare Access et de la passerelle privée.
4. **BB-08** : fournir une lecture Vercel Usage de la période facturée pour transformer `NOT_MEASURED` en mesure et fixer des seuils.

## Documents canoniques, sans duplication

- [Roadmap d'ingénierie](engineering-roadmap.md) : définition de terminé, commandes, dépendances, ordre d'exécution technique.
- [Runbook d'exploitation](operations.md) et [répertoire des scripts](script-ownership.md) : procédures et interfaces d'exécution.
- [Parité React](homepage-migration-parity.md) et [GO/NO-GO](homepage-react-cutover.md) : seule procédure de bascule/rollback.
- [Publication sûre](publication-redaction.md), [accès aux sources](sitewide-document-access.md), [preuve privée](nre-evidence-openrag-access.md) : frontières de confidentialité.
- [NRE](nre-visit-ledger.md) et [FinOps](vercel-finops.md) : règles métier et mesures.
- [Archive du backlog précédent](archive/roadmap-through-2026-11-13.md) : traces historiques, jamais autorité active.

**Règle de clôture :** chaque `BB-xx` est marqué terminé seulement lorsque les changements existent dans la branche prévue, les contrôles applicables sont prouvés sur le SHA exact, et les validations éditoriales/de publication requises sont explicites. Conserver `FAIL`, `BLOCKED` et `NOT_RUN` comme tels. Pas de merge, d'activation ni de suppression automatique.
