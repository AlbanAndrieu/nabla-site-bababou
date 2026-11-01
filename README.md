# Bababou — site hybride Next.js et pages historiques

Le site `bababou.com` utilise **Next.js App Router** et `next-intl` (FR/EN/DE/NO), tout en préservant les pages historiques de `public/`.

**État au 31 octobre 2026 :** la [PR #253](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/253) de migration React est fusionnée. Elle ne vaut **pas autorisation de basculer** la homepage publique : `/` reste servie depuis `public/index.html` tant que le verrou serveur n'est pas approuvé.

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

Les contrats hors ligne ne remplacent ni le build, ni Playwright/axe, ni BetterLeaks/SAST/SCA/ZAP. Ne déclencher aucun GitHub Actions simplement pour obtenir une preuve lorsque les crédits sont indisponibles ; ne pas contourner les gates. Les PR restent Draft tant que les preuves requises manquent, sans fusion automatique.

## Documentation — une autorité par sujet

| Besoin | Document |
| --- | --- |
| **Ce qu'il reste à faire** | [Roadmap active](docs/roadmap.md) |
| Parité fonctionnelle, catalogue des pages et écarts | [Parité Home / Abduction](docs/homepage-migration-parity.md) |
| Activation de `/`, conditions GO et rollback | [Procédure de bascule](docs/homepage-react-cutover.md) |
| Exploitation, CI et diagnostics non reconstruisibles | [Runbook opérationnel](docs/operations.md) |
| Publication, anonymisation et confidentialité | [Publication sûre](docs/publication-redaction.md) et [politique canonique](.agents/skills/protect-family-privacy/SKILL.md) |
| Couverture et preuves de sécurité | [Registre de sécurité](docs/security-audit-coverage-ledger.md) |
| Consignes agents, contributions | [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md), [CONTRIBUTING.md](CONTRIBUTING.md) |

Les anciennes PR, listes de commits et validations datées ne sont pas des instructions de reprise. Pour un état exact, lire le HEAD courant et la roadmap.

