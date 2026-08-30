import { spawnSync } from "node:child_process";
import { appendFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import process from "node:process";

const startedAt = performance.now();
const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    env: process.env,
    stdio: "inherit",
  },
);
const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);

console.log(`Next build duration: ${seconds}s`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `next_build_seconds=${seconds}\n`,
    "utf8",
  );
}

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (result.signal) {
  console.error(`Next build terminated by signal ${result.signal}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
