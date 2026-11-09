# Roadmap active — Site Bababou (consolidée au 9 novembre 2026)

> État audité à partir de `master@4bfb32ac` : les PR **#258, #260, #261 et #262** sont fusionnées ; la PR #263 de demande documentaire globale est fusionnée ; la PR #264 est fusionnée, mais les vérifications post-fusion restent ouvertes. Ne pas confondre source GitHub, tests d'exécution, Preview et production ; l'état de validation est lié à un SHA.

## P0 transversal — exploitation Vercel et consommation CPU

**Production vérifiée (connecteur Vercel, 9 novembre) :** `dpl_6LPdgycLzEXKLyCQXmzQk49Lxm2F`, état **READY**, branche `master@4e1a2b14538e2e4f5b3a2454690e12156c5ed5bc` après fusion #264. Le build Vercel affiche explicitement les quatre routes `/fr/success`, `/en/success`, `/de/success` et `/no/success` comme **SSG (●)** et non plus comme **SSR (ƒ)**. La page d'accueil `www.bababou.com` est accessible. Vercel ne remonte **aucune erreur runtime agrégée sur 24 h**, mais les logs détaillés Hobby ne conservent qu'une courte période et aucune métrique CPU observability n'est disponible dans cette session. Les sous-pages doivent être éprouvées par navigateur avant d'affirmer une recette complète.

- [#260](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/260) **fusionnée** : rendu statique NRE et pages juridiques ; confirmer le manifeste de la production exacte.
- [#261](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/261) **fusionnée** : distinguer HTTP 402 d'une vraie panne DAST ; aucun scanner contourné.
- [#262](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/262) **fusionnée** : registre public, accès documentaire explicatif, Cloudflare Access défini mais **inactif**.
- [#263](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/263) **fusionnée** : demander une copie depuis les liens documentaires de tout le site, sans rendre les archives publiées privées.
- [#264](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/264) **fusionnée** : retrait du SSR de la confirmation Stripe ; 4 routes SSG attestées par le build de production. `session_id` reste un simple affichage client, non une preuve de paiement. **Les économies Fluid CPU restent non mesurées** et les gates Node24/qualité du dernier HEAD PR étaient rouges avant fusion.

Les contrôles CI `skipped` n'établissent pas la qualité et des checks rouges ne doivent pas être requalifiés en PASS parce que le build Vercel est READY. **P0 encore ouvert :** remédier au `QG_AUTOFIX_REQUIRED` et aux échecs de contrats Node24, vérifier les parcours navigateur post-fusion et préserver SAST/SCA, Playwright/axe, BetterLeaks et DAST/ZAP.

- [ ] **FinOps mesuré** : relever le quota d'équipe via Vercel Usage (Fluid Active CPU, mémoire, invocations) et le découpage par projet/Top Paths, sans déduire le CPU facturé de la durée HTTP. Le connecteur a obtenu `404 costs_not_found` et Observability `404 not_found` ; **CPU réel NOT_MEASURED**. La récupération CLI JSON et la validation prudente des fenêtres sont préparées dans [Site Alban #295](https://github.com/AlbanAndrieu/nabla-site-alban/pull/295), en **Draft**. Les autres projets de l'équipe consomment aussi le même quota.

## État des migrations

| Domaine | Situation vérifiée dans le code | Reste à faire pour clôturer |
| --- | --- | --- |
| **NRE React / i18n** | Page React Next FR/EN/DE/NO, calendrier mensuel, filtres, registre public déclaratif, approche des heures de contact et référence juridique ; **#258 fusionnée** | Exécuter tests navigateurs et revue éditoriale exacte des pièces |
| **Page explicative preuves** | Sur **master après fusion #262** : `/evidence-access` (FR) et `/en`, `/de`, `/no` ; liens par identifiant public, référencement SEO, guide Cloudflare Access ; aucun téléchargement privé | Tests exact-SHA, déploiement et validation avant annonce de mise en ligne |
| **Demandes sur tous les documents liés** | Fusion #263 : script commun Next + HTML historique, références `SITE-DOC-*`, guide public et résolveur local sans fuite de lien source | Tests Node/Playwright, revue a11y, inventaire des documents externes non reconnus et vérification de toutes les pages |
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

- `docs/sitewide-document-access.md` : comportement transversal de demande de copie et risques des assets publics.
- `docs/nre-evidence-openrag-access.md` : architecture, objets publics/privés, provenance, processus d'autorisation, audit du PDF déjà public et critères GO/NO-GO.
- `infra/cloudflare/README.md` et `infra/cloudflare/nre-evidence-access.tf` : activation future de Cloudflare Access, avec politique **désactivée par défaut**.
- `data/nre-evidence.public.json` + `lib/nrePublicEvidence.mjs` : registre public à validation restrictive ; **aucun document lié** par défaut.
- `docs/nre-visit-ledger.md` : calcul et limites des heures déclarées, calendriers et explications légales.
- `docs/homepage-migration-parity.md` et `docs/homepage-react-cutover.md` : parité, décision et rollback de la homepage.
- GitHub PR #258, #260, #261, #262 et #263 (fusionnées), commits et logs : détails historiques, sans recopier des diagnostics déjà retrouvables dans Git.

## État de validation à la consolidation

Le lot initial #262 a fait l'objet de contrôles **structurels** via GitHub, pas d'un build local ni d'une preuve d'exécution sécurisée sur TrueNAS. L'extension Access/page explicative doit encore obtenir ses propres validations au SHA final. Aucun changement de politique, de DNS, de Tunnel ou d'OpenRAG n'est effectué par l'ajout des seuls fichiers de code et d'infrastructure inerte.

**GO/NO-GO :** publication de la nouvelle page publique possible uniquement après tests et revue ; **NO-GO** sur le partage privé et la bascule de la homepage tant que les préconditions propres à ces deux périmètres ne sont pas remplies.

## Parcours documentaire global — 9 novembre 2026

**Objectif :** permettre de demander une copie d'un **document lié depuis n'importe quelle page du site**, sans exposer les URL privées et sans altérer les documents volontairement publics. Spécification : [sitewide-document-access.md](sitewide-document-access.md).

| Priorité | Statut préparé | Validation restante |
| --- | --- | --- |
| **P0 — audit de publication** | Liens d'archives et fichiers documentaires publics identifiés comme catégorie de risque, sans suppression. | Classification juridique, audit PDF/Office et métadonnées, éventuelle décision de retrait/caviardage, purge CDN. |
| **P1 — CTA transversal** | Détection sélective des documents PDF/Office, archives HTML `/ca/` et liens de fournisseurs reconnus ; doublon « Demander une copie » ajouté sans remplacer l'original. | Vérifier les cas de documents sans extension et les exceptions explicitement marquées, en FR/EN/DE/NO. |
| **P2 — guide et traçabilité** | Guide `/evidence-access?doc=SITE-DOC-*#request-documents`, référence opaque, recours au Contact et résolveur local. | Tester que la référence suffit à identifier le lien public sans divulguer URL, query secrets ou pièce privée ; revue RGPD. |
| **P3 — sécurité réelle** | La configuration Cloudflare Access issue de #262 reste **désactivée**. | Installer puis tester Tunnel, MFA, approbation temporaire, passerelle ACL par document, copies caviardées et révocation ; ne pas annoncer portail actif avant GO. |
| **P4 — qualité et migration** | Convergence des pages Next et HTML historiques par le même module JS, sans modifier la homepage 404 protégée. | Node 24/npm 12, typecheck, lint, privacy gates, Playwright/axe multi-navigateurs, qualité de pré-rendu et tests exact-SHA sur Preview accessible. |

**Ne pas confondre** demande de copie et accès effectif à un document. La diffusion actuelle de fichiers sous `public/` reste indépendante de Cloudflare Access. La bascule complète de la homepage demeure un périmètre distinct soumis à la décision du propriétaire.

## Bilan de la PR #264 — critères exact-SHA

- La page de confirmation Stripe n'appelle plus `searchParams` côté serveur, utilise `Suspense` pour un îlot client et reste `noindex`. La nouvelle métadonnée `referrer: no-referrer` empêche l'envoi de `session_id` dans les en-têtes `Referer` de navigation. Elle **ne supprime pas** un éventuel accès à l'URL par les outils analytiques : conserver la politique de télémétrie minimale sur ces routes.
- `scripts/verify-next-prerender.mjs` inclut désormais `success` pour FR/EN/DE/NO. Le contrat de test vérifie un manifeste synthétique valide et un cas de régression ISR. La preuve décisive reste un **vrai build Next exact-SHA**, pas le seul drapeau `force-static`.
- Test navigateur multi-langue : référence masquée en absence du paramètre, affichée après hydratation et limitée à 200 caractères, balises `robots: noindex` et `referrer: no-referrer`. Ne pas inférer un paiement effectif de cette référence purement affichée.
- **Fusion déjà réalisée** : les contrôles qualité Node24 et le post-merge exact-SHA restent à remédier et à exécuter ; ne pas déduire une validation de sécurité d'un build Vercel READY. Aucune modification de paiement Stripe, d'abonnement ou des certificats.
- **Périmètre distinct** : bascule React de la homepage, audit des originaux familiaux dans `public/`, approbations Cloudflare et ACL OpenRAG ; tous restent ouverts et ne doivent pas être déclarés terminés par la seule #264.
