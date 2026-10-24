# Canonical local-first developer interface. Keep Makefile only for legacy targets.
set shell := ["bash", "-euo", "pipefail", "-c"]

default:
    @just --list

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

dev:
    npm run dev

build:
    npm run build

test-unit:
    npm run test:unit

test-a11y:
    npm run test:a11y

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

publish-check:
    bash scripts/agent-publish.sh

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

# Validate pre-commit structural integrity without fetching or executing hooks.
# Uses PyYAML already supplied by the local pre-commit Python installation.
precommit-config-test:
    python3 -m py_compile scripts/quality/check-precommit-config.py
    python3 scripts/quality/check-precommit-config.py
    python3 -m unittest discover -s unit-tests -p 'test_precommit_integrity.py' -q

# Source-only functional inventory. Pending legacy integrations remain pending.
homepage-runtime-parity:
    node scripts/quality/homepage-runtime-parity.mjs
    node --test unit-tests/homepageRuntimeParity.test.mjs

# Dependency-free L1 fallback when GitHub, registries, or hooks are inaccessible.
offline-release:
    node --check scripts/ci/release-tag-bridge.mjs
    node --test unit-tests/releaseTagBridge.test.mjs

offline-draft-policy:
    node --check scripts/ci/check-draft-workflows.mjs
    node --test unit-tests/workflowDraftBudget.test.mjs
    node scripts/ci/check-draft-workflows.mjs

offline-contracts:
    node --test unit-tests/releaseTagBridge.test.mjs unit-tests/workflowDraftBudget.test.mjs unit-tests/agentOfflineBase.test.mjs unit-tests/vercelNode24Layout.test.mjs unit-tests/vercelIgnoredBuildSafety.test.mjs unit-tests/publicAssetScopeParity.test.mjs unit-tests/publicAssetRenameSafety.test.mjs unit-tests/ciScopeNullPaths.test.mjs unit-tests/gitPathDelimiterSafety.test.mjs unit-tests/agentUntrackedWhitespace.test.mjs unit-tests/agentScopeNullPaths.test.mjs unit-tests/gitScopeFailClosed.test.mjs unit-tests/homepageMigrationContract.test.mjs unit-tests/homepagePolicyNavigation.test.mjs unit-tests/siteUiConvergenceContract.test.mjs unit-tests/homepageRuntimeParity.test.mjs unit-tests/backToTopMotionContract.test.mjs unit-tests/homepageAssociationsParity.test.mjs unit-tests/mainContentRoute.test.mjs unit-tests/documentationNavigation.test.mjs
    node scripts/quality/homepage-runtime-parity.mjs
    node scripts/ci/check-draft-workflows.mjs

# TypeScript parser requires npm ci; not part of dependency-free offline-l1.
source-check:
    npm run check:jsx-attributes
    node --test unit-tests/jsxDuplicateAttributes.test.mjs unit-tests/siteUiConvergenceContract.test.mjs unit-tests/homepageRuntimeParity.test.mjs unit-tests/homepageAssociationsParity.test.mjs unit-tests/backToTopMotionContract.test.mjs unit-tests/mainContentRoute.test.mjs
    node scripts/quality/homepage-runtime-parity.mjs
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
