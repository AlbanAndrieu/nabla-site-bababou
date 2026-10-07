#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

MODE="${1:-changed}"
shift || true

CONFIG="${BETTERLEAKS_CONFIG:-.gitleaks.toml}"
IMAGE="${BETTERLEAKS_IMAGE:-ghcr.io/betterleaks/betterleaks:v1.9.0}"
SYSTEM_BIN="${BETTERLEAKS_BIN:-}"

if [[ ! -f "${CONFIG}" ]]; then
    printf '❌ BETTERLEAKS_CONFIG_MISSING: %s\n' "${CONFIG}" >&2
    exit 2
fi

run_betterleaks() {
    if [[ -n "${SYSTEM_BIN}" ]]; then
        "${SYSTEM_BIN}" "$@"
        return
    fi

    command -v docker >/dev/null 2>&1 || {
        echo "❌ BetterLeaks requires Docker or BETTERLEAKS_BIN." >&2
        exit 2
    }

    docker run --rm \
        --volume "${ROOT}:${ROOT}:ro" \
        --workdir "${ROOT}" \
        "${IMAGE}" "$@"
}

scan_files() {
    local -a files=("$@")
    if (("${#files[@]}" == 0)); then
        echo "✅ BetterLeaks: no files to scan."
        return
    fi

    run_betterleaks dir "${files[@]}" --redact --config "${CONFIG}"
}

scan_changed() {
    local -a files=()

    while IFS= read -r -d '' file; do
        [[ -f "${file}" ]] && files+=("${file}")
    done < <(
        {
            git diff --name-only --diff-filter=ACMR -z HEAD
            git ls-files --others --exclude-standard -z
        }
    )

    if (("${#files[@]}" > 1)); then
        mapfile -d '' -t files < <(printf '%s\0' "${files[@]}" | sort -zu)
    fi

    scan_files "${files[@]}"
}

case "${MODE}" in
    files)
        scan_files "$@"
        ;;
    changed)
        scan_changed
        ;;
    -h | --help)
        cat <<'EOF'
Usage: bash scripts/run-betterleaks.sh [files <path>...|changed]

files    scan the explicit files supplied by pre-commit or an operator
changed  scan tracked staged/unstaged changes plus non-ignored untracked files

The pre-commit framework supplies staged filenames and temporarily hides
unstaged changes, so the hook does not depend on BetterLeaks' Git diff mode.

Environment:
  BETTERLEAKS_BIN     optional system binary override; default uses pinned Docker v1.9.0
  BETTERLEAKS_IMAGE   optional Docker image override
  BETTERLEAKS_CONFIG  optional config path (default: .gitleaks.toml)
EOF
        ;;
    *)
        printf '❌ unknown BetterLeaks mode: %s\n' "${MODE}" >&2
        exit 2
        ;;
esac
