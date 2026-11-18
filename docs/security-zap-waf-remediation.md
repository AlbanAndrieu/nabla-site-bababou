# ZAP, CSP, SRI et WAF — Bababou

Révision du 17 novembre 2026. Cette page documente **les alertes encore visibles**, les corrections progressives et les risques de blocage WAF. Elle ne contient ni requête HTTP brute, ni cookie, ni URL de pièces familiales.

## Preuves exact-SHA

- [Production DAST #44163310324](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/44163310324), SHA `d2367a7d0a88d32bbab5947028adbb31c02fc134` : ZAP **exit 0**, JSON valide, SARIF minimisé présent, **H0 / M4 / L4 / I5**. Un job vert sous la politique `WARN` n'est pas une remédiation.
- SARIF ne contient que les identifiants de règles **10038, 10098, 10099, 90003** : pas de réponses, de chemins, de cookies ni d'instances exploitables. Chaque suppression de finding exige une nouvelle preuve locale; ne jamais inventer de diagnostic HTTP.
- [Production DAST #44080102456](https://github.com/AlbanAndrieu/nabla-site-bababou/actions/runs/44080102456) retrouve les mêmes quatre catégories. ZAP Preview était `SKIPPED` le 17/11 ; aucun scan actif n'a été lancé par ces corrections.

## Matrice de remédiation

| Alerte | Mesure appliquée dans le code | Limite / preuve de clôture |
| --- | --- | --- |
| **10038 CSP absente** | `next.config.mjs` émet une CSP **enforced** minimale : `base-uri 'self'`, `object-src 'none'`, `frame-ancestors 'none'`. Politique complète distincte `Content-Security-Policy-Report-Only` pour revue legacy. | L'interdiction des scripts inline n'est **pas** appliquée. Établir la liste des dépendances, vérifier les retours, préférer nonce/hash et tester Next SSG. Un en-tête présent n'est pas une CSP XSS complète. |
| **10098 CORS** | Aucun `Access-Control-Allow-Origin: *` ajouté; contrat source vérifie Next, API de démonstration et fallback 404. | Le signal peut venir du CDN, d'un asset ou d'une réponse de passerelle. Reproduire **localement** avec origine non autorisée, requête préflight et credentials, puis corriger la couche exacte. Aucun bypass CORS global. |
| **10099 divulgation de code** | Les tests Preview `tests/source-disclosure.spec.ts` refusent `.git`, `.env`, workflows, scripts et code Python. La phrase de l'accueil historique reste inchangée. | Ancien faux positif éditorial plausible ; non acquitté sans l'instance brute revue en environnement de confiance. Si une vraie réponse source en 200 est reproduite : **P0**. |
| **90003 SRI** | `scripts/security/audit-external-sri.mjs` impose SRI aux fournisseurs immuables déjà présents dans les deux pages HTML approuvées. | Cloudflare Turnstile et l'annonce Better Stack sont **dynamiques sans SRI** : exceptions explicites, pas un PASS. Google Translate et outils analytics chargés dynamiquement : inventorier avant durcissement et envisager hébergement local lorsque le fournisseur le permet. |

Les règles `10038/10098/10099/90003` restent `WARN` jusqu'à vérification des occurrences exactes; **aucune** n'est mise à `IGNORE`. ZAP signale en plus les bibliothèques vulnérables (`10003`), cookies SameSite (`10054`) et faiblesses CSP (`10055`) si les add-ons disponibles produisent ces alertes. Leur absence n'est pas la preuve qu'un contrôle a eu lieu.

## Protection de la pipeline ZAP contre le WAF

Le hook `scripts/security/zap-rate-limit-hook.py` impose **1 requête/seconde** au niveau du réseau ZAP, uniquement sur `www.bababou.com` ou un hôte exact `*.vercel.app`. Le crawl passif est porté à **2 minutes** mais les scans restent limités à 5 minutes de démarrage/attente (`-T 5`) et 15/20 minutes par job. En cas de Rate Limit add-on manquant, la pipeline **échoue sans scanner**.

Un précontrôle détecte HTTP `429` et `x-vercel-mitigated: challenge`, et le scan repère les signaux de checkpoint dans la sortie **privée du runner**. Le statut est **FAIL/coverage blocked**, jamais `PASS` ni finding logiciel. Le bypass Vercel OIDC/protection ne désactive pas les protections DDoS ou les rate limits déclenchés durant une attaque.

**Important :** le scan actif peut générer des requêtes dangereuses. Il reste séparé, uniquement sur une Preview explicitement autorisée, jamais en Production. Aucune augmentation du nombre d'appels actifs dans les workflows automatiques.

### Règle WAF proposée pour le plan Vercel Hobby (non appliquée)

1. Dans **Vercel → nabla-site-bababou → Firewall → Configure → New Rule**, créer une unique règle pour `www.bababou.com` : **fixed window, par IP, 300 requêtes/60 s**, action `Log` initiale. Éviter de compter uniquement sur `User-Agent` ou un header contrôlable par le client pour autoriser ZAP.
2. Analyser les événements de déclenchement, les utilisateurs derrière NAT, les robots légitimes, les erreurs `429`, les scans CI et le coût réel du service. Ensuite seulement envisager l'action `429` et ajuster le seuil à la charge mesurée. En Hobby : **une règle WAF Rate Limiting par projet**, facteur de décision important. Les tarifs/limitations doivent être examinés dans le tableau de bord.
3. Si un challenge ou `429` apparaît pendant un scan, **ne pas contourner globalement le WAF**. Examiner la règle, le budget de scan et l'éventuel chevauchement de jobs ; conserver la protection DDoS. Les runners GitHub n'ont pas d'adresse IP stable à supposer dans une allowlist.
4. La lecture actuelle de la configuration active WAF par le connecteur Vercel a renvoyé `404 not_found / access denied` ; aucune règle n'a donc été créée ni modifiée. Vérifier les rôles/projet et reconnecter Vercel pour une revue en lecture seule avant tout changement actif.

## Critères de GO

- Exécuter `node --test unit-tests/legacy-sri-contract.test.mjs`, `node --import tsx --test unit-tests/securityHeaders.test.ts unit-tests/zap-preview-workflow-contract.test.ts unit-tests/security-pipeline-contract.test.ts`, l'analyse YAML, `npm run build` et les contrôles de confidentialité au SHA exact.
- Vérifier sur la Preview puis en production : CSP en-tête réel, absence de violation bloquante, CORS sur l'origine suspecte, absence d'exposition source, SRI des assets immuables. Pour la migration CSP : contrôler les 4 langues, les archives HTML et le checkout sans altérer le contenu juridique.
- Exécuter le DAST passif et contrôler le rapport minimisé, les nouvelles règles `10003/10054/10055`, les réponses WAF et les compteurs, puis classer individuellement les quatre alertes historiques. Les raw logs restent runner-local et sont détruits.
- Pas de bascule homepage, de suppression d'archive, de changement WAF production ni de fermeture de BB-02 en l'absence de preuves.

Références : [Vercel Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [Vercel Automation Bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation), [ZAP Rate Limit](https://www.zaproxy.org/docs/desktop/addons/network/options/ratelimit/), [ZAP baseline](https://www.zaproxy.org/docs/docker/baseline-scan/).
