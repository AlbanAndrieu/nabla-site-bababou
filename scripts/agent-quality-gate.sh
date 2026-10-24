#!/usr/bin/env bash
set -euo pipefail

# Repository-specific agent-first gate for nabla-site-bababou.
# Keep scripts/quality-gate.sh canonical across Nabla repositories; this wrapper
# owns cheap repository preflight, deterministic local fixes and pre-build checks.

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

# shellcheck source=scripts/lib/agent-quality-support.sh
source scripts/lib/agent-quality-support.sh

MODE="check"
PUBLISH=false
case "${1:-}" in
    --fix)
        MODE="fix"
        shift
        ;;
    --preflight)
        MODE="preflight"
        shift
        ;;
    --publish)
        PUBLISH=true
        shift
        ;;
    -h | --help)
        print_agent_quality_usage
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

LOG_TAIL="${QUALITY_LOG_TAIL:-12}"
FIX_PASSES="${QUALITY_FIX_PASSES:-12}"
if [[ ! "${FIX_PASSES}" =~ ^[1-9][0-9]*$ ]]; then
    echo "❌ QUALITY_FIX_PASSES must be a positive integer" >&2
    exit 2
fi

BASE_REF="$(resolve_base_ref)"

if [[ "${BASE_REF}" != "HEAD" ]]; then
    if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
        printf '❌ QG_BASE_MISSING: comparison base %s is unavailable\n' "${BASE_REF}" >&2
        exit 1
    fi
    if ! git merge-base --is-ancestor "${BASE_REF}" HEAD; then
        printf '❌ QG_BASE_STALE: HEAD does not contain %s; fetch/rebase before publication\n' "${BASE_REF}" >&2
        exit 1
    fi
    printf '✅ branch contains comparison base %s\n' "${BASE_REF}"
fi

ci_skip_directive_failed=0
if [[ "${BASE_REF}" != "HEAD" ]]; then
    mapfile -t PR_COMMITS < <(git rev-list --reverse "${BASE_REF}..HEAD")
    for commit in "${PR_COMMITS[@]}"; do
        message="$(git log -1 --format=%B "${commit}")"
        if grep -Eiq '\[(skip ci|ci skip|no ci|skip actions|actions skip)\]' <<<"${message}" ||
            grep -Eiq '^[[:space:]]*skip-checks:[[:space:]]*true[[:space:]]*$' <<<"${message}"; then
            subject="$(git log -1 --format=%s "${commit}")"
            printf '❌ QG_CI_SKIP_DIRECTIVE: commit %s (%s) suppresses required PR validation\n' \
                "${commit}" "${subject}" >&2
            ci_skip_directive_failed=1
        fi
    done
fi
if ((ci_skip_directive_failed != 0)); then
    exit 1
fi
printf '✅ CI skip-directive guard\n'

# Avoid process substitution: a failed Git scope must never look like an empty PR.
changed_scope_file="$(mktemp)"
deleted_scope_file="$(mktemp)"
if ! collect_changed_files >"${changed_scope_file}" ||
    ! collect_deleted_files >"${deleted_scope_file}"; then
    rm -f "${changed_scope_file}" "${deleted_scope_file}"
    echo "❌ QG_SCOPE_ENUMERATION_FAILED: failed to collect changed or deleted Git paths" >&2
    exit 1
fi
mapfile -d '' -t CHANGED_FILES <"${changed_scope_file}"
mapfile -d '' -t DELETED_FILES <"${deleted_scope_file}"
rm -f "${changed_scope_file}" "${deleted_scope_file}"

precommit_fix_until_stable() {
    local pass
    local before
    local after
    local log
    local rc
    local before_digests
    local pass_evidence
    local evidence=""
    declare -A seen_fingerprints=()

    for ((pass = 1; pass <= FIX_PASSES; pass++)); do
        local fix_scope_file
        fix_scope_file="$(mktemp)" || return 1
        if ! collect_changed_files >"${fix_scope_file}"; then
            rm -f "${fix_scope_file}"
            return 1
        fi
        mapfile -d '' -t fix_files <"${fix_scope_file}"
        rm -f "${fix_scope_file}"
        if (("${#fix_files[@]}" == 0)); then
            echo "✅ no changed files require pre-commit auto-fixes"
            return 0
        fi

        before="$(workspace_fingerprint)"
        if [[ -n "${seen_fingerprints[${before}]:-}" ]]; then
            printf '❌ QG_FIX_OSCILLATION: workspace fingerprint repeated (passes %s and %s).\n' \
                "${seen_fingerprints[${before}]}" "${pass}" >&2
            report_fix_oscillation "${seen_fingerprints[${before}]}" "${pass}" "${evidence}" >&2
            printf "   Inspect mutating pre-commit hooks and files.\n" >&2
            git status --short >&2
            return 1
        fi
        seen_fingerprints["${before}"]="${pass}"
        before_digests="$(fix_file_digests "${fix_files[@]}")"
        log="$(mktemp)"
        set +e
        pre-commit run --hook-stage pre-commit --files "${fix_files[@]}" >"${log}" 2>&1
        rc=$?
        set -e
        after="$(workspace_fingerprint)"
        pass_evidence="$(fix_pass_evidence "${pass}" "${log}" "${before_digests}" "$(fix_file_digests "${fix_files[@]}")")"
        if [[ -n "${pass_evidence}" ]]; then
            printf -v evidence "%s%s\n" "${evidence}" "${pass_evidence}"
        fi

        if ((rc == 0)); then
            rm -f "${log}"
            printf '✅ pre-commit auto-fix converged after pass %d\n' "${pass}"
            return 0
        fi

        if [[ "${before}" != "${after}" ]]; then
            printf '🔧 pre-commit pass %d/%d applied deterministic fixes; retrying without log analysis\n' \
                "${pass}" "${FIX_PASSES}"
            rm -f "${log}"
            continue
        fi

        echo "❌ QG_PRECOMMIT_FAILED: auto-fix made no further progress." >&2
        tail -n "${LOG_TAIL}" "${log}" >&2 || true
        rm -f "${log}"
        return "${rc}"
    done

    echo "❌ QG_FIX_DID_NOT_CONVERGE: pre-commit kept changing files after ${FIX_PASSES} passes." >&2
    echo "   Inspect 'git status --short' and only the relevant changed files." >&2
    git status --short >&2
    return 1
}

is_destructive_diff_guarded_path() {
    case "$1" in
        package-lock.json | public/assets/* | public/checklist/* | public/d3.v3.min.js | .github/copilot-instructions.md)
            return 1
            ;;
        *.md | *.ts | *.tsx | *.js | *.mjs | *.cjs | *.json | *.yml | *.yaml | *.toml | *.sh | *.css | *.html)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

large_deletion_failed=0
if [[ "${QUALITY_ALLOW_LARGE_DELETION:-0}" != "1" && "${BASE_REF}" != "HEAD" ]]; then
    for file in "${CHANGED_FILES[@]}"; do
        is_destructive_diff_guarded_path "${file}" || continue
        git cat-file -e "${BASE_REF}:${file}" 2>/dev/null || continue
        base_lines="$(git show "${BASE_REF}:${file}" | wc -l | tr -d ' ')"
        current_lines="$(wc -l <"${file}" | tr -d ' ')"
        if ((base_lines < 200 || current_lines >= base_lines)); then
            continue
        fi
        deleted_lines=$((base_lines - current_lines))
        deleted_percent=$((deleted_lines * 100 / base_lines))
        if ((deleted_lines >= 100 && deleted_percent >= 40)); then
            printf '❌ QG_LARGE_DELETION: %s lost %d/%d lines (%d%%); set QUALITY_ALLOW_LARGE_DELETION=1 only after explicit review\n' \
                "${file}" "${deleted_lines}" "${base_lines}" "${deleted_percent}" >&2
            large_deletion_failed=1
        fi
    done

    for file in "${DELETED_FILES[@]}"; do
        is_destructive_diff_guarded_path "${file}" || continue
        git cat-file -e "${BASE_REF}:${file}" 2>/dev/null || continue
        base_lines="$(git show "${BASE_REF}:${file}" | wc -l | tr -d ' ')"
        if ((base_lines >= 200)); then
            printf '❌ QG_LARGE_DELETION: %s was deleted (%d lines); set QUALITY_ALLOW_LARGE_DELETION=1 only after explicit review\n' \
                "${file}" "${base_lines}" >&2
            large_deletion_failed=1
        fi
    done
fi
if ((large_deletion_failed != 0)); then
    exit 1
fi
printf '✅ destructive-diff guard\n'

exec_bit_failed=0
for file in "${CHANGED_FILES[@]}"; do
    IFS= read -r first_line <"${file}" || true
    [[ "${first_line:-}" == '#!'* ]] || continue

    if git ls-files --error-unmatch -- "${file}" >/dev/null 2>&1; then
        mode="$(git ls-files --stage -- "${file}" | awk 'NR == 1 {print $1}')"
        if [[ "${mode}" != "100755" ]]; then
            printf '❌ QG_EXEC_BIT: %s has a shebang but Git mode is %s; run git add --chmod=+x %q\n' \
                "${file}" "${mode:-unknown}" "${file}" >&2
            exec_bit_failed=1
        fi
    elif [[ ! -x "${file}" ]]; then
        printf '❌ QG_EXEC_BIT: untracked %s has a shebang but is not executable\n' "${file}" >&2
        exec_bit_failed=1
    fi
done
if ((exec_bit_failed != 0)); then
    exit 1
fi
printf '✅ executable-script contract\n'

validate_changed_shell_syntax() {
    local file

    for file in "${CHANGED_FILES[@]}"; do
        case "${file}" in
            *.sh)
                bash -n "${file}"
                ;;
        esac
    done
}

validate_changed_python_syntax() {
    local file

    for file in "${CHANGED_FILES[@]}"; do
        case "${file}" in
            *.py)
                python3 -c 'import pathlib, sys; path = pathlib.Path(sys.argv[1]); compile(path.read_text(encoding="utf-8"), str(path), "exec")' "${file}"
                ;;
        esac
    done
}

validate_untracked_whitespace() {
    local file
    local log
    local rc
    local untracked_scope_file

    # Git pathnames may contain tabs/newlines. Process substitution hides
    # enumeration errors, so read a checked NUL-delimited inventory instead.
    untracked_scope_file="$(mktemp)" || return 1
    if ! git ls-files --others --exclude-standard -z >"${untracked_scope_file}"; then
        rm -f "${untracked_scope_file}"
        echo "❌ QG_UNTRACKED_GIT_FAILED: cannot enumerate untracked files" >&2
        return 1
    fi

    while IFS= read -r -d '' file; do
        [[ -f "${file}" ]] || continue

        # Keep this independent from the destructive-diff allowlist: pre-commit's
        # filesystem whitespace hooks are broader, and git diff safely treats
        # binary files as ordinary content differences without whitespace errors.
        log="$(mktemp)" || {
            rm -f "${untracked_scope_file}"
            return 1
        }
        set +e
        git diff --no-index --check /dev/null -- "${file}" >"${log}" 2>&1
        rc=$?
        set -e

        # git diff --no-index returns 1 for an ordinary clean-content diff.
        # Whitespace errors and command failures return a value greater than 1.
        if ((rc > 1)); then
            cat "${log}" >&2
            rm -f "${log}" "${untracked_scope_file}"
            return 1
        fi
        rm -f "${log}"
    done <"${untracked_scope_file}"
    rm -f "${untracked_scope_file}"
}

run_dependency_free_preflight() {
    if [[ "${BASE_REF}" != "HEAD" ]]; then
        run_compact "committed diff whitespace" git diff --check "${BASE_REF}...HEAD"
    fi
    run_compact "working-tree diff whitespace" git diff --check
    run_compact "staged diff whitespace" git diff --cached --check
    run_compact "untracked diff whitespace" validate_untracked_whitespace
    run_compact "changed shell syntax" validate_changed_shell_syntax
    run_compact "changed Python syntax" validate_changed_python_syntax
}

run_dependency_free_preflight

if (("${#CHANGED_FILES[@]}" > 0)); then
    run_compact_report "baseline-aware code-size report" \
        python3 scripts/check_code_size.py \
        --baseline-ref "${BASE_REF}" \
        "${CHANGED_FILES[@]}"
else
    echo "✅ baseline-aware code-size report (no changed files)"
fi

worktree_scope_output="$(bash scripts/ci-scope.sh "${BASE_REF}" WORKTREE)"
printf '%s\n' "${worktree_scope_output}"

if [[ "${MODE}" == "preflight" ]]; then
    echo "✅ Agent preflight passed without installing dependencies."
    echo "ℹ️ Scope above includes committed, staged, unstaged and untracked paths."
    exit 0
fi

command -v pre-commit >/dev/null 2>&1 || {
    echo "❌ pre-commit is required; run 'mise run hooks' first" >&2
    exit 1
}

# Detect duplicate/overridden hook definitions before invoking any hook runtime.
# Preflight remains dependency-free; strict quality runs after pre-commit setup.
run_compact "pre-commit configuration integrity" \
    python3 scripts/quality/check-precommit-config.py

classify_changed_files "${CHANGED_FILES[@]}"

if [[ "${MODE}" != "fix" && "${agent_gate_changed}" == true && "${QUALITY_CANONICAL_GATE_VERIFIED:-0}" != "1" ]]; then
    run_compact "agent quality shell formatting" \
        pre-commit run shfmt --files "${AGENT_GATE_SHELL_FILES[@]}"
    run_compact "agent quality shell lint" \
        pre-commit run shell-lint --files "${AGENT_GATE_SHELL_FILES[@]}"
    run_compact "agent quality shell style" \
        pre-commit run bashate --files "${AGENT_GATE_SHELL_FILES[@]}"
fi

if [[ "${MODE}" == "fix" ]]; then
    precommit_fix_until_stable

    if [[ "${javascript_lint_all}" == true || "${stylelint_all}" == true || "${#JAVASCRIPT_LINT_FILES[@]}" -gt 0 || "${#STYLELINT_FILES[@]}" -gt 0 ]]; then
        if command -v npm >/dev/null 2>&1 && [[ -d node_modules ]]; then
            if [[ "${javascript_lint_all}" == true ]]; then
                run_compact "ESLint local auto-fix" npm run lint:fix
            elif (("${#JAVASCRIPT_LINT_FILES[@]}" > 0)); then
                run_compact "ESLint changed-file auto-fix" \
                    npx eslint --fix --format ./scripts/eslint-github-formatter.mjs "${JAVASCRIPT_LINT_FILES[@]}"
            fi

            if [[ "${stylelint_all}" == true ]]; then
                run_compact "Stylelint local auto-fix" npm run lint:css:fix
            elif (("${#STYLELINT_FILES[@]}" > 0)); then
                run_compact "Stylelint changed-file auto-fix" \
                    npx stylelint --fix "${STYLELINT_FILES[@]}"
            fi

            precommit_fix_until_stable
        else
            echo "⚠️ QG_NODE_FIX_SKIPPED: node_modules unavailable; pre-commit fixes ran, but npm lint auto-fixes were skipped." >&2
            echo "   Run 'npm ci --no-audit --no-fund' before the strict publication gate." >&2
        fi
    fi

    echo "✅ deterministic local auto-fix phase converged."
    git status --short
    echo "ℹ️  review the diff, commit it, then run scripts/agent-publish.sh"
    exit 0
fi

STATUS="$(git status --short)"
if [[ -n "${STATUS}" ]]; then
    echo "❌ QG_DIRTY_TREE: strict agent validation requires committed changes" >&2
    printf '%s\n' "${STATUS}" >&2
    echo "   Run 'bash scripts/agent-quality-gate.sh --fix', review, then commit first." >&2
    exit 1
fi

require_supported_js_toolchain QG_AGENT
if [[ ! -d node_modules ]]; then
    echo "❌ node_modules is missing; run 'npm ci --no-audit --no-fund' first" >&2
    exit 1
fi

if [[ "${PUBLISH}" == true ]]; then
    run_compact "canonical formatter/linter/security publication gate" \
        bash scripts/quality-gate.sh --publish
elif [[ "${QUALITY_CANONICAL_GATE_VERIFIED:-0}" == "1" ]]; then
    echo "✅ canonical formatter/linter/security gate already verified earlier in this CI job"
else
    run_compact "canonical formatter/linter/security gate" bash scripts/quality-gate.sh
fi

scope_output="$(bash scripts/ci-scope.sh "${BASE_REF}" HEAD)"
printf '%s\n' "${scope_output}"
build="$(awk -F= '$1 == "build" { print $2; exit }' <<<"${scope_output}")"

run_maintenance_project_checks() {
    npm run lint
    npm run lint:css
    npm run test:unit
}

run_full_prebuild_checks() {
    npm run lint
    npm run lint:css
    npx next typegen
    npm run typecheck
    npm run test:unit
    npm run privacy:check
    npm run privacy:publication
}

case "${build}" in
    true)
        run_compact "full pre-build lint, types, unit and privacy gate" run_full_prebuild_checks
        ;;
    false)
        run_compact "maintenance lint, CSS and unit gate" run_maintenance_project_checks
        ;;
    *)
        printf '❌ QG_SCOPE_INVALID: ci-scope returned build=%s\n' "${build:-missing}" >&2
        exit 1
        ;;
esac

if [[ "${PUBLISH}" == true ]]; then
    STATUS="$(git status --short)"
    if [[ -n "${STATUS}" ]]; then
        echo "❌ Working tree changed during the agent publication gate." >&2
        printf '%s\n' "${STATUS}" >&2
        exit 1
    fi
    echo "✅ Agent pre-build publication gate passed; repository is clean."
else
    echo "✅ Agent pre-build quality gate passed."
fi
