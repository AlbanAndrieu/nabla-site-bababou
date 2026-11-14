# Roadmap d'ingénierie — Site Bababou

**Réconciliée le 13 novembre 2026.** Complément d'exécution de la [roadmap générale](roadmap.md) : **mêmes identifiants `BB-xx`, aucun second backlog**. Priorités et arbitrages sont exclusivement dans `docs/roadmap.md`. La référence de lecture initiale est `master@2ebb293691d1` ; toute validation de livraison doit être liée à son **SHA exact**, pas à cette référence historique.

## Protocole commun de livraison

Sur un checkout Git complet, isolé et en branche non protégée : `just toolchain-check`, `just docs-audit`, `just offline-l1`, `just offline-contracts`, puis les tests ciblés ; avant publication : `just p0`, `just quality-fix` si nécessaire, `just quality`, `just publish`, et enfin Preview, Playwright/axe, BetterLeaks, SAST/SCA/DAST suivant le scope. Ne jamais transformer une commande non exécutée en PASS. Voir [operations.md](operations.md) pour les niveaux L0–L3 et [script-ownership.md](script-ownership.md) pour le point d'entrée canonique.

| ID | Dépendances / travaux à produire | Critère vérifiable de clôture |
| --- | --- | --- |
| BB-01 | Inventaire en lecture seule des médias PDF/Office sous `public/`, liens documentaires, métadonnées et exposition CDN ; soumettre les décisions de publication sans modifier d'originaux | Liste classifiée (autorisé public / à caviarder / privé), arbitrage explicite, absence de fuite après éventuel retrait et purge |
| BB-02 | Vérifier l'exact SHA, précommit, Node 24/npm 12, build, privacy, sécurité, DAST/Playwright accessibles ; diagnostiquer uniquement la première étape en erreur | Journal `PASS/FAIL/BLOCKED/NOT_RUN` par contrôle et SHA, aucune gate obligatoire ignorée |
| BB-03 | Réviser #270 sur sa propre branche : galerie six cartes, AVIF locale, textes FR/EN/DE/NO, footer, liens et protections de publication | Preview exacte validée visuellement et via tests navigateur/a11y, décision de fusion séparée |
| BB-04 | Après BB-03, vérifier `lib/homeCutoverPolicy.mjs`, manifest réel SSG, 4 locales, HTTP/SEO, protection des Previews et repli legacy ; ne pas régler les variables Production avant GO | `just home-cutover-verify` sur le bon SHA, budget Vercel, validation propriétaire, smoke Production et rollback observé |
| BB-05 | Recetter `/people-contacted` React issu de #270 : arbre ARF natif `<details>`, cartes pays/institutions, URLs HTTP(S), liens localisés ; ne pas supprimer les anciens scripts sans inventaire | Source ARF inchangée, liens et interactions comparés sur Playwright/axe/mobile ; ancienne URL préservée jusqu’au GO de redirection |
| BB-06 | Croiser `data/nre-evidence.public.json`, `docs/nre-visit-ledger.md`, références `SITE-DOC-*` et 4 langues ; tester les PDF sources vs les HTML approuvés | Dates/heures documentées sans transformer une déclaration en fait judiciaire, tests NRE et autorités, impressions et focus contrôlés |
| BB-07 | Après BB-01, séparer corpus privé TrueNAS/Docling/OpenRAG et public Vercel ; tunnel, Access/MFA, ACL par pièce, revue humaine, durée courte et révocation | Tests refus sans session, signature JWT/iss/aud/exp, 401/403, absence de cache/lien public, caviardage irréversible, GO explicite |
| BB-08 | Réutiliser l'audit Vercel de Site Alban adapté aux quatre locales via `just vercel-runtime-audit` (SSG/ISR, fonctions, API privées), puis lire `vercel usage` ou Usage équipe pour CPU actif/mémoire/invocations | Rapport artefacts au SHA exact + valeurs CPU réelles datées, seuils 50/75/90 % et tendance ; `cpuMeasured=false` tant qu'aucun export n'est fourni |
| BB-09 | Axe/Playwright Chromium–Firefox–WebKit, WCAG 2.2 AA, zoom, clavier, SEO/canonical/hreflang, français et 3 traductions | Rapport exact-SHA par route/localisation avec défauts corrigés ou dérogations approuvées |
| BB-10 | Inventaire `scripts/README.md` relié à `script-ownership.md`, adaptation de l'audit Vercel Alban #293, garde destructive déjà présente ; conserver les niveaux de gates et scripts réellement distincts | `just docs-audit`, `just vercel-runtime-test`, tests locaux et aucune régression scopes/gates ; expliciter les écarts inter-repos |
| BB-11 | Contrôle de la transcription JSX de la page approuvée `ca/demande-explications-autorites-competentes-fr.html` : 13 IDs, texte strictement identique, destinataires et liens PDF ; footer Contact/Calendly/GitHub | Contrat de parité textuelle, Playwright/axe/impression, contrôle des anciennes URL puis décision humaine avant redirection ou retrait d’archive |

## Séquences techniques par lot

### BB-01 — confidentialité et diffusion

Lire [publication-redaction.md](publication-redaction.md), [sitewide-document-access.md](sitewide-document-access.md) et [nre-evidence-openrag-access.md](nre-evidence-openrag-access.md). Comparer liens/objets **déjà accessibles**, scanner les métadonnées en environnement privé autorisé, rapporter les décisions en privé. Aucun retrait ni réécriture automatique d'un PDF, d'un document familial ou de l'ancien index.

### BB-02 — preuve de qualité

Réaliser les contrôles ciblés avant L3 ; pour les incidents CI suivre `workflow → job → step → première erreur`. Les indicateurs `skipped`, un déploiement `READY`, un test de structure et un log sans erreur ne sont pas interchangeables. Rejouer les vérifications après rebase/merge si le SHA change.

### BB-03 / BB-04 / BB-05 / BB-11 — parcours React

#270 reste ouverte (Ready for review, non fusionnée) : la carte courte, les 3 liens du footer et deux nouvelles pages React sont préparées, tandis que les archives `.html` restent publiées. Les 13 messages français sont repris sans traduction ni modification du texte. La bascule `/` est une **décision distincte** ; son protocole exhaustif vit uniquement dans [homepage-react-cutover.md](homepage-react-cutover.md), et la matrice de fonctionnalités dans [homepage-migration-parity.md](homepage-migration-parity.md). Ne pas recopier ici la procédure de GO ni supprimer `public/index.html`.

### BB-06 / BB-07 — preuves et accès

Pour les déclarations NRE, distinguer les dates source, les occurrences générées à vérifier, les contacts effectifs et les heures estimées ; ne pas reconstituer des durées inconnues. Une page `/ca/*.html` approuvée est directement consultable ; **seul un document source** justifie une action de demande. La passerelle privée nécessite un modèle d'autorisation revu **avant** tout lancement.

### BB-08 — FinOps réel

Utiliser [vercel-finops.md](vercel-finops.md), `just vercel-runtime-audit` (artefacts du build, adapté de Site Alban) et les scripts `scripts/finops/`, sans exposer de token ni créer d'endpoint Vercel. `WINDOW_UNVERIFIED`, `STALE_USAGE` et `NOT_MEASURED` ne sont pas des valeurs CPU.

### BB-09 / BB-10 — industrialisation

Établir le tableau des routes i18n restant à couvrir, aligner les contrats qui doivent être communs avec Site Alban (quality gates, pre-commit, exact-SHA, security baselines) et conserver les protections propres à la confidentialité familiale. Le [répertoire des scripts](script-ownership.md) identifie les wrappers qui sont des alias et ceux qui ont une responsabilité distincte : ne pas supprimer une gate parce que son nom est voisin d'une autre.

## Qualification de l'état

- `CODE_MERGED` : changement identifié dans Git ; n'établit pas la validation.
- `PREPARED` : documentation/architecture/contrat présents sans recette complète.
- `PASS` : preuve reproductible sur SHA et environnement indiqués.
- `FAIL` : défaut observé ; `BLOCKED` : environnement/accès empêche la preuve ; `NOT_RUN` : pas d'exécution.
- `DONE` : critère de clôture et autorisation humaine satisfaits. Déplacer ensuite la trace dans l'archive ou se référer à la PR, sans garder un second item actif.
