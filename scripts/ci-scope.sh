#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

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

BASE_REF="${1:-$(resolve_base_ref)}"
HEAD_REF="${2:-HEAD}"

if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
    printf '❌ CI_SCOPE_BASE_MISSING: %s\n' "${BASE_REF}" >&2
    exit 1
fi
if ! git rev-parse --verify "${HEAD_REF}^{commit}" >/dev/null 2>&1; then
    printf '❌ CI_SCOPE_HEAD_MISSING: %s\n' "${HEAD_REF}" >&2
    exit 1
fi

mapfile -t CHANGED_FILES < <(
    git diff --name-only --diff-filter=ACMRD "${BASE_REF}" "${HEAD_REF}" |
        awk 'NF' |
        sort -u
)

is_source_file() {
    case "$1" in
        *.cjs | *.js | *.jsx | *.mjs | *.py | *.ts | *.tsx)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

is_maintenance_only_path() {
    case "$1" in
        docs/* | unit-tests/* | tests/* | *.md | \
            .github/* | .zap/* | .vscode/* | .idea/* | .agents/* | .cursor/* | .claude/* | \
            .assetsignore | .pre-commit-config.yaml | .pre-commit-pre-push.yaml | .python-version | \
            mise.toml | eslint.config.js | stylelint.config.cjs | commitlint.config.* | playwright.config.* | \
            scripts/agent-quality-gate.sh | scripts/agent-publish.sh | scripts/lib/agent-quality-support.sh | \
            scripts/quality-gate.sh | scripts/ci-scope.sh | scripts/verify-production-baseline.sh | \
            scripts/verify-production-live.sh | scripts/ci-performance-budget.sh | \
            scripts/publish-vercel-preview-checkpoint.sh | scripts/check_code_size.py | \
            scripts/eslint-github-formatter.mjs)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

is_preview_safe_path() {
    case "$1" in
        docs/* | unit-tests/* | tests/* | *.md | \
            .github/* | .zap/* | .vscode/* | .idea/* | .agents/* | .cursor/* | .claude/* | \
            .assetsignore | .pre-commit-config.yaml | .pre-commit-pre-push.yaml | .python-version | \
            mise.toml | eslint.config.js | stylelint.config.cjs | commitlint.config.* | playwright.config.* | \
            scripts/agent-quality-gate.sh | scripts/agent-publish.sh | scripts/lib/agent-quality-support.sh | \
            scripts/lib/production-baseline-classification.sh | scripts/quality-gate.sh | scripts/ci-scope.sh | \
            scripts/verify-production-baseline.sh | scripts/verify-production-live.sh | \
            scripts/ci-performance-budget.sh | scripts/publish-vercel-preview-checkpoint.sh | \
            scripts/check_code_size.py | scripts/eslint-github-formatter.mjs)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

MAINTENANCE_ONLY=true
APPLICATION=false
SAST=false
BUILD=false
DEPENDENCIES=false
PREVIEW_REQUIRED=false

if (("${#CHANGED_FILES[@]}" == 0)); then
    # An empty diff is unusual in CI. Prefer the safe/full path rather than
    # silently skipping application validation.
    MAINTENANCE_ONLY=false
    APPLICATION=true
    SAST=true
    BUILD=true
    PREVIEW_REQUIRED=true
else
    for file in "${CHANGED_FILES[@]}"; do
        case "${file}" in
            package.json | package-lock.json)
                DEPENDENCIES=true
                ;;
        esac

        if ! is_maintenance_only_path "${file}"; then
            MAINTENANCE_ONLY=false
            APPLICATION=true
            BUILD=true
        fi
        if ! is_preview_safe_path "${file}"; then
            PREVIEW_REQUIRED=true
        fi

        case "${file}" in
            app/* | components/* | i18n/* | lib/* | api/* | scripts/*)
                if is_source_file "${file}"; then
                    SAST=true
                fi
                ;;
            next.config.mjs | proxy.ts)
                SAST=true
                ;;
        esac
    done
fi

emit() {
    printf 'maintenance_only=%s\n' "${MAINTENANCE_ONLY}"
    printf 'application=%s\n' "${APPLICATION}"
    printf 'sast=%s\n' "${SAST}"
    printf 'build=%s\n' "${BUILD}"
    printf 'dependencies=%s\n' "${DEPENDENCIES}"
    printf 'preview_required=%s\n' "${PREVIEW_REQUIRED}"
    printf 'changed_count=%d\n' "${#CHANGED_FILES[@]}"
}

emit
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    emit >>"${GITHUB_OUTPUT}"
fi

if [[ "${MAINTENANCE_ONLY}" == true ]]; then
    echo "ℹ️ CI scope: maintenance-only change; application SAST/build may be skipped."
else
    echo "ℹ️ CI scope: application-capable change; deploy-relevant checks remain mandatory."
fi

if [[ "${PREVIEW_REQUIRED}" == true ]]; then
    echo "ℹ️ Preview scope: deploy-relevant change; Preview security gates are required."
else
    echo "ℹ️ Preview scope: no deploy-relevant changes; Preview runner may be skipped."
fi
