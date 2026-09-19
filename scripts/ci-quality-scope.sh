#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

HEAD_REF="${QUALITY_SCOPE_HEAD_REF:-HEAD}"
BASE_REF="${QUALITY_SCOPE_BASE_REF:-}"

if ! git rev-parse --verify "${HEAD_REF}^{commit}" >/dev/null 2>&1; then
	printf '❌ invalid quality-scope head: %s\n' "${HEAD_REF}" >&2
	exit 1
fi

if [[ -z "${BASE_REF}" ]] || ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
	BASE_REF="${HEAD_REF}^"
fi

if [[ "$(git rev-parse "${BASE_REF}^{commit}")" == "$(git rev-parse "${HEAD_REF}^{commit}")" ]]; then
	BASE_REF="${HEAD_REF}^"
fi

mapfile -t FILES < <(
	git diff --name-only --diff-filter=ACMRD "${BASE_REF}" "${HEAD_REF}" | awk 'NF' | sort -u
)

FULL_PROJECT=false
SAST=false
DEPENDENCIES=false

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

for file in "${FILES[@]}"; do
	case "${file}" in
		package.json | package-lock.json)
			FULL_PROJECT=true
			DEPENDENCIES=true
			;;
		.nvmrc | .npmrc | next.config.* | proxy.ts | postcss.config.* | tsconfig.json | tsconfig.*.json)
			FULL_PROJECT=true
			;;
		app/* | components/* | i18n/* | lib/* | messages/* | public/* | api/*)
			FULL_PROJECT=true
			;;
		scripts/vercel-ignore-build.sh)
			# This script is Vercel's ignoreCommand and directly decides whether a
			# deployment is built. Changes therefore require the full project gate.
			FULL_PROJECT=true
			;;
		scripts/agent-quality-gate.sh | scripts/quality-gate.sh | scripts/ci-quality-scope.sh | scripts/verify-production-baseline.sh | scripts/verify-production-live.sh | scripts/ci-performance-budget.sh | scripts/publish-vercel-preview-checkpoint.sh | scripts/eslint-github-formatter.mjs)
			# Quality/deployment orchestration: validate with lint/unit contracts,
			# but it does not require rebuilding the application.
			;;
		scripts/*)
			FULL_PROJECT=true
			;;
	esac

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

emit() {
	printf 'full_project=%s\n' "${FULL_PROJECT}"
	printf 'sast=%s\n' "${SAST}"
	printf 'dependencies=%s\n' "${DEPENDENCIES}"
	printf 'changed_count=%d\n' "${#FILES[@]}"
}

emit
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
	emit >>"${GITHUB_OUTPUT}"
fi
