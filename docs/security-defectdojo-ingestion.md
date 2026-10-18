# DefectDojo — collecte privée et sélective des rapports Bababou

## Objectif et périmètre

Le serveur `https://defectdojo.int.albandrieu.com` demeure **interne**. Aucun nouvel endpoint Vercel, redirection, règle Cloudflare Access publique ni droit général GitHub ne lui est accordé. Un **collecteur interne séparé** tire exclusivement les artefacts GitHub Actions `master` de `AlbanAndrieu/nabla-site-bababou` et n'exporte que des findings préalablement minimisés. Le script `scripts/security/defectdojo-pull-master.mjs` prépare cette connexion, sans l'exécuter sur le TrueNAS.

## Sources autorisées

| Source | Sélection et format | Ingestion par défaut |
| --- | --- | --- |
| `security-deep.yml` — `trivy-master-<run_id>` | `trivy-master.json` : seules vulnérabilités HIGH/CRITICAL du `package-lock.json`, pas de licences, chemins locaux, contexte ou SBOM | Oui, si `--ingest` explicitement approuvé |
| `security-deep.yml` — `nuclei-master-<run_id>` | SARIF dépouillé : ID, titre de template et gravité, sans URL, requête, réponse ou cookies | Seulement `DEFECTDOJO_ALLOW_NUCLEI=yes` |
| `production-dast.yml` — `zap-production-report` | Transformation du JSON ZAP en SARIF à catégories MEDIUM/HIGH **sans `instances`, URL, attaques ni requêtes HTTP** | Seulement `DEFECTDOJO_ALLOW_ZAP=yes` |

**Toujours refusés** : les artefacts de PR, BetterLeaks et ses éventuelles valeurs de secrets, rapports CodeQL contenant du code, Semgrep détaillé, SBOM complet, licence brute, Nuclei JSONL, corps HTTP ZAP, données privées et journaux homelab. **Ne pas donner de jeton Actions au service web DefectDojo** : il appartient uniquement au collecteur non privilégié.

## Exécution du collecteur (après fusion et configuration interne)

En lecture seule : `node scripts/security/defectdojo-pull-master.mjs --check`. Le collecteur exige `GH_TOKEN` avec permission **Actions:read uniquement sur ce repository**. `--collect` télécharge les 3 artefacts approuvés et ne conserve que des compteurs à l'écran ; les fichiers temporaires privés sont supprimés. Les rapports proviennent exclusivement de runs `master` réussis, avec branche et SHA complets vérifiés.

Pour importer, l'opérateur installe un jeton Dojo propre au produit avec la permission minimale de reimport sur un engagement identifié. L'appel `--ingest` exige **tous** `GH_TOKEN`, `DEFECTDOJO_API_TOKEN`, `DEFECTDOJO_ENGAGEMENT_ID` (ID numérique déjà créé), `DEFECTDOJO_INGEST_APPROVED=yes`. Sans cette approbation, aucune requête à DefectDojo n'est envoyée. Nuclei et ZAP requièrent deux autorisations supplémentaires séparées ; **pas d'`auto_create_context`**. API TLS vérifiée, URL et repository codés explicitement dans le collecteur ; aucune exposition publique ou credential dans Git.

**Activation côté nabla-compose** (non effectuée ici) : prévoir un conteneur collecteur non-root, rootfs read-only, réseau egress limité à `api.github.com`, API DefectDojo et DNS interne ; jetons en secrets montés temporairement depuis Vaultwarden/secret store, pas dans Compose/YAML. Exécuter après la fenêtre des scans master, conserver seulement compteurs et identifiants de run, journaliser les imports acceptés, définir les droits spécifiques du produit/engagement et une politique de rétention. Tester la déduplication et les parsers `Trivy Scan`/`SARIF` sur un engagement de test avant activation périodique.

**Limitations** : le collecteur et les parseurs DefectDojo ne sont **pas testés contre votre instance interne**. Une acceptation HTTP par DefectDojo n'est ni une confirmation du traitement asynchrone ni une preuve de disparition des vulnérabilités. L'artefact ZAP source contient encore des données HTTP en stockage privé GitHub pendant sa rétention configurée : ne pas lui donner un accès GitHub global, revoir la rétention dans les réglages du dépôt. Aucun déploiement n'est réalisé sur le TrueNAS dans cette PR.
