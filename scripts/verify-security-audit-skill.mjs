import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Git blob IDs are content-addresses, not SHA-256 or authenticity proofs.
export const UPSTREAM_COMMIT = 'c1c8a8c1471069fb0e188eeaff69b8e8db6564a8';
export const UPSTREAM_BLOBS = Object.freeze({
  'LICENSE': '6dbc9ecb3a5b9080e95b962869e8c7ab16cfdc20',
  'skills/security-audit/SKILL.md': '92178dad304d3f63e37582a297026a7874e12c62',
  'skills/security-audit/validate-findings.cjs': '2843feceddb7e30bf10d6e4f7bbe6640e4c57799',
  'skills/security-audit/validate-coverage-ledger.cjs': '0ef58657bef18b26a92321df6c8e3d31bc8e6659',
});

export function gitBlobId(buffer) {
  return createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
}

export function verifySnapshot(root, expectedBlobs = UPSTREAM_BLOBS) {
  const results = [];
  for (const [relativePath, expected] of Object.entries(expectedBlobs)) {
    if (!relativePath || isAbsolute(relativePath) || relativePath.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) {
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
      const segments = relativePath.split('/');
      let current = resolve(root);
      for (let i = 0; i < segments.length; i++) {
        current = join(current, segments[i]);
        const stat = lstatSync(current);
        if (stat.isSymbolicLink()) {
          const error = new Error('Symbolic links are forbidden');
          error.code = 'SYMLINK';
          throw error;
        }
        if (i < segments.length - 1 && !stat.isDirectory()) {
          const error = new Error('Expected directory');
          error.code = 'NOT_DIRECTORY';
          throw error;
        }
        if (i === segments.length - 1 && !stat.isFile()) {
          const error = new Error('Expected regular file');
          error.code = 'NOT_FILE';
          throw error;
        }
      }
      actual = gitBlobId(readFileSync(absolutePath));
    }
    catch (error) { reason = error.code ?? 'READ_ERROR'; }
    results.push({ relativePath, ok: actual === expected, expected, actual, reason });
  }
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) {
    console.error('Usage: node scripts/verify-security-audit-skill.mjs <upstream-checkout-root>');
    process.exitCode = 2;
  } else {
    const results = verifySnapshot(resolve(process.argv[2]));
    for (const item of results) {
      console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.relativePath}${item.reason ? ` (${item.reason})` : ''}`);
    }
    console.log(`Upstream expected commit: ${UPSTREAM_COMMIT}; matching blobs: ${results.filter(x => x.ok).length}/${results.length}`);
    if (results.some(x => !x.ok)) process.exitCode = 1;
    console.log('NOTE: four content blobs only; checkout commit/signature and actual audit are NOT verified.');
  }
}
