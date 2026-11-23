# ZAP, CSP, SRI et WAF — Bababou

Révision du 17 novembre 2026 ; état WAF Vercel relu le 21 novembre 2026. Cette page documente **les alertes encore visibles**, les corrections progressives et les risques de blocage WAF. Elle ne contient ni requête HTTP brute, ni cookie, ni URL de pièces familiales.

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

### Convergence du producteur SARIF depuis Site Alban — 22/11/2026

Reprise ciblée de la minimisation fail-closed de [Site Alban #236](https://github.com/AlbanAndrieu/nabla-site-alban/pull/236) dans `scripts/security/zap-safe-report.mjs`, **sans copier le producteur HIGH-only** : Bababou conserve les identifiants de règles **HIGH et MEDIUM** (les quatre `WARN` encore ouverts doivent rester visibles).

- JSON source borné à **8 Mo**, **1 à 20 sites**, **2 000 alertes par site** ; sortie SARIF bornée à **1 Mo**, créée exclusivement en `0600` sans écraser un artefact préexistant.
- Chaque site doit correspondre à une origine HTTPS publique approuvée (`www.bababou.com`, `bababou.com` ou `bababou.albandrieu.com`), sans chemin, requête, identifiant ou port non HTTPS ; tout écart échoue **avant la création de l'artefact**.
- Les identifiants de règles MEDIUM/HIGH sont exclusivement numériques. L'export conserve leurs identifiants et niveaux, mais jamais les URLs d'instances, corps/headers HTTP, messages libres ou pièces familiales. **Pas d'upload brut**.
- `node --test unit-tests/zapSafeReportProducer.test.mjs unit-tests/productionDastHttp402.test.mjs` couvre filtrage, schéma, confidentialité, permission des fichiers, HTTP 402 et blocage WAF. Un échec de validation est une **erreur de producteur**, pas « 0 vulnérabilité ».

Le producteur ne traite que le DAST de **production** : une Preview Vercel dispose d'alias dynamiques et son contrôle exact-SHA demeure dans `.github/workflows/zap-preview.yml`. Aucun assouplissement du host-check Preview, de la politique `.zap/rules.tsv` ni des protections Vercel.

**Hardening preflight du 22 novembre 2026 :** les workflows `production-dast.yml`, `zap-preview.yml` et `playwright.yml` reconnaissent désormais **toute mitigation explicite** `x-vercel-mitigated` (y compris `deny`) et HTTP 429 comme `COVERAGE_BLOCKED`, avant la branche « authentification échouée ». Les précontrôles Preview arrêtent les tentatives d'authentification si Vercel retourne HTTP 402 ; Playwright refuse également HTTP 4xx/5xx inattendus. Les en-têtes de mitigation ne sont jamais recopiés bruts dans les outputs GitHub ou les logs. Contrat source : `unit-tests/vercelMitigationGates.test.mjs` (suite Node 24 non exécutée). `scripts/security/vercel-waf-snapshot-audit.mjs` refuse un `ENFORCED` si d'autres CRS/managed rules sont actifs ou si des IP overrides sont présents. 

**Validation locale ciblée :** 18 tests Node 22.16.0 réussis sur une copie strictement identique aux blobs GitHub (scripts WAF/ZAP/smoke et tests unitaires). Ni `just quality`, ni le DAST réel, ni le déploiement, ni la réception navigateur n'ont été exécutés. Les quatre alertes ZAP moyennes restent ouvertes.

## Protection de la pipeline ZAP contre le WAF

Le hook `scripts/security/zap-rate-limit-hook.py` impose **1 requête/seconde** au niveau du réseau ZAP, uniquement sur `www.bababou.com` ou un hôte exact `*.vercel.app`. Le crawl passif est porté à **2 minutes** mais les scans restent limités à 5 minutes de démarrage/attente (`-T 5`) et 15/20 minutes par job. En cas de Rate Limit add-on manquant, la pipeline **échoue sans scanner**.

Un précontrôle détecte HTTP `429` et `x-vercel-mitigated: challenge`, et le scan repère les signaux de checkpoint dans la sortie **privée du runner**. Le statut est **FAIL/coverage blocked**, jamais `PASS` ni finding logiciel. Le bypass Vercel OIDC/protection ne désactive pas les protections DDoS ou les rate limits déclenchés durant une attaque.

**Important :** le scan actif peut générer des requêtes dangereuses. Il reste séparé, uniquement sur une Preview explicitement autorisée, jamais en Production. Aucune augmentation du nombre d'appels actifs dans les workflows automatiques.

### État réellement actif du WAF — lecture API du 21/11/2026

Lecture de configuration `active` du projet `nabla-site-bababou` (`prj_9eUAYmWQtHFIRKIOBYsumhU3QLU0`) : `firewallEnabled=true`, `managedRules.bot_protection={active:true,action:challenge}`, CRS `gen`, `sqli`, `xss`, `rce` actifs avec action **`log` uniquement** ; `rules=[]`, `ips=[]`. Les autres catégories CRS retournées sont inactives. Le `updatedAt` rapporté est le **4 août 2026** : lecture actuelle de la configuration active, et non preuve d'événements WAF récents. **Aucune règle SQLi/XSS/RCE n'est attestée en `deny`, et aucune règle personnalisée de rate limiting n'est présente.** Ne pas confondre détection et blocage.

Avant activation : récupérer les événements Firewall Observability (période, actions, catégories, 429/challenge), exclure les faux positifs, vérifier les impacts sur scanners/robots/utilisateurs légitimes, utiliser le module Terraform **déjà fusionné** dans `nabla-compose` via la [PR #433](https://github.com/AlbanAndrieu/nabla-compose/pull/433) ; son `import` Garage, son `plan` et son `apply` restent **NOT_RUN** d'après la roadmap Compose. Ne jamais créer un second WAF ni remplacer des règles existantes. Conserver un snapshot exploitable pour rollback et un journal de décision ; revue des capacités et coûts du plan courant. Le HCL existant demande `deny` pour SQLi/XSS/RCE et une règle de débit `deny` 300/60 s/IP : **c'est l'état cible du code et non une configuration appliquée**. Toute expérimentation préalable en journalisation ou activation partielle exige un `plan` HCL explicite et une revue des différences. Le mode `log` n'est pas un contrôle bloquant. Aucune règle de production n'a été changée par cette revue.

### IaC et validation sans duplication — BB-02 / Compose H04

**Autorité unique :** [`nabla-compose/terraform/vercel-waf/main.tf`](https://github.com/AlbanAndrieu/nabla-compose/blob/master/terraform/vercel-waf/main.tf) et [runbook d'import/apply](https://github.com/AlbanAndrieu/nabla-compose/blob/master/terraform/vercel-waf/README.md). La [PR Compose #433](https://github.com/AlbanAndrieu/nabla-compose/pull/433) a été fusionnée : **CODED, NOT_APPLIED**. Le module vise SQLi/XSS/RCE en `deny`, `gen` en `log`, anti-bot en `challenge` et **une seule règle de rate limit** sur `www.bababou.com`, `bababou.com` et `bababou.albandrieu.com`, jamais `*.vercel.app`.

**Licence mise à jour (21/11) :** la [documentation historique des managed rulesets](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets) mentionne **Enterprise** ; le [changelog du 19 novembre 2026](https://vercel.com/changelog/priority-projects-now-in-public-beta) ouvre également OWASP sur **Pro + Priority Projects (bêta)**, option annoncée à **200 USD/projet/mois**, avec inspection OWASP facturée séparément. Le [rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) reste disponible sur tous les plans dans les limites du forfait. La réponse `get_team` du 21/11 ne divulgue pas le forfait ni l'éligibilité à OWASP : **ENTITLEMENT_UNVERIFIED**. Ne pas provoquer d'upgrade payant ni promettre que les actions `deny` seront acceptées. Sur Hobby, l'accès à OWASP géré n'est pas démontré ; si l'offre ne le permet pas, décider d'une protection alternative après étude, sans pseudo-règles regex non vérifiées. Ne pas activer Priority sans accord financier explicite.

**Recette applicative locale (sans API, sans CI supplémentaire) :**

```bash
umask 077
# Capturer le JSON WAF active uniquement sur une workstation autorisée,
# dans un fichier temporaire privé hors dépôt : aucun log HTTP brut dans Git.
just waf-snapshot-test
just waf-snapshot-inventory /chemin/prive/waf-active.json
just waf-snapshot-verify /chemin/prive/waf-active.json
```

`inventory` retourne 0 pour un JSON valide mais déclare `NOT_A_SECURITY_GATE`. `verify` retourne **2** tant que le blocage SQLi/XSS/RCE, le bot challenge, `gen=log` et le rate limit exact ne sont pas attestés ; **1** si le snapshot est absent ou mal formé. Les sorties sont réduites à des indicateurs : ni domaine individuel, ni expression de règle, ni données personnelles. Une structure API inconnue est **UNVERIFIED**, jamais convertie en PASS. Ces vérifications ne remplacent ni les tests navigateur ni la preuve d'événements WAF réels. L'appel `get_active_attack_status` du 21/11 a renvoyé `anomalies=[]` : ce n'est **pas** une preuve d'absence de faux positifs.

**Séquence d'activation :** (1) droits et forfait, événements + faux positifs et budget ; (2) import de l'existant dans le Garage de Compose et `plan` sans destruction ; (3) approbation spécifique du diff ; (4) activation contrôlée, smoke FR/EN/DE/NO et vérification 403/429, ZAP ≤1 req/s et coûts ; (5) rollback IaC et relecture de la configuration active. Aucun bypass global des IP GitHub Actions, et aucun scan actif ZAP en production.

## Critères de GO

- Exécuter `node --test unit-tests/legacy-sri-contract.test.mjs`, `node --import tsx --test unit-tests/securityHeaders.test.ts unit-tests/zap-preview-workflow-contract.test.ts unit-tests/security-pipeline-contract.test.ts`, l'analyse YAML, `npm run build` et les contrôles de confidentialité au SHA exact.
- Vérifier sur la Preview puis en production : CSP en-tête réel, absence de violation bloquante, CORS sur l'origine suspecte, absence d'exposition source, SRI des assets immuables. Pour la migration CSP : contrôler les 4 langues, les archives HTML et le checkout sans altérer le contenu juridique.
- Exécuter le DAST passif et contrôler le rapport minimisé, les nouvelles règles `10003/10054/10055`, les réponses WAF et les compteurs, puis classer individuellement les quatre alertes historiques. Les raw logs restent runner-local et sont détruits.
- Pas de bascule homepage, de suppression d'archive, de changement WAF production ni de fermeture de BB-02 en l'absence de preuves.

Références : [Vercel Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [Vercel Automation Bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation), [ZAP Rate Limit](https://www.zaproxy.org/docs/desktop/addons/network/options/ratelimit/), [ZAP baseline](https://www.zaproxy.org/docs/docker/baseline-scan/).
