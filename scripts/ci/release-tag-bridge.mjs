#!/usr/bin/env node
// Migrate verified legacy numeric tags without inventing a release or regressing semver.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && !["--check", "--apply"].includes(args[0]))) {
  console.error("Usage: release-tag-bridge.mjs [--check|--apply]");
  process.exit(2);
}

function run(command, commandArgs) {
  return execFileSync(command, commandArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function semverParts(version) {
  if (!versionPattern.test(version)) {
    throw new Error("A complete numeric semver is required");
  }
  return version.split(".").map(BigInt);
}

function compareVersions(a, b) {
  const left = semverParts(a);
  const right = semverParts(b);
  for (let i = 0; i < 3; i++) {
    if (left[i] > right[i]) return 1;
    if (left[i] < right[i]) return -1;
  }
  return 0;
}

function latest(tags, prefix) {
  return tags
    .filter((tag) => (prefix ? tag.startsWith("v") : !tag.startsWith("v")))
    .filter((tag) => versionPattern.test(prefix ? tag.slice(1) : tag))
    .sort((a, b) =>
      compareVersions(prefix ? b.slice(1) : b, prefix ? a.slice(1) : a),
    )[0];
}

function assertAncestor(tag) {
  try {
    run("git", ["merge-base", "--is-ancestor", `${tag}^{commit}`, "HEAD"]);
  } catch {
    throw new Error("Release tag is not an ancestor of the validated checkout");
  }
}

try {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const packageVersion = pkg.version;
  semverParts(packageVersion);
  const tags = run("git", ["tag", "--list"]).split("\n");
  const existing = latest(tags, true);
  const legacy = latest(tags, false);
  if (existing) {
    if (legacy && compareVersions(legacy, existing.slice(1)) > 0) {
      throw new Error(
        "Numeric release is newer than the latest v-tag; manual audit required",
      );
    }
    assertAncestor(existing);
    if (compareVersions(existing.slice(1), packageVersion) > 0) {
      throw new Error("Latest v-prefixed release is newer than package.json");
    }
    console.log(`RELEASE_TAG_OK existing=${existing}`);
    process.exit(0);
  }

  if (!legacy || compareVersions(legacy, packageVersion) > 0) {
    throw new Error("No valid legacy baseline compatible with package.json");
  }
  assertAncestor(legacy);
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY must be an owner/repo identifier");
  }
  try {
    run("gh", ["release", "view", legacy, "--repo", repository]);
  } catch {
    throw new Error("Legacy tag has no verifiable GitHub Release");
  }

  const target = run("git", ["rev-parse", `${legacy}^{commit}`]);
  if (args[0] !== "--apply") {
    console.log(`RELEASE_TAG_CHECK alias=v${legacy} target=${target}`);
    process.exit(0);
  }

  // A failed POST can still have persisted remotely (lost response).
  // Read back the remote ref and only reuse an exact SHA match.
  let created = true;
  try {
    run("gh", [
      "api",
      "--method",
      "POST",
      `repos/${repository}/git/refs`,
      "-f",
      `ref=refs/tags/v${legacy}`,
      "-f",
      `sha=${target}`,
    ]);
  } catch {
    let remoteSha;
    try {
      remoteSha = run("gh", [
        "api",
        `repos/${repository}/git/ref/tags/v${legacy}`,
        "--jq",
        ".object.sha",
      ]);
    } catch {
      throw new Error("Release alias publish failed; remote tag could not be verified");
    }
    if (remoteSha !== target) {
      throw new Error("Existing remote release alias does not match the verified legacy commit");
    }
    created = false;
  }
  // Do not change local refs until remote persistence is confirmed.
  run("git", ["tag", `v${legacy}`, target]);
  console.log(`RELEASE_TAG_${created ? "CREATED" : "REUSED"} alias=v${legacy} target=${target}`);
} catch (error) {
  console.error(`RELEASE_TAG_BLOCKED: ${error.message}`);
  process.exit(1);
}
