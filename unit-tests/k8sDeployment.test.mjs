import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/k8s/deploy-bababou.sh", import.meta.url));
const digest = "a".repeat(64);
const image = "ghcr.io/albanandrieu/nabla-site-bababou@sha256:" + digest;

function run(mode = "--render", overrides = {}) {
  return spawnSync("bash", [script, mode], {
    encoding: "utf8",
    env: {
      ...process.env,
      BABABOU_K8S_IMAGE: image,
      BABABOU_K8S_HOST: "bababou.int.albandrieu.com",
      BABABOU_K8S_ALLOW_APPLY: "false",
      ...overrides,
    },
  });
}

test("offline rendering emits a digest-pinned, private and restricted workload", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  for (const fragment of [
    "kind: Namespace",
    "kind: Deployment",
    "kind: Service",
    "kind: Ingress",
    "pod-security.kubernetes.io/enforce: restricted",
    "automountServiceAccountToken: false",
    "readOnlyRootFilesystem: true",
    "runAsNonRoot: true",
    "capabilities:",
    "drop: [ALL]",
    "type: ClusterIP",
    "ingressClassName: traefik",
    "secretName: bababou-internal-tls",
    "host: bababou.int.albandrieu.com",
    "mountPath: /app/.next/cache",
    "image: " + image,
  ]) {
    assert.ok(result.stdout.includes(fragment), "Missing: " + fragment);
  }
  assert.doesNotMatch(result.stdout, /kind: (NodePort|LoadBalancer)/);
  assert.doesNotMatch(result.stdout, /hostNetwork: true/);
  assert.doesNotMatch(result.stdout, /www\.bababou\.com/);
});

test("rendering fails closed when the image is absent or mutable", () => {
  for (const bad of ["", "ghcr.io/albanandrieu/nabla-site-bababou:latest",
    "ghcr.io/other/website@sha256:" + digest, "ghcr.io/albanandrieu/nabla-site-bababou@sha256:no"]) {
    const result = run("--render", { BABABOU_K8S_IMAGE: bad });
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
  }
});

test("rendering rejects public hosts and YAML injection", () => {
  for (const host of ["www.bababou.com", "bababou.com",
    "a.int.albandrieu.com\nkind: Secret", "a.int.albandrieu.com.evil.example"]) {
    const result = run("--render", { BABABOU_K8S_HOST: host });
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
  }
  const namespace = run("--render", { BABABOU_K8S_NAMESPACE: "public; echo x" });
  assert.notEqual(namespace.status, 0);
});

test("apply cannot reach kubectl without an explicit operator opt-in", () => {
  const result = run("--apply");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /BABABOU_K8S_ALLOW_APPLY=true/);
  assert.equal(result.stdout, "");
});

test("preflight is read-only and requires explicit cluster configuration", () => {
  const result = run("--preflight", { KUBECONFIG: "" });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
});
