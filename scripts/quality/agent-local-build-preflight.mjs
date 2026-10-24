import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function version(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value.trim());
  return match ? match.slice(1).map(Number) : null;
}

/** Pure diagnostic; never installs dependencies, accesses the network or reads secrets. */
export function assessLocalBuild({
  nodeVersion,
  npmVersion,
  developmentNode,
  productionNode,
  miseConfig,
  engineRange,
  dependenciesReady,
}) {
  const blockers = [];
  const node = version(nodeVersion);
  const npm = version(npmVersion);
  const development = version(developmentNode);
  const production = version(productionNode);
  const miseNode = /^node\s*=\s*"(\d+)"\s*$/m.exec(miseConfig)?.[1];
  const miseNpm = /^npm\s*=\s*"(\d+\.\d+\.\d+)"\s*$/m.exec(miseConfig)?.[1];
  const supportedNode =
    node !== null &&
    ((node[0] === 24 && node[1] >= 11) || node[0] === 26);

  if (
    !development ||
    development[0] !== 26 ||
    !production ||
    production[0] !== 24 ||
    miseNode !== "24"
  ) {
    blockers.push(
      "RUNTIME_POLICY_DRIFT: expected .nvmrc Node 26, .nvmrc-production Node 24, mise Node 24",
    );
  }
  if (engineRange !== ">=24.11.0 <27") {
    blockers.push("ENGINES_POLICY_DRIFT: inspect package.json engines.node");
  }
  if (!supportedNode) {
    blockers.push(
      "NODE_UNSUPPORTED: " +
        nodeVersion +
        "; expected supported Node 24 LTS or Node 26 development",
    );
  }
  if (!npm || !miseNpm || npmVersion.trim() !== miseNpm) {
    blockers.push(
      "NPM_UNPINNED: " +
        npmVersion +
        "; expected " +
        (miseNpm ?? "npm pin in mise.toml"),
    );
  }
  if (!dependenciesReady) {
    blockers.push(
      "NODE_MODULES_MISSING: run npm ci with the committed lockfile when the registry is available",
    );
  }
  return blockers;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const npmVersion = (() => {
    try {
      return execFileSync("npm", ["--version"], {
        encoding: "utf8",
        timeout: 10000,
      }).trim();
    } catch {
      return "missing";
    }
  })();
  const blockers = assessLocalBuild({
    nodeVersion: process.version,
    npmVersion,
    developmentNode: read(".nvmrc"),
    productionNode: read(".nvmrc-production"),
    miseConfig: read("mise.toml"),
    engineRange: JSON.parse(read("package.json")).engines?.node,
    dependenciesReady: ["next", "typescript", "tsx"].every((name) =>
      existsSync(join(root, "node_modules", name, "package.json")),
    ),
  });
  if (blockers.length) {
    for (const blocker of blockers) {
      console.error("LOCAL_BUILD_BLOCKED " + blocker);
    }
    console.error("NOT_RUN: Next compilation, typecheck, tests and privacy checks");
    process.exitCode = 2;
  } else {
    console.log(
      "LOCAL_BUILD_READY node=" +
        process.version +
        " npm=" +
        npmVersion +
        "; execute npm run check on this worktree",
    );
  }
}
