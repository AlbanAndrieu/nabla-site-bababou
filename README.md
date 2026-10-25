# Bababou — site hybride Next.js et pages historiques

Le site `bababou.com` combine **Next.js App Router**, `next-intl` (FR/EN/DE/NO) et les pages historiques de `public/`. La homepage publique `/` reste la page `public/index.html` pendant la migration. La route de revue React `/home-preview` est **consultable**, `noindex`, et n'est pas la homepage publique. `/fr/home-preview` redirige vers `/home-preview`; `/en/home-preview`, `/de/home-preview` et `/no/home-preview` restent disponibles.

**Ne pas publier de nouveaux documents familiaux, identifiants personnels ou traductions non approuvées.**

## Démarrer

Pré-requis : outillage verrouillé par `mise.toml`, `mise.lock`, `package.json` et `package-lock.json`.

```bash
mise install
just install
just dev
```

`justfile` est l'interface principale ; `Makefile` subsiste pour compatibilité.

## Valider localement

```bash
just offline-l1
just offline-contracts
just source-check
just p0
just quality
```

Les contrôles `offline-*` ne prouvent pas le build ni la conformité complète. `just source-check` requiert les dépendances npm. `just publish` exige un checkout propre, un commit et une preuve au SHA exact. Les gates BetterLeaks, SAST/SCA, confidentialité, Playwright et ZAP restent obligatoires pour la publication. Ne pas relancer volontairement GitHub Actions lorsque les crédits sont épuisés.

## Sources de vérité

| Sujet | Source |
| --- | --- |
| Travaux ouverts, priorités, refactoring | [Roadmap](docs/roadmap.md) |
| Runbooks Git, CI, Vercel, diagnostics | [Opérations](docs/operations.md) |
| Parité React / HTML et critères de bascule | [Migration de la homepage](docs/homepage-migration-parity.md) |
| Publication des contenus familiaux et caviardage | [Confidentialité et publication](docs/publication-redaction.md) |
| Preuves et dettes SAST/SCA/ZAP | [Registre de sécurité](docs/security-audit-coverage-ledger.md) |
| Règles pour les agents | [AGENTS.md](AGENTS.md) |
| Contribuer et lancer les tests | [CONTRIBUTING.md](CONTRIBUTING.md) |

**Les historiques de PR, les commits et les rapports datés ne sont pas des instructions de reprise.** Pour les incidents reproductibles et les erreurs connues, utiliser le runbook.
