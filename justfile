# Canonical local-first developer interface. Keep Makefile only for legacy targets.
set shell := ["bash", "-euo", "pipefail", "-c"]

default:
    @just --list

# Plan local en lecture seule, sans téléchargement.
agent-plan:
    node scripts/agent/capability-plan.mjs --json

agent-isolated-plan:
    node scripts/agent/capability-plan.mjs --mode isolated --json

# Exécution seulement si checkout complet et outils réellement accessibles.
agent-verify tier="p0":
    node scripts/agent/capability-plan.mjs --mode workstation --tier "{{tier}}" --run

hooks:
    mise run hooks

toolchain-check:
    bash scripts/verify-mise-npm.sh

install:
    npm ci --no-audit --no-fund

# Project and publication checks use the existing npm and security contracts.
check:
    npm run check

lint:
    npm run lint
    npm run lint:css

typecheck:
    npm run typecheck

unit:
    npm run test:unit

a11y:
    npm run test:a11y

# Local-only homepage gate. --no prevents npm from downloading missing tools.
# Browser binaries and node_modules must already exist in the checkout.
homepage-validation:
    npm exec --no -- playwright test tests/home-preview.spec.ts tests/home-preview-analytics-network.spec.ts tests/next-seo.spec.ts tests/accessibility-axe.spec.ts tests/accessibility-keyboard.spec.ts tests/accessibility-responsive.spec.ts --project=chromium --project=firefox --project=webkit

# Enumerate the selected tests without starting Next or a browser.
homepage-validation-list:
    npm exec --no -- playwright test --list tests/home-preview.spec.ts tests/home-preview-analytics-network.spec.ts tests/next-seo.spec.ts tests/accessibility-axe.spec.ts tests/accessibility-keyboard.spec.ts tests/accessibility-responsive.spec.ts

# Explicit local release gate; never spends GitHub Actions minutes.
# Requires a SHA-approved Next build already in .next/ and preinstalled browsers.
# CI=1 makes Playwright serve that production build via npm run start:test.
home-cutover-verify:
    node scripts/verify-home-cutover.mjs .next/prerender-manifest.json
    CI=1 BABABOU_HOME_REQUIRE_E2E=true npm exec --no -- playwright test tests/homepage-cutover.spec.ts --project=chromium --project=firefox --project=webkit

dev:
    npm run dev

build:
    npm run build

# Never contact CI; fail closed before expensive local Next checks.
# Requires an existing npm ci installation from the committed lockfile.
# Node 22/npm 10: dependency-free JavaScript contracts only. No install, Next or CI.
agent-local-tests:
    npm run test:agent-local

agent-local-build:
    node scripts/quality/agent-local-build-preflight.mjs
    npm run check

alias test-unit := unit

alias test-a11y := a11y

preflight:
    bash scripts/agent-quality-gate.sh --preflight

p0:
    bash scripts/agent-p0-check.sh

quality-fix:
    npm run quality:agent:fix

quality:
    npm run quality:agent

publish:
    bash scripts/agent-publish.sh

alias publish-check := publish

publish-status:
    bash scripts/agent-publish.sh --status

# Audit the complete workflow baseline without needing a deployment.
# These two hooks remain mandatory in the CI quality job.
workflow-audit:
    pre-commit run actionlint --all-files
    pre-commit run zizmor --all-files

# Read-only runner triage; never consumes a new GitHub Actions job.
ci-diagnose run_id:
    bash scripts/ci/diagnose-actions-startup.sh AlbanAndrieu/nabla-site-bababou "{{run_id}}"

# Keep historical make recipes available, without making them canonical.
legacy-help:
    make help

# Secret scanning is local-first. Private ignored family/legal source files are not staged.
secrets-config:
    betterleaks config check .betterleaks.toml

secrets-staged:
    betterleaks git --pre-commit --staged --redact --config .betterleaks.toml

secrets-worktree:
    betterleaks git --pre-commit --redact --config .betterleaks.toml

secrets-history:
    betterleaks git . --redact --config .betterleaks.toml

privacy-check:
    npm run privacy:check

privacy-publication:
    npm run privacy:publication

# Opt-in Dagger CI spike. The same wrapper is used locally and by dagger-spike.yml.
dagger-p0:
    bash scripts/dagger-ci.sh p0

dagger-quality-preflight:
    bash scripts/dagger-ci.sh quality-preflight

dagger-test:
    bash scripts/dagger-ci.sh test

dagger-build:
    bash scripts/dagger-ci.sh build

# Explicitly opt-in; two equivalent runs, not a claim of cold/warm cache parity.
dagger-benchmark:
    bash scripts/dagger-benchmark.sh p0

# Fast offline checks during iteration; not a substitute for just quality/publish.
# Mirrors the bounded local-first feedback pattern from nabla-compose.
loop:
    just offline-l1
    just precommit-config-test
    just offline-contracts

# Local-only source footprint (Git-tracked files, KiB and line counts; no CI).
code-footprint top="15":
    node scripts/quality/source-footprint.mjs --top "{{top}}"

code-footprint-test:
    node --test unit-tests/sourceFootprint.test.mjs

# Dependency-free documentation, script-entrypoint and roadmap parity audit.
docs-audit:
    node scripts/quality/docs-roadmap-consistency.mjs

# Read-only SSG/ISR/Function audit, adapted from nabla-site-alban; no API or CPU estimate.
vercel-runtime-audit:
    node scripts/audit-vercel-runtime.mjs

vercel-runtime-test:
    node --test unit-tests/vercelRuntimeAudit.test.mjs

# Read-only Vercel WAF snapshots: no network calls or raw rule output.
waf-snapshot-inventory file:
    node scripts/security/vercel-waf-snapshot-audit.mjs inventory "{{file}}"

# Strict acceptance: exit 2 while SQLi/XSS/RCE or rate limit are unverified.
waf-snapshot-verify file:
    node scripts/security/vercel-waf-snapshot-audit.mjs enforce "{{file}}"

waf-snapshot-test:
    node --test unit-tests/vercelWafSnapshotAudit.test.mjs

# Validate the bounded public ZAP SARIF producer without starting ZAP or CI.
zap-report-privacy-test:
    node --test unit-tests/zapSafeReportProducer.test.mjs unit-tests/productionDastHttp402.test.mjs unit-tests/vercelMitigationGates.test.mjs unit-tests/zapSafeReportProducer.test.mjs

# Validate pre-commit structural integrity without fetching or executing hooks.
# Uses PyYAML already supplied by the local pre-commit Python installation.
precommit-config-test:
    python3 -m py_compile scripts/quality/check-precommit-config.py
    python3 scripts/quality/check-precommit-config.py
    python3 -m unittest discover -s unit-tests -p 'test_precommit_integrity.py' -q

# Source-only functional inventory. Pending legacy integrations remain pending.
homepage-runtime-parity:
    node scripts/quality/homepage-runtime-parity.mjs
    node scripts/quality/homepage-preview-links.mjs
    node --test unit-tests/homepageRuntimeParity.test.mjs unit-tests/homepagePreviewLinks.test.mjs

# Dependency-free L1 fallback when GitHub, registries, or hooks are inaccessible.
offline-release:
    node --check scripts/ci/release-tag-bridge.mjs
    node --test unit-tests/releaseTagBridge.test.mjs

offline-draft-policy:
    node --check scripts/ci/check-draft-workflows.mjs
    node --test unit-tests/workflowDraftBudget.test.mjs
    node scripts/ci/check-draft-workflows.mjs

offline-contracts:
    node --test unit-tests/releaseTagBridge.test.mjs unit-tests/workflowDraftBudget.test.mjs unit-tests/agentOfflineBase.test.mjs unit-tests/vercelNode24Layout.test.mjs unit-tests/vercelIgnoredBuildSafety.test.mjs unit-tests/publicAssetScopeParity.test.mjs unit-tests/publicAssetRenameSafety.test.mjs unit-tests/ciScopeNullPaths.test.mjs unit-tests/gitPathDelimiterSafety.test.mjs unit-tests/agentUntrackedWhitespace.test.mjs unit-tests/agentScopeNullPaths.test.mjs unit-tests/gitScopeFailClosed.test.mjs unit-tests/homepageMigrationContract.test.mjs unit-tests/homepagePolicyNavigation.test.mjs unit-tests/siteUiConvergenceContract.test.mjs unit-tests/homepageRuntimeParity.test.mjs unit-tests/homepagePreviewLinks.test.mjs unit-tests/backToTopMotionContract.test.mjs unit-tests/homepageAssociationsParity.test.mjs unit-tests/mainContentRoute.test.mjs unit-tests/routeRegistryContract.test.mjs unit-tests/policyIndexTranslations.test.mjs unit-tests/policyRouteOwnership.test.mjs unit-tests/homePreviewControlsContract.test.mjs unit-tests/publicHomeReviewContract.test.mjs unit-tests/homepageGalleryParity.test.mjs unit-tests/agentLocalBuildPreflight.test.mjs unit-tests/analyticsLocalHost.test.mjs unit-tests/documentationNavigation.test.mjs unit-tests/vercelWafSnapshotAudit.test.mjs
    node scripts/quality/homepage-runtime-parity.mjs
    node scripts/quality/homepage-preview-links.mjs
    node scripts/ci/check-draft-workflows.mjs
    node --test unit-tests/sourceFootprint.test.mjs
    just docs-audit

# TypeScript parser requires npm ci; not part of dependency-free offline-l1.
source-check:
    npm run check:jsx-attributes
    node --test unit-tests/jsxDuplicateAttributes.test.mjs unit-tests/siteUiConvergenceContract.test.mjs unit-tests/homepageRuntimeParity.test.mjs unit-tests/homepagePreviewLinks.test.mjs unit-tests/homepageAssociationsParity.test.mjs unit-tests/backToTopMotionContract.test.mjs unit-tests/mainContentRoute.test.mjs unit-tests/routeRegistryContract.test.mjs unit-tests/policyIndexTranslations.test.mjs unit-tests/policyRouteOwnership.test.mjs unit-tests/homePreviewControlsContract.test.mjs unit-tests/publicHomeReviewContract.test.mjs unit-tests/homepageGalleryParity.test.mjs unit-tests/agentLocalBuildPreflight.test.mjs unit-tests/analyticsLocalHost.test.mjs
    node scripts/quality/homepage-runtime-parity.mjs
    node scripts/quality/homepage-preview-links.mjs
    @echo "QG_SOURCE_CHECK_OK: targeted source tests only; build and publication NOT_RUN"

offline-l1:
    bash scripts/agent-offline-check.sh

# Require the Git comparison base to exist and to be an ancestor.
# This is a PR readiness diagnostic, not a CI replacement.
offline-pr:
    AGENT_OFFLINE_REQUIRE_BASE=1 bash scripts/agent-offline-check.sh

offline-base-test:
    node --check unit-tests/agentOfflineBase.test.mjs
    node --test unit-tests/agentOfflineBase.test.mjs

# Offline provenance check, requires an already downloaded official upstream checkout.
audit-skill-verify upstream:
    node scripts/verify-security-audit-skill.mjs "{{upstream}}"

audit-skill-test:
    node --test unit-tests/verifySecurityAuditSkill.test.mjs
