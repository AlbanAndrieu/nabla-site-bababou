# Archive — incident Vercel Security Checkpoint du 25 octobre 2026

> Observation datée conservée pour diagnostic, non état courant. [Runbook actif](../operations.md).

### Relevé après fusion du 25 octobre 2026 — challenge sur les sondes

- Fusion GitHub **#246** : `master@d07ede9fe34e0076f8578b9c13e294c0ca9ce74c`.
- Vercel production : déploiement `dpl_3kyxXPVor8zouZMnLqeYdyCDmDWH`, `READY`, Node 24.x, mêmes SHA et alias `bababou.com`/`www.bababou.com`. Statut GitHub `Vercel: success`.
- Accès automatisé au domaine et à l'URL de déploiement : `429 Too Many Requests`, page **Vercel Security Checkpoint**, y compris `/`, les index juridiques FR/EN/DE/NO, `robots.txt` et `sitemap.xml`. Cela interdit de confirmer les réponses applicatives ; ce n'est pas une preuve de panne du site pour les visiteurs.
- Regroupement Vercel des erreurs runtime sur 24 h : aucune erreur remontée. Lecture des logs `error/fatal` sur 30 min : aucun événement retourné. Ces absences ne démontrent ni disponibilité ni qualité de toutes les routes. Les logs plus anciens ne sont pas disponibles via la fenêtre de rétention Hobby.
- **Reprise :** utiliser un client et un moyen d'accès approuvés, exécuter le smoke read-only sur le **SHA servi**, recueillir les vrais codes HTTP, vérifier redirections, 404, SEO et confidentialité. Ne pas désactiver WAF/SSO/challenge ni faire de boucle de requêtes pour forcer un passage. Séparer les résultats navigateur, production Vercel, tests locaux et GitHub Actions.

