#!/usr/bin/env bash
# Read-only production smoke: report each result; never mistake DNS failures for HTTP failures.
set -uo pipefail
base="${1:-https://bababou.com}"
base="${base%/}"
fail=0
for path in / /en /de /no /for-fathers.html /people-contacted.html /central-authorities.html /feed.xml /eleonore-feed.xml /robots.txt /policy/privacy_policy.html; do
  url="${base}${path}"
  if result="$(curl --silent --show-error --location --max-time 15 --output /dev/null --write-out '%{http_code} %{url_effective}' "$url")"; then
    code="${result%% *}"
    case "$code" in
      200) printf 'PASS %s %s\n' "$path" "$result" ;;
      *) printf 'FAIL %s %s\n' "$path" "$result"; fail=1 ;;
    esac
  else
    printf 'UNVERIFIED %s (network/DNS/TLS error)\n' "$path" >&2
    fail=1
  fi
done
exit "$fail"
