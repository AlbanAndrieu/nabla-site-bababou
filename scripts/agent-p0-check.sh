#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

VERBOSE=false
case "${1:-}" in
    --verbose)
        VERBOSE=true
        shift
        ;;
    -h | --help)
        cat <<'EOF'
Usage:
    bash scripts/agent-p0-check.sh [--verbose]

Default:
    compact dependency-free P0 checkpoint.

--verbose:
    preserve complete preflight and Node test-runner output for diagnosis.

Environment:
    P0_LOG_TAIL   maximum compact failure-summary lines (default: 12)
EOF
        exit 0
        ;;
    "")
        ;;
    *)
        printf '❌ unknown argument: %s\n' "$1" >&2
        exit 2
        ;;
esac

if (($# > 0)); then
    printf '❌ unexpected argument: %s\n' "$1" >&2
    exit 2
fi

P0_LOG_TAIL="${P0_LOG_TAIL:-12}"
if [[ ! "${P0_LOG_TAIL}" =~ ^[1-9][0-9]*$ ]]; then
    echo "❌ P0_LOG_TAIL must be a positive integer" >&2
    exit 2
fi

# shellcheck source=scripts/lib/agent-quality-support.sh
source scripts/lib/agent-quality-support.sh
LOG_TAIL="${P0_LOG_TAIL}"

P0_TESTS=(
    "unit-tests/ciScopeBehavior.test.ts"
    "unit-tests/agentOfflineContract.test.ts"
    "unit-tests/agentOfflineBase.test.mjs"
    "unit-tests/vercelNode24Layout.test.mjs"
    "unit-tests/ciSemgrepContract.test.ts"
    "unit-tests/security-pipeline-contract.test.ts"
    "unit-tests/justBetterleaksContract.test.ts"
    "unit-tests/daggerCiContract.test.ts"
    "unit-tests/legacyHtmlFallbackContract.test.ts"
    "unit-tests/ciScope.test.ts"
    "unit-tests/ciScopeCompactDiagnosticsContract.test.ts"
    "unit-tests/maintenanceScopeParity.test.ts"
    "unit-tests/generatedNextEnvContract.test.ts"
    "unit-tests/generatedNextEnvBehavior.test.ts"
    "unit-tests/textScaleContract.test.ts"
    "unit-tests/accessibilityKeyboardContract.test.ts"
    "unit-tests/accessibilityAxeContract.test.ts"
    "unit-tests/agentP0CompactOutputContract.test.ts"
    "unit-tests/localFirstPost202Parity.test.ts"
    "unit-tests/productionBaselineClassification.test.ts"
    "unit-tests/publicationPrivacyGateContract.test.ts"
    "unit-tests/privatePublicationAuditContract.test.ts"
    "unit-tests/privateConsolidationContract.test.ts"
    "unit-tests/executableScriptsContract.test.ts"
    "unit-tests/agentPreflightBehavior.test.ts"
    "unit-tests/agentPublishBehavior.test.ts"
    "unit-tests/agentQualityGate.test.ts"
    "unit-tests/agentQualityEfficiencyContract.test.ts"
    "unit-tests/dependencyAutomationContract.test.ts"
    "unit-tests/ciRunnerStartupContract.test.ts"
    "unit-tests/miseNpmContract.test.ts"
    "unit-tests/release-workflow-contract.test.ts"
    "unit-tests/nodeRuntimeCompatibility.test.ts"
    "unit-tests/toolingConvergence.test.ts"
    "unit-tests/vercel-build-policy.test.ts"
    "unit-tests/vercelPreviewCheckpointPublisher.test.ts"
    "unit-tests/ci-auto-preview-contract.test.ts"
    "unit-tests/vercel-preview-workflow.test.ts"
    "unit-tests/zap-preview-workflow-contract.test.ts"
    "unit-tests/opencodeAgentContract.test.ts"
    "unit-tests/migration-structure.test.ts"
    "unit-tests/verifySecurityAuditSkill.test.mjs"
)

if [[ "${VERBOSE}" == true ]]; then
    bash scripts/agent-quality-gate.sh --preflight
else
    run_compact_report "P0 Git preflight"         bash scripts/agent-quality-gate.sh --preflight
fi

require_supported_js_toolchain QG_P0

if [[ "${VERBOSE}" == true ]]; then
    node --experimental-strip-types --test "${P0_TESTS[@]}"
else
    log="$(mktemp)"
    trap 'rm -f "${log}"' EXIT

    set +e
    NO_COLOR=1 FORCE_COLOR=0         node --experimental-strip-types --test "${P0_TESTS[@]}" >"${log}" 2>&1
    rc=$?
    set -e

    if ((rc == 0)); then
        tests="$(awk '/^ℹ tests / {print $3; exit}' "${log}")"
        passed="$(awk '/^ℹ pass / {print $3; exit}' "${log}")"
        if [[ -n "${tests}" && -n "${passed}" ]]; then
            printf '✅ P0 offline contracts · %s/%s passed\n' "${passed}" "${tests}"
        else
            printf '✅ P0 offline contracts\n'
        fi
    else
        echo "❌ P0 offline contracts" >&2
        echo "--- compact failure summary ---" >&2
        awk -v max_lines="${P0_LOG_TAIL}" '
            function emit(line) {
                gsub(/\033\[[0-9;]*m/, "", line)
                if (length(line) > 280) {
                    line = substr(line, 1, 277) "..."
                }
                # Keep the most recent actionable errors and Node test totals.
                lines[matched % max_lines] = line
                matched++
            }
            END {
                start = matched > max_lines ? matched - max_lines : 0
                for (i = start; i < matched; i++) {
                    print lines[i % max_lines]
                }
            }
            /^test at / ||
            /^✖ / ||
            /^[[:space:]]*AssertionError/ ||
            /^[[:space:]]*(code|expected|operator):/ ||
            /^ℹ (tests|pass|fail|cancelled|skipped|todo) / {
                emit($0)
            }
        ' "${log}" >&2
        echo "--- end compact failure summary ---" >&2
        echo "ℹ️ diagnostic complet: bash scripts/agent-p0-check.sh --verbose" >&2
        exit "${rc}"
    fi

    rm -f "${log}"
    trap - EXIT
fi

echo "✅ local P0 checkpoint passed without node_modules."
