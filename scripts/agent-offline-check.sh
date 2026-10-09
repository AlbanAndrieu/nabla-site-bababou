# shellcheck shell=bash
set -euo pipefail

# Offline L1 fallback only; never substitutes for P0, pre-commit or publication.
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
MAX_PATHS="${AGENT_OFFLINE_MAX_PATHS:-0}"
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
if [[ -n "$BASE" ]] && git rev-parse --verify "$BASE^{commit}" >/dev/null 2>&1 &&
    git merge-base "$BASE" HEAD >/dev/null 2>&1; then
    mapfile -t files < <(
        {
            git diff --name-only --diff-filter=ACMR "$BASE...HEAD"
            git diff --name-only --diff-filter=ACMR
        git diff --cached --name-only --diff-filter=ACMR
            git ls-files --others --exclude-standard
        } | LC_ALL=C sort -u
    )
    printf 'ℹ️ OFFLINE_SCOPE_DIFF: %s...HEAD + worktree\n' "$BASE"
else
    # Never silently truncate the file set or claim PR-completeness without a base.
    mapfile -t files < <(
        { git ls-files; git ls-files --others --exclude-standard; } | LC_ALL=C sort -u
    )
    echo "⚠️ OFFLINE_BASE_UNAVAILABLE: checking every local tracked/untracked path; PR completeness NOT VERIFIED" >&2
fi
if ((MAX_PATHS > 0 && ${#files[@]} > MAX_PATHS)); then
    printf '❌ OFFLINE_LIMIT_EXCEEDED: %d paths exceed explicit limit %d\n' "${#files[@]}" "$MAX_PATHS" >&2
    exit 2
fi
checked=0
for file in "${files[@]}"; do
    [[ -f "$file" && ! -L "$file" ]] || continue
    case "$file" in
        *.sh)
            bash -n "$file"
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
    esac
done
git diff --check
git diff --cached --check
printf '✅ OFFLINE_L1_PASS: paths=%d syntax_checked=%d\n' "${#files[@]}" "$checked"
echo '⚠️ NOT_RUN: formatter, Betterleaks, dependencies, application tests, publication build and CI'
