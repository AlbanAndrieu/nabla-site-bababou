import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("preferred text scaling uses browser opt-in without double CSS scaling", async () => {
  const [reset, layout, e2e] = await Promise.all([
    read("app/reset.css"),
    read("app/[locale]/layout.tsx"),
    read("tests/accessibility-responsive.spec.ts"),
  ]);

  assert.match(reset, /font-size: 100%/);
  assert.doesNotMatch(reset, /font-size:[^;]*env\(preferred-text-scale/);
  assert.match(layout, /<meta name="text-scale" content="scale" \/>/);
  // #252: CDP text scale is unreliable on desktop Chrome and absent in
  // Firefox/WebKit; the spec doubles the root size and says it is not native zoom.
  assert.match(
    e2e,
    /root\.style\.setProperty\("font-size", `\$\{baseline \* 2\}px`, "important"\)/,
  );
  assert.match(e2e, /toBeGreaterThanOrEqual\(baselineFontSize \* 1\.99\)/);
  assert.match(e2e, /NOT a claim of validating native browser zoom/);
  assert.doesNotMatch(e2e, /page\.addStyleTag/);
});
