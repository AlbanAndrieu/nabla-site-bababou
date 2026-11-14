#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { availableParallelism, freemem } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const gib = 1024 ** 3;
const positive = x => Number.isSafeInteger(x) && x > 0;
export function budget({ cpus, freeBytes, overrideWorkers } = {}) {
  const cpu = positive(cpus) ? cpus : 1;
  const free = Number.isFinite(freeBytes) && freeBytes >= 0 ? freeBytes : 0;
  const recommended = Math.min(4, Math.max(1, cpu - 2), Math.max(1, Math.floor((free - gib) / (1.5 * gib))));
  if (overrideWorkers === undefined) return recommended;
  if (!positive(overrideWorkers) || overrideWorkers > 16) throw new Error("AGENT_WORKERS_INVALID: expected integer 1..16");
  return Math.min(recommended, overrideWorkers);
}
export function choose({ requestedMode, hasCheckout, hasJust, hasDependencies }) {
  if (!["auto", "workstation", "isolated"].includes(requestedMode)) throw new Error("AGENT_MODE_INVALID");
  const available = hasCheckout && hasJust;
  const mode = requestedMode === "auto" ? (available ? "workstation" : "isolated") : requestedMode;
  return { mode, canRun: mode === "workstation" && available,
    canPublish: mode === "workstation" && available && hasDependencies };
}
function freeMemory() {
  try {
    const capText = readFileSync("/sys/fs/cgroup/memory.max", "utf8").trim();
    if (capText === "max") return freemem();
    const used = Number(readFileSync("/sys/fs/cgroup/memory.current", "utf8").trim()), cap = Number(capText);
    if (Number.isSafeInteger(cap) && Number.isSafeInteger(used) && cap > 0 && used >= 0)
      return Math.max(0, Math.min(freemem(), cap - used));
  } catch { /* cgroup absent; fall back to available host memory */ }
  return freemem();
}
function toolAvailable(cmd) {
  const result = spawnSync(cmd, ["--version"], { cwd: root, encoding: "utf8", timeout: 3000, stdio: "ignore" });
  return !result.error && result.status === 0;
}
function checkoutExists() {
  if (!existsSync(join(root, ".git"))) return false;
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8", timeout: 3000 });
  return result.status === 0 && result.stdout.trim() === root;
}
const recipes = { offline: ["offline-l1", "docs-audit"], p0: ["p0"], publish: ["publish"], browser: ["homepage-validation"] };
function main(args) {
  let mode = process.env.AGENT_EXECUTION_MODE || "auto", tier = "offline", run = false, json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mode") mode = args[++i];
    else if (args[i] === "--tier") tier = args[++i];
    else if (args[i] === "--run") run = true;
    else if (args[i] === "--json") json = true;
    else throw new Error("usage: capability-plan.mjs [--mode auto|workstation|isolated] [--tier offline|p0|publish|browser] [--run] [--json]");
  }
  if (!Object.hasOwn(recipes, tier)) throw new Error("AGENT_TIER_INVALID");
  const tools = { git: toolAvailable("git"), just: toolAvailable("just"), node: toolAvailable("node"),
    npm: toolAvailable("npm"), browserDeps: existsSync(join(root, "node_modules", "@playwright", "test")) };
  const checkout = checkoutExists(), deps = existsSync(join(root, "node_modules", ".package-lock.json"));
  const decision = choose({ requestedMode: mode, hasCheckout: checkout, hasJust: tools.just, hasDependencies: deps });
  const override = process.env.AGENT_WORKERS;
  const workers = budget({ cpus: availableParallelism(), freeBytes: freeMemory(), overrideWorkers: override === undefined ? undefined : Number(override) });
  const plan = { ...decision, tier, checkout, dependenciesReady: deps, tools, cpus: availableParallelism(), workers,
    commands: recipes[tier].map(r => "just " + r), execution: run ? "requested" : "NOT_RUN" };
  if (json) console.log(JSON.stringify(plan));
  else console.log("AGENT_PLAN mode=" + decision.mode + " tier=" + tier + " checkout=" + checkout + " deps=" + deps + " cpus=" + plan.cpus + " workers=" + workers + " execution=" + plan.execution);
  if (!run) return 0;
  if (!decision.canRun || process.env.CI) { console.error("BLOCKED_ENVIRONMENT: no full checkout/just, or CI; use targeted connector evidence"); return 2; }
  if ((tier === "publish" || tier === "browser") && !decision.canPublish) { console.error("BLOCKED_DEPENDENCIES: run npm ci manually on workstation; no automatic install"); return 2; }
  const env = { ...process.env, PLAYWRIGHT_WORKERS: String(workers) };
  for (const name of recipes[tier]) {
    const result = spawnSync("just", [name], { cwd: root, env, stdio: "inherit", timeout: 30 * 60 * 1000 });
    if (result.error) { console.error("BLOCKED_TOOL: " + name + " " + (result.error.code || "unknown")); return 2; }
    if (result.status !== 0) return result.status || 1;
  }
  console.log("AGENT_" + tier.toUpperCase() + "_PASS: local execution only; remote CI/DAST NOT_RUN");
  return 0;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
