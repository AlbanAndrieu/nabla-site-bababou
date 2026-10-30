# Roadmap active — Site Bababou

**Mise à jour : 29 octobre 2026.** [PR #251](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/251) et [PR #252](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/252) **fusionnées**. [PR #253](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/253) **Draft**, validations réseau complémentaires. La base de production après #252 est `ccb688c3d5ac613b5e2029839fc4fa59f6c22d65` ; déploiement Vercel `dpl_GhoM19dbmTW3k67AUa248u5YHqY1` **READY**.

## Politique de publication et état cible

La route `/` sert **toujours `public/index.html`**. Les quatre versions Next.js restent des pages publiques de **revue non indexable** : `/home-preview` (FR), `/en/home-preview`, `/de/home-preview`, `/no/home-preview`. L'alias `/fr/home-preview` redirige vers la route FR. Les protections `noindex, nofollow, nosnippet` et `private, no-store` sont configurées en source ; **leurs en-têtes HTTP ne sont pas encore attestés sur le nouveau SHA**.

**NO-GO** pour basculer `/` : absence de recette navigateur Next complète, de gates sécurité complètes et d'approbation éditoriale/privacy. Ne pas copier ou publier automatiquement de données identifiant une mineure, de positions précises ou d'allégations nominatives. Ne pas désactiver le WAF, ni fusionner automatiquement une PR.

## Priorités ouvertes (P1 → P5)

| Priorité | Acquis versionnés / observés | Travail encore ouvert | Condition de clôture |
| --- | --- | --- | --- |
| **P1 — Homepage React** | 13 sections, 10 cartes **toutes illustrées** (6 ressources historiques sans identifiant + 4 SVG neutres locaux) ; inventaire des 15 scripts (6 équivalents partiels, 4 conservés sur HTML, 5 non nécessaires à la Preview) | Recette de parité visuelle/fonctionnelle sur les quatre locales ; NRE et liens historiques restaurés en source ; vérifier images, thème, impression et parcours sur navigateur ; revue éditoriale | Navigateur réel sur SHA final et autorisation explicite avant remplacement de `/` |
| **P2 — WCAG 2.2 AA** | Contrôles thème/impression FR/EN/DE/NO, focus contrasté, boutons ≥44 px et scénarios Playwright ; test de redimensionnement du texte 200 % | Exécuter axe/Playwright sur Chromium/Firefox/WebKit, reflow, clavier, focus, contrastes, reduced-motion ; zoom natif 200 % et lecteur d'écran manuels | Aucune violation bloquante ; parcours clavier/lecteur d'écran validés |
| **P3 — i18n/pages** | 16 footers HTML harmonisés ; 28 contrôles Chrome HTML locaux historiques PASS ; le bloc People donne maintenant des descriptions des deux pages publiques existantes sans recopier de données nominatives ; extraits anglais conservés avec `lang=en` | Contrôler en navigateur les liens juridiques désormais localisés, les traductions humaines, le sélecteur de langue React, les anciennes routes HTML et le rendu print/PDF | FR/EN/DE/NO et anciennes URLs vérifiés en navigateur |
| **P4 — SEO/confidentialité** | Sitemap XML legacy nettoyé (14 URLs), filtrage des alias `home-preview` encodés, garde analytics direct/SPA, tests d'audit réseau | Vérifier HTTP 200/307/404, canonical, hreflang/`x-default`, OG/Twitter, RSS, robots et sitemap ; réseau réel, y compris WebSockets/Service Workers et navigation Next | Preuves de réponses HTTP et de non-émission réseau sur SHA final, avec accès Vercel autorisé |
| **P5 — Qualité/maintenance** | `justfile` canonique ; `just homepage-validation[-list]`, contrats locaux ; documentation consolidée | Exécuter `just p0`, `just quality`, BetterLeaks, SAST/SCA, ZAP ; identifier provenance npm `cache-dir` ; limiter la dette de tests/legacy | Gates complètes PASS ou dérogations documentées et approuvées, sans contournement |

Le périmètre des contenus HTML nominatifs, de D3/ARF, de Google Translate et de BetterStack reste **legacy**, sauf migration approuvée. Ne pas assimiler l'inventaire des scripts à une parité de contenu. Voir [homepage-migration-parity.md](homepage-migration-parity.md), [publication-redaction.md](publication-redaction.md) et [operations.md](operations.md).

## Preuves récentes et limites

| Contrôle | Résultat | Portée exacte |
| --- | --- | --- |
| Vercel production après #252 | **READY** (`ccb688c3`) | Compilation / déploiement uniquement ; aucune attestation fonctionnelle |
| Contrats Node analytics + SEO + audit réseau #253 | **16/16 PASS**, Node 24.22.1 | Six fichiers exacts récupérés via GitHub et exécutés dans un sandbox sans réseau, **pas** checkout complet |
| Syntaxe JS et analyse syntaxique du scénario Playwright #253 | **6/6 JS + 1/1 TS PASS** | Analyse syntaxique, **pas** exécution browser |
| Audit navigateur Next/axe réel, transition SPA, Firefox/WebKit, zoom natif | **NOT_RUN** | Sans checkout complet local ni navigateur autorisé sur le nouveau SHA |
| Réponses HTTP publiques | **BLOCKED/NOT_VERIFIED** | Un précédent contrôle Vercel avait obtenu 429 Security Checkpoint ; pas de preuve HTTP au SHA #253 |
| Security gates BetterLeaks/SAST/SCA/ZAP, `just p0`, `just quality` | **NOT_RUN** | Aucun PASS déduit du build Vercel |
| Approbation éditoriale / vie privée | **PENDING** | Bloquante pour remplacer `/` |
| Warning npm `Unknown env config "cache-dir"` | **CONFIRMÉ** dans les logs de build #252 | Non présent dans `.npmrc` ni `vercel.json` examinés ; inspecter la configuration d’environnement Vercel sans afficher les secrets. Ne pas supprimer ce warning sans avoir identifié sa source |

La PR #253 couvre désormais les requêtes **HTTP contextuelles** (Service Workers) et les **connexions WebSocket**. Elle ne déclare pas que ces risques ont été éliminés en production : le test navigateur est non exécuté.

## Avancée de parité visuelle et de contenu — PR #253

- **Galerie :** 10 cartes / 10 images locales. Les six images historiques sans identifiant conservées ont été complétées par quatre SVG originaux et neutres (contact, documents, personnes contactées, message). Les quatre anciennes illustrations exclues ne sont **pas** republiées : elles peuvent contenir des pièces d'identité, des informations sur une mineure, des localisations ou des allégations.
- **Informations :** les quatre descriptions associées à ces cartes ont été enrichies uniquement à partir du contenu déjà publié et des fonctionnalités existantes. Le bloc `LegacyPeopleSection` décrit désormais les deux ressources publiques `/people-contacted.html` et `/central-authorities.html` (fichiers présents dans le dépôt), sans importer leurs données.
- **Contrôles :** six tests Node ciblés de structure/visuel/SVG `PASS`, plus quatre SVG XML valides. Le test local `existsSync` des six images historiques est **NOT_RUN dans le sandbox** car leurs fichiers binaires n'y ont pas été copiés ; vérification indépendante des 10 noms et tailles de fichiers dans le listing GitHub **10/10 PASS**. La validation Playwright de l'affichage des images et du réseau demeure `NOT_RUN`.
- **Publication :** aucun document familial ou juridique nouveau n'est ajouté ; l'approbation éditoriale pour les informations omises reste ouverte. Ne pas qualifier de parité éditoriale complète cette restauration des illustrations.

## Suite P1 — liens publics et fiabilité des images (30 octobre 2026)

- **Parité des données publiques :** le lien `nre-en.html` présent dans la homepage historique était absent de la Preview. La section juridique React dessert maintenant `/for-fathers.html`, `/en/nre` et `/en/central-authorities`, avec trois cartes responsives. La route Next `/en/nre` et la redirection historique sont déjà présentes ; aucune donnée nominative NRE n'est copiée dans la Preview.
- **Images :** `GalleryCardMedia.tsx` sert les 10 images locales d'origine directement (`unoptimized`) en conservant l'affichage de remplacement `onError`. Le test Playwright exige un `src` local et l'absence d'image cassée ; **NOT_RUN** sur le rendu réel.
- **Tests ciblés :** `unit-tests/homepageLegalResourcesParity.test.mjs` couvre les routes publiques, la mise en page et la source des 10 images ; **3/3 PASS** sous Node 24.22.1 dans un sandbox sans réseau. La syntaxe TSX n'a pas pu être contrôlée par le lecteur TypeScript natif Node (JSX non pris en charge) : un build Next.js exact-SHA est requis.
- **Confidentialité :** la Preview reste non indexée et la homepage `/` inchangée. Les documents, positions précises et informations sensibles non approuvées restent exclus.

## Correction P3 — navigation locale des ressources (30 octobre 2026)

- Le bloc juridique reçoit maintenant `locale` depuis la route `home-preview` après validation par `hasLocale`.
- Les liens NRE et Central Authorities utilisent `canonicalPagePath(..., locale)` et suivent le registre Next existant. FR : `/nre`, `/central-authorities` ; EN/DE/NO : les mêmes routes préfixées dans la langue de la Preview. `/for-fathers.html` reste un document historique en anglais.
- Les contrats `homepageLegalResourcesParity` et `homepageLinkOwnership` ont été mis à jour pour les objets de données `href:` et pour détecter toute route anglaise codée en dur.
- **Preuve ciblée :** 6/6 PASS sous Node 24.22.1 sur les sources exactes récupérées via GitHub, dans un sandbox isolé sans accès réseau. La suite complète de tests, TypeScript/Next et Playwright ont des validations séparées ; aucun statut READY de build ne prouve le comportement du navigateur.
- Le contenu narratif déjà approuvé reste en anglais avec `lang="en"` tant que les traductions humaines ne sont pas relues. La correction ne réintroduit ni données sensibles ni images d'identité.

## Préparation de la bascule réversible — 30 octobre 2026

La **route publique React est désormais codée mais inactive** : `app/[locale]/page.tsx` et `proxy.ts` exigent une approbation éditoriale, une approbation des gates navigateur et un SHA Vercel exact via `lib/homeCutoverPolicy.mjs`. Sans ces valeurs, `/` reste le HTML historique et `/en`, `/de`, `/no` redirigent vers `/`. Un nouveau SHA invalide le GO précédent. Les canonicals et les langues du sitemap basculeront uniquement avec ce verrou. Aucun marqueur d'approbation n'a été ajouté aux variables Vercel.

**Confiance et limites :** le propriétaire confirme que les images apparaissent sur la Preview précédente (**validation utilisateur des images**, pas recette WCAG). Tests Node ciblés du verrou **4/4 PASS** sous Node 24.22.1 sur sources exactes. Le build complet de ce dernier lot, les tests navigateur/a11y/sécurité et la revue éditoriale restent à confirmer. La duplication temporaire de structure de JSX entre `home-preview` et la nouvelle route publique pourra être factorisée **après** preuve de parité, sans modifier les textes approuvés.

Voir [procédure de GO/NO-GO et retour arrière](homepage-react-cutover.md). **NO-GO** maintenu : ne pas définir les variables d'activation, ne pas merger automatiquement, ne pas supprimer les fichiers historiques.

## Prochaine étape de validation (local-first)

```bash
# Depuis un checkout complet de la PR #253, avec dépendances et navigateurs déjà installés :
just agent-local-tests
just homepage-validation-list
just homepage-validation
just p0
just quality
```

Utiliser un accès autorisé à Vercel si les sondes sont exécutées sur un déploiement protégé. Ne jamais mettre de jeton dans les artefacts, rapports, captures ou logs. Ne pas relancer GitHub Actions pour ces recettes.

**À différer :** migration des pages legacy restantes, widgets tiers et nouvelles traductions non approuvées. Demander au propriétaire d'installer lui-même les skills tiers `web-design-guidelines`, `frontend-design` et `security-audit-skill` lorsque la migration reprendra ; Dagger/Context7 restent des évaluations sans priorité de publication.
