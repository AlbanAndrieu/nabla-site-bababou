#!/usr/bin/env node
// Dependency-free policy check: PR drafts must not allocate GitHub-hosted runners.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = [
  ".github/workflows/ci.yml",
  ".github/workflows/docker-build.yml",
  ".github/workflows/node24-compat.yml",
  ".github/workflows/copilot-setup-steps.yml",
];
const root = resolve(process.argv[2] ?? ".");
if (process.argv.length > 3) {
  console.error("Usage: node scripts/ci/check-draft-workflows.mjs [REPO_ROOT]");
  process.exit(2);
}

function jobsIn(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.indexOf("jobs:");
  if (start < 0) throw new Error("missing jobs block");
  const result = [];
  let current;
  for (const line of lines.slice(start + 1)) {
    const job = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (job) {
      current = { name: job[1], header: [] };
      result.push(current);
      continue;
    }
    if (/^[^\s#]/.test(line)) break;
    if (current && !current.steps) {
      if (/^ {4}steps:/.test(line)) current.steps = true;
      else current.header.push(line);
    }
  }
  return result;
}

let count = 0;
const errors = [];
for (const path of files) {
  let workflow;
  try {
    workflow = readFileSync(resolve(root, path), "utf8");
    const event = /^ {2}pull_request:\s*$/m.test(workflow);
    const review = /ready_for_review/.test(workflow.split("\njobs:")[0]);
    if (!event || !review) {
      throw new Error("missing pull_request/ready_for_review trigger");
    }
    const jobs = jobsIn(workflow);
    if (jobs.length === 0) throw new Error("missing configured jobs");
    for (const job of jobs) {
      const preSteps = job.header.join("\n");
      if (!/^ {4}(?:runs-on|uses):/m.test(preSteps)) {
        throw new Error(
          `job ${job.name} is missing a runner/reusable workflow`,
        );
      }
      const ifBlock = /(?:^|\n) {4}if:([^\n]*(?:\n {6,}[^\n]*)*)/.exec(
        preSteps,
      )?.[0];
      if (
        !ifBlock ||
        !/github\.event\.pull_request\.draft\s*==\s*false/.test(ifBlock)
      ) {
        throw new Error(`job ${job.name} is not guarded against draft PRs`);
      }
      count += 1;
    }
  } catch (error) {
    errors.push(`${path}: ${error.message}`);
  }
}
if (errors.length) {
  for (const message of errors) console.error(`DRAFT_GUARD_FAIL ${message}`);
  process.exit(1);
}
console.log(
  `DRAFT_GUARD_OK workflows=${files.length} jobs=${count} github_minutes=0`,
);
