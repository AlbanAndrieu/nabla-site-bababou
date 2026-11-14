import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const documents = [
  "README.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "docs/roadmap.md",
  "docs/operations.md",
  "docs/homepage-migration-parity.md",
  "docs/homepage-react-cutover.md",
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

test("roadmap and engineering reference the same active BB items and canonical runbooks", () => {
  const read = (name) => readFileSync(resolve(root, name), "utf8");
  const roadmap = read("docs/roadmap.md");
  const engineering = read("docs/engineering-roadmap.md");
  const readme = read("README.md");
  const roadmapIds = [...roadmap.matchAll(/^\| \*\*(BB-\d{2})\*\* \|/gm)].map((match) => match[1]);
  const engineeringIds = [...engineering.matchAll(/^\| (BB-\d{2}) \|/gm)].map((match) => match[1]);
  assert.equal(roadmapIds.length, 11, "Canonical backlog must contain eleven decisions");
  assert.equal(new Set(roadmapIds).size, roadmapIds.length);
  assert.deepEqual(engineeringIds, roadmapIds);
  assert.match(roadmap, /NO-GO/);
  assert.match(roadmap, /publication-redaction\.md/);
  assert.match(roadmap, /Playwright/);
  assert.match(roadmap, /AppSec|SAST/);
  assert.match(roadmap, /operations\.md/);
  assert.match(readme, /\[Roadmap générale\]\(docs\/roadmap\.md\)/);
  assert.match(readme, /\[Roadmap d.ingénierie\]\(docs\/engineering-roadmap\.md\)/);
  assert.match(readme, /\[Runbook opérationnel\]\(docs\/operations\.md\)/);
  assert.match(readme, /\[Procédure de bascule\]\(docs\/homepage-react-cutover\.md\)/);
  assert.doesNotMatch(roadmap, /## Travail restant — ordre P1 → P5|- \[x\] /);
});

test("cutover and parity reflect five child cards and seven parent cards", () => {
  const read = (name) => readFileSync(resolve(root, name), "utf8");
  const parity = read("docs/homepage-migration-parity.md");
  const cutover = read("docs/homepage-react-cutover.md");
  for (const source of [parity, cutover]) {
    assert.match(source, /5 cartes/);
    assert.match(source, /7 cartes/);
    assert.match(source, /noindex|non indexable/);
  }
  assert.match(cutover, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(cutover, /BABABOU_HOME_CUTOVER_SHA/);
  assert.match(cutover, /Retour arrière/);
  assert.doesNotMatch(cutover, /10\/10 images|dix cartes/);
});
