import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const documents = [
  "README.md",
  "CONTRIBUTING.md",
  "docs/roadmap.md",
  "docs/operations.md",
  "docs/homepage-migration-parity.md",
  "tests/README.md",
];

/** Inspect only tracked, canonical documentation. No external URLs or private corpus. */
function localLinks(markdown) {
  return [...markdown.matchAll(/\]\(([^)]+)\)/g)]
    .map((match) => match[1].trim().split("#")[0].split("?")[0])
    .filter((value) => value && !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value));
}

test("canonical docs keep resolvable internal Markdown links", () => {
  for (const document of documents) {
    const sourceFile = resolve(root, document);
    const markdown = readFileSync(sourceFile, "utf8");
    for (const link of localLinks(markdown)) {
      const target = resolve(dirname(sourceFile), decodeURIComponent(link));
      const relativeTarget = relative(root, target);
      assert.ok(
        relativeTarget !== ".." && !relativeTarget.startsWith(".." + sep),
        document + " escapes repository root: " + link,
      );
      assert.ok(existsSync(target), document + " has a broken link: " + link);
    }
  }
});

test("roadmap remains active-only and points to canonical runbooks", () => {
  const read = (name) => readFileSync(resolve(root, name), "utf8");
  const roadmap = read("docs/roadmap.md");
  assert.match(roadmap, /## P1 —/);
  assert.match(roadmap, /## P2 —/);
  assert.match(roadmap, /## P3 —/);
  assert.match(roadmap, /## P4 —/);
  assert.match(roadmap, /## P5 —/);
  assert.match(roadmap, /## Barrières de publication/);
  assert.ok(
    roadmap.indexOf("## Barrières de publication") > roadmap.indexOf("## P5 —"),
    "publication gates follow the five active roadmap priorities",
  );
  assert.match(roadmap, /publication-redaction\.md/);
  assert.match(roadmap, /Playwright\/axe/);
  assert.match(roadmap, /BetterLeaks/);
  assert.match(roadmap, /\[operations\.md\]\(operations\.md\)/);
  assert.match(read("README.md"), /\[Roadmap\]\(docs\/roadmap\.md\)/);
  assert.match(read("README.md"), /\[Opérations\]\(docs\/operations\.md\)/);
  assert.doesNotMatch(roadmap, /- \[x\] /);
});
