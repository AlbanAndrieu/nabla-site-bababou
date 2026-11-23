#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PRODUCTION_BASE_URL:-https://www.bababou.com}"
SMOKE_VERBOSE="${PRODUCTION_SMOKE_VERBOSE:-0}"
SMOKE_PASSED=0
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

	if [[ "${status}" == "402" ]]; then
		printf '❌ PROD_LIVE_PLATFORM_BLOCKED: Vercel returned HTTP 402; check team usage/quota before any additional scan\n' >&2
		return 1
	fi
	# An explicit Vercel mitigation is a security coverage blocker, not failed login.
	# Never echo the (untrusted) x-vercel-mitigated value or retry this probe.
	if [[ "${status}" == "429" || ( -n "${mitigated}" && "${mitigated,,}" != "none" ) ]]; then
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
			SMOKE_PASSED=$((SMOKE_PASSED + 1))
			if [[ "${SMOKE_VERBOSE}" == "1" ]]; then
				printf '✅ production %s: expected HTTP 307 → %s\n' "${path}" "${expected_redirect}"
			fi
			return 0
		fi
	fi

	if [[ "${status}" != "200" ]]; then
		printf '❌ PROD_LIVE_HTTP: %s%s returned HTTP %s%s\n' \
			"${BASE_URL}" "${path}" "${status}" \
			"${location:+ (Location: ${location%%\?*})}" >&2
		return 1
	fi

	SMOKE_PASSED=$((SMOKE_PASSED + 1))
	if [[ "${SMOKE_VERBOSE}" == "1" ]]; then
		printf '✅ production %s: HTTP 200\n' "${path}"
	fi
}

probe "/" "/index.html"
probe "/index.html"
probe "/test"
probe "/contact"
probe "/policy"

printf '✅ canonical production smoke passed: %d checks (PRODUCTION_SMOKE_VERBOSE=1 for details)\n' "${SMOKE_PASSED}"
