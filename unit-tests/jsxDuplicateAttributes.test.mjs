import assert from "node:assert/strict";
import test from "node:test";
import { findDuplicateJsxAttributes } from "../scripts/quality/check-jsx-duplicate-attributes.mjs";

test("detects repeated attributes responsible for TS17001", () => {
  const input = '<span key={metric.key} data-evidence-key={metric.key}\n data-evidence-key={metric.key} data-evidence-state="ok" />';
  assert.deepEqual(findDuplicateJsxAttributes(input).map(({ name, line }) => ({ name, line })), [
    { name: "data-evidence-key", line: 2 },
  ]);
});

test("does not confuse adjacent, nested or self-closing elements", () => {
  assert.deepEqual(findDuplicateJsxAttributes(
    '<><a aria-label="First"/><a aria-label="Second"><span aria-label="Nested" /></a></>',
  ), []);
});

test("does not report JSX spread as an explicit duplicate", () => {
  assert.deepEqual(findDuplicateJsxAttributes('<Link {...props} aria-label="Link" />'), []);
});

test("detects standard className and namespaced attributes", () => {
  const results = findDuplicateJsxAttributes('<Item className="a" className={other} />');
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "className");
});

test("ignores duplicates on separate opening tags", () => {
  assert.deepEqual(findDuplicateJsxAttributes('<main id="main"><p id="note" /></main>'), []);
});
