import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const verifier = fileURLToPath(
  new URL("../scripts/verify-mise-npm.sh", import.meta.url),
);

test("Mise npm verifier enforces exact pin and rejects drift", async () => {
  const root = await mkdtemp(join(tmpdir(), "bababou-npm-pin-"));
  try {
    const bin = join(root, "bin");
    const config = join(root, "mise.toml");
    await mkdir(bin);
    const npm = join(bin, "npm");
    await writeFile(npm, '#!/usr/bin/env bash\nprintf "12.2.0\\n"\n');
    await chmod(npm, 0o755);
    const run = () =>
      spawnSync("bash", [verifier, config], {
        encoding: "utf8",
        env: { ...process.env, PATH: bin + ":" + (process.env.PATH ?? "") },
      });

    await writeFile(config, '[tools]\nnpm = "12.2.0"\n');
    const ok = run();
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /MISE_NPM_OK npm=12\.2\.0/);

    await writeFile(config, '[tools]\nnpm = "12.3.0"\n');
    const mismatch = run();
    assert.equal(mismatch.status, 1);
    assert.match(mismatch.stderr, /MISE_NPM_MISMATCH/);

    await writeFile(config, '[tools]\nnpm = "12.2.0"\nnpm = "12.3.0"\n');
    const duplicate = run();
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.stderr, /MISE_NPM_UNPINNED/);

    await writeFile(config, '[tools]\nnpm = "latest"\n');
    const invalid = run();
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /MISE_NPM_UNPINNED/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("all GitHub npm setup paths use the canonical mise npm verifier", async () => {
  for (const path of [
    ".github/workflows/ci.yml",
    ".github/workflows/copilot-setup-steps.yml",
    ".github/workflows/node24-compat.yml",
    ".github/workflows/playwright.yml",
    ".github/workflows/release.yml",
  ]) {
    const workflow = await readFile(
      new URL("../" + path, import.meta.url),
      "utf8",
    );
    assert.match(workflow, /run: bash scripts\/verify-mise-npm\.sh/, path);
    assert.doesNotMatch(workflow, /run: test "\$\(npm --version\)" =/, path);
  }

  const mise = await readFile(new URL("../mise.toml", import.meta.url), "utf8");
  assert.match(mise, /npm = "12\.2\.1"/);
  const justfile = await readFile(
    new URL("../justfile", import.meta.url),
    "utf8",
  );
  assert.match(
    justfile,
    /toolchain-check:\n {4}bash scripts\/verify-mise-npm\.sh/,
  );
});
