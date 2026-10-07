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
# WORKTREE is a local-only sentinel used by the dependency-free agent preflight.
# It classifies committed, staged, unstaged and untracked paths through the same
# policy functions used by CI, without inventing a second scope implementation.

if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
    printf '❌ CI_SCOPE_BASE_MISSING: %s\n' "${BASE_REF}" >&2
    exit 1
fi
if [[ "${HEAD_REF}" != "WORKTREE" ]] && ! git rev-parse --verify "${HEAD_REF}^{commit}" >/dev/null 2>&1; then
    printf '❌ CI_SCOPE_HEAD_MISSING: %s\n' "${HEAD_REF}" >&2
    exit 1
fi

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
            .pre-commit-config.yaml | .pre-commit-pre-push.yaml | .python-version | \
            Makefile | justfile | .mega-linter.yml | .betterleaks.toml | \
            mise.toml | opencode.json | renovate.json | eslint.config.js | stylelint.config.cjs | commitlint.config.* | playwright.config.* | \
            scripts/agent-quality-gate.sh | scripts/agent-p0-check.sh | scripts/agent-publish.sh | scripts/lib/agent-quality-support.sh | \
            scripts/quality-gate.sh | scripts/check_code_size.py | scripts/ci-scope.sh | \
            scripts/verify-production-baseline.sh | scripts/verify-production-live.sh | \
            scripts/ci-performance-budget.sh | scripts/publish-vercel-preview-checkpoint.sh | \
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
            Makefile | justfile | .mega-linter.yml | .betterleaks.toml | \
            mise.toml | opencode.json | renovate.json | eslint.config.js | stylelint.config.cjs | commitlint.config.* | playwright.config.* | \
            scripts/agent-quality-gate.sh | scripts/agent-p0-check.sh | scripts/agent-publish.sh | scripts/lib/agent-quality-support.sh | \
            scripts/lib/production-baseline-classification.sh | \
            scripts/quality-gate.sh | scripts/check_code_size.py | scripts/ci-scope.sh | \
            scripts/verify-production-baseline.sh | scripts/verify-production-live.sh | \
            scripts/ci-performance-budget.sh | scripts/publish-vercel-preview-checkpoint.sh | \
            scripts/eslint-github-formatter.mjs)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

if [[ "${HEAD_REF}" == "WORKTREE" ]]; then
    mapfile -t CHANGED_FILES < <(
        {
            if [[ "${BASE_REF}" != "HEAD" ]]; then
                git diff --name-only --diff-filter=ACMRD "${BASE_REF}...HEAD"
            fi
            git diff --name-only --diff-filter=ACMRD
            git diff --cached --name-only --diff-filter=ACMRD
            git ls-files --others --exclude-standard
        } |
            awk 'NF' |
            sort -u
    )
else
    mapfile -t CHANGED_FILES < <(
        git diff --name-only --diff-filter=ACMRD "${BASE_REF}" "${HEAD_REF}" |
            awk 'NF' |
            sort -u
    )
fi

maintenance_only=true
application=false
sast=false
build=false
preview_required=false
zap_bootstrap=false
dependencies=false

if (("${#CHANGED_FILES[@]}" == 0)); then
    # An empty diff is unusual in CI. Prefer the safe/full path rather than
    # silently skipping application validation.
    maintenance_only=false
    application=true
    sast=true
    build=true
    preview_required=true
else
    for file in "${CHANGED_FILES[@]}"; do
        case "${file}" in
            package.json | package-lock.json)
                dependencies=true
                ;;
        esac

        if ! is_maintenance_only_path "${file}"; then
            maintenance_only=false
        fi

        if ! is_preview_safe_path "${file}"; then
            preview_required=true
            application=true
            build=true
        fi

        if [[ "${file}" == ".github/workflows/zap-preview.yml" ]]; then
            zap_bootstrap=true
        fi

        case "${file}" in
            app/* | components/* | i18n/* | lib/* | api/* | scripts/*)
                if is_source_file "${file}"; then
                    sast=true
                fi
                ;;
            .github/workflows/*.yml | .github/workflows/*.yaml | next.config.mjs | proxy.ts)
                sast=true
                ;;
        esac
    done
fi

emit() {
    printf 'maintenance_only=%s\n' "${maintenance_only}"
    printf 'application=%s\n' "${application}"
    printf 'sast=%s\n' "${sast}"
    printf 'build=%s\n' "${build}"
    printf 'preview_required=%s\n' "${preview_required}"
    printf 'zap_bootstrap=%s\n' "${zap_bootstrap}"
    printf 'dependencies=%s\n' "${dependencies}"
    printf 'changed_count=%d\n' "${#CHANGED_FILES[@]}"
}

emit
if [[ "${HEAD_REF}" == "WORKTREE" ]]; then
    echo "ℹ️ Scope source: committed + staged + unstaged + untracked worktree paths."
fi
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    emit >>"${GITHUB_OUTPUT}"
fi

if [[ "${maintenance_only}" == true ]]; then
    echo "ℹ️ CI scope: maintenance-only change; application SAST/build may be skipped."
elif [[ "${preview_required}" == true ]]; then
    echo "ℹ️ CI scope: deploy-relevant application change; build/Preview remain mandatory."
elif [[ "${sast}" == true ]]; then
    echo "ℹ️ CI scope: security-sensitive non-deployable source change; SAST remains mandatory."
else
    echo "ℹ️ CI scope: non-deployable policy change; canonical quality remains mandatory without fake SAST/build work."
fi

if [[ "${preview_required}" == true ]]; then
    echo "ℹ️ Preview scope: deploy-relevant change; Preview security gates are required."
else
    echo "ℹ️ Preview scope: no deploy-relevant changes; Preview runner may be skipped."
fi
