#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

MODE="${1:-staged}"
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

    local common_dir
    local git_common
    local -a docker_args=(
        run --rm
        --volume "${ROOT}:${ROOT}:ro"
        --workdir "${ROOT}"
    )

    git_common="$(git rev-parse --git-common-dir)"
    if [[ "${git_common}" == /* ]]; then
        common_dir="${git_common}"
    else
        common_dir="${ROOT}/${git_common}"
    fi
    common_dir="$(cd "${common_dir}" && pwd -P)"

    case "${common_dir}" in
        "${ROOT}" | "${ROOT}"/*)
            ;;
        *)
            docker_args+=(--volume "${common_dir}:${common_dir}:ro")
            ;;
    esac

    docker "${docker_args[@]}" "${IMAGE}" "$@"
}

scan_staged() {
    run_betterleaks git --pre-commit --staged --redact --config "${CONFIG}"
}

scan_changed() {
    local -a untracked=()

    # BetterLeaks git/pre-commit covers tracked staged + unstaged diffs.
    run_betterleaks git --pre-commit --redact --config "${CONFIG}"

    # BetterLeaks v1 has no single all-committable-changes mode.
    # Add ignored-aware untracked coverage explicitly.
    while IFS= read -r -d '' file; do
        untracked+=("${file}")
    done < <(git ls-files --others --exclude-standard -z)

    if (("${#untracked[@]}" == 0)); then
        echo "✅ BetterLeaks changed scan: no untracked files outside .gitignore."
        return
    fi

    run_betterleaks dir "${untracked[@]}" --redact --config "${CONFIG}"
    printf '✅ BetterLeaks changed scan covered %d untracked file(s).\n' "${#untracked[@]}"
}

case "${MODE}" in
    staged)
        scan_staged
        ;;
    changed)
        scan_changed
        ;;
    -h | --help)
        cat <<'EOF'
Usage: bash scripts/run-betterleaks.sh [staged|changed]

staged  scan only the staged Git diff (pre-commit contract)
changed scan tracked staged/unstaged diffs plus non-ignored untracked files

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
