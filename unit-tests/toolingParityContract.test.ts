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
  assert.equal(pkg.engines.npm, ">=11.17.0 <12");

  for (const [name, version] of Object.entries({
    next: "16.3.8",
    "next-intl": "^4.9.2",
    react: "^19.2.4",
    "react-dom": "^19.2.4",
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
      assert.equal(pkg.devDependencies[name], version, `unexpected ${name} version`);
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

  assert.match(mise, /node = "26\.8\.2"/);
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
  assert.equal(pkg.devDependencies["postcss-selector-parser"], "^7.1.4");
});
