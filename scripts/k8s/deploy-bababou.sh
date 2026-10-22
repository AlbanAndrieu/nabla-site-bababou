#!/usr/bin/env bash
set -euo pipefail
# Explicitly opt-in Talos deployment; default is offline rendering only.
MODE="${1:---render}"
NAMESPACE="${BABABOU_K8S_NAMESPACE:-nabla-site-bababou}"
HOST="${BABABOU_K8S_HOST:-bababou.int.albandrieu.com}"
INGRESS_CLASS="${BABABOU_K8S_INGRESS_CLASS:-traefik}"
TLS_SECRET="${BABABOU_K8S_TLS_SECRET:-bababou-internal-tls}"
CONTEXT="${BABABOU_K8S_CONTEXT:-admin@nabla-talos}"
IMAGE="${BABABOU_K8S_IMAGE:-}"
DEPLOYMENT=nabla-site-bababou

fail() { printf '❌ %s\n' "$*" >&2; exit 1; }
usage() {
  cat <<'HELP'
Usage: BABABOU_K8S_IMAGE=ghcr.io/albanandrieu/nabla-site-bababou@sha256:<digest> \
  bash scripts/k8s/deploy-bababou.sh [--render|--preflight|--server-dry-run|--apply]
Render is offline/read-only. Apply also needs BABABOU_K8S_ALLOW_APPLY=true.
Public domain and Vercel traffic remain unchanged.
HELP
}

case "$MODE" in
  --render|--preflight|--server-dry-run|--apply) ;;
  --help|-h) usage; exit 0 ;;
  *) usage >&2; fail "unsupported mode" ;;
esac
[[ "$NAMESPACE" =~ ^[a-z][a-z0-9-]{0,62}$ ]] || fail "invalid namespace"
[[ "$INGRESS_CLASS" =~ ^[a-z][a-z0-9-]{0,62}$ ]] || fail "invalid ingress class"
[[ "$TLS_SECRET" =~ ^[a-z][a-z0-9-]{0,62}$ ]] || fail "invalid TLS secret"
[[ "$HOST" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.int\.albandrieu\.com$ ]] ||
  fail "only reviewed *.int.albandrieu.com hostnames are permitted"
[[ "$CONTEXT" =~ ^[a-zA-Z0-9@_.-]+$ ]] || fail "invalid Kubernetes context"
if [[ "$MODE" == --apply && "${BABABOU_K8S_ALLOW_APPLY:-false}" != true ]]; then
  fail "set BABABOU_K8S_ALLOW_APPLY=true explicitly before deploying"
fi

preflight() {
  for tool in kubectl jq python3; do
    command -v "$tool" >/dev/null 2>&1 || fail "missing tool: $tool"
  done
  [[ -n "${KUBECONFIG:-}" && -s "${KUBECONFIG}" ]] ||
    fail "set KUBECONFIG to the reviewed Talos kubeconfig"
  local actual_context
  actual_context="$(kubectl config current-context)" || fail "cannot inspect kubeconfig"
  [[ "$actual_context" == "$CONTEXT" ]] ||
    fail "wrong Kubernetes context: $actual_context (expected $CONTEXT)"
  kubectl get ingressclass "$INGRESS_CLASS" >/dev/null ||
    fail "IngressClass unavailable"
  kubectl get namespace "$NAMESPACE" >/dev/null ||
    fail "namespace missing: bootstrap it and install the TLS secret first"
  local secret_type
  secret_type="$(kubectl -n "$NAMESPACE" get secret "$TLS_SECRET" -o jsonpath='{.type}')" ||
    fail "TLS secret unavailable"
  [[ "$secret_type" == kubernetes.io/tls ]] || fail "expected kubernetes.io/tls secret"
  local claims
  claims="$(kubectl get ingress -A -o json | jq -r \
    --arg host "$HOST" --arg namespace "$NAMESPACE" \
    '.items[] | select(any(.spec.rules[]?; .host == $host))
     | select(.metadata.namespace != $namespace or .metadata.name != "nabla-site-bababou")
     | "\(.metadata.namespace)/\(.metadata.name)"')" ||
    fail "cannot inspect ingress ownership"
  [[ -z "$claims" ]] || fail "hostname is already claimed: $claims"
  python3 - "$HOST" <<'PY' || fail "private DNS resolution failed"
import ipaddress
import socket
import sys
host = sys.argv[1]
addresses = {entry[4][0] for entry in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}
if not addresses or not all(ipaddress.ip_address(ip).is_private for ip in addresses):
    raise SystemExit("DNS must resolve to private addresses only")
print(f"Private DNS verified: {host}")
PY
  printf 'Preflight OK: %s (%s)\n' "$CONTEXT" "$NAMESPACE"
}
if [[ "$MODE" == --preflight ]]; then preflight; exit 0; fi
[[ "$IMAGE" =~ ^ghcr\.io/albanandrieu/nabla-site-bababou@sha256:[a-f0-9]{64}$ ]] ||
  fail "BABABOU_K8S_IMAGE must be the exact approved GHCR digest"

manifest="$(mktemp)"
trap 'rm -f "$manifest"' EXIT
cat >"$manifest" <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ${NAMESPACE}
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${DEPLOYMENT}
  namespace: ${NAMESPACE}
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate: {maxSurge: 1, maxUnavailable: 0}
  selector:
    matchLabels: {app.kubernetes.io/name: ${DEPLOYMENT}}
  template:
    metadata:
      labels: {app.kubernetes.io/name: ${DEPLOYMENT}}
    spec:
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        runAsGroup: 10001
        fsGroup: 10001
        seccompProfile: {type: RuntimeDefault}
      containers:
        - name: nextjs
          image: ${IMAGE}
          imagePullPolicy: IfNotPresent
          env:
            - {name: NODE_ENV, value: production}
            - {name: HOSTNAME, value: "0.0.0.0"}
            - {name: PORT, value: "3000"}
            - {name: NEXT_TELEMETRY_DISABLED, value: "1"}
          ports:
            - {name: http, containerPort: 3000}
          startupProbe:
            httpGet: {path: /, port: http}
            periodSeconds: 5
            failureThreshold: 24
          readinessProbe:
            httpGet: {path: /, port: http}
            periodSeconds: 10
            failureThreshold: 3
          livenessProbe:
            httpGet: {path: /, port: http}
            periodSeconds: 20
            failureThreshold: 3
          resources:
            requests: {cpu: 100m, memory: 192Mi, ephemeral-storage: 128Mi}
            limits: {cpu: "1", memory: 768Mi, ephemeral-storage: 512Mi}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
          volumeMounts:
            - {name: tmp, mountPath: /tmp}
            - {name: next-cache, mountPath: /app/.next/cache}
      volumes:
        - name: tmp
          emptyDir: {sizeLimit: 128Mi}
        - name: next-cache
          emptyDir: {sizeLimit: 256Mi}
---
apiVersion: v1
kind: Service
metadata:
  name: ${DEPLOYMENT}
  namespace: ${NAMESPACE}
spec:
  type: ClusterIP
  selector: {app.kubernetes.io/name: ${DEPLOYMENT}}
  ports:
    - {name: http, port: 80, targetPort: http}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${DEPLOYMENT}
  namespace: ${NAMESPACE}
spec:
  ingressClassName: ${INGRESS_CLASS}
  tls:
    - hosts: [${HOST}]
      secretName: ${TLS_SECRET}
  rules:
    - host: ${HOST}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${DEPLOYMENT}
                port: {number: 80}
EOF
case "$MODE" in
  --render) cat "$manifest" ;;
  --server-dry-run)
    preflight
    kubectl apply --dry-run=server -f "$manifest"
    ;;
  --apply)
    preflight
    kubectl apply --dry-run=server -f "$manifest"
    kubectl apply -f "$manifest"
    kubectl -n "$NAMESPACE" rollout status deployment/"$DEPLOYMENT" --timeout=180s
    ;;
esac
