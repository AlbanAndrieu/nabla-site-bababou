# shellcheck shell=bash
# shellcheck disable=SC2034
# Shared mechanics for scripts/agent-quality-gate.sh and scripts/agent-publish.sh.
# This file is sourced; it is intentionally not executable and does not own
# formatter, linter, privacy, build or publication policy.

print_agent_quality_usage() {
    cat <<'EOF'
Usage:
    bash scripts/agent-quality-gate.sh [--fix|--preflight|--publish]

Modes:
    default      strict deterministic pre-build validation
    --fix        converge deterministic pre-commit + npm lint auto-fixes locally
    --preflight  dependency-free branch/diff/untracked-whitespace/shell/Python/code-size checks plus local CI/Preview worktree scope
    --publish    strict pre-build gate plus clean-tree publication validation

Environment:
    QUALITY_BASE_REF                    override comparison base
    QUALITY_LOG_TAIL                    failure log lines to print (default: 12)
    QUALITY_FIX_PASSES                  maximum local pre-commit fix passes (default: 12)
    QUALITY_CANONICAL_GATE_VERIFIED=1   CI-only: canonical gate already passed in this job
    QUALITY_ALLOW_LARGE_DELETION=1      acknowledge an intentional large truncation
EOF
}

resolve_base_ref() {
    if [[ -n "${QUALITY_BASE_REF:-}" ]]; then
        printf '%s\n' "${QUALITY_BASE_REF}"
    elif git symbolic-ref --quiet refs/remotes/origin/HEAD >/dev/null 2>&1; then
        git symbolic-ref --quiet --short refs/remotes/origin/HEAD
    elif git rev-parse --verify origin/main >/dev/null 2>&1; then
        printf '%s\n' "origin/main"
    elif git rev-parse --verify origin/master >/dev/null 2>&1; then
        printf '%s\n' "origin/master"
    elif git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
        printf '%s\n' "HEAD~1"
    else
        printf '%s\n' "HEAD"
    fi
}

run_compact() {
    local label="$1"
    shift
    local log
    local rc
    log="$(mktemp)"
    if "$@" >"${log}" 2>&1; then
        rm -f "${log}"
        printf '✅ %s\n' "${label}"
        return 0
    else
        rc=$?
    fi
    printf '❌ %s\n' "${label}" >&2
    tail -n "${LOG_TAIL}" "${log}" >&2 || true
    rm -f "${log}"
    return "${rc}"
}

run_compact_report() {
    local label="$1"
    shift
    local log
    local rc
    log="$(mktemp)"
    if "$@" >"${log}" 2>&1; then
        grep -E '^(WARNING |Code-size gate:)' "${log}" || true
        rm -f "${log}"
        printf '✅ %s\n' "${label}"
        return 0
    else
        rc=$?
    fi
    printf '❌ %s\n' "${label}" >&2
    tail -n "${LOG_TAIL}" "${log}" >&2 || true
    rm -f "${log}"
    return "${rc}"
}

require_supported_js_toolchain() {
    local error_prefix="${1:-QG_TOOLCHAIN}"
    local node_version
    local npm_version
    local node_major
    local node_minor
    local npm_major
    local npm_minor

    command -v node >/dev/null 2>&1 || {
        printf '❌ %s_NODE_MISSING: node is required; activate the repository toolchain with mise\n' \
            "${error_prefix}" >&2
        return 1
    }
    command -v npm >/dev/null 2>&1 || {
        printf '❌ %s_NPM_MISSING: npm is required; activate the repository toolchain with mise\n' \
            "${error_prefix}" >&2
        return 1
    }

    if ! node_version="$(node -p 'process.versions.node' 2>/dev/null)" ||
        [[ ! "${node_version}" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
        printf '❌ %s_NODE_VERSION: unable to read a valid Node version\n' \
            "${error_prefix}" >&2
        return 1
    fi
    node_major="${BASH_REMATCH[1]}"
    node_minor="${BASH_REMATCH[2]}"

    if ! npm_version="$(npm --version 2>/dev/null)" ||
        [[ ! "${npm_version}" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
        printf '❌ %s_NPM_VERSION: unable to read a valid npm version\n' \
            "${error_prefix}" >&2
        return 1
    fi
    npm_major="${BASH_REMATCH[1]}"
    npm_minor="${BASH_REMATCH[2]}"

    if ((node_major < 24 || node_major >= 27 || (node_major == 24 && node_minor < 11))); then
        printf '❌ %s_NODE_VERSION: Node %s is outside repository engines >=24.11.0 <27\n' \
            "${error_prefix}" "${node_version}" >&2
        return 1
    fi
    if ((npm_major < 11 || npm_major >= 12 || (npm_major == 11 && npm_minor < 17))); then
        printf '❌ %s_NPM_VERSION: npm %s is outside repository engines >=11.17.0 <12\n' \
            "${error_prefix}" "${npm_version}" >&2
        return 1
    fi

    printf '✅ supported Node/npm toolchain: node=%s npm=%s\n' \
        "${node_version}" "${npm_version}"
}

collect_changed_files() {
    {
        if [[ "${BASE_REF}" != "HEAD" ]] && git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
            git diff --name-only --diff-filter=ACMR "${BASE_REF}...HEAD"
        fi
        git diff --name-only --diff-filter=ACMR
        git diff --cached --name-only --diff-filter=ACMR
        git ls-files --others --exclude-standard
    } |
        awk 'NF' |
        sort -u |
        while IFS= read -r file; do
            [[ -f "${file}" ]] && printf '%s\n' "${file}"
        done
}

collect_deleted_files() {
    {
        if [[ "${BASE_REF}" != "HEAD" ]] && git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
            git diff --name-only --diff-filter=D "${BASE_REF}...HEAD"
        fi
        git diff --name-only --diff-filter=D
        git diff --cached --name-only --diff-filter=D
    } |
        awk 'NF' |
        sort -u
}

workspace_fingerprint() {
    local file
    {
        git diff --binary
        git diff --cached --binary
        git status --porcelain=v1 --untracked-files=all
        while IFS= read -r file; do
            [[ -f "${file}" ]] || continue
            printf 'file:%s\n' "${file}"
            sha256sum "${file}"
        done < <(collect_changed_files)
    } | sha256sum | awk '{print $1}'
}

classify_changed_files() {
    local file
    agent_gate_changed=false
    javascript_lint_all=false
    stylelint_all=false
    AGENT_GATE_SHELL_FILES=()
    JAVASCRIPT_LINT_FILES=()
    STYLELINT_FILES=()

    for file in "$@"; do
        case "${file}" in
            scripts/agent-quality-gate.sh | scripts/agent-p0-check.sh | scripts/agent-publish.sh | scripts/lib/agent-quality-support.sh)
                agent_gate_changed=true
                AGENT_GATE_SHELL_FILES+=("${file}")
                ;;
        esac
        case "${file}" in
            eslint.config.js)
                javascript_lint_all=true
                ;;
            *.js | *.jsx | *.mjs | *.cjs | *.ts | *.tsx)
                JAVASCRIPT_LINT_FILES+=("${file}")
                ;;
        esac
        case "${file}" in
            stylelint.config.cjs)
                stylelint_all=true
                ;;
            *.css)
                STYLELINT_FILES+=("${file}")
                ;;
        esac
    done
}
