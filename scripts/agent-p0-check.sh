#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

bash scripts/agent-quality-gate.sh --preflight

command -v node >/dev/null 2>&1 || {
    echo "❌ QG_P0_NODE_MISSING: node is required for the local P0 contracts" >&2
    exit 1
}

node_version="$(node -p 'process.versions.node')"
IFS=. read -r node_major node_minor _ <<<"${node_version}"
if ((node_major < 24 || node_major >= 27 || (node_major == 24 && node_minor < 11))); then
    printf '❌ QG_P0_NODE_VERSION: Node %s is outside repository engines >=24.11.0 <27\n' \
        "${node_version}" >&2
    exit 1
fi

node --experimental-strip-types --test \
    unit-tests/ciScopeBehavior.test.ts \
    unit-tests/agentPreflightBehavior.test.ts \
    unit-tests/agentPublishBehavior.test.ts \
    unit-tests/agentQualityGate.test.ts \
    unit-tests/opencodeAgentContract.test.ts \
    unit-tests/dependencyAutomationContract.test.ts \
    unit-tests/migration-structure.test.ts

echo "✅ local P0 checkpoint passed without node_modules."
