# Security

## Runtime and deployment boundary

- Production is a root Next.js application deployed through Vercel Git Integration.
- The local Vercel CLI, npm D3, Wrangler and unused browser observability SDK roots are intentionally retired.
- Bababou has no active Stripe SDK dependency; hosted payment result routes do not require one.
- Browser Vercel/Datadog analytics use the shared site analytics integration rather than root npm SDKs.
- OpenCommit is intentionally retained as dev-only commit tooling and is not part of the runtime bundle.

## Dependency supply-chain controls

- The Node.js package engine is `>=24.11.0 <27`; local development, agents and primary CI are pinned by `.nvmrc` to Node 26 Current (`v26.8.2`). Vercel production uses its supported Node 24.x runtime, which remains an explicit compatibility target rather than the development source of truth. Node 25 is EOL and must not be reintroduced.
- npm is constrained to `>=11.17.0 <12`.
- `.npmrc` enables `strict-allow-scripts=true`.
- Packages with reviewed install scripts are explicitly denied through `package.json#allowScripts`; any new install script must fail until reviewed.
- Never enable `dangerously-allow-all-scripts`.
- Keep the application dependency graph limited to packages with a proven runtime or build consumer.
- Routine version updates are owned by Renovate: npm runtime updates are grouped weekly, devDependencies monthly, and GitHub Actions/pre-commit maintenance monthly. npm releases must age 7 days before routine Renovate upgrades.
- Dependabot remains the vulnerability signal/security-fix path. The repository intentionally has no `.github/dependabot.yml`, so Dependabot version updates are not enabled alongside Renovate.
- Renovate vulnerability-alert and OSV PR generation stay disabled while Dependabot security updates own CVE remediation, preventing duplicate security PRs.

## Content/privacy boundary

- The repository privacy gate is part of the canonical quality checks.
- Family/legal publication rules are defined in `AGENTS.md` and the dedicated privacy skill; do not duplicate sensitive values in security documentation.
- `public/404.html` and the owner-controlled homepage have explicit repository policies that security refactors must preserve.

## Validation

- Ready PR Quality validates the current production base and canonical live smoke before dependency installation. Changed-source Semgrep runs before Node/npm only when source scope requires SAST; maintenance-only changes intentionally skip Semgrep, the production Next build and dependency scanning while still running lint/CSS/unit checks.
- Semgrep remains blocking whenever its source scope is active. SARIF publication to GitHub Code Scanning is opt-in because Code Scanning is currently disabled for this private repository. Successful scans do not retain a redundant SARIF workflow artifact when Code Scanning is disabled; a failed scan keeps `semgrep-sast-report` for 7 days for diagnosis. After enabling Code Scanning, set repository variable `ENABLE_CODE_SCANNING_SARIF=true`.
- Snyk runs only for dependency-scope Quality changes when `SNYK_TOKEN` is configured; otherwise it is skipped to avoid unnecessary process/download cost.
- Preview Playwright validates deploy-relevant PR revisions on the exact Vercel checkpoint SHA.
- Preview OWASP ZAP runs independently on the same exact checkpoint, uses the versioned `.zap/rules.tsv` policy, negotiates Vercel Automation Bypass with an OIDC trusted-source fallback, and reports H/M/L/Informational alert counts plus the top alert types.
- Production publishes independent `Production Post-deploy Smoke` and `Production DAST` statuses. Production DAST runs after successful Vercel production deployments, on demand, and daily against `www.bababou.com`.
- Pre-merge Quality requires a healthy production base with Vercel, `Production Post-deploy Smoke` and `Production DAST`; a metadata-only semantic-release commit may inherit its parent production baseline only under the strict bounded release-hop contract.
- `npm audit` is an advisory signal; review upgrades instead of applying blind `--force` fixes.
- Interpret CodeQL, dependency and deployment posture from current runs rather than historical vulnerability counts.

Secrets must never be committed. Use the minimum permissions required by each workflow and keep release/deployment credentials scoped to their task.
