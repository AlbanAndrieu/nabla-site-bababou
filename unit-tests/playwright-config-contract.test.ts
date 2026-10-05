import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Playwright local server uses a configurable loopback port", async () => {
  const [config, packageJsonSource] = await Promise.all([
    readFile(new URL("../playwright.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonSource) as {
    scripts?: Record<string, string>;
  };

  assert.match(config, /PLAYWRIGHT_PORT/);
  assert.match(config, /127\.0\.0\.1/);
  assert.match(config, /-- --port \$\{testPort\}/);
  assert.match(config, /VERCEL_TRUSTED_OIDC_TOKEN/);
  assert.match(config, /VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.match(config, /VERCEL_AUTH_MODE/);
  assert.match(config, /vercelAuthMode === "oidc"/);
  assert.match(config, /vercelAuthMode === "bypass-cookie"/);
  assert.equal(
    packageJson.scripts?.["quality:gate"],
    "bash scripts/quality-gate.sh",
  );
  assert.equal(
    packageJson.scripts?.["dev:test"],
    "bash scripts/run-next-clean.sh dev --hostname 127.0.0.1",
  );
  assert.equal(
    packageJson.scripts?.["start:test"],
    "next start --hostname 127.0.0.1",
  );
});
