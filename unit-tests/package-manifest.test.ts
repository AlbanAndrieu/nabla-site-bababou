import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const packageLockUrl = new URL("../package-lock.json", import.meta.url);

type PackageMetadata = {
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type PackageLock = {
  packages?: Record<string, PackageMetadata>;
};

test("Next.js tooling stays aligned and Express is not a direct dependency", async () => {
  const [packageJsonSource, packageLockSource] = await Promise.all([
    readFile(packageJsonUrl, "utf8"),
    readFile(packageLockUrl, "utf8"),
  ]);
  const manifest = JSON.parse(packageJsonSource) as PackageMetadata;
  const lock = JSON.parse(packageLockSource) as PackageLock;
  const root = lock.packages?.[""];
  const nextVersion = manifest.dependencies?.next;

  assert.equal(typeof nextVersion, "string");
  assert.equal(nextVersion, "16.3.4");
  assert.equal(manifest.dependencies?.express, undefined);
  assert.equal(manifest.devDependencies?.["@types/express"], undefined);
  assert.equal(manifest.devDependencies?.["eslint-config-next"], nextVersion);

  assert.equal(root?.dependencies?.express, undefined);
  assert.equal(root?.devDependencies?.["@types/express"], undefined);
  assert.equal(root?.dependencies?.next, nextVersion);
  assert.equal(root?.devDependencies?.["eslint-config-next"], nextVersion);
  assert.equal(
    lock.packages?.["node_modules/eslint-config-next"]?.version,
    nextVersion,
  );
  assert.equal(
    lock.packages?.["node_modules/@next/eslint-plugin-next"]?.version,
    nextVersion,
  );
});
