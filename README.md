# Bababou — site hybride Next.js et pages historiques

Le site `bababou.com` utilise **Next.js App Router** et `next-intl` (FR/EN/DE/NO), tout en préservant les pages historiques de `public/`.

**État au 14 novembre 2026 :** les PR #266 (préparation de la bascule React) et #269 (documents sources) sont fusionnées sur `master`. La [PR #270](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/270) reste **ouverte, Ready for review**, avec une sixième carte sur sa branche ; les cinq cartes indiquées ci-dessous restent celles de `master`. La validation éditoriale ne vaut pas activation de `/` : l'accueil public historique reste servi tant que les gates exact-SHA ne sont pas approuvées.

Deux pages React principales sont disponibles pour revue, **non indexables par configuration** :

| Public | Français | English | Deutsch | Norsk |
| --- | --- | --- | --- | --- |
| Messages personnels — 5 cartes | `/home-preview` | `/en/home-preview` | `/de/home-preview` | `/no/home-preview` |
| Parents et traducteurs — 7 cartes | `/abduction` | `/en/abduction` | `/de/abduction` | `/no/abduction` |

`/fr/home-preview` redirige vers `/home-preview`. Les documents historiques et destinations externes peuvent avoir leur propre langue. **Ne pas recopier de données identifiantes ou de localisations précises depuis l'ancien index sans revue et approbation spécifiques.**

## Démarrer et valider

Les versions sont verrouillées par `mise.toml`, `mise.lock` et le lockfile npm. `justfile` est l'interface canonique ; `Makefile` reste pour compatibilité.

```bash
mise install
just install
just dev

# Validations, sur checkout complet et branche non protégée :
just offline-l1
just offline-contracts
just homepage-validation-list
just homepage-validation
just p0
just quality
```

Les contrats hors ligne ne remplacent ni le build, ni Playwright/axe, ni Betterleaks/SAST/SCA/ZAP. Ne déclencher aucun GitHub Actions simplement pour obtenir une preuve lorsque les crédits sont indisponibles ; ne pas contourner les gates. Les nouvelles PR documentaires restent Draft en absence de preuve complète ; la PR #270 est Ready for review mais ses contrôles GitHub ne sont pas tous verts. Aucune fusion automatique.

## Documentation — une autorité par sujet

| Besoin | Document |
| --- | --- |
| **Décisions et priorités ouvertes** | [Roadmap générale](docs/roadmap.md) |
| Critères techniques, dépendances et vérifications | [Roadmap d’ingénierie](docs/engineering-roadmap.md) |
| Scripts, alias et commandes canoniques | [Répertoire de scripts](docs/script-ownership.md) |
| Parité fonctionnelle, catalogue des pages et écarts | [Parité Home / Abduction](docs/homepage-migration-parity.md) |
| Activation de `/`, conditions GO et rollback | [Procédure de bascule](docs/homepage-react-cutover.md) |
| Exploitation, CI et diagnostics non reconstruisibles | [Runbook opérationnel](docs/operations.md) |
| Publication, anonymisation et confidentialité | [Publication sûre](docs/publication-redaction.md) et [politique canonique](.agents/skills/protect-family-privacy/SKILL.md) |
| Couverture et preuves de sécurité | [Registre de sécurité](docs/security-audit-coverage-ledger.md) |
| Consignes agents, contributions | [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md), [CONTRIBUTING.md](CONTRIBUTING.md) |

Les anciennes PR, listes de commits et validations datées ne sont pas des instructions de reprise. Pour un état exact, lire le HEAD courant et la roadmap.
