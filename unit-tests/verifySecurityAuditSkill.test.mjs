import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitBlobId, verifySnapshot, UPSTREAM_BLOBS } from '../scripts/verify-security-audit-skill.mjs';

test('Git blob includes length/header', () => {
  assert.equal(gitBlobId(Buffer.from('test\n')), '9daeafb9864cf43055ae93beb0afd6c7d144bfa4');
});
test('matches, detects tampering and missing files', () => {
  const root = mkdtempSync(join(tmpdir(), 'audit-skill-'));
  try {
    mkdirSync(join(root, 'skills', 'security-audit'), { recursive: true });
    writeFileSync(join(root, 'LICENSE'), 'fixture\n');
    const manifest = {
      LICENSE: gitBlobId(Buffer.from('fixture\n')),
      'skills/security-audit/SKILL.md': gitBlobId(Buffer.from('correct')),
      'skills/security-audit/validate-findings.cjs': '0000000000000000000000000000000000000000',
    };
    writeFileSync(join(root, 'skills/security-audit/SKILL.md'), 'tampered');
    const results = verifySnapshot(root, manifest);
    assert.deepEqual(results.map(item => item.ok), [true, false, false]);
    assert.equal(results[2].reason, 'ENOENT');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('rejects unsafe manifest paths', () => {
  assert.throws(() => verifySnapshot('/tmp', { '../secret': 'abc' }), /Unsafe manifest path/);
});
test('pins four upstream blobs', () => {
  assert.equal(Object.keys(UPSTREAM_BLOBS).length, 4);
});
