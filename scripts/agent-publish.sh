#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

MODE="publish"
case "${1:-}" in
    "")
        ;;
    --status)
        MODE="status"
        ;;
    *)
        printf '❌ QG_PUBLISH_ARGUMENT_INVALID: %s\n' "${1}" >&2
        exit 2
        ;;
esac
if (($# > 1)); then
    printf '❌ QG_PUBLISH_ARGUMENT_INVALID: unexpected extra arguments\n' >&2
    exit 2
fi

resolve_protected_branch() {
    if git symbolic-ref --quiet refs/remotes/origin/HEAD >/dev/null 2>&1; then
        git symbolic-ref --quiet --short refs/remotes/origin/HEAD |
            sed 's#^origin/##'
    else
        printf '%s\n' "master"
    fi
}

CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
    printf '%s\n' \
        '❌ QG_PUBLISH_DETACHED_HEAD: publication requires a named non-default branch' >&2
    exit 1
fi
PROTECTED_BRANCH="$(resolve_protected_branch)"
if [[ "${CURRENT_BRANCH}" == "${PROTECTED_BRANCH}" ]]; then
    printf '❌ QG_PUBLISH_PROTECTED_BRANCH: refusing publication on %s\n' \
        "${CURRENT_BRANCH}" >&2
    exit 1
fi

# shellcheck source=scripts/lib/agent-quality-support.sh
source scripts/lib/agent-quality-support.sh

LOG_TAIL="${QUALITY_LOG_TAIL:-40}"
BASE_REF="$(resolve_base_ref)"

tool_version_or_fail() {
    local label="$1"
    shift
    local value

    if ! command -v "$1" >/dev/null 2>&1; then
        printf '❌ QG_PUBLISH_TOOL_MISSING: required tool %s is unavailable\n' "${label}" >&2
        return 1
    fi
    if ! value="$("$@" 2>&1)"; then
        printf '❌ QG_PUBLISH_TOOL_INVALID: failed to query %s version\n' "${label}" >&2
        return 1
    fi
    printf '%s\n' "${value}"
}

toolchain_fingerprint() {
    local node_version
    local npm_version
    local python_version
    local precommit_version

    node_version="$(tool_version_or_fail node node --version)" || return 1
    npm_version="$(tool_version_or_fail npm npm --version)" || return 1
    python_version="$(tool_version_or_fail python3 python3 --version)" || return 1
    precommit_version="$(tool_version_or_fail pre-commit pre-commit --version)" || return 1

    {
        printf 'node=%s\n' "${node_version}"
        printf 'npm=%s\n' "${npm_version}"
        printf 'python=%s\n' "${python_version}"
        printf 'pre-commit=%s\n' "${precommit_version}"
        if [[ -f node_modules/.package-lock.json ]]; then
            printf 'node-modules-lock='
            sha256sum node_modules/.package-lock.json | awk '{print $1}'
        else
            printf 'node-modules-lock=missing\n'
        fi
    } | sha256sum | awk '{print $1}'
}

if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
    printf '❌ QG_PUBLISH_BASE_MISSING: comparison base %s is unavailable\n' "${BASE_REF}" >&2
    exit 1
fi
if ! git merge-base --is-ancestor "${BASE_REF}" HEAD; then
    printf '❌ QG_PUBLISH_BASE_STALE: HEAD does not contain %s; fetch/rebase before publishing\n' "${BASE_REF}" >&2
    exit 1
fi

STATUS="$(git status --short)"
if [[ -n "${STATUS}" ]]; then
    echo "❌ QG_PUBLISH_DIRTY: commit the intended batch before publication validation." >&2
    printf '%s\n' "${STATUS}" >&2
    exit 1
fi

for command_name in node npm python3 pre-commit; do
    command -v "${command_name}" >/dev/null 2>&1 || {
        printf '❌ QG_PUBLISH_TOOL_MISSING: %s is required\n' "${command_name}" >&2
        exit 1
    }
done
if [[ ! -d node_modules ]]; then
    echo "❌ QG_PUBLISH_DEPS_MISSING: run 'npm ci --no-audit --no-fund' first" >&2
    exit 1
fi

HEAD_SHA="$(git rev-parse HEAD)"
BASE_SHA="$(git rev-parse "${BASE_REF}^{commit}")"
if ! TOOLCHAIN_SHA="$(toolchain_fingerprint)"; then
    echo "❌ QG_PUBLISH_TOOLCHAIN_INVALID: cannot compute a trustworthy toolchain fingerprint" >&2
    exit 1
fi
PROOF_VERSION="v2"
PROOF_KEY="${PROOF_VERSION}|${HEAD_SHA}|${BASE_SHA}|${TOOLCHAIN_SHA}"
PROOF_FILE="$(git rev-parse --git-path agent-publication-proof)"

if [[ "${MODE}" == "status" ]]; then
    if [[ ! -f "${PROOF_FILE}" ]]; then
        printf '%s\n' \
            '❌ QG_PUBLISH_PROOF_MISSING: no strict publication proof exists' >&2
        exit 1
    fi
    if [[ "$(cat "${PROOF_FILE}")" != "${PROOF_KEY}" ]]; then
        printf '%s\n' \
            '❌ QG_PUBLISH_PROOF_STALE: HEAD/base/toolchain changed' >&2
        exit 1
    fi
    printf '✅ QG_PUBLISH_PROOF_OK\n'
    printf 'head=%s\n' "${HEAD_SHA}"
    printf 'base=%s\n' "${BASE_SHA}"
    printf 'toolchain_sha=%s\n' "${TOOLCHAIN_SHA}"
    exit 0
fi

if [[ "${QUALITY_FORCE_PUBLISH:-0}" != "1" && -f "${PROOF_FILE}" ]] &&
    [[ "$(cat "${PROOF_FILE}")" == "${PROOF_KEY}" ]]; then
    echo "✅ QG_PUBLISH_PROOF_REUSED: HEAD/base/toolchain unchanged; strict publication gate already passed."
    exit 0
fi

QUALITY_BASE_REF="${BASE_SHA}" bash scripts/agent-quality-gate.sh --publish

scope_output="$(bash scripts/ci-scope.sh "${BASE_SHA}" HEAD)"
printf '%s\n' "${scope_output}"
build="$(awk -F= '$1 == "build" { print $2; exit }' <<<"${scope_output}")"

case "${build}" in
    true)
        run_compact "Next.js production build" npm run build
        run_compact "built-output privacy gate" npm run privacy:check:build
        ;;
    false)
        echo "✅ non-build publication scope; Next build intentionally skipped"
        ;;
    *)
        printf '❌ QG_PUBLISH_SCOPE_INVALID: ci-scope returned build=%s\n' "${build:-missing}" >&2
        exit 1
        ;;
esac

STATUS="$(git status --short)"
if [[ -n "${STATUS}" ]]; then
    echo "❌ QG_PUBLISH_DIRTY_AFTER_CHECKS: tracked workspace changed during publication validation." >&2
    printf '%s\n' "${STATUS}" >&2
    exit 1
fi

mkdir -p "$(dirname "${PROOF_FILE}")"
PROOF_TMP="$(mktemp "${PROOF_FILE}.XXXXXX")"
trap 'rm -f "${PROOF_TMP}"' EXIT
printf '%s\n' "${PROOF_KEY}" >"${PROOF_TMP}"
mv "${PROOF_TMP}" "${PROOF_FILE}"
trap - EXIT

echo "✅ QG_PUBLISH_PROOF_WRITTEN: strict publication proof cached for this HEAD/base/toolchain."
