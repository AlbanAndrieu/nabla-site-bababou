# Bascule React de la homepage — procédure réversible

État au 30 octobre 2026 : **préparée, NON AUTORISÉE**. La route `/` reste servie par `public/index.html` et les racines `/en`, `/de`, `/no` redirigent vers `/` tant que les cinq vérifications du verrou serveur ne sont pas simultanément réunies.

## Conditions de GO

Cette liste est **cumulative**. Les captures de build `READY` ou les tests de source ne remplacent pas une recette navigateur :

1. **Éditorial / confidentialité :** valider par écrit la copie publique exacte sur FR/EN/DE/NO, les éléments omis par rapport à l'ancienne page, les liens et les documents. Conserver les identifiants officiels, localisations précises, allégations nominatives et originaux privés hors de la nouvelle page.
2. **P1 parité :** constater 10/10 images visibles et chargées, vérifier navigation, ancrages, formulaires inexistants, ressources NRE/autorités, thèmes, impression et mobile sur le SHA candidat. Le retour du propriétaire « Je vois bien les images maintenant » est un **signal positif limité aux images**, pas l'approbation éditoriale de toute la page.
3. **P2 accessibilité :** Playwright + axe sur Chromium, Firefox et WebKit ; clavier, focus, contrastes, agrandissement 200 %, reflow, mouvement réduit, lecteur d'écran et test mobile. Enregistrer les écarts.
4. **P4 SEO / réseau :** 200/307/404, canonical et hreflang FR/EN/DE/NO, sitemap/robots, en-têtes de Preview `noindex` et `private, no-store`, absence de trackers/POST/WebSockets non prévus, Service Workers, balises OG/Twitter et liens RSS. Utiliser une session navigateur autorisée ; **ne pas affaiblir Vercel Security Checkpoint**.
5. **P5 gates :** `just agent-local-tests`, `just homepage-validation`, `just p0`, `just quality`, BetterLeaks, SAST/SCA et ZAP sur un checkout complet et **le même SHA**. Pas de CI GitHub Actions avant le merge si les crédits sont épuisés.

Consigner les résultats avec `PASS`, `FAIL`, `NOT_RUN` ou `BLOCKED`, l'heure, l'environnement et le SHA. Un seul blocage maintient **NO-GO**.

## Activation après validation (opération volontaire, jamais automatique)

Le serveur exige simultanément les variables suivantes :

| Variable | Valeur requise |
| --- | --- |
| `BABABOU_HOME_CUTOVER` | `approved` |
| `BABABOU_HOME_EDITORIAL_APPROVED` | `true` |
| `BABABOU_HOME_BROWSER_GATES_APPROVED` | `true` |
| `BABABOU_HOME_CUTOVER_SHA` | SHA Git complet (40 caractères hexadécimaux minuscules) de la version approuvée |
| `VERCEL_GIT_COMMIT_SHA` | SHA fourni par Vercel ; doit être strictement égal à `BABABOU_HOME_CUTOVER_SHA` |

Les quatre premières variables restent absentes de la configuration Vercel tant que la recette n'est pas terminée. Ne jamais les définir pour faire passer un test incomplet. Ce verrou est lu uniquement côté serveur et ne se modifie **pas** par URL, cookie ou en-tête client. Toute version dont le SHA change revient automatiquement au comportement historique tant que son nouveau SHA n'est pas approuvé.

**Séquence d'activation (après GO explicite) :**
1. Valider le SHA exact sur une Preview Vercel protégée et enregistrer le rapport.
2. Relire la différence de publication puis approuver explicitement la fusion. Ne pas automatiser le merge.
3. Revalider le SHA final obtenu sur `master` (le SHA du merge peut différer de celui de la PR). Si différent, recommencer les contrôles liés au SHA.
4. Définir les quatre variables d'approbation **dans l'environnement Production seulement**, avec le SHA de déploiement final, et redéployer cet exact SHA.
5. Contrôler `/`, `/en`, `/de`, `/no`, `/index.html`, le sitemap, les redirections, les headers, les ressources et la télémétrie. Surveiller les erreurs Vercel.
6. Annoncer GO uniquement après ces vérifications post-déploiement.

La page publique native présente les textes déjà approuvés, dix cartes et des introductions neutres localisées ; les quatre routes `home-preview` restent non indexées pour revue. Le code existe dans `app/[locale]/page.tsx`, sans changer le comportement par défaut de `proxy.ts`.

## Retour arrière

1. Mettre `BABABOU_HOME_CUTOVER` à une valeur différente de `approved`, ou retirer la variable, en Production.
2. Redéployer le même commit afin que `/` serve de nouveau `public/index.html` et que les racines étrangères convergent vers `/`.
3. Confirmer les réponses HTTP et les métadonnées ; si l'environnement Vercel est indisponible, utiliser son mécanisme de rollback vers le dernier déploiement Production `READY` connu.

**Conserver `public/index.html` et ses assets** jusqu'à au moins un cycle de validation post-bascule. Le mécanisme de rollback ne supprime ni les fichiers ni les données historiques déjà publiques.

## Preuves actuelles

- Images : propriétaire confirme leur affichage en Preview ; contrôle automatisé du chargement complet et multibrowser encore `NOT_RUN`.
- Liens NRE et ressources : 6/6 contrats Node locaux `PASS` au SHA précédent ; 4/4 tests Node du verrou `PASS` sur sources courantes.
- Vercel : ancienne Preview `READY` ; build du nouveau verrou à vérifier sur le dernier SHA.
- Recette navigateur, tests de sécurité, audit d'accessibilité complet et validation éditoriale : **en attente**. Décision : **NO-GO**.
