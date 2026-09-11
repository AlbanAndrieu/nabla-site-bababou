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
	} >>"${GITHUB_STEP_SUMMARY}"
fi

if ((warned != 0)); then
	echo "⚠️  one or more CI performance budgets need review; quality result remains non-blocking"
else
	echo "✅ measured CI performance is within warning budgets"
fi
