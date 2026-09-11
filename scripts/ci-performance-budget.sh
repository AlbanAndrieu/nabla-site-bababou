#!/usr/bin/env bash
set -euo pipefail

# Warning-only budgets derived from the stable #158/#167/#168/#178 baselines.
# They intentionally leave headroom for cache misses and hosted-runner variance.
NPM_CI_WARN_SECONDS="${NPM_CI_WARN_SECONDS:-30}"
NODE_MODULES_WARN_MB="${NODE_MODULES_WARN_MB:-800}"
FULL_CHECK_WARN_SECONDS="${FULL_CHECK_WARN_SECONDS:-60}"
NEXT_BUILD_WARN_SECONDS="${NEXT_BUILD_WARN_SECONDS:-30}"
NEXT_OUTPUT_WARN_MB="${NEXT_OUTPUT_WARN_MB:-80}"

warned=0

is_number() {
	[[ "$1" =~ ^[0-9]+([.][0-9]+)?$ ]]
}

above() {
	awk -v value="$1" -v budget="$2" 'BEGIN { exit !(value > budget) }'
}

value_or_na() {
	if [[ -n "$1" ]]; then
		printf '%s' "$1"
	else
		printf 'n/a'
	fi
}

check_budget() {
	local label="$1"
	local value="$2"
	local budget="$3"
	local unit="$4"

	if [[ -z "${value}" || "${value}" == "n/a" ]]; then
		printf 'ℹ️  %s: not measured for this quality scope\n' "${label}"
		return 0
	fi
	if ! is_number "${value}" || ! is_number "${budget}"; then
		printf '::warning::CI performance budget for %s could not be evaluated (value=%s, budget=%s).\n' \
			"${label}" "${value}" "${budget}"
		warned=1
		return 0
	fi
	if above "${value}" "${budget}"; then
		printf '::warning::CI performance regression candidate: %s=%s%s exceeds warning budget %s%s. Compare cache state and recent master baselines before tightening or treating as blocking.\n' \
			"${label}" "${value}" "${unit}" "${budget}" "${unit}"
		warned=1
	else
		printf '✅ %s=%s%s ≤ warning budget %s%s\n' \
			"${label}" "${value}" "${unit}" "${budget}" "${unit}"
	fi
}

check_budget "npm ci" "${NPM_CI_SECONDS:-}" "${NPM_CI_WARN_SECONDS}" "s"
check_budget "node_modules" "${NODE_MODULES_MB:-}" "${NODE_MODULES_WARN_MB}" "MiB"
check_budget "full checks" "${CHECK_SECONDS:-}" "${FULL_CHECK_WARN_SECONDS}" "s"
check_budget "Next build" "${NEXT_BUILD_SECONDS:-}" "${NEXT_BUILD_WARN_SECONDS}" "s"
check_budget ".next output" "${NEXT_MB:-}" "${NEXT_OUTPUT_WARN_MB}" "MiB"

quality_scope="maintenance"
if [[ -n "${CHECK_SECONDS:-}" || -n "${NEXT_BUILD_SECONDS:-}" || -n "${NEXT_MB:-}" ]]; then
	quality_scope="full"
fi

# GITHUB_SHA is a synthetic merge SHA on pull_request events. The workflow checks
# out the exact PR revision, so HEAD is the canonical revision for comparable
# PR and post-merge performance records.
checkout_sha="$(git rev-parse HEAD 2>/dev/null || true)"
baseline_record="CI_PERF_BASELINE run=$(value_or_na "${GITHUB_RUN_ID:-}") sha=$(value_or_na "${checkout_sha}") event=$(value_or_na "${GITHUB_EVENT_NAME:-}") scope=${quality_scope} npm_ci_s=$(value_or_na "${NPM_CI_SECONDS:-}") node_modules_mb=$(value_or_na "${NODE_MODULES_MB:-}") full_checks_s=$(value_or_na "${CHECK_SECONDS:-}") next_build_s=$(value_or_na "${NEXT_BUILD_SECONDS:-}") next_output_mb=$(value_or_na "${NEXT_MB:-}")"
printf '%s\n' "${baseline_record}"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
	{
		echo
		echo "### CI performance warning budgets"
		echo
		echo "- npm ci: ${NPM_CI_WARN_SECONDS}s"
		echo "- node_modules: ${NODE_MODULES_WARN_MB} MiB"
		echo "- full checks: ${FULL_CHECK_WARN_SECONDS}s"
		echo "- Next build: ${NEXT_BUILD_WARN_SECONDS}s"
		echo "- .next output: ${NEXT_OUTPUT_WARN_MB} MiB"
		echo "- policy: warning-only; investigate cache/runner variance before promoting a budget to a blocking gate"
		echo
		echo "#### Copy-ready baseline record"
		echo
		printf '`%s`\n' "${baseline_record}"
	} >>"${GITHUB_STEP_SUMMARY}"
fi

if ((warned != 0)); then
	echo "⚠️  one or more CI performance budgets need review; quality result remains non-blocking"
else
	echo "✅ measured CI performance is within warning budgets"
fi
