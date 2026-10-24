# Contribuer à nabla-site-bababou

Consulter d'abord [AGENTS.md](AGENTS.md) pour les règles Git, la confidentialité, les gates et les responsabilités des agents. La [roadmap](docs/roadmap.md) décrit les travaux ouverts ; le [runbook](docs/operations.md) explique leur validation.

## Préparer le dépôt

```bash
mise install
just install
just hooks
```

Utiliser les versions enregistrées dans `mise.toml`, `mise.lock` et `package-lock.json`. Conserver une `node_modules` et un répertoire `.next` propres à chaque worktree. Ne pas sourcer automatiquement `.envrc` ou des secrets de production pour un contrôle local.

## Développer

Travailler sur une branche différente de `master`. Préférer une PR Draft pendant les changements et conserver les protections CI. Le site est hybride ; ne pas créer un second projet Next.js sous `app/` ou `public/`. Préserver les URL historiques et les pages approuvées.

```bash
just dev
just offline-l1
just offline-contracts
just source-check
just p0
```

`just source-check` nécessite `npm ci`. Les tests unitaires complets utilisent `just unit`, les tests navigateur `npm test` et les tests accessibilité `just a11y`.

Avant une publication, revoir les changements déterministes produits par `just quality-fix`, committer seulement les fichiers intentionnels, puis exécuter `just quality` et `just publish` sur le HEAD propre. Un contrôle `offline-l1` réussi ne remplace pas BetterLeaks, SAST/SCA, Playwright ni ZAP.

Utiliser les conventions de commit (par exemple `fix:`, `refactor:`, `docs:`, `test:`). Ne pas utiliser `--no-verify`, `[skip ci]` ou de force-push sans nécessité et accord. Ne jamais fusionner automatiquement.

## Confidentialité

La homepage approuvée `public/index.html`, la 404 et les documents publiés ont des contrats de parité. Lire [publication-redaction.md](docs/publication-redaction.md) avant toute mutation de contenu familial ou juridique. Ne pas recopier les originaux privés dans les tests, prompts, logs ou artefacts.
