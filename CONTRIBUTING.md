# Contributing to nabla-site-bababou

Follow `AGENTS.md` as the canonical repository policy.

## Getting started

```bash
git clone https://github.com/AlbanAndrieu/nabla-site-bababou.git
cd nabla-site-bababou
npm ci
mise run hooks
```

Node.js local/CI is pinned through `.nvmrc` / `mise.toml`; the package engine remains compatible with the supported Vercel runtime.

## Development workflow

> Never write or push directly to `master`. Create a non-default branch and integrate changes through a pull request.

```bash
git checkout -b feature/your-change
npm run dev
```

Before publication:

```bash
bash scripts/quality-gate.sh
```

For focused checks, use the root scripts such as `npm run lint`, `npm run test:unit`, `npm run build`, or `npm test`.

OpenCommit remains available as an optional local helper:

```bash
npm run oco
# or
npm run opencommit
```

Commitlint remains authoritative. Use Conventional Commits such as `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `build:`, `perf:` and `revert:`.

## Project structure

```text
nabla-site-bababou/
├── app/                 # Next.js App Router
├── api/                 # Optional Vercel serverless handlers
├── public/              # Shared assets + retained legacy HTML during migration
├── messages/            # first-class next-intl catalogs
├── unit-tests/          # Node contract tests
├── tests/               # Playwright E2E tests
└── .github/             # GitHub workflows and repository instructions
```

Bababou remains hybrid while migration parity is being proven. Do not create a second npm/Next application under `public/`.

## Pull requests

- Keep changes focused and use one atomic commit for API-authored multi-file changes when practical.
- Preserve the owner-controlled homepage and protected `public/404.html` rules.
- Do not change family/legal publication or pseudonymization rules outside the explicit policy in `AGENTS.md`.
- For deploy-relevant changes, use the validated on-demand Vercel Preview checkpoint and exact-SHA Playwright flow.
- Update documentation and regression contracts when the repository architecture changes.

## Security

Never commit secrets or realistic credentials. `npm audit` is advisory; review dependency changes instead of applying blind `--force` upgrades.

## License

Contributions are licensed under the repository's **MIT License**.
