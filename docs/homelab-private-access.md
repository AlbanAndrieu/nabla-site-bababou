# Accès privé au homelab depuis Bababou

Variable serveur Vercel : `HOMELAB_TRUSTED_CIDRS=82.66.4.247/32` (type *sensitive*, Production, Preview et Development ; jamais `NEXT_PUBLIC_*`).

- Le proxy protège `/private`, `/private/*`, `/api/private` et `/api/private/*` en lisant `x-real-ip` depuis l'ingress Vercel, uniquement lorsque `VERCEL=1`. Configuration absente/invalide, IP inconnue ou non autorisée : **404 sans cache**.
- **Ne jamais placer des données sensibles dans `public/`, un bundle client, un artefact ou une page statique.** Les nouveaux handlers privés doivent aussi vérifier l'authentification/autorisation et renvoyer `Cache-Control: private, no-store`. Une adresse IP ne suffit pas à identifier une personne.
- Les pages publiques existantes restent publiques. Classer et déplacer toute ressource sensible vers un handler serveur privé avant de revendiquer sa confidentialité.
- Avec un proxy amont (Cloudflare par exemple), Vercel peut voir l'IP du proxy, non celle du client. Ne pas basculer sur `CF-Connecting-IP` ou la première valeur de `X-Forwarded-For` non vérifiée ; maintenir le refus d'accès. Voir [Vercel request headers](https://vercel.com/docs/headers/request-headers).
- Les mises à jour des variables Vercel requièrent un **nouveau déploiement** pour devenir effectives. Valider une requête depuis le homelab et une autre hors allowlist avant d'ajouter une donnée privée.
