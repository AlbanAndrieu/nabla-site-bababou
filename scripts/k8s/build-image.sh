#!/usr/bin/env bash
set -euo pipefail
# Local-only build and smoke. Never pushes, deploys, or invokes GitHub Actions.
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
for tool in git docker curl trivy betterleaks; do
  command -v "$tool" >/dev/null 2>&1 || { echo "Missing required tool: $tool" >&2; exit 2; }
done
SHA="$(git rev-parse HEAD)"
[[ "$SHA" =~ ^[a-f0-9]{40}$ ]] || exit 2
[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || {
  echo "Refusing image build from a dirty checkout" >&2
  exit 1
}
IMAGE="ghcr.io/albanandrieu/nabla-site-bababou-next:$SHA"
# Keep the canonical full local checks; do not downgrade privacy/security requirements.
bash scripts/verify-mise-npm.sh
bash scripts/agent-quality-gate.sh
betterleaks git . --redact --config .betterleaks.toml
docker buildx build --load --platform linux/amd64 --file Dockerfile.k8s \
  --build-arg "VCS_REF=$SHA" --tag "$IMAGE" .
[[ "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$IMAGE")" == "$SHA" ]] || {
  echo "Image revision label does not match the tested source SHA" >&2
  exit 1
}
[[ "$(docker image inspect --format '{{.Config.User}}' "$IMAGE")" == "10001:10001" ]] || {
  echo "Unexpected container user" >&2
  exit 1
}
trivy image --quiet --scanners vuln --severity HIGH,CRITICAL --exit-code 1 "$IMAGE"
cid=""
cleanup() {
  [[ -z "$cid" ]] || docker stop "$cid" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cid="$(docker run --detach --rm --read-only --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /tmp:rw,mode=1777 \
  --tmpfs /app/.next/cache:rw,uid=10001,gid=10001 \
  --publish 127.0.0.1::3000 "$IMAGE")"
address="$(docker port "$cid" 3000/tcp)"
[[ "$address" =~ ^127\.0\.0\.1:[0-9]+$ ]] || { echo "Unexpected port binding" >&2; exit 1; }
for attempt in $(seq 1 30); do
  if curl --fail --silent --max-time 5 "http://$address/" --output /dev/null; then
    echo "Local Next.js container smoke PASS: $SHA"
    echo "Local image: $IMAGE (NOT PUBLISHED; digest not yet known)"
    exit 0
  fi
  sleep 2
done
echo "Next.js container did not become ready" >&2
exit 1
