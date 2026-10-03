#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

NEXT_ENV="next-env.d.ts"
NEXT_ENV_SNAPSHOT=""
NEXT_PID=""

snapshot_next_env() {
    if git ls-files --error-unmatch "${NEXT_ENV}" >/dev/null 2>&1 && [[ -f "${NEXT_ENV}" ]]; then
        NEXT_ENV_SNAPSHOT="$(mktemp)"
        cp "${NEXT_ENV}" "${NEXT_ENV_SNAPSHOT}"
    fi
}

# Invoked indirectly by the EXIT trap below.
# shellcheck disable=SC2329
restore_next_env() {
    if [[ -n "${NEXT_ENV_SNAPSHOT}" && -f "${NEXT_ENV_SNAPSHOT}" ]]; then
        cp "${NEXT_ENV_SNAPSHOT}" "${NEXT_ENV}"
        rm -f "${NEXT_ENV_SNAPSHOT}"
        NEXT_ENV_SNAPSHOT=""
    fi
}

# Invoked indirectly by the INT/TERM traps below.
# shellcheck disable=SC2329
terminate_next() {
    local signal="$1"
    local exit_code="$2"

    trap - "${signal}"
    if [[ -n "${NEXT_PID}" ]] && kill -0 "${NEXT_PID}" 2>/dev/null; then
        kill "-${signal}" "${NEXT_PID}" 2>/dev/null || true
        wait "${NEXT_PID}" 2>/dev/null || true
    fi
    NEXT_PID=""
    exit "${exit_code}"
}

snapshot_next_env
trap restore_next_env EXIT
trap 'terminate_next INT 130' INT
trap 'terminate_next TERM 143' TERM

npx next "$@" &
NEXT_PID=$!

set +e
wait "${NEXT_PID}"
status=$?
set -e

NEXT_PID=""
exit "${status}"
