# Security

## Runtime and deployment boundary

- Production is a root Next.js application deployed through Vercel Git Integration.
- The local Vercel CLI, npm D3, Wrangler and unused browser observability SDK roots are intentionally retired.
- Bababou has no active Stripe SDK dependency; hosted payment result routes do not require one.
- Browser Vercel/Datadog analytics use the shared site analytics integration rather than root npm SDKs.
- OpenCommit is intentionally retained as dev-only commit tooling and is not part of the runtime bundle.

## Dependency supply-chain controls

- Node.js is constrained to `>=24.11.0 <25`.
- npm is constrained to `>=11.17.0 <12`.
- `.npmrc` enables `strict-allow-scripts=true`.
- Packages with reviewed install scripts are explicitly denied through `package.json#allowScripts`; any new install script must fail until reviewed.
- Never enable `dangerously-allow-all-scripts`.
- Keep the application dependency graph limited to packages with a proven runtime or build consumer.

## Content/privacy boundary

- The repository privacy gate is part of the canonical quality checks.
- Family/legal publication rules are defined in `AGENTS.md` and the dedicated privacy skill; do not duplicate sensitive values in security documentation.
- `public/404.html` and the owner-controlled homepage have explicit repository policies that security refactors must preserve.

## Validation

- `CI (Quality and Security)` runs a changed-source Semgrep SAST before Node/npm setup, then lint, route type generation, type-check, unit/privacy checks and the production Next build. Semgrep itself is blocking. SARIF publication to GitHub Code Scanning is opt-in because Code Scanning is currently disabled for this private repository; the `semgrep-sast-report` artifact is always retained when SARIF is produced. After enabling Code Scanning, set repository variable `ENABLE_CODE_SCANNING_SARIF=true`.
- Snyk runs when `SNYK_TOKEN` is configured.
- Preview Playwright validates deploy-relevant PR revisions on the exact Vercel checkpoint SHA.
- Preview OWASP ZAP runs independently on the same exact checkpoint, uses the versioned `.zap/rules.tsv` policy, negotiates Vercel Automation Bypass with an OIDC trusted-source fallback, and reports H/M/L/Informational alert counts plus the top alert types.
- Production publishes independent `Production Post-deploy Smoke` and `Production DAST` statuses. Production DAST runs after successful Vercel production deployments, on demand, and daily against `www.bababou.com`.
- The first post-merge production DAST/smoke statuses must be observed before promoting them to mandatory pre-merge base-health requirements.
- `npm audit` is an advisory signal; review upgrades instead of applying blind `--force` fixes.
- Interpret CodeQL, dependency and deployment posture from current runs rather than historical vulnerability counts.

Secrets must never be committed. Use the minimum permissions required by each workflow and keep release/deployment credentials scoped to their task.
