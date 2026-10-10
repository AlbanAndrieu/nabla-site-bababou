#!/usr/bin/env bash
set -euo pipefail

readonly DAGGER_REQUIRED_VERSION="v0.21.10"
readonly NODE_IMAGE="node:26.8.2-bookworm@sha256:e7bc1a4cd2419953c91f9a6f7bb6efb3737773093fb4ded0b1c77a0a5831fac4"
readonly SOURCE_EXCLUDES=".git/**,.private-publication-source/**,.redaction-work/**,.env*,**/.env*,**/*.pem,**/*.key,**/*.p12,**/*.pfx,**/id_rsa*,**/id_ed25519*,.vercel/**,node_modules/**,.next/**,test-results/**,playwright-report/**,megalinter-reports/**"

usage() {
    cat <<'EOF'
Usage: bash scripts/dagger-ci.sh <target>

Targets:
  p0                 Run dependency-free P0 contracts in an isolated Git snapshot.
  quality-preflight  Run the dependency-free agent quality preflight.
  test               Install dependencies and run unit tests.
  build              Install dependencies and run the production Next build.

This is an opt-in Dagger spike. It intentionally does not expose the host Docker
socket or claim parity with the full canonical quality gate.
EOF
}

require_dagger() {
    command -v dagger >/dev/null 2>&1 || {
        echo "❌ dagger is required (expected ${DAGGER_REQUIRED_VERSION})" >&2
        exit 127
    }

    local actual
    actual="$(dagger version 2>/dev/null | awk 'NR == 1 {print $2}')"
    if [[ "${actual}" != "${DAGGER_REQUIRED_VERSION}" ]]; then
        printf '❌ DAGGER_VERSION: expected %s, got %s\n' \
            "${DAGGER_REQUIRED_VERSION}" "${actual:-unknown}" >&2
        exit 2
    fi
}

container_exec() {
    local command="$1"

    dagger -M core container \
        from --address="${NODE_IMAGE}" \
        with-directory \
        --path=/workspace \
        --source=. \
        --gitignore=true \
        --exclude="${SOURCE_EXCLUDES}" \
        with-workdir --path=/workspace \
        with-exec --args "bash" "-lc" "${command}" \
        sync >/dev/null
}

readonly SANDBOX_GIT_PREFIX='
git init -q
git config user.name "nabla-dagger-spike"
git config user.email "nabla-dagger-spike@example.invalid"
git add -A
git commit -qm "chore: dagger isolated snapshot"
'

readonly NODE_BOOTSTRAP='
npm install --global "npm@11.17.0" --no-audit --no-fund
npm ci --no-audit --no-fund
'

main() {
    local target="${1:-}"
    case "${target}" in
        -h | --help)
            if (($# != 1)); then
                usage >&2
                exit 2
            fi
            usage
            exit 0
            ;;
        "")
            usage >&2
            exit 2
            ;;
    esac

    if (($# != 1)); then
        usage >&2
        exit 2
    fi

    # Reject unsupported targets before invoking Dagger or contacting its runtime.
    case "${target}" in
        p0 | quality-preflight | test | build) ;;
        *)
            printf '❌ unknown Dagger target: %s\n' "${target}" >&2
            usage >&2
            exit 2
            ;;
    esac

    require_dagger

    case "${target}" in
        p0)
            container_exec "${SANDBOX_GIT_PREFIX}
QUALITY_BASE_REF=HEAD bash scripts/agent-p0-check.sh"
            ;;
        quality-preflight)
            container_exec "${SANDBOX_GIT_PREFIX}
QUALITY_BASE_REF=HEAD bash scripts/agent-quality-gate.sh --preflight"
            ;;
        test)
            container_exec "${NODE_BOOTSTRAP}
npm run test:unit"
            ;;
        build)
            container_exec "${NODE_BOOTSTRAP}
NEXT_TELEMETRY_DISABLED=1 npm run build"
            ;;
        *)
            printf '❌ unknown Dagger target: %s\n' "${target}" >&2
            usage >&2
            exit 2
            ;;
    esac

    printf '✅ Dagger spike target %s passed with %s\n' \
        "${target}" "${DAGGER_REQUIRED_VERSION}"
}

main "$@"
