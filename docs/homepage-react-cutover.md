# Bascule de la homepage React — GO/NO-GO et rollback

**Décision du propriétaire, 9 novembre 2026 : page d'accueil validée sur le plan éditorial et visuel.** L'accord est enregistré pour la préparation de la migration React, mais **ne vaut pas à lui seul validation des contrôles navigateur/sécurité ni activation en production**. Le verrou de bascule conserve sa vérification stricte du SHA et des gates ; `proxy.ts` continue par défaut de servir `public/index.html` jusqu'au GO technique.

La future Home propose **5 cartes** centrées sur les messages personnels ; la page distincte `/abduction` comporte **7 cartes** pour les parents, associations et traducteurs. Les deux parcours existent en FR/EN/DE/NO et doivent être vérifiés ensemble.

## Décisions et éléments encore attendus

| Condition | État au 9 novembre 2026 |
| --- | --- |
| Validation du propriétaire concernant la page d'accueil React | **APPROUVÉE** dans la conversation, sans modification supplémentaire des identités |
| Parité visuelle et éditoriale FR/EN/DE/NO | Contenu approuvé ; **preuve navigateur exact-SHA à produire** |
| Accessibilité, SEO, cache, liens et appareils | **NOT_VERIFIED** sur le futur déploiement |
| Qualité, SAST/SCA/DAST, privacy gates | **NOT_VERIFIED** au SHA de la future PR |
| Publication Vercel / activation du flag | **NON EFFECTUÉE** ; opération distincte et réversible |

La validation de l'accueil ne constitue **pas** une autorisation de recopier les identifiants complets, photographies privées, lieux de résidence ou pièces sensibles de l'ancienne page dans des surfaces différentes. La politique `protect-family-privacy` reste applicable. Les quatre variables de garde restent inactives tant que les preuves techniques ne sont pas réunies.

## Conditions de GO — toutes obligatoires

1. **Éditorial / vie privée** : approbation explicite du contenu public exact, des quatre traductions, des omissions par rapport à `public/index.html` et du périmètre de publication des références d'identité ou de localisation. Ne pas republier automatiquement des données personnelles sensibles ou des accusations nominatives.
2. **P1 / P3 — parité** : contrôler en navigateur les **5 + 7 cartes**, leurs images, liens, accès au contact, ressources, associations, navigation et traduction FR/EN/DE/NO. Vérifier thème clair/sombre, mobile, liens historiques, PDF/impression et RSS.
3. **P2 — accessibilité** : Chromium, Firefox, WebKit, axe/WCAG 2.2 AA, clavier/focus, zoom 200 %, reflow, lecteur d'écran et mouvement réduit.
4. **P4 — sécurité, SEO et comportement effectif** : HTTP 200/307/404, `noindex` / `private, no-store` des Previews, sitemap, canonical/hreflang et métadonnées sociales ; vérifier les requêtes réseau, WebSockets, Service Workers et les redirections avant/après activation. **Prouver que le verrou fonctionne lors de la génération statique Next.js ET au runtime** ; ne pas inférer son comportement de la lecture des variables seule. Ne jamais contourner Vercel Security Checkpoint.
5. **P5 — qualité** : checkout complet au SHA candidat, `just homepage-validation`, `just p0`, `just quality` et contrôles obligatoires BetterLeaks, SAST, SCA, ZAP, confidentialité. Aucune gate requise ne doit être contournée sous prétexte de crédits GitHub Actions.

Enregistrer **PASS / FAIL / NOT_RUN / BLOCKED**, SHA, environnement, date, preuve et éventuelle dérogation autorisée. Une condition manquante maintient **NO-GO**.

## Verrou serveur et séquence d'activation

`lib/homeCutoverPolicy.mjs` exige **toutes** les valeurs suivantes :

| Variable | Valeur attendue |
| --- | --- |
| `BABABOU_HOME_CUTOVER` | `approved` |
| `BABABOU_HOME_EDITORIAL_APPROVED` | `true` |
| `BABABOU_HOME_BROWSER_GATES_APPROVED` | `true` |
| `BABABOU_HOME_CUTOVER_SHA` | SHA complet de 40 caractères hexadécimaux minuscules |
| `VERCEL_GIT_COMMIT_SHA` | SHA du déploiement Vercel, identique au SHA d'approbation |

Les quatre premières variables **ne doivent pas être définies pour les besoins d'un test incomplet**. Le client ne peut activer le verrou via URL, cookie ou en-tête.

**Après contrôle complet des gates techniques (validation éditoriale déjà donnée)** :

1. Construire et vérifier une Preview d'un **SHA exact** avec les conditions du futur déploiement. Confirmer le comportement réel du rendu, du cache et de la redirection, pas uniquement les variables.
2. Conserver la validation éditoriale déjà donnée et produire les preuves des gates exact-SHA. Faire approuver séparément toute fusion ; **ne jamais merger automatiquement**.
3. Vérifier le SHA final du commit de production : il peut différer de la tête de PR. Réévaluer toute preuve liée au SHA.
4. Définir les variables d'autorisation **uniquement pour Production**, avec le SHA réellement déployé, puis **redéployer**. Vérifier que le verrou est évalué dans le contexte du build et du runtime Next.js.
5. Vérifier `/`, `/en`, `/de`, `/no`, `/index.html`, les huit parcours de revue, ressources, sitemap/robots, SEO, headers, routes historiques, console et logs Vercel.
6. Annoncer GO seulement après une recette post-déploiement réussie.

## Retour arrière

1. Retirer `BABABOU_HOME_CUTOVER` ou lui donner une valeur autre que `approved` en Production.
2. **Redéployer** le commit concerné ; confirmer que `/` revient à `public/index.html` et que les racines étrangères appliquent les anciennes redirections.
3. Contrôler les réponses HTTP, le cache, les métadonnées et les erreurs. Si la configuration ne peut être réappliquée, revenir au dernier déploiement Production `READY` connu, après vérification de sa provenance.
4. **Ne pas supprimer `public/index.html` ni ses assets** avant un cycle post-bascule documenté.

## Preuves et statut

L'ancien build Preview `624dc24f` était `READY` ; des contrats Node ciblés ont été exécutés sur cette version. Ce sont des preuves **historiques de compilation et de structure**, pas une attestation d'activation sur le `master` courant. L'approbation éditoriale a été confirmée le 9 novembre 2026 ; les recettes HTTP, navigateur et sécurité complètes restent non confirmées. Voir [roadmap.md](roadmap.md) pour les seuls résiduels actifs.

## Préparation technique consolidée — 10 novembre 2026

**Rebase** : PR #266 reconstruite sur `master@d259a912484717935665f95bcb85e1bfd90f311c`, sans écraser les changements Vercel FinOps et NRE des deux derniers commits master.

- **Performance** : `app/[locale]/page.tsx` utilise `dynamic = "force-static"`; le parent `app/[locale]/layout.tsx` génère les 4 locales. Le marqueur ne prouve pas à lui seul un build SSG. `npm run audit:home-cutover` exige à la fois les approbations SHA-borne et les quatre routes du manifeste Next ; un manifeste manquant ou contenant une route ISR/incorrecte échoue sans accepter l'activation.
- **SEO après GO** : `next.config.mjs` ajoute `X-Robots-Tag: noindex, follow` à l'ancien chemin physique `/index.html` **uniquement quand le verrou de publication est actif lors du build**. L'archive reste consultable et conserve sa fonction de rollback, sans rivaliser avec le canonical React. Vérifier le header HTTP réel sur la Preview SHA approuvée.
- **Langues** : le lien « Retour à l'accueil » du footer commun passe à `/`, `/en`, `/de`, `/no` seulement après GO ; les politiques du pied de page spécifique à l'accueil sont liées à leurs chemins localisés, sans prétendre que leur texte source historique est entièrement traduit.
- **Recette** : Playwright des quatre routes en GO : `lang`, 5 cartes, image, canonical, 4 hreflang, absence de `noindex` sur la nouvelle homepage, `noindex` sur `/index.html`, liens légaux et footer, responsive 320/375/768/1280. En mode NO-GO, les tests historiques de `/` restent applicables. Les tests de GO **sont volontairement sautés** sans toutes les variables de validation ; dans ce cas l'état est NOT_RUN, pas PASS.
- **Politique de vie privée** : aucun nom complet de mineur, lieu actuel ou document familial privé n'est transféré depuis l'archive vers une route Next. Le propriétaire a approuvé la nouvelle Home, non une extension de l'exception de publication de `public/index.html`.
- **Déploiement** : les variables de contrôle sont évaluées à la génération statique. Ne pas activer une variable au runtime sur un HTML déjà construit avec le verrou fermé : **redéployer l'exact SHA validé**. Après fusion (SHA potentiellement modifié), reprendre les preuves associées au nouveau SHA avant GO.

**État : préparation terminée en code, activation de production NON EFFECTUÉE.** Node 24/npm 12, tests complets, scans de sécurité, manifeste réel et Preview exacte restent les preuves manquantes ; aucun échec de CI ne doit être contourné.

