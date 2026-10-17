#!/usr/bin/env bash
# Reproducible, opt-in acquisition of the pinned public audit skill.
set -euo pipefail

readonly upstream_url="https://github.com/cloudflare/security-audit-skill.git"
readonly upstream_sha="c1c8a8c1471069fb0e188eeaff69b8e8db6564a8"
usage() {
  printf 'Usage: bash %s --verify-existing <checkout-dir> | --fetch-verify <empty-dir>\n' "$0" >&2
  exit 2
}
[[ $# -eq 2 ]] || usage
mode="$1"
target="$2"
case "$mode" in
  --verify-existing)
    [[ -d "$target" && ! -L "$target" ]] || { echo "Expected a real checkout directory" >&2; exit 2; }
    ;;
  --fetch-verify)
    [[ ! -e "$target" && ! -L "$target" ]] || { echo "Refusing to overwrite an existing path" >&2; exit 2; }
    git clone --no-checkout --filter=blob:none "$upstream_url" "$target"
    git -C "$target" -c advice.detachedHead=false checkout --detach "$upstream_sha"
    ;;
  *) usage ;;
esac

# Refuse a different Git revision; file-level integrity is verified separately.
actual_sha="$(git -C "$target" rev-parse HEAD)"
if [[ "$actual_sha" != "$upstream_sha" ]]; then
  echo "Unexpected upstream HEAD: $actual_sha" >&2
  exit 1
fi
node "$(dirname "$0")/verify-security-audit-skill.mjs" "$target"
echo "Snapshot pin and 22-file integrity verified. Audit NOT executed."
