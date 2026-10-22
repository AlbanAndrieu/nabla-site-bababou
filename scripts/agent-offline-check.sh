# shellcheck shell=bash
set -euo pipefail

# Offline L1 fallback only; never substitutes for P0, pre-commit or publication.
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
MAX_PATHS="${AGENT_OFFLINE_MAX_PATHS:-0}"
REQUIRE_BASE="${AGENT_OFFLINE_REQUIRE_BASE:-0}"
if [[ ! "$REQUIRE_BASE" =~ ^[01]$ ]]; then
    echo "❌ OFFLINE_REQUIRE_BASE_INVALID: expected 0 or 1" >&2
    exit 2
fi
if [[ ! "$MAX_PATHS" =~ ^(0|[1-9][0-9]*)$ ]]; then
    echo "❌ OFFLINE_LIMIT_INVALID: AGENT_OFFLINE_MAX_PATHS must be 0 or a positive integer" >&2
    exit 2
fi
BASE="${QUALITY_BASE_REF:-}"
if [[ -z "$BASE" ]]; then
    for candidate in origin/master origin/main master main; do
        if git rev-parse --verify "$candidate^{commit}" >/dev/null 2>&1; then
            BASE="$candidate"
            break
        fi
    done
fi
scope_file="$(mktemp)"
trap 'rm -f "$scope_file"' EXIT
base_available=false
if [[ -n "$BASE" ]] && git rev-parse --verify "$BASE^{commit}" >/dev/null 2>&1; then
    if git merge-base "$BASE" HEAD >/dev/null 2>&1; then
        base_available=true
    fi
fi
if [[ "$base_available" == true ]]; then
    if ! git merge-base --is-ancestor "$BASE" HEAD; then
        if [[ "$REQUIRE_BASE" == 1 ]]; then
            echo "❌ OFFLINE_BASE_DIVERGED: $BASE is not an ancestor of HEAD; rebase before PR validation" >&2
            exit 2
        fi
        echo "⚠️ OFFLINE_BASE_DIVERGED: $BASE is not an ancestor; PR freshness NOT VERIFIED" >&2
    fi
    # Execute Git in the current shell: process-substitution errors could be lost.
    {
        git diff --name-only -z --diff-filter=ACMR "$BASE...HEAD"
        git diff --name-only -z --diff-filter=ACMR
        git diff --cached --name-only -z --diff-filter=ACMR
        git ls-files --others --exclude-standard -z
    } | LC_ALL=C sort -zu >"$scope_file"
    printf 'ℹ️ OFFLINE_SCOPE_DIFF: %s...HEAD + worktree\n' "$BASE"
else
    if [[ "$REQUIRE_BASE" == 1 ]]; then
        echo "❌ OFFLINE_BASE_REQUIRED: Git comparison base is missing or unrelated; cannot attest PR completeness" >&2
        exit 2
    fi
    # Never silently truncate the file set or claim PR-completeness without a base.
    {
        git ls-files -z
        git ls-files --others --exclude-standard -z
    } | LC_ALL=C sort -zu >"$scope_file"
    echo "⚠️ OFFLINE_BASE_UNAVAILABLE: checking every local tracked/untracked path; PR completeness NOT VERIFIED" >&2
fi
mapfile -d '' -t files <"$scope_file"
if ((MAX_PATHS > 0 && ${#files[@]} > MAX_PATHS)); then
    printf '❌ OFFLINE_LIMIT_EXCEEDED: %d paths exceed explicit limit %d\n' "${#files[@]}" "$MAX_PATHS" >&2
    exit 2
fi
checked=0
for file in "${files[@]}"; do
    [[ -f "$file" && ! -L "$file" ]] || continue
    case "$file" in
        *.sh)
            bash -n "./$file"
            checked=$((checked + 1))
            ;;
        *.mjs|*.cjs)
            command -v node >/dev/null 2>&1 || {
                echo "❌ OFFLINE_NODE_MISSING" >&2
                exit 2
            }
            node --check "./$file"
            checked=$((checked + 1))
            ;;
        *.py)
            command -v python3 >/dev/null 2>&1 || {
                echo "❌ OFFLINE_PYTHON_MISSING" >&2
                exit 2
            }
            python3 -c 'import ast,sys; from pathlib import Path; ast.parse(Path(sys.argv[1]).read_text(encoding="utf-8"),filename=sys.argv[1])' "$file"
            checked=$((checked + 1))
            ;;
        *.json)
            command -v python3 >/dev/null 2>&1 || {
                echo "❌ OFFLINE_PYTHON_MISSING" >&2
                exit 2
            }
            python3 -c 'import json,sys; from pathlib import Path; json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))' "$file"
            checked=$((checked + 1))
            ;;
    esac
done
if [[ "$base_available" == true ]]; then
    git diff --check "$BASE...HEAD"
fi
git diff --check
git diff --cached --check
printf '✅ OFFLINE_L1_PASS: paths=%d syntax_checked=%d\n' "${#files[@]}" "$checked"
echo '⚠️ NOT_RUN: formatter, Betterleaks, dependencies, application tests, publication build and CI'
