import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageUrl = new URL("../package.json", import.meta.url);
const miseUrl = new URL("../mise.toml", import.meta.url);

test("shared runtime and test toolchain versions remain internally aligned", async () => {
  const pkg = JSON.parse(await readFile(packageUrl, "utf8")) as {
    engines: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  const mise = await readFile(miseUrl, "utf8");

  assert.equal(pkg.engines.node, ">=24.11.0 <27");
  assert.equal(pkg.engines.npm, ">=12.2.0 <13");

  for (const [name, version] of Object.entries({
    next: "16.4.2",
    "next-intl": "^4.9.2",
    react: "^19.3.1",
    "react-dom": "^19.3.1",
  })) {
    assert.equal(pkg.dependencies[name], version, `unexpected ${name} version`);
  }

  for (const [name, version] of Object.entries({
    "@playwright/test": "^1.58.0",
    playwright: "^1.58.0",
    typescript: "^5.9.3",
    stylelint: "^17.14.1",
    "@commitlint/config-conventional": "^20.3.1",
    "@eslint/js": "^9.39.1",
    lodash: undefined,
  })) {
    if (version === undefined) {
      assert.equal(pkg.devDependencies[name], undefined);
    } else {
      assert.equal(
        pkg.devDependencies[name],
        version,
        `unexpected ${name} version`,
      );
    }
  }

  assert.equal(
    pkg.devDependencies["eslint-config-next"],
    pkg.dependencies.next,
    "eslint-config-next must track Next exactly",
  );
  assert.equal(
    pkg.devDependencies.playwright,
    pkg.devDependencies["@playwright/test"],
    "Playwright runner and package must stay aligned",
  );

  assert.match(mise, /node = "26\.12\.1"/);
  assert.match(mise, /pre-commit = "4\.6\.2"/);
});

test("Bababou-specific tooling divergences stay explicit while parity work remains open", async () => {
  const pkg = JSON.parse(await readFile(packageUrl, "utf8")) as {
    devDependencies: Record<string, string>;
  };

  assert.equal(pkg.devDependencies.eslint, "^9.39.1");
  assert.equal(pkg.devDependencies.tsx, "^4.23.13");
  assert.equal(pkg.devDependencies["@types/node"], "^24.13.3");
  assert.equal(pkg.devDependencies["typescript-eslint"], "^8.47.0");
  assert.equal(pkg.devDependencies["postcss-selector-parser"], "^7.1.6");
});

test("P5 tooling dependencies retain package-lock root parity and installed resolutions", async () => {
  const packageJson = JSON.parse(await readFile(packageUrl, "utf8")) as {
    devDependencies: Record<string, string>;
  };
  const lock = JSON.parse(
    await readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  ) as {
    lockfileVersion: number;
    packages: Record<
      string,
      { version?: string; devDependencies?: Record<string, string> }
    >;
  };
  assert.equal(lock.lockfileVersion, 3);
  for (const name of [
    "eslint",
    "tsx",
    "@types/node",
    "typescript-eslint",
    "postcss-selector-parser",
  ]) {
    assert.equal(
      lock.packages[""]?.devDependencies?.[name],
      packageJson.devDependencies[name],
      `root lockfile manifest drift for ${name}; run npm install --package-lock-only`,
    );
    assert.match(
      lock.packages[`node_modules/${name}`]?.version ?? "",
      /^\d+\.\d+\.\d+/,
      `missing resolved lockfile version for ${name}`,
    );
  }
});
