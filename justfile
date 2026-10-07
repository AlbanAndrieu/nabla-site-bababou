# Additive aliases for local-first development. Keep the historical Makefile.
set shell := ["bash", "-euo", "pipefail", "-c"]

default:
    @just --list

hooks:
    mise run hooks

install:
    npm ci --no-audit --no-fund

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

publish-check:
    bash scripts/agent-publish.sh

publish-status:
    bash scripts/agent-publish.sh --status

# Canonical BetterLeaks wrapper; ignored private family/legal sources stay out.
secrets-staged:
    pre-commit run betterleaks-files

secrets-changed:
    bash scripts/run-betterleaks.sh changed

privacy-check:
    npm run privacy:check

privacy-publication:
    npm run privacy:publication
