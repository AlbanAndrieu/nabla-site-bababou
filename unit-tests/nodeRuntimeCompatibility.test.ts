import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Node runtime policy separates development Current from production compatibility", async () => {
  const [nvmrc, productionNvmrc, envrc, packageRaw, security, workflow] =
    await Promise.all([
      read(".nvmrc"),
      read(".nvmrc-production"),
      read(".envrc"),
      read("package.json"),
      read("SECURITY.md"),
      read(".github/workflows/node24-compat.yml"),
    ]);
  const packageJson = JSON.parse(packageRaw) as {
    engines?: { node?: string; npm?: string };
  };

  assert.equal(nvmrc.trim(), "v26.8.2");
  assert.equal(productionNvmrc.trim(), "v24.11.0");
  assert.equal(packageJson.engines?.node, ">=24.11.0 <27");
  assert.match(envrc, /NODE_VERSIONS=\$\{NODE_VERSIONS:-"v26\.8\.2"\}/);
  assert.match(security, /Node 26 Current/);
  assert.match(security, /Vercel production uses its supported Node 24\.x runtime/);

  assert.match(workflow, /node-version-file:\s*"\.nvmrc-production"/);
  assert.doesNotMatch(workflow, /node-version:\s*"?\d/);
  assert.match(workflow, /github\.event\.pull_request\.draft == false/);
  assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.match(workflow, /npm run test:unit/);
  assert.doesNotMatch(workflow, /npm run build|npm run check(?!:)/);
});
