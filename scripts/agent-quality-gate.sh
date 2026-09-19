#!/usr/bin/env bash
set -euo pipefail

# Repository-specific agent-first gate for nabla-site-bababou.
# Keep scripts/quality-gate.sh canonical across Nabla repositories; this wrapper
# adds cheap Git preflight checks, deterministic local fixes and the project npm
# validation used before publication.

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

MODE="check"
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
	MODE="publish"
	shift
	;;
-h | --help)
	cat <<'USAGE'
Usage:
  bash scripts/agent-quality-gate.sh [--fix|--preflight|--publish]

Modes:
  default      strict agent validation on a clean committed branch
  --fix        converge deterministic formatter/linter fixes on changed files
  --preflight  Git-only checks; safe to run before dependency installation
  --publish    strict publication validation; reuses an exact local proof when valid

Environment:
  QUALITY_BASE_REF                 override comparison base
  QUALITY_LOG_TAIL                 failure log lines to print (default: 40)
  QUALITY_FIX_MAX_PASSES           max deterministic --fix passes (default: 12)
  QUALITY_ALLOW_LARGE_DELETION=1   acknowledge an intentional large truncation/deletion
  QUALITY_FORCE_PUBLISH=1          ignore the local exact-SHA publication proof
USAGE
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

LOG_TAIL="${QUALITY_LOG_TAIL:-40}"
FIX_MAX_PASSES="${QUALITY_FIX_MAX_PASSES:-12}"
STAMP_PATH="$(git rev-parse --git-path nabla-agent-quality.stamp)"

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

BASE_REF="$(resolve_base_ref)"

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

collect_changed_files() {
	{
		if [[ "${BASE_REF}" != "HEAD" ]]; then
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
		if [[ "${BASE_REF}" != "HEAD" ]]; then
			git diff --name-only --diff-filter=D "${BASE_REF}...HEAD"
		fi
		git diff --name-only --diff-filter=D
		git diff --cached --name-only --diff-filter=D
	} | awk 'NF' | sort -u
}

mapfile -t CHANGED_FILES < <(collect_changed_files)
mapfile -t DELETED_FILES < <(collect_deleted_files)

snapshot_changed_files() {
	{
		for file in "${CHANGED_FILES[@]}"; do
			if [[ -f "${file}" ]]; then
				printf '%s\t%s\n' "${file}" "$(git hash-object -- "${file}")"
			else
				printf '%s\t<missing>\n' "${file}"
			fi
		done
	} | git hash-object --stdin
}

precommit_fix_until_stable() {
	local pass=1
	local before
	local after
	local log
	local rc

	while ((pass <= FIX_MAX_PASSES)); do
		before="$(snapshot_changed_files)"
		log="$(mktemp)"
		set +e
		pre-commit run --hook-stage pre-commit \
			--files "${CHANGED_FILES[@]}" >"${log}" 2>&1
		rc=$?
		set -e
		after="$(snapshot_changed_files)"

		if ((rc == 0)); then
			rm -f "${log}"
			printf '✅ pre-commit auto-fix converged after pass %d\n' "${pass}"
			return 0
		fi

		if [[ "${after}" != "${before}" ]]; then
			printf '🔧 pre-commit pass %d/%d applied deterministic fixes; retrying without log analysis\n' \
				"${pass}" "${FIX_MAX_PASSES}"
			rm -f "${log}"
			((pass += 1))
			continue
		fi

		echo "❌ QG_PRECOMMIT_FAILED: auto-fix made no further progress." >&2
		tail -n "${LOG_TAIL}" "${log}" >&2 || true
		rm -f "${log}"
		return "${rc}"
	done

	echo "❌ QG_FIX_DID_NOT_CONVERGE: pre-commit kept changing files after ${FIX_MAX_PASSES} passes." >&2
	echo "   Inspect 'git status --short' and only the relevant changed files." >&2
	git status --short >&2
	return 1
}

run_fix_until_stable() {
	command -v pre-commit >/dev/null 2>&1 || {
		echo "❌ pre-commit is required; run 'mise run hooks' first" >&2
		exit 1
	}

	if [[ ! "${FIX_MAX_PASSES}" =~ ^[1-9][0-9]*$ ]]; then
		printf '❌ QUALITY_FIX_MAX_PASSES must be a positive integer, got: %s\n' "${FIX_MAX_PASSES}" >&2
		exit 2
	fi

	if (("${#CHANGED_FILES[@]}" == 0)); then
		echo "✅ no changed files require deterministic formatter/linter fixes"
		return 0
	fi

	# Run npm-backed lint fixes only on changed JS/TS/CSS files, unless their
	# configuration changed. Pre-commit owns the remaining deterministic hooks
	# and converges after npm-backed fixes.
	local javascript_lint_all=false
	local stylelint_all=false
	local file
	local -a javascript_lint_files=()
	local -a stylelint_files=()

	for file in "${CHANGED_FILES[@]}"; do
		case "${file}" in
		eslint.config.js)
			javascript_lint_all=true
			;;
		*.js | *.jsx | *.mjs | *.cjs | *.ts | *.tsx)
			javascript_lint_files+=("${file}")
			;;
		esac
		case "${file}" in
		stylelint.config.cjs)
			stylelint_all=true
			;;
		*.css)
			stylelint_files+=("${file}")
			;;
		esac
	done

	if [[ "${javascript_lint_all}" == true || "${stylelint_all}" == true ||
		"${#javascript_lint_files[@]}" -gt 0 || "${#stylelint_files[@]}" -gt 0 ]]; then
		if command -v npm >/dev/null 2>&1 && [[ -d node_modules ]]; then
			if [[ "${javascript_lint_all}" == true ]]; then
				run_compact "ESLint local auto-fix" npm run lint:fix
			elif (("${#javascript_lint_files[@]}" > 0)); then
				run_compact "ESLint changed-file auto-fix" \
					npx eslint --fix --format ./scripts/eslint-github-formatter.mjs "${javascript_lint_files[@]}"
			fi

			if [[ "${stylelint_all}" == true ]]; then
				run_compact "Stylelint local auto-fix" npm run lint:css:fix
			elif (("${#stylelint_files[@]}" > 0)); then
				run_compact "Stylelint changed-file auto-fix" \
					npx stylelint --fix "${stylelint_files[@]}"
			fi
		else
			echo "⚠️ QG_NODE_FIX_SKIPPED: node_modules unavailable; npm lint auto-fixes were skipped." >&2
			echo "   Run 'npm ci --no-audit --no-fund' before the strict publication gate." >&2
		fi
	fi

	# npm fixes can create changes covered by Biome/other hooks; converge those
	# hooks last.
	precommit_fix_until_stable

	echo "✅ deterministic local auto-fix phase converged."
	git status --short
}

is_guarded_path() {
	case "$1" in
	package-lock.json | public/assets/* | public/checklist/* | public/d3.v3.min.js | .github/copilot-instructions.md)
		# Generated/vendor-heavy or deliberately thin instruction surfaces have
		# dedicated contracts; large-deletion heuristics would create false positives.
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
		is_guarded_path "${file}" || continue
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
		is_guarded_path "${file}" || continue
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

if [[ "${MODE}" == "preflight" ]]; then
	echo "✅ Agent preflight passed without installing dependencies."
	exit 0
fi

if [[ "${MODE}" == "fix" ]]; then
	run_fix_until_stable
	echo "ℹ️  review git diff/status, commit deterministic changes, then run the strict agent gate"
	exit 0
fi

STATUS="$(git status --short)"
if [[ -n "${STATUS}" ]]; then
	echo "❌ QG_DIRTY_TREE: strict agent validation requires committed changes" >&2
	printf '%s\n' "${STATUS}" >&2
	echo "   Run 'bash scripts/agent-quality-gate.sh --fix', review, then commit first." >&2
	exit 1
fi

command -v npm >/dev/null 2>&1 || {
	echo "❌ npm is required; activate the repository toolchain with mise" >&2
	exit 1
}
command -v node >/dev/null 2>&1 || {
	echo "❌ node is required; activate the repository toolchain with mise" >&2
	exit 1
}
command -v pre-commit >/dev/null 2>&1 || {
	echo "❌ pre-commit is required; run 'mise run hooks' first" >&2
	exit 1
}
if [[ ! -d node_modules ]]; then
	echo "❌ node_modules is missing; run 'npm ci --no-audit --no-fund' first" >&2
	exit 1
fi

publication_key() {
	local base_sha
	local deps_hash="missing"
	if [[ "${BASE_REF}" == "HEAD" ]]; then
		base_sha="$(git rev-parse HEAD)"
	else
		base_sha="$(git rev-parse "${BASE_REF}^{commit}")"
	fi
	if [[ -f node_modules/.package-lock.json ]]; then
		deps_hash="$(git hash-object -- node_modules/.package-lock.json)"
	fi
	{
		printf 'head=%s\n' "$(git rev-parse HEAD)"
		printf 'base=%s\n' "${base_sha}"
		printf 'node=%s\n' "$(node --version)"
		printf 'npm=%s\n' "$(npm --version)"
		printf 'precommit=%s\n' "$(pre-commit --version)"
		printf 'deps=%s\n' "${deps_hash}"
	} | git hash-object --stdin
}

STAMP_KEY="$(publication_key)"
if [[ "${MODE}" == "publish" && "${QUALITY_FORCE_PUBLISH:-0}" != "1" && -f "${STAMP_PATH}" ]]; then
	if [[ "$(cat "${STAMP_PATH}")" == "${STAMP_KEY}" ]]; then
		echo "✅ QG_PUBLISH_CACHE: exact HEAD/base/toolchain already passed the strict local gate."
		exit 0
	fi
fi

# Run the formatter/linter/security gate before npm-backed project validation.
# Cheap deterministic failures should be discovered before expensive work.
if [[ "${MODE}" == "publish" ]]; then
	run_compact "canonical formatter/linter/security publication gate" \
		bash scripts/quality-gate.sh --publish
else
	run_compact "canonical formatter/linter/security gate" bash scripts/quality-gate.sh
fi

scope_output="$(
	QUALITY_SCOPE_BASE_REF="${BASE_REF}" \
		QUALITY_SCOPE_HEAD_REF=HEAD \
		bash scripts/ci-quality-scope.sh
)"
printf '%s\n' "${scope_output}"
full_project="$(awk -F= '$1 == "full_project" { print $2; exit }' <<<"${scope_output}")"

run_maintenance_project_checks() {
	npm run lint
	npm run lint:css
	npm run test:unit
}

case "${full_project}" in
true)
	run_compact "Next/npm lint, types, unit, privacy and production build gate" npm run check
	;;
false)
	run_compact "maintenance npm lint, CSS and unit gate" run_maintenance_project_checks
	;;
*)
	printf '❌ QG_SCOPE_INVALID: ci-quality-scope returned full_project=%s\n' "${full_project:-missing}" >&2
	exit 1
	;;
esac

mkdir -p "$(dirname "${STAMP_PATH}")"
printf '%s\n' "${STAMP_KEY}" >"${STAMP_PATH}"

if [[ "${MODE}" == "publish" ]]; then
	echo "✅ Agent publication gate passed; exact local proof recorded for pre-push reuse."
else
	echo "✅ Agent quality gate passed; exact local proof recorded for a subsequent publish/pre-push."
fi
