import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const configUrl = new URL("../next.config.mjs", import.meta.url);

test("Next applies baseline response hardening to native and legacy routes", async () => {
  const config = await readFile(configUrl, "utf8");

  assert.match(config, /poweredByHeader:\s*false/);
  assert.match(config, /source:\s*"\/:path\*"/);
  assert.match(config, /key:\s*"X-Frame-Options",\s*value:\s*"DENY"/);
  assert.match(
    config,
    /key:\s*"X-Content-Type-Options",\s*value:\s*"nosniff"/,
  );
  assert.match(
    config,
    /key:\s*"Referrer-Policy",\s*value:\s*"strict-origin-when-cross-origin"/,
  );
  assert.match(config, /key:\s*"Permissions-Policy"/);
  assert.match(config, /camera=\(\), microphone=\(\), geolocation=\(\)/);
});

test("baseline headers do not prematurely introduce a legacy-breaking CSP", async () => {
  const config = await readFile(configUrl, "utf8");

  // CSP needs a dedicated inventory of native and legacy external dependencies,
  // including the retained Google Translate fallback. Keep it explicit rather
  // than accidentally shipping a policy that breaks those approved surfaces.
  assert.doesNotMatch(config, /Content-Security-Policy/);
});
