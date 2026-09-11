#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

BASE_SHA="${BASE_SHA:-${QUALITY_BASE_REF:-}}"
GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
API_URL="${GITHUB_API_URL:-https://api.github.com}"
REPOSITORY="${GITHUB_REPOSITORY:-}"
MAX_RELEASE_HOPS="${QUALITY_BASELINE_RELEASE_HOPS:-3}"

required_contexts=(
	"Vercel"
	"Production Post-deploy Smoke"
	"Production DAST"
)

if [[ ! "${BASE_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
	printf '❌ PROD_BASE_INVALID: BASE_SHA must be a 40-character commit SHA, got %s\n' "${BASE_SHA:-<empty>}" >&2
	exit 2
fi
if [[ -z "${GH_TOKEN}" ]]; then
	echo "❌ PROD_BASE_TOKEN_MISSING: GH_TOKEN/GITHUB_TOKEN is required" >&2
	exit 2
fi
if [[ ! "${REPOSITORY}" =~ ^[^/]+/[^/]+$ ]]; then
	printf '❌ PROD_BASE_REPOSITORY_INVALID: GITHUB_REPOSITORY must be owner/name, got %s\n' "${REPOSITORY:-<empty>}" >&2
	exit 2
fi
if [[ ! "${MAX_RELEASE_HOPS}" =~ ^[0-9]+$ ]]; then
	printf '❌ QUALITY_BASELINE_RELEASE_HOPS must be a non-negative integer, got %s\n' "${MAX_RELEASE_HOPS}" >&2
	exit 2
fi

status_json() {
	local sha="$1"
	curl --fail-with-body --silent --show-error \
		--header "Authorization: Bearer ${GH_TOKEN}" \
		--header 'Accept: application/vnd.github+json' \
		--header 'X-GitHub-Api-Version: 2022-11-28' \
		"${API_URL}/repos/${REPOSITORY}/commits/${sha}/status?per_page=100"
}

latest_status() {
	local json="$1"
	local context="$2"
	jq -c --arg context "${context}" \
		'([.statuses[]? | select(.context == $context)] | sort_by(.created_at) | last) // {}' \
		<<<"${json}"
}

has_ignored_vercel_status() {
	local json="$1"
	jq -e \
		'any(.statuses[]?; .context == "Vercel" and .description == "Canceled by Ignored Build Step")' \
		<<<"${json}" >/dev/null
}

release_only_hop() {
	local parent="$1"
	local child="$2"
	local message
	local file
	local package_changed=false
	local lock_changed=false
	local changelog_changed=false
	local normalized_filter

	message="$(git log -1 --format=%B "${child}")"
	if [[ "${message%%$'\n'*}" != chore\(release\):* ]] || ! grep -Fq '[skip ci]' <<<"${message}"; then
		return 1
	fi

	mapfile -t release_files < <(git diff --name-only --diff-filter=ACMR "${parent}" "${child}" | awk 'NF' | sort -u)
	if (("${#release_files[@]}" == 0)); then
		return 1
	fi

	for file in "${release_files[@]}"; do
		case "${file}" in
			CHANGELOG.md)
				changelog_changed=true
				;;
			package.json)
				package_changed=true
				;;
			package-lock.json)
				lock_changed=true
				;;
			*)
				printf '❌ PROD_BASE_RELEASE_SCOPE: %s changes unexpected file %s\n' "${child}" "${file}" >&2
				return 1
				;;
		esac
	done

	if [[ "${package_changed}" != true || "${lock_changed}" != true ]]; then
		printf '❌ PROD_BASE_RELEASE_SCOPE: %s does not contain the expected package version pair\n' "${child}" >&2
		return 1
	fi

	if ! cmp -s \
		<(git show "${parent}:package.json" | jq -S 'del(.version)') \
		<(git show "${child}:package.json" | jq -S 'del(.version)'); then
		printf '❌ PROD_BASE_RELEASE_SCOPE: package.json changed beyond version metadata in %s\n' "${child}" >&2
		return 1
	fi

	normalized_filter='del(.version) | if ((.packages // {}) | has("")) then .packages[""] |= del(.version) else . end'
	if ! cmp -s \
		<(git show "${parent}:package-lock.json" | jq -S "${normalized_filter}") \
		<(git show "${child}:package-lock.json" | jq -S "${normalized_filter}"); then
		printf '❌ PROD_BASE_RELEASE_SCOPE: package-lock.json changed beyond root version metadata in %s\n' "${child}" >&2
		return 1
	fi

	if [[ "${changelog_changed}" == true ]]; then
		printf 'ℹ️  accepted semantic-release metadata hop %s -> %s (version + changelog only)\n' "${parent}" "${child}"
	else
		printf 'ℹ️  accepted semantic-release metadata hop %s -> %s (version only)\n' "${parent}" "${child}"
	fi
	return 0
}

candidate="${BASE_SHA}"
release_hops=0

while :; do
	json="$(status_json "${candidate}")"
	missing=()
	failed=()

	for context in "${required_contexts[@]}"; do
		status="$(latest_status "${json}" "${context}")"
		state="$(jq -r '.state // "missing"' <<<"${status}")"
		description="$(jq -r '.description // ""' <<<"${status}")"

		case "${state}" in
			success)
				printf '✅ %s @ %s: %s\n' "${context}" "${candidate}" "${description:-success}"
				;;
			missing)
				missing+=("${context}")
				;;
			*)
				failed+=("${context}=${state}")
				;;
		esac
	done

	if (("${#failed[@]}" > 0)); then
		printf '❌ PROD_BASE_UNHEALTHY: %s has non-success production status(es): %s\n' \
			"${candidate}" "${failed[*]}" >&2
		exit 1
	fi

	if (("${#missing[@]}" == 0)); then
		printf '✅ production baseline healthy at %s\n' "${candidate}"
		if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
			printf 'baseline_sha=%s\nrelease_hops=%d\n' "${candidate}" "${release_hops}" >>"${GITHUB_OUTPUT}"
		fi
		if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
			{
				echo "## Production baseline"
				echo
				echo "- PR base: \`${BASE_SHA}\`"
				echo "- healthy production baseline: \`${candidate}\`"
				echo "- semantic-release metadata hops: ${release_hops}"
				echo "- required statuses: Vercel, Production Post-deploy Smoke, Production DAST"
			} >>"${GITHUB_STEP_SUMMARY}"
		fi
		exit 0
	fi

	if ((release_hops >= MAX_RELEASE_HOPS)); then
		printf '❌ PROD_BASE_MISSING: %s is missing required production status(es): %s\n' \
			"${candidate}" "${missing[*]}" >&2
		exit 1
	fi

	if ! has_ignored_vercel_status "${json}"; then
		printf '❌ PROD_BASE_MISSING: %s is missing %s and has no ignored Vercel release status\n' \
			"${candidate}" "${missing[*]}" >&2
		exit 1
	fi

	parent="$(git rev-parse "${candidate}^")"
	if ! release_only_hop "${parent}" "${candidate}"; then
		printf '❌ PROD_BASE_RELEASE_SCOPE: cannot inherit an older production baseline across %s\n' "${candidate}" >&2
		exit 1
	fi

	printf 'ℹ️  ignored Vercel production status found in %s history; later Preview statuses do not block release-baseline inheritance\n' "${candidate}"
	candidate="${parent}"
	((release_hops += 1))
done
