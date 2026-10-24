import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("priority keyboard surfaces expose visible focus contracts", async () => {
  const [theme, routeHeader, action, contact, policy, e2e] = await Promise.all([
    read("public/theme.css"),
    read("components/RouteHeader.module.css"),
    read("components/ui/Action.module.css"),
    read("app/[locale]/contact/page.tsx"),
    read("app/[locale]/policy/page.tsx"),
    read("tests/accessibility-keyboard.spec.ts"),
  ]);

  assert.match(theme, /a:focus-visible,\s*button:focus-visible\s*{[^}]*outline:\s*2px solid/s);
  assert.match(routeHeader, /\.select:focus-visible\s*{[^}]*outline:\s*3px solid var\(--ui-focus-ring\)/s);
  assert.match(action, /\.action:focus-visible\s*{[^}]*outline:\s*3px solid var\(--ui-focus-ring\)/s);
  assert.doesNotMatch(contact, /<SkipToMainContent \/>/);
  assert.doesNotMatch(policy, /<SkipToMainContent \/>/);
  const header = await read("components/RouteHeader.tsx");
  assert.match(header, /hasMainContentRoute\(parts\)/);
  assert.match(header, /<a className="skip-to-main" href="#main-content">/);
  assert.match(contact, /id="main-content"/);
  assert.match(policy, /id="main-content"/);

  for (const route of ["/contact", "/en/contact", "/policy", "/en/policy"]) assert.ok(e2e.includes(JSON.stringify(route)));
  assert.match(e2e, /tabUntilFocused/);
  assert.match(e2e, /element\.matches\(":focus-visible"\)/);
  assert.match(e2e, /outlineWidth > 0 \|\| styles\.boxShadow !== "none"/);
  assert.match(e2e, /#route-header-locale/);
  assert.match(e2e, /a\.skip-to-main/);
});
