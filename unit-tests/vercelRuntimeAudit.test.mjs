import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { STATIC_LOCALES, STATIC_SLUGS } from "../scripts/verify-next-prerender.mjs";
import { assessRuntimeTopology, auditRuntime } from "../scripts/audit-vercel-runtime.mjs";

function staticManifest() {
  const routes = {};
  for (const locale of STATIC_LOCALES) {
    for (const slug of STATIC_SLUGS) {
      const pathname = locale === "fr" ? "/" + slug : "/" + locale + "/" + slug;
      routes[pathname] = { initialRevalidateSeconds: false };
    }
  }
  return { routes, dynamicRoutes: { "/api/checkout": {} } };
}

test("shares the existing four-locale SSG contract without a second page catalog", () => {
  assert.deepEqual([...STATIC_LOCALES], ["fr", "en", "de", "no"]);
  const result = assessRuntimeTopology(staticManifest());
  assert.equal(result.status, "PASS");
  assert.equal(result.checked.length, STATIC_LOCALES.length * STATIC_SLUGS.length);
  assert.equal(result.cpuMeasured, false);
});

test("warnings distinguish missing routes, ISR and unexpected public functions", () => {
  const manifest = staticManifest();
  delete manifest.routes["/de/nre"];
  manifest.routes["/en/home-preview"].initialRevalidateSeconds = 60;
  const result = assessRuntimeTopology(manifest, ["/no/nre", "/api/checkout"]);
  assert.equal(result.status, "WARN");
  assert.deepEqual(result.missing, ["de:nre"]);
  assert.deepEqual(result.notStatic, ["/en/home-preview"]);
  assert.deepEqual(result.publicFunctions, ["/no/nre"]);
});

test("private API prerendering is never treated as safe public SSG", () => {
  const manifest = staticManifest();
  manifest.routes["/api/create-checkout-session"] = { initialRevalidateSeconds: false };
  const result = assessRuntimeTopology(manifest);
  assert.equal(result.status, "FAIL");
  assert.deepEqual(result.privatePrerendered, ["/api/create-checkout-session"]);
});

test("absent or invalid build artifacts do not return PASS", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bababou-runtime-"));
  try {
    const manifestPath = join(directory, "prerender-manifest.json");
    const functionsDirectory = join(directory, "functions");
    const absent = await auditRuntime({ manifestPath, functionsDirectory });
    assert.equal(absent.status, "NOT_RUN");
    await writeFile(manifestPath, "not-json");
    assert.equal((await auditRuntime({ manifestPath, functionsDirectory })).status, "FAIL");
    await writeFile(manifestPath, JSON.stringify(staticManifest()));
    const noFunctions = await auditRuntime({ manifestPath, functionsDirectory });
    assert.equal(noFunctions.status, "WARN");
    assert.equal(noFunctions.functionsPresent, false);
    await mkdir(join(functionsDirectory, "en", "home-preview.func"), { recursive: true });
    const withFunctions = await auditRuntime({ manifestPath, functionsDirectory });
    assert.equal(withFunctions.status, "WARN");
    assert.equal(withFunctions.functionsPresent, true);
    assert.deepEqual(withFunctions.publicFunctions, ["/en/home-preview"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI without build exits NOT_RUN and does not access a network", () => {
  const script = new URL("../scripts/audit-vercel-runtime.mjs", import.meta.url);
  const child = spawnSync(process.execPath, [script.pathname, "--json"], {
    cwd: tmpdir(), encoding: "utf8",
  });
  assert.equal(child.status, 2);
  assert.equal(JSON.parse(child.stdout).status, "NOT_RUN");
});
