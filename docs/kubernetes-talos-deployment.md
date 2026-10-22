# Bababou — préparation du déploiement Next.js sur Talos / TrueNAS

**Statut : préparé, non déployé.** Le domaine public [www.bababou.com](https://www.bababou.com/) reste sur Vercel. Aucun changement automatique de DNS, Cloudflare, pfSense, Traefik, certificats ou du cluster.

## Architecture et séparation des images

- Cluster Talos hébergé sur TrueNAS, control-plane `172.17.0.50`, workers `172.17.0.51` et `172.17.0.52`. Les préflights plateforme restent dans `nabla-compose/scripts/talos/`.
- `Dockerfile` + GHCR `ghcr.io/albanandrieu/nabla-site-bababou` : **fallback statique Nginx**, port 8080, inchangé.
- `Dockerfile.k8s` + GHCR **distinct** `ghcr.io/albanandrieu/nabla-site-bababou-next` : **application Next.js complète**, port 3000. `BABABOU_CONTAINER_BUILD=1` active `output: standalone` seulement dans cette image, sans toucher au build Vercel.
- `Dockerfile.k8s.dockerignore` : contexte de build limité aux sources publiques Next.js. Aucun fichier `.env*`, `.git`, fichier familial brut, configuration privée ou secret n'est autorisé dans le contexte.
- Namespace `nabla-site-bababou` avec Pod Security `restricted`. Deployment non-root UID/GID 10001, `readOnlyRootFilesystem`, seccomp `RuntimeDefault`, capacités supprimées, Service ClusterIP et Ingress Traefik HTTPS interne.
- Aucun PVC ni TrueNAS CSI/NFS nécessaire au démarrage : cache Next.js et `/tmp` utilisent des `emptyDir` bornés. Aucun stockage de secrets sur disque dans le dépôt.

## 1. Préparer l'image localement (aucun GitHub Actions)

Dans un **checkout complet et propre** de la révision à publier, avec Node 26.8.2, npm 12.2.0, Docker Buildx, BetterLeaks, Trivy et les dépendances déjà installées :

```bash
just k8s-contracts       # syntaxe shell + contrats du manifeste, hors ligne
just offline-l1          # syntaxe du diff + fichiers JSON
just k8s-build           # quality gate complète, BetterLeaks, build, Trivy, smoke localhost
```

`just k8s-build` **ne pousse pas l'image** et ne consomme aucune minute GitHub Actions. Un échec d'un contrôle arrête le build. Le builder utilise la même version Node que `.nvmrc` et npm 12.2.0. La base Docker taguée et le fonctionnement de `npm ci --ignore-scripts` doivent être confirmés par un build réel avant homologation ; aucune preuve de build n'est déclarée ici.

Le push GHCR est **manuel**, après revue du contenu et du SHA Git, depuis une machine autorisée (authentification minimale `write:packages`). Exemple, sans automatisation :

```bash
SHA="$(git rev-parse HEAD)"
docker push "ghcr.io/albanandrieu/nabla-site-bababou-next:${SHA}"
# Récupérer ensuite le digest sha256 exact publié dans GHCR ;
# une image taguée, même par commit SHA, ne remplace pas le digest.
```

Si le package GHCR est privé, prévoir un `imagePullSecret` dans le namespace ou configurer l'accès au package avant déploiement ; ne pas enregistrer de token dans Git. **Le manifeste actuel n'injecte pas d'imagePullSecret** : l'acceptation runtime exige que le cluster puisse tirer cette image.

## 2. Préparer la plateforme privée

- Contrôler les trois nœuds Ready, `kubectl`, les politiques Pod Security et l'IngressClass `traefik` dans le cluster géré par `nabla-compose`.
- Préparer le namespace `nabla-site-bababou` avec labels `pod-security.kubernetes.io/{enforce,audit,warn}=restricted` et un Secret TLS `bababou-internal-tls` de type `kubernetes.io/tls`, provisionné par la gestion de secrets existante (Vaultwarden / opérateur). Vérifier expiration et SAN du certificat.
- Créer **uniquement après vérification** l'entrée DNS LAN privée candidate `bababou.int.albandrieu.com`, pointant sur l'Ingress interne. Vérifier la terminaison HTTPS et l'absence d'ouverture WAN. Le script refuse un host hors `*.int.albandrieu.com` et toute résolution DNS publique.
- **Important : le DNS privé n'est pas un contrôle d'accès.** Vérifier que le listener Traefik/HAProxy et les règles pfSense interdisent réellement les requêtes Internet, même si l'en-tête `Host` est forcé ; exiger redirection HTTP→HTTPS et certificat correspondant. `--apply` demande une attestation explicite supplémentaire `BABABOU_K8S_NETWORK_BOUNDARY_REVIEWED=true`.
- Le namespace et le certificat doivent exister avant le préflight ; cela permet d'éviter un apply initial qui activerait un Ingress non sécurisé.

## 3. Préflight, validation serveur et application manuelle

Depuis un poste ayant accès au cluster et après publication vérifiée de l'image **Next.js** :

```bash
export KUBECONFIG=/chemin/vers/kubeconfig-talos
export BABABOU_K8S_IMAGE='ghcr.io/albanandrieu/nabla-site-bababou-next@sha256:<64-caracteres-hex>'
export BABABOU_K8S_CONTEXT='admin@nabla-talos'

just k8s-render
bash scripts/k8s/deploy-bababou.sh --preflight
bash scripts/k8s/deploy-bababou.sh --server-dry-run

# Uniquement après revue du digest, DNS, TLS, privacy gate et préflight :
BABABOU_K8S_ALLOW_APPLY=true BABABOU_K8S_NETWORK_BOUNDARY_REVIEWED=true \\
  bash scripts/k8s/deploy-bababou.sh --apply
```

`--render` n'utilise ni kubectl ni réseau. `--preflight` reste en lecture seule : contexte kubeconfig explicite, IngressClass existante, namespace, Secret TLS, unicité du nom d'hôte et IP privées. `--server-dry-run` demande la validation Kubernetes sans persister. `--apply` exige les deux flags explicites d'autorisation et de revue LAN-only, en plus des mêmes contrôles. Ce flag est une attestation opérateur, **pas une preuve technique** de blocage WAN.

## 4. Critères d'acceptation et rollback

1. Image Next.js épinglée en **digest immutable**, scan Trivy HIGH/CRITICAL OK, privacy gate et quality locale complètes OK ; absence de données privées dans l'image et les logs.
2. Pod Ready non-root et namespace `restricted` ; URL privée HTTPS avec certificat vérifié et aucune exposition publique additionnelle.
3. Vérifier `/`, `/en`, `/de`, `/no`, pages légales, RSS, assets, redirections des anciennes routes, la vraie page 404 et les protections des chemins techniques. La configuration `vercel.json` ne s'applique **pas** à Kubernetes : contrôler sa parité comportementale séparément.
4. Exécuter Playwright et ZAP passif contre **l'adresse privée exacte**, sans publier les réponses HTTP contenant des données familiales. Maintenir les quality gates bloquantes et l'hébergement public Vercel.
5. Confirmer consommation CPU/mémoire/cache, journaux, disponibilité en cas de redémarrage et règles d'accès via Traefik/pfSense. Après un update, rollback manuel : `kubectl -n nabla-site-bababou rollout undo deployment/nabla-site-bababou` (préserver le ReplicaSet précédent), puis revérifier les probes et les routes.

**Non réalisés** : build Docker réel, push GHCR, DNS/TLS, dry-run serveur, application cluster, Playwright/DAST sur Talos. Le `nabla-compose` reste l'autorité de la plateforme ; une fois cette préparation validée, y intégrer le déploiement en GitOps déclaratif, puis seulement envisager une bascule de trafic.
