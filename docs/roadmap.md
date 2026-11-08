# Roadmap active — Site Bababou (consolidée au 8 novembre 2026)

> État audité à partir de `master@b24338a` et de la PR Draft **#262**, ouverte après fusion de **#258**. Ne pas confondre source GitHub, tests d'exécution, Preview et production ; l'état de validation est lié à un SHA.

## P0 transversal — blocage Vercel et consommation CPU

La dernière revue du dépôt signale **une suspension du projet Vercel Hobby avec réponses HTTP 402** depuis le 3 novembre 2026 ; la reprise annoncée au 3 décembre et la demande au support doivent être **revérifiées**, sans déduire d'un HTTP 402 une défaillance du code.

- [PR #260](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/260) : **Draft ouverte** ; génération statique (SSG) NRE, autorités centrales et pages juridiques, `force-static` et audit `scripts/verify-next-prerender.mjs`. La clôture exige le manifeste Next `.next/prerender-manifest.json`, profil CPU et tests exact-SHA ; pas de preuve de bascule sans exécution.
- [PR #261](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/261) : **Draft ouverte** ; qualification du HTTP 402 avant DAST/ZAP, sans transformer une absence de scan en succès de sécurité.
- **PR #262** (présente branche) : page explicative d'accès, registre documentaire et politique Cloudflare Access à activation explicite ; **sans ouverture des pièces**.
- Ne pas fusionner automatiquement les trois PR ni déclencher des CI coûteuses tant que la plateforme ne permet pas de produire une preuve exploitable. Préserver SAST/SCA/ZAP, la version Node 24 et le verrou de bascule exact-SHA.

## État des migrations

| Domaine | Situation vérifiée dans le code | Reste à faire pour clôturer |
| --- | --- | --- |
| **NRE React / i18n** | Page React Next FR/EN/DE/NO, calendrier mensuel, filtres, registre public déclaratif, approche des heures de contact et référence juridique ; **#258 fusionnée** | Exécuter tests navigateurs et revue éditoriale exacte des pièces |
| **Page explicative preuves** | Dans la **PR Draft #262** : `/evidence-access` (FR) et `/en`, `/de`, `/no` ; liens par identifiant public, référencement SEO, guide Cloudflare Access ; aucun téléchargement privé | Tests exact-SHA, déploiement et validation avant annonce de mise en ligne |
| **Docling → OpenRAG** | Contrats, modèle probatoire, manuel et contrôles préparés uniquement ; aucun document privé connecté par cette PR | Inventaire privé et traitement sur TrueNAS, audit OpenRAG/OpenSearch, séparation des corpus |
| **Cloudflare Access** | Terraform **désactivé par défaut**, application self-hosted, allowlist nominative, MFA et approbation temporaire préparés | Vérifier IdP, Tunnel, hostname, protection origine, appliquer avec autorisation, tests 401/403/révocation ; ne pas publier de lien privé avant GO |
| **Homepage React** | Home/Abduction React et pages de revue existent ; la racine `/` reste intentionnellement sur `public/index.html` tant que `isHomeCutoverEnabled()` refuse la bascule | Parité visuelle/contenu et publication propriétaire approuvée : **pas de bascule automatique** |
| **Contrôles communs** | Tests de contrat, lint, privacy et qualité définis dans package/justfile ; règles SAST/SCA/DAST conservées | Réaliser les quality gates sur le SHA final ; aucun statut CI `skipped` ne vaut PASS |

### Priorités finales et critères d'achèvement

**P0 — Empêcher toute fuite probatoire avant la migration.** Auditer l'ancien PDF de plainte déjà publié dans `public/assets/` : données de mineur, métadonnées, liens, CDN et historiques. **Ne pas modifier ou effacer silencieusement une pièce volontairement publique** ; soumettre un arbitrage de publication au propriétaire. Tester la sûreté du registre : champs inconnus rejetés, dates non inventées, 0 lien direct vers originaux.

**P1 — Finaliser le parcours public React dans #262.** Vérifier `/nre` ↔ `/evidence-access` dans les quatre langues, navigation clavier, focus sur les ancres, états `pending`, impression, affichage mobile 320/375 px. S'assurer que les références `NRE-CLAIM-*` sont des identifiants internes, non des numéros de plainte. Garder la page d'accès **publique et informative**, sans endpoint de fichiers.

**P2 — Intégrer le corpus privé hors Vercel.** Ingestion locale et isolée Docling, contrôle d'intégrité SHA-256, provenance page, recoupement humain ; OpenRAG/OpenSearch non accessible aux tiers, secrets hors Next. Aucun enrichissement automatique du site à partir des chunks et aucune conclusion juridique automatisée.

**P3 — Déployer l'accès individuel (GO conditionnel).** Terraform Cloudflare inerte par défaut. Après validation de la passerelle et de la sécurité d'origine, autoriser temporairement les emails pré-qualifiés ; MFA indépendante à chaque login, justification, approbation et durée de 15 min. Vérifier `iss/aud/exp/signature` des JWT, ACL par document, refus `401/403`, révocation, copies irréversiblement caviardées, absence de cache, logs minimisés. Activer uniquement après validation expresse et tests.

**P4 — Migration React et accessibilité du site.** Revue P1 de la homepage historique (5 cartes Home/7 Abduction), illustrations et textes du propriétaire, écran 320 px, WCAG 2.2 AA (axe, Chromium/Firefox/WebKit), SEO, sitemap, PDF et tous les liens depuis NRE/autorités centrales. Conserver l'exception `public/index.html` tant que la décision de bascule de la homepage n'est pas approuvée ; ne pas prétendre que le code fusionné change `/`.

**P5 — Preuve de publication exact-SHA.** Sur checkout Node 24/npm 12 : `node --test unit-tests/nrePublicEvidence.test.mjs unit-tests/nreEvidenceAccessContract.test.mjs unit-tests/nreVisitLedger.test.mjs`, puis `just p0`, `npm run check`, Playwright/axe, BetterLeaks/SAST/SCA/ZAP si disponibles, revue du diff, Preview puis décision humaine. Les checks GH `skipped` sur Draft ne constituent pas une validation. Aucune PR mergée automatiquement.

## Livrables conservés comme sources de vérité

- `docs/nre-evidence-openrag-access.md` : architecture, objets publics/privés, provenance, processus d'autorisation, audit du PDF déjà public et critères GO/NO-GO.
- `infra/cloudflare/README.md` et `infra/cloudflare/nre-evidence-access.tf` : activation future de Cloudflare Access, avec politique **désactivée par défaut**.
- `data/nre-evidence.public.json` + `lib/nrePublicEvidence.mjs` : registre public à validation restrictive ; **aucun document lié** par défaut.
- `docs/nre-visit-ledger.md` : calcul et limites des heures déclarées, calendriers et explications légales.
- `docs/homepage-migration-parity.md` et `docs/homepage-react-cutover.md` : parité, décision et rollback de la homepage.
- GitHub PR #258 (fusionnée) et #262 (Draft), commits et logs : détails historiques, sans recopier des diagnostics déjà retrouvables dans Git.

## État de validation à la consolidation

Le lot initial #262 a fait l'objet de contrôles **structurels** via GitHub, pas d'un build local ni d'une preuve d'exécution sécurisée sur TrueNAS. L'extension Access/page explicative doit encore obtenir ses propres validations au SHA final. Aucun changement de politique, de DNS, de Tunnel ou d'OpenRAG n'est effectué par l'ajout des seuls fichiers de code et d'infrastructure inerte.

**GO/NO-GO :** publication de la nouvelle page publique possible uniquement après tests et revue ; **NO-GO** sur le partage privé et la bascule de la homepage tant que les préconditions propres à ces deux périmètres ne sont pas remplies.
