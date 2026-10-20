import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared platform hardening stays aligned with nabla-site-alban", async () => {
  const [dockerfile, nextConfig, nvmrc, productionNvmrc, nodeCompat] =
    await Promise.all([
      source("Dockerfile"),
      source("next.config.mjs"),
      source(".nvmrc"),
      source(".nvmrc-production"),
      source(".github/workflows/node24-compat.yml"),
    ]);

  assert.match(
    dockerfile,
    /FROM nginxinc\/nginx-unprivileged:1\.30\.4-alpine-slim@sha256:3a4485bf084957d56674ee22db07d77d5a281418815c5852827419d6d629d440/,
  );
  assert.match(nextConfig, /poweredByHeader:\s*false/);
  assert.match(nextConfig, /X-Content-Type-Options/);
  assert.match(nextConfig, /Referrer-Policy/);
  assert.match(nextConfig, /Permissions-Policy/);
  assert.match(nvmrc, /26\.8\.2/);
  assert.equal(productionNvmrc.trim(), "v24.11.0");
  assert.match(nodeCompat, /node-version: \$\{\{ steps\.node-floor\.outputs\.version \}\}/);
  assert.match(nodeCompat, /npm run test:unit/);
});
