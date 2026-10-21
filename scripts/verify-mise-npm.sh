#!/usr/bin/env bash
# Validate the active npm against the single pinned version in mise.toml.
set -euo pipefail

mise_config="${1:-mise.toml}"
if [[ ! -r "${mise_config}" ]]; then
    printf '❌ MISE_NPM_CONFIG_MISSING: %s is not readable\n' "${mise_config}" >&2
    exit 1
fi

pin_count="$(grep -Ec '^[[:space:]]*npm[[:space:]]*=' "${mise_config}" || true)"
expected="$(sed -nE 's/^[[:space:]]*npm[[:space:]]*=[[:space:]]*"([0-9]+\.[0-9]+\.[0-9]+)"[[:space:]]*$/\1/p' "${mise_config}")"
if [[ "${pin_count}" != 1 || ! "${expected}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    printf '❌ MISE_NPM_UNPINNED: exactly one valid npm version is required in %s\n' "${mise_config}" >&2
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo '❌ MISE_NPM_MISSING: npm is not installed' >&2
    exit 1
fi
if ! actual="$(npm --version 2>/dev/null)"; then
    echo '❌ MISE_NPM_VERSION: unable to query active npm' >&2
    exit 1
fi
if [[ "${actual}" != "${expected}" ]]; then
    printf '❌ MISE_NPM_MISMATCH: expected=%s actual=%s\n' "${expected}" "${actual}" >&2
    exit 1
fi

printf '✅ MISE_NPM_OK npm=%s\n' "${actual}"
