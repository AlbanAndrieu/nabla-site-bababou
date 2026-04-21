# GitHub Actions setup

CI covers Playwright, optional Next.js checks, and other workflows under `.github/workflows/`.

## Workflows (current)

| Workflow | Purpose |
|----------|---------|
| `playwright.yml` | End-to-end tests against the static site |
| `weblate-sync.yml` | Manual **Next.js app verify** (`cd app && npm ci && npm run build`) |
| `mega-linter.yml`, `docker-build.yml`, `opencommit.yml`, … | Tooling as configured in each file |

## Vercel deployment

Production and preview deployments are normally driven by the **Vercel Git integration** (push and pull requests). The app lives in `app/` with `vercel.json` at the repo root setting `"rootDirectory": "app"`.

You do **not** need GitHub Actions secrets for Vercel unless you add a custom workflow that calls the Vercel CLI.

## Optional: Vercel CLI from Actions

If you later add a workflow that runs `vercel deploy`, configure these repository secrets:

### VERCEL_TOKEN

1. Vercel → Account → Tokens → Create token  
2. GitHub → Repository → Settings → Secrets and variables → Actions → New secret → name `VERCEL_TOKEN`

### VERCEL_ORG_ID and VERCEL_PROJECT_ID

After `vercel link` in the repo (or under `app/`):

```bash
cat .vercel/project.json
```

Copy `orgId` and `projectId` into secrets with the same names.

## Security

- Do not commit `.vercel/` or tokens  
- Rotate tokens periodically  
