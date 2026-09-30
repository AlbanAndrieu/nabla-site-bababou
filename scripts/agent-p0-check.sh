#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

bash scripts/agent-quality-gate.sh --preflight

# shellcheck source=scripts/lib/agent-quality-support.sh
source scripts/lib/agent-quality-support.sh
require_supported_js_toolchain QG_P0

node --experimental-strip-types --test \
    unit-tests/ciScopeBehavior.test.ts \
    unit-tests/maintenanceScopeParity.test.ts \
    unit-tests/agentPreflightBehavior.test.ts \
    unit-tests/agentPublishBehavior.test.ts \
    unit-tests/agentQualityGate.test.ts \
    unit-tests/dependencyAutomationContract.test.ts \
    unit-tests/nodeRuntimeCompatibility.test.ts \
    unit-tests/toolingConvergence.test.ts \
    unit-tests/vercel-build-policy.test.ts \
    unit-tests/vercelPreviewCheckpointPublisher.test.ts \
    unit-tests/ci-auto-preview-contract.test.ts \
    unit-tests/vercel-preview-workflow.test.ts \
    unit-tests/zap-preview-workflow-contract.test.ts \
    unit-tests/opencodeAgentContract.test.ts \
    unit-tests/migration-structure.test.ts

echo "✅ local P0 checkpoint passed without node_modules."
