import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (name) => readFileSync(join(root, name), "utf8");
const manifest = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const packages = lock.packages;
const app = packages[""];

function assertSameManifestKeys(kind) {
  assert.deepEqual(
    Object.fromEntries(Object.entries(app[kind]).sort()),
    Object.fromEntries(Object.entries(manifest[kind]).sort()),
    "npm ci requires all direct " + kind + " ranges in the root lock",
  );
}

test("npm lock root matches the complete application manifest", () => {
  assert.equal(lock.lockfileVersion, 3);
  assertSameManifestKeys("dependencies");
  assertSameManifestKeys("devDependencies");
  assert.deepEqual(app.engines, manifest.engines);
});

test("security-patched Next.js and lint tooling remain exactly aligned", () => {
  const next = manifest.dependencies.next;
  assert.equal(next, "16.4.2");
  assert.equal(manifest.devDependencies["eslint-config-next"], next);
  for (const path of [
    "next",
    "@next/env",
    "@next/eslint-plugin-next",
    "eslint-config-next",
  ]) {
    const node = packages["node_modules/" + path];
    assert.equal(node?.version, next, "incorrect resolved " + path);
    assert.match(node?.integrity ?? "", /^sha512-/, path);
  }
  assert.equal(
    packages["node_modules/eslint-config-next"].dependencies[
      "@next/eslint-plugin-next"
    ],
    next,
  );
});

test("React and React DOM are synchronized with their scheduler and types", () => {
  const react = "19.3.1";
  assert.equal(manifest.dependencies.react, "^" + react);
  assert.equal(manifest.dependencies["react-dom"], "^" + react);
  assert.equal(packages["node_modules/react"]?.version, react);
  assert.equal(packages["node_modules/react-dom"]?.version, react);
  assert.equal(
    packages["node_modules/react-dom"].dependencies.scheduler,
    "^0.28.0",
  );
  assert.equal(packages["node_modules/scheduler"]?.version, "0.28.0");
  for (const dep of ["@types/react", "@types/react-dom"]) {
    assert.equal(manifest.devDependencies[dep], "^19.3.0");
    assert.equal(packages["node_modules/" + dep]?.version, "19.3.0");
  }
});

test("all new direct lock packages have integrity hashes and registry URLs", () => {
  for (const path of [
    "next",
    "@next/env",
    "@next/eslint-plugin-next",
    "eslint-config-next",
    "react",
    "react-dom",
    "scheduler",
    "@types/react",
    "@types/react-dom",
  ]) {
    const resolved = packages["node_modules/" + path];
    assert.match(resolved?.resolved ?? "", /^https:\/\/registry\.npmjs\.org\//);
    assert.match(resolved?.integrity ?? "", /^sha512-[A-Za-z0-9+/]+={0,2}$/);
  }
});

test("toolchain pinning preserves Node 24 LTS production compatibility", () => {
  assert.equal(read(".nvmrc").trim(), "v26.12.1");
  assert.equal(read(".nvmrc-production").trim(), "v24.22.1");
  const mise = read("mise.toml");
  assert.match(mise, /^node = "26\.12\.1"$/m);
  assert.match(mise, /^npm = "12\.2\.1"$/m);
  assert.equal(manifest.engines.node, ">=24.11.0 <27");
  assert.equal(manifest.engines.npm, ">=12.2.0 <13");
});
