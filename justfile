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

# Dependency-free L1 fallback when GitHub, registries, or hooks are inaccessible.
offline-release:
    node --check scripts/ci/release-tag-bridge.mjs
    node --test unit-tests/releaseTagBridge.test.mjs

offline-draft-policy:
    node --check scripts/ci/check-draft-workflows.mjs
    node --test unit-tests/workflowDraftBudget.test.mjs
    node scripts/ci/check-draft-workflows.mjs

offline-contracts:
    node --test unit-tests/releaseTagBridge.test.mjs unit-tests/workflowDraftBudget.test.mjs
    node scripts/ci/check-draft-workflows.mjs

offline-l1:
    bash scripts/agent-offline-check.sh

# Offline provenance check, requires an already downloaded official upstream checkout.
audit-skill-verify upstream:
    node scripts/verify-security-audit-skill.mjs "{{upstream}}"

audit-skill-test:
    node --test unit-tests/verifySecurityAuditSkill.test.mjs
