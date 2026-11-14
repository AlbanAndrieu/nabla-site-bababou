#!/usr/bin/env node
/**
 * Local-only build-artifact audit adapted from nabla-site-alban #293.
 * Reuses the canonical Bababou static-route contract instead of duplicating it.
 * No network, credentials, private document access or billed CPU assumptions.
 */
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STATIC_LOCALES, STATIC_SLUGS, auditPrerenderManifest } from "./verify-next-prerender.mjs";

const PRIVATE_API = /^\/api(?:\/|$)/;

function normalizedRoute(value) {
  const pathname = String(value).replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  const withoutIndex = pathname.replace(/(?:^|\/)index$/, "");
  return withoutIndex ? "/" + withoutIndex : "/";
}

function expectedPublicRoutes() {
  const routes = new Set();
  for (const locale of STATIC_LOCALES) {
    for (const slug of STATIC_SLUGS) {
      if (locale === "fr") {
        routes.add("/" + slug);
        routes.add("/fr/" + slug);
      } else {
        routes.add("/" + locale + "/" + slug);
      }
    }
  }
  return routes;
}

export function assessRuntimeTopology(manifest, functionPaths = []) {
  if (!manifest || !manifest.routes || typeof manifest.routes !== "object" ||
      Array.isArray(manifest.routes)) {
    return {
      status: "FAIL", reason: "invalid-prerender-manifest",
      checked: [], missing: [], notStatic: [],
      privatePrerendered: [], publicFunctions: [], cpuMeasured: false,
    };
  }
  const staticProof = auditPrerenderManifest(manifest);
  const privatePrerendered = Object.keys(manifest.routes)
    .filter((key) => PRIVATE_API.test(normalizedRoute(key))).sort();
  const expectedRoutes = expectedPublicRoutes();
  const publicFunctions = [...new Set(functionPaths.map(normalizedRoute))]
    .filter((route) => expectedRoutes.has(route)).sort();
  const status = privatePrerendered.length ? "FAIL"
    : !staticProof.passed || publicFunctions.length ? "WARN" : "PASS";
  const reason = privatePrerendered.length ? "api-prerendered"
    : status === "WARN" ? "runtime-review-required" : "static-build-verified";
  return {
    status, reason, checked: staticProof.checked,
    missing: staticProof.missing, notStatic: staticProof.notStatic,
    privatePrerendered, publicFunctions, cpuMeasured: false,
  };
}

async function listFunctions(directory) {
  try {
    const entries = await readdir(directory, { recursive: true });
    return entries.filter((entry) => entry.endsWith(".func"))
      .map((entry) => entry.slice(0, -".func".length));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function auditRuntime({
  manifestPath = ".next/prerender-manifest.json",
  functionsDirectory = ".vercel/output/functions",
} = {}) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    return {
      status: error.code === "ENOENT" ? "NOT_RUN" : "FAIL",
      reason: error.code === "ENOENT" ? "next-build-artifact-absent" : "invalid-manifest-json",
      manifestPresent: error.code !== "ENOENT", functionsPresent: false, cpuMeasured: false,
    };
  }
  let functions;
  try {
    functions = await listFunctions(functionsDirectory);
  } catch {
    return {
      status: "FAIL", reason: "unreadable-functions-artifacts",
      manifestPresent: true, functionsPresent: false, cpuMeasured: false,
    };
  }
  const report = assessRuntimeTopology(manifest, functions ?? []);
  if (functions === null && report.status === "PASS") {
    report.status = "WARN";
    report.reason = "functions-inventory-not-run";
  }
  return {
    ...report, manifestPresent: true, functionsPresent: functions !== null,
    cpuMeasured: false,
  };
}

async function main(args) {
  if (args.some((arg) => !["--json", "--strict"].includes(arg))) {
    console.error("Usage: node scripts/audit-vercel-runtime.mjs [--json] [--strict]");
    process.exitCode = 2;
    return;
  }
  const report = await auditRuntime();
  if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    console.log("VERCEL_RUNTIME_AUDIT status=" + report.status +
      " reason=" + report.reason + " cpu_measured=false");
    if (report.checked?.length) console.log("SSG routes: " + report.checked.length);
    for (const field of ["missing", "notStatic", "publicFunctions", "privatePrerendered"]) {
      if (report[field]?.length) console.log(field + ": " + report[field].join(", "));
    }
    if (!report.functionsPresent) console.log("Function artifacts: NOT_RUN");
  }
  process.exitCode = report.status === "NOT_RUN" ? 2
    : report.status === "FAIL" || (report.status === "WARN" && args.includes("--strict")) ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main(process.argv.slice(2));
}
