#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PRODUCTION_BASE_URL:-https://www.bababou.com}"
BYPASS_SECRET="${VERCEL_AUTOMATION_BYPASS_SECRET:-}"

if [[ -z "${BYPASS_SECRET}" ]]; then
	echo "❌ PROD_LIVE_CREDENTIAL_MISSING: VERCEL_AUTOMATION_BYPASS_SECRET is required" >&2
	exit 2
fi

BASE_URL="${BASE_URL%/}"

probe() {
	local path="$1"
	local expected_redirect="${2:-}"
	local headers
	local body
	local status
	local mitigated
	local location

	headers="$(mktemp)"
	body="$(mktemp)"
	trap 'rm -f "${headers}" "${body}"' RETURN

	status="$(curl --silent --show-error \
		--connect-timeout 5 \
		--max-time 15 \
		--output "${body}" \
		--dump-header "${headers}" \
		--write-out '%{http_code}' \
		--header "x-vercel-protection-bypass: ${BYPASS_SECRET}" \
		"${BASE_URL}${path}")"
	mitigated="$(awk 'BEGIN { IGNORECASE=1 } /^x-vercel-mitigated:/ { sub(/^[^:]+:[[:space:]]*/, ""); sub(/\r$/, ""); print; exit }' "${headers}")"
	location="$(awk 'BEGIN { IGNORECASE=1 } /^location:/ { sub(/^[^:]+:[[:space:]]*/, ""); sub(/\r$/, ""); print; exit }' "${headers}")"

	if [[ "${status}" == "429" || "${mitigated,,}" == "challenge" ]]; then
		printf '❌ PROD_LIVE_CHECKPOINT: %s%s hit the Vercel Security Checkpoint (HTTP %s)\n' \
			"${BASE_URL}" "${path}" "${status}" >&2
		return 1
	fi
	if grep -Eiq '^location: https://vercel\.com/(login|sso-api)' "${headers}" || \
		[[ "${status}" == "401" || "${status}" == "403" ]]; then
		printf '❌ PROD_LIVE_AUTH: %s%s rejected automation access (HTTP %s)\n' \
			"${BASE_URL}" "${path}" "${status}" >&2
		return 1
	fi

	if [[ "${status}" == "307" && -n "${expected_redirect}" ]]; then
		local redirect_path="${location%%\?*}"
		if [[ "${redirect_path}" == "${expected_redirect}" || "${redirect_path}" == "${BASE_URL}${expected_redirect}" ]]; then
			printf '✅ production %s: expected HTTP 307 → %s\n' "${path}" "${expected_redirect}"
			return 0
		fi
	fi

	if [[ "${status}" != "200" ]]; then
		printf '❌ PROD_LIVE_HTTP: %s%s returned HTTP %s%s\n' \
			"${BASE_URL}" "${path}" "${status}" \
			"${location:+ (Location: ${location%%\?*})}" >&2
		return 1
	fi

	printf '✅ production %s: HTTP 200\n' "${path}"
}

probe "/" "/index.html"
probe "/index.html"
probe "/test"
probe "/contact"
probe "/policy"

echo "✅ canonical production smoke passed before PR dependency installation"
