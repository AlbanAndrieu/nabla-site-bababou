import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Docker CI skips draft PRs and targets master/static fallback inputs only", async () => {
  const workflow = await read(".github/workflows/docker-build.yml");

  assert.match(workflow, /branches: \[master\]/);
  assert.doesNotMatch(workflow, /branches: \[main\]/);
  assert.equal(workflow.match(/"public\/\*\*"/g)?.length, 2);
  assert.match(workflow, /"Dockerfile"/);
  assert.match(workflow, /"\.dockerignore"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /publish_dockerhub:/);
  assert.match(
    workflow,
    /github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.draft == false/,
  );
});

test("Docker fallback builds and scans the Bababou image without Node or pgclient debt", async () => {
  const workflow = await read(".github/workflows/docker-build.yml");

  assert.match(workflow, /LOCAL_IMAGE: nabla-site-bababou:ci/);
  assert.match(workflow, /GHCR_IMAGE: ghcr\.io\/albanandrieu\/nabla-site-bababou/);
  assert.match(workflow, /DOCKERHUB_IMAGE: nabla\/nabla-site-bababou/);
  assert.ok(
    workflow.includes(
      "docker/setup-buildx-action@37fe631027851001ddb9b187196cc803df7f5f0e",
    ),
  );
  assert.ok(
    workflow.includes(
      "docker/build-push-action@53b7df96c91f9c12dcc8a07bcb9ccacbed38856a",
    ),
  );
  assert.match(workflow, /context: \./);
  assert.match(workflow, /load: true/);
  assert.match(workflow, /push: false/);
  assert.match(workflow, /cache-from: type=gha/);
  assert.match(workflow, /cache-to: type=gha,mode=max/);
  assert.match(workflow, /image-ref: \$\{\{ env\.LOCAL_IMAGE \}\}/);
  assert.ok(
    workflow.includes(
      "aquasecurity/trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25",
    ),
  );
  assert.match(workflow, /version: "v0\.74\.0"/);
  assert.match(workflow, /scanners: "vuln"/);
  assert.match(workflow, /format: "sarif"/);
  assert.match(workflow, /limit-severities-for-sarif: true/);
  assert.match(workflow, /exit-code: "1"/);
  assert.match(workflow, /id: trivy-scan/);
  assert.match(workflow, /continue-on-error: true/);
  assert.doesNotMatch(workflow, /sarif\.tpl/);
  assert.match(workflow, /Preserve failed Trivy SARIF report/);
  assert.ok(
    workflow.includes(
      "actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f",
    ),
  );
  assert.match(workflow, /trivy-sarif-\$\{\{ github\.sha \}\}/);
  assert.match(
    workflow,
    /steps\.trivy-scan\.outcome != 'success'.*hashFiles\('trivy-results\.sarif'\) != ''/s,
  );
  assert.match(workflow, /retention-days: 7/);
  assert.doesNotMatch(workflow, /retention-days: 14/);
  assert.match(workflow, /Detect GitHub Code Scanning availability/);
  assert.match(workflow, /code-scanning\/alerts\?per_page=1/);
  assert.match(
    workflow,
    /steps\.code-scanning\.outputs\.enabled == 'true'.*hashFiles\('trivy-results\.sarif'\) != ''/s,
  );
  assert.ok(
    workflow.includes(
      "github/codeql-action/upload-sarif@cdf488f595d80d6e07e03d4674febd5ab45fa938",
    ),
  );
  assert.match(workflow, /Enforce Trivy vulnerability scan/);
  assert.match(workflow, /steps\.trivy-scan\.outcome == 'failure'/);
  assert.ok(
    workflow.indexOf("- name: Preserve failed Trivy SARIF report") <
      workflow.indexOf("- name: Enforce Trivy vulnerability scan"),
  );
  assert.ok(
    workflow.indexOf("- name: Upload Trivy scan results to GitHub Code Scanning") <
      workflow.indexOf("- name: Enforce Trivy vulnerability scan"),
  );
  assert.ok(
    workflow.indexOf("- name: Enforce Trivy vulnerability scan") <
      workflow.indexOf("- name: Login to GitHub Container Registry"),
  );
  assert.match(workflow, /actions: read/);

  assert.doesNotMatch(workflow, /pgclient/i);
  assert.doesNotMatch(workflow, /PG_MAJOR/);
  assert.doesNotMatch(workflow, /actions\/setup-node/);
  assert.doesNotMatch(workflow, /npm install/);
  assert.doesNotMatch(workflow, /GITHUB_CONTEXT/);
});

test("Docker fallback smoke test proves non-root runtime and protected static assets", async () => {
  const workflow = await read(".github/workflows/docker-build.yml");

  assert.match(workflow, /Smoke test fallback container/);
  assert.match(
    workflow,
    /docker run --detach --rm --publish 127\.0\.0\.1:18080:8080/,
  );
  assert.match(workflow, /http:\/\/127\.0\.0\.1:18080\/404\.html/);
  assert.ok(
    workflow.includes(
      '"http://127.0.0.1:18080/assets/fontawesome-free-7.1.0-web/js/${asset}"',
    ),
  );
  assert.match(workflow, /docker exec "\$\{container_id\}" id -u/);
  assert.match(workflow, /runtime_uid.*== "0"/s);
  assert.ok(
    workflow.indexOf("- name: Smoke test fallback container") <
      workflow.indexOf("- name: Run Trivy vulnerability scanner"),
  );
});

test("Docker fallback publishing is safe by default", async () => {
  const workflow = await read(".github/workflows/docker-build.yml");

  assert.match(
    workflow,
    /github\.event_name == 'push' && github\.ref == 'refs\/heads\/master'/,
  );
  assert.match(workflow, /docker push "\$\{GHCR_IMAGE\}:latest"/);
  assert.match(workflow, /docker push "\$\{GHCR_IMAGE\}:\$\{GITHUB_SHA\}"/);
  assert.match(
    workflow,
    /github\.event_name == 'workflow_dispatch' && inputs\.publish_dockerhub/,
  );
  assert.ok(
    workflow.includes(
      "docker/login-action@dbcb813823bdd20940b903addbd779551569679f",
    ),
  );
});

test("Docker context contains only the reviewed public fallback", async () => {
  const [dockerignore, dockerfile] = await Promise.all([
    read(".dockerignore"),
    read("Dockerfile"),
  ]);

  assert.equal(dockerignore, "**\n!public/\n!public/**\n");
  assert.match(dockerfile, /Static fallback only/);
  assert.match(
    dockerfile,
    /FROM nginxinc\/nginx-unprivileged:1\.30\.4-alpine-slim/,
  );
  assert.doesNotMatch(dockerfile, /nginx:1\.27-alpine/);
  assert.match(dockerfile, /EXPOSE 8080/);
  assert.match(dockerfile, /USER 101/);
  assert.match(dockerfile, /COPY public\/ \/usr\/share\/nginx\/html\//);
  assert.match(
    dockerfile,
    /org\.opencontainers\.image\.title="nabla-site-bababou"/,
  );
  assert.doesNotMatch(dockerfile, /version="0\.0\.5"/);
});
