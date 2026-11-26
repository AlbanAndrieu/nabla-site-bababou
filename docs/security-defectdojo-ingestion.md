# DefectDojo — collecte privée et sélective des rapports Bababou

## Objectif et périmètre

Le serveur `https://defectdojo.int.albandrieu.com` demeure **interne**. Aucun nouvel endpoint Vercel, redirection, règle Cloudflare Access publique ni droit général GitHub ne lui est accordé. Un **collecteur interne séparé** tire exclusivement les artefacts GitHub Actions `master` de `AlbanAndrieu/nabla-site-bababou` et n'exporte que des findings préalablement minimisés. Le dépôt Bababou ne contient **aucun collecteur GitHub ni client d’import DefectDojo**. La collecte et l’import sont exclusivement confiés à `nabla-compose` ; Bababou produit les formats normalisés.

## Sources autorisées

| Source | Sélection et format | Ingestion par défaut |
| --- | --- | --- |
| `security-deep.yml` — `trivy-master-<run_id>` | `trivy-master.json` : seules vulnérabilités HIGH/CRITICAL du `package-lock.json`, pas de licences, chemins locaux, contexte ou SBOM | Oui, si `--ingest` explicitement approuvé |
| `security-deep.yml` — `nuclei-master-<run_id>` | SARIF dépouillé : ID, titre de template et gravité, sans URL, requête, réponse ou cookies | Seulement `DEFECTDOJO_ALLOW_NUCLEI=yes` |
| `production-dast.yml` — `zap-production-report` | Transformation du JSON ZAP en SARIF à catégories MEDIUM/HIGH **sans `instances`, URL, attaques ni requêtes HTTP** | Seulement `DEFECTDOJO_ALLOW_ZAP=yes` |

**Toujours refusés** : les artefacts de PR, BetterLeaks et ses éventuelles valeurs de secrets, rapports CodeQL contenant du code, Semgrep détaillé, SBOM complet, licence brute, Nuclei JSONL, corps HTTP ZAP, données privées et journaux homelab. **Ne pas donner de jeton Actions au service web DefectDojo** : il appartient uniquement au collecteur non privilégié.

## Exécution du collecteur (après fusion et configuration interne)

En lecture seule : `node scripts/security/defectdojo-pull-master.mjs --check`. Le collecteur GitHub App, sa gestion des secrets, les choix de scans et son mode import sont implémentés et validés uniquement dans `nabla-compose`. Les tests unitaires Bababou ne requièrent aucun secret. Nuclei et ZAP requièrent deux autorisations supplémentaires séparées ; **pas d'`auto_create_context`**. API TLS vérifiée, URL et repository codés explicitement dans le collecteur ; aucune exposition publique ou credential dans Git.

**Activation côté nabla-compose** (non effectuée ici) : prévoir un conteneur collecteur non-root, rootfs read-only, réseau egress limité à `api.github.com`, API DefectDojo et DNS interne ; jetons en secrets montés temporairement depuis Vaultwarden/secret store, pas dans Compose/YAML. Exécuter après la fenêtre des scans master, conserver seulement compteurs et identifiants de run, journaliser les imports acceptés, définir les droits spécifiques du produit/engagement et une politique de rétention. Tester la déduplication et les parsers `Trivy Scan`/`SARIF` sur un engagement de test avant activation périodique.

**Limitations** : le collecteur et les parseurs DefectDojo ne sont **pas testés contre votre instance interne**. Une acceptation HTTP par DefectDojo n'est ni une confirmation du traitement asynchrone ni une preuve de disparition des vulnérabilités. L'artefact ZAP source contient encore des données HTTP en stockage privé GitHub pendant sa rétention configurée : ne pas lui donner un accès GitHub global, revoir la rétention dans les réglages du dépôt. Aucun déploiement n'est réalisé sur le TrueNAS dans cette PR.

## Durcissement du collecteur (PR #233)

- **Propriété unique du collecteur** : sélection des runs, fraîcheur, authentification et téléchargement dans `nabla-compose`; seule la projection des rapports est maintenue ici.
- **Minimisation stricte** : la sortie ZAP/Nuclei est reconstruite sans source libre ni traces HTTP; les rapports de production restent protégés.
- **Limite opérationnelle** : les rapports ZAP de production ont une cadence indépendante des scans approfondis. Leurs SHAs peuvent donc différer, sans prétendre à une photographie uniforme du déploiement. Toujours conserver l'identifiant du run de chaque famille de scan. Le import effectif dans votre homelab reste à tester séparément, sans exposer DefectDojo publiquement.

## Compatibilité du collecteur Homelab — 19 octobre 2026

Le collecteur canonique cible est **`nabla-compose` PR #263**, avec GitHub App à token éphémère, collecte depuis TrueNAS et import `/api/v2/reimport-scan/` dans le LAN. Le collecteur Node de Bababou reste un **prototype autonome non déployé** : ne pas en faire un deuxième service ou une seconde source de vérité.

| Origine exacte | Artefact privé | Fichier | Format / scan type proposé | Restriction |
| --- | --- | --- | --- | --- |
| `security-deep.yml`, master réussi | `trivy-master-<run_id>` | `trivy-master.json` | `Trivy Scan` après projection stricte du lockfile | Seules vulnérabilités HIGH/CRITICAL, aucun SBOM/licence |
| `security-deep.yml`, master réussi | `nuclei-master-<run_id>` | `nuclei-master.sarif` | `SARIF` / outil `Nuclei` | Identifiant de règle et sévérité seulement, revalidation LAN |
| `production-dast.yml`, master réussi | `zap-production-safe-<run_id>` | `zap-production-safe.sarif` | `SARIF` / outil `ZAP` | Rapport sans URL, réponse HTTP, cookie ni titre libre ; filtre MEDIUM/HIGH |

**Important** : le collecteur `nabla-compose` existant est encore configuré uniquement pour `nabla-site-alban` et refuse globalement `SARIF`. Il faut ajouter une allowlist Bababou distincte (deux outils SARIF approuvés seulement), une identité GitHub App autorisée explicitement à lire le dépôt **privé** Bababou et un Engagement DefectDojo isolé. Ne jamais désactiver `defaultDeny`, importer le SARIF générique depuis d'autres producteurs, ni rediriger le jeton GitHub vers DefectDojo.

Le ZAP original `zap-production-report` reste un artefact de diagnostic privé créé par l'action ZAP, **non autorisé pour le collecteur**. Aucun scan additionnel n'est ajouté : la conversion intervient après le ZAP de production existant. L'import et le parseur de DefectDojo ne sont pas attestés tant que le collecteur TrueNAS n'a pas été testé sur un engagement de test ; l'upload d'un artefact SARIF n'est pas une preuve de finding valide.

**Décision du 19 octobre** : suppression du collecteur Node Bababou redondant. `scripts/security/defectdojo-report-sanitizers.mjs` exporte uniquement les fonctions de projection testables sans jeton. `nabla-compose` est la source de vérité pour un collecteur multi-dépôts.

## Actualisation — 23 novembre 2026 : Nuclei et ZAP (Site Alban #338)

Le job `nuclei-public` reste **dans `security-deep.yml`** et publie l'artefact déjà attendu `nuclei-master-<run_id>`, uniquement en **SARIF expurgé**. Contrairement aux anciennes descriptions, le titre libre d'une règle n'est plus exporté : **ID et sévérité seulement**. MEDIUM est conservé pour le suivi Bababou ; tout URL, nom, chemin, cookie et corps de réponse Nuclei reste éphémère. L'absence de templates YAML, l'échec du scanner et une mitigation WAF produisent `INCOMPLETE` et non une preuve « zéro finding ».

`production-dast.yml` enrichit désormais le même artefact `zap-production-safe-<run_id>` d'une vue HTML et d'un résumé Markdown calculés à partir du **SARIF déjà minimisé**, sans nouvelle sonde, sans rapport brut ni modification du type de scan de DefectDojo. Les chemins d'ingestion SARIF et l'allowlist des noms d'artefacts restent inchangés. **Exécution et import DefectDojo réels NOT_RUN** ; le collecteur et ses droits restent uniquement dans `nabla-compose`.
