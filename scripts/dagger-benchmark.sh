# Invoked with bash; intentionally non-executable in Git.
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: bash scripts/dagger-benchmark.sh [p0|quality-preflight|test|build]
Execute the same opt-in Dagger target twice, reporting each wall-clock sample.
The first/second samples are NOT proof of cold/warm cache without runtime traces.
EOF
}

target="${1:-p0}"
if (($# > 1)); then
    usage >&2
    exit 2
fi
case "${target}" in
    -h | --help)
        usage
        exit 0
        ;;
    p0 | quality-preflight | test | build) ;;
    *)
        printf '❌ unsupported benchmark target: %s\n' "${target}" >&2
        usage >&2
        exit 2
        ;;
esac

for iteration in 1 2; do
    printf 'DAGGER_SAMPLE=%d DAGGER_TARGET=%s\n' "${iteration}" "${target}"
    bash scripts/dagger-ci.sh "${target}"
done
echo 'ℹ️ Compare samples only with matching code, engine, hardware, and cache provenance.'
