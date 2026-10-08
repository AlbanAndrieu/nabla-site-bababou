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
