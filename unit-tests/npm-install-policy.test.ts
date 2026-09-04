import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reviewedInstallScriptVersions = {
  "@parcel/watcher": ["2.6.0"],
  "@swc/core": ["1.15.46"],
  esbuild: ["0.27.7"],
  fsevents: ["2.3.2", "2.3.3"],
  "unrs-resolver": ["1.12.2"],
} as const;

function packageNameFromLockPath(path: string) {
  const marker = "node_modules/";
  const index = path.lastIndexOf(marker);
  return index === -1 ? "" : path.slice(index + marker.length);
}

test("npm install scripts stay explicitly denied and strict", async () => {
  const [packageJsonSource, lockSource, npmrc, workflow] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
    readFile(new URL("../.npmrc", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
  ]);

  const packageJson = JSON.parse(packageJsonSource) as {
    engines?: { node?: string; npm?: string };
    allowScripts?: Record<string, boolean>;
  };
  const lock = JSON.parse(lockSource) as {
    packages: Record<string, { version?: string }>;
  };

  assert.equal(packageJson.engines?.node, ">=25.9.0 <26");
  assert.equal(packageJson.engines?.npm, ">=11.17.0 <12");
  assert.deepEqual(packageJson.allowScripts, {
    "@parcel/watcher": false,
    "@swc/core": false,
    esbuild: false,
    fsevents: false,
    "unrs-resolver": false,
  });
  assert.match(npmrc, /^strict-allow-scripts=true$/m);
  assert.doesNotMatch(npmrc, /dangerously-allow-all-scripts\s*=\s*true/);
  assert.match(workflow, /- "\.npmrc"/);

  const installed = new Map<string, string[]>();
  for (const [path, metadata] of Object.entries(lock.packages)) {
    const name = packageNameFromLockPath(path);
    if (!(name in reviewedInstallScriptVersions) || !metadata.version) {
      continue;
    }
    const versions = installed.get(name) ?? [];
    versions.push(metadata.version);
    installed.set(name, versions);
  }

  for (const [name, expectedVersions] of Object.entries(
    reviewedInstallScriptVersions,
  )) {
    assert.deepEqual(
      [...(installed.get(name) ?? [])].sort(),
      [...expectedVersions].sort(),
      `${name} install-script versions changed and require explicit review`,
    );
  }
});
