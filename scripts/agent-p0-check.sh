#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

bash scripts/agent-quality-gate.sh --preflight

command -v node >/dev/null 2>&1 || {
    echo "❌ QG_P0_NODE_MISSING: node is required for the local P0 contracts" >&2
    exit 1
}

node --experimental-strip-types --test \
    unit-tests/ciScopeBehavior.test.ts \
    unit-tests/agentPreflightBehavior.test.ts \
    unit-tests/opencodeAgentContract.test.ts \
    unit-tests/dependencyAutomationContract.test.ts \
    unit-tests/migration-structure.test.ts

echo "✅ local P0 checkpoint passed without node_modules."
