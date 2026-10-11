import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Git blob IDs are content-addresses, not SHA-256 or authenticity proofs.
export const UPSTREAM_COMMIT = "c1c8a8c1471069fb0e188eeaff69b8e8db6564a8";
export const UPSTREAM_BLOBS = Object.freeze({
  LICENSE: "6dbc9ecb3a5b9080e95b962869e8c7ab16cfdc20",
  "README.md": "c80305c88cd5087db37f76a0d230c1fc092c864c",
  "skills/security-audit/AI-AND-LLM.md":
    "02ba9039eca4cec811fefc77bce0d7349b379aae",
  "skills/security-audit/ATTACK-CLASSES.md":
    "18a2beb4dbb554fb52b0a0293b8bd9108207f8fa",
  "skills/security-audit/CLIENT-SIDE.md":
    "8ba673e9e7e3d02f5518aa0219bcbeec7957531b",
  "skills/security-audit/CLOUD-AND-DEPLOYMENT.md":
    "5569f76c7740744aa3f60aaa89eaefe275f2e6c9",
  "skills/security-audit/DATA-ISOLATION-AND-LIFECYCLE.md":
    "0cba1fa463b62c9b0caba710a201e29c1eecd0ec",
  "skills/security-audit/DESKTOP-MOBILE-AND-LOCAL-IPC.md":
    "d6230098651bff6348d3868c11f566bfb1306e7f",
  "skills/security-audit/HUNTING.md":
    "377d4dcfbe88a049379448cd7892717185401597",
  "skills/security-audit/MEMORY-SAFETY-AND-BINARY.md":
    "86ff4920752661fc4a31a35ca4f962ace5dd5f48",
  "skills/security-audit/PROTOCOLS-RPC-AND-MESSAGING.md":
    "b04ab88f852224838fdc9683d9fcccd858b0778a",
  "skills/security-audit/RECONNAISSANCE.md":
    "1a170a93ab76b93dc5ac268a5b690beb423a8aa9",
  "skills/security-audit/report-schema.json":
    "55815a3687a45fff63d8ebf20068611bd6ad6d9a",
  "skills/security-audit/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md":
    "6cbbd1e2cfa482068c8279c2f7da9db43d3f54b8",
  "skills/security-audit/SKILL.md": "92178dad304d3f63e37582a297026a7874e12c62",
  "skills/security-audit/SUPPLY-CHAIN-AND-RELEASE.md":
    "bf96aed0803bc07471483ab129dea86759c3e305",
  "skills/security-audit/validate-coverage-ledger.cjs":
    "0ef58657bef18b26a92321df6c8e3d31bc8e6659",
  "skills/security-audit/validate-coverage-ledger.test.cjs":
    "b1444f57e1b021a61175733b8c356171861c8701",
  "skills/security-audit/validate-findings.cjs":
    "2843feceddb7e30bf10d6e4f7bbe6640e4c57799",
  "skills/security-audit/validate-findings.test.cjs":
    "8d245b226bbe2fdf28b46b3203b99c2824039d2d",
  "skills/security-audit/VALIDATION-AND-REPORTING.md":
    "5e200d7387e665e53e0e4190fa4a5814c334c507",
  "skills/security-audit/WEB-PROTOCOL-AND-AUTH.md":
    "1a099fa575cf52a61e9a627f91b61015120fa517",
});

export function gitBlobId(buffer) {
  return createHash("sha1")
    .update(`blob ${buffer.length}\0`)
    .update(buffer)
    .digest("hex");
}

export function verifySnapshot(root, expectedBlobs = UPSTREAM_BLOBS) {
  const results = [];
  const rootStat = lstatSync(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error("Snapshot root must be a real directory");
  }
  const expectedPaths = new Set(Object.keys(expectedBlobs));
  // Fail closed on any unlisted file or symlink; do not execute injected content.
  function inspectDirectory(directory, prefix = "") {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        results.push({ relativePath, ok: false, reason: "SYMLINK" });
      } else if (entry.isDirectory()) {
        inspectDirectory(join(directory, entry.name), relativePath);
      } else if (!entry.isFile() || !expectedPaths.has(relativePath)) {
        results.push({ relativePath, ok: false, reason: "UNEXPECTED_FILE" });
      }
    }
  }
  if (expectedBlobs === UPSTREAM_BLOBS) inspectDirectory(root);
  for (const [relativePath, expected] of Object.entries(expectedBlobs)) {
    if (
      !relativePath ||
      isAbsolute(relativePath) ||
      relativePath
        .split(/[\\/]/)
        .some((part) => !part || part === "." || part === "..")
    ) {
      throw new Error(`Unsafe manifest path: ${relativePath}`);
    }
    const absolutePath = resolve(root, relativePath);
    if (!absolutePath.startsWith(resolve(root) + sep)) {
      throw new Error(`Path escapes snapshot: ${relativePath}`);
    }
    let actual = null;
    let reason = null;
    try {
      // Inspect every path component; readFileSync would otherwise follow a symlink
      // outside the trusted snapshot, possibly reading local secret material.
      const segments = relativePath.split("/");
      let current = resolve(root);
      for (let i = 0; i < segments.length; i++) {
        current = join(current, segments[i]);
        const stat = lstatSync(current);
        if (stat.isSymbolicLink()) {
          const error = new Error("Symbolic links are forbidden");
          error.code = "SYMLINK";
          throw error;
        }
        if (i < segments.length - 1 && !stat.isDirectory()) {
          const error = new Error("Expected directory");
          error.code = "NOT_DIRECTORY";
          throw error;
        }
        if (i === segments.length - 1 && !stat.isFile()) {
          const error = new Error("Expected regular file");
          error.code = "NOT_FILE";
          throw error;
        }
      }
      actual = gitBlobId(readFileSync(absolutePath));
    } catch (error) {
      reason = error.code ?? "READ_ERROR";
    }
    results.push({
      relativePath,
      ok: actual === expected,
      expected,
      actual,
      reason,
    });
  }
  return results;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.length !== 3) {
    console.error(
      "Usage: node scripts/verify-security-audit-skill.mjs <upstream-checkout-root>",
    );
    process.exitCode = 2;
  } else {
    const results = verifySnapshot(resolve(process.argv[2]));
    for (const item of results) {
      console.log(
        `${item.ok ? "PASS" : "FAIL"} ${item.relativePath}${item.reason ? ` (${item.reason})` : ""}`,
      );
    }
    console.log(
      `Upstream expected commit: ${UPSTREAM_COMMIT}; matching blobs: ${results.filter((x) => x.ok).length}/${results.length}`,
    );
    if (results.some((x) => !x.ok)) process.exitCode = 1;
    console.log(
      "NOTE: 22 upstream Git blob IDs checked; checkout commit/signature and actual audit are NOT verified.",
    );
  }
}
