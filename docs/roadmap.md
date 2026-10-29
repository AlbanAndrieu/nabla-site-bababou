# Roadmap active — Site Bababou

**Mise à jour : 29 octobre 2026.** [PR #251](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/251) et [PR #252](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/252) **fusionnées**. [PR #253](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/253) **Draft**, validations réseau complémentaires. La base de production après #252 est `ccb688c3d5ac613b5e2029839fc4fa59f6c22d65` ; déploiement Vercel `dpl_GhoM19dbmTW3k67AUa248u5YHqY1` **READY**.

## Politique de publication et état cible

La route `/` sert **toujours `public/index.html`**. Les quatre versions Next.js restent des pages publiques de **revue non indexable** : `/home-preview` (FR), `/en/home-preview`, `/de/home-preview`, `/no/home-preview`. L'alias `/fr/home-preview` redirige vers la route FR. Les protections `noindex, nofollow, nosnippet` et `private, no-store` sont configurées en source ; **leurs en-têtes HTTP ne sont pas encore attestés sur le nouveau SHA**.

**NO-GO** pour basculer `/` : absence de recette navigateur Next complète, de gates sécurité complètes et d'approbation éditoriale/privacy. Ne pas copier ou publier automatiquement de données identifiant une mineure, de positions précises ou d'allégations nominatives. Ne pas désactiver le WAF, ni fusionner automatiquement une PR.

## Priorités ouvertes (P1 → P5)

| Priorité | Acquis versionnés / observés | Travail encore ouvert | Condition de clôture |
| --- | --- | --- | --- |
| **P1 — Homepage React** | 13 sections, 10 cartes, 6 médias ; inventaire des 15 scripts (6 équivalents partiels, 4 conservés sur HTML, 5 non nécessaires à la Preview) | Recette de parité visuelle/fonctionnelle sur les quatre locales ; ancres, liens, thème, impression, fallback média, parcours legacy ; revue éditoriale | Navigateur réel sur SHA final et autorisation explicite avant remplacement de `/` |
| **P2 — WCAG 2.2 AA** | Contrôles thème/impression FR/EN/DE/NO, focus contrasté, boutons ≥44 px et scénarios Playwright ; test de redimensionnement du texte 200 % | Exécuter axe/Playwright sur Chromium/Firefox/WebKit, reflow, clavier, focus, contrastes, reduced-motion ; zoom natif 200 % et lecteur d'écran manuels | Aucune violation bloquante ; parcours clavier/lecteur d'écran validés |
| **P3 — i18n/pages** | 16 footers HTML harmonisés ; 28 contrôles Chrome HTML locaux historiques PASS ; extraits anglais conservés avec `lang=en` | Vérifier traductions humaines, sélecteur de langue React, liens et anciennes routes HTML, rendu print/PDF | FR/EN/DE/NO et anciennes URLs vérifiés en navigateur |
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
