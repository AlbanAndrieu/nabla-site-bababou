import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isTrustedHomelabIpv4 } from "../lib/homelabTrustedCidrs.mjs";

test("homelab allowlist accepts only configured IPv4 CIDRs", () => {
  const trusted = "82.66.4.247/32";
  assert.equal(isTrustedHomelabIpv4("82.66.4.247", trusted), true);
  for (const client of [
    "82.66.4.246",
    "82.66.4.248",
    "127.0.0.1",
    "82.66.4.247, 8.8.8.8",
    "82.66.4.247:443",
    "",
  ]) {
    assert.equal(isTrustedHomelabIpv4(client, trusted), false);
  }
  assert.equal(isTrustedHomelabIpv4("82.66.4.247", undefined), false);
  assert.equal(isTrustedHomelabIpv4("82.66.4.247", "82.66.4.247/999"), false);
  assert.equal(
    isTrustedHomelabIpv4("82.66.4.247", "82.66.4.247/32, INVALID"),
    false,
  );
  assert.equal(
    isTrustedHomelabIpv4("82.66.4.247", "82.66.4.0/24,10.0.0.0/8"),
    true,
  );
});

test(
  "private paths use Vercel ingress IP, deny on missing configuration",
  async () => {
    const proxy = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
    assert.match(proxy, /process\.env\.HOMELAB_TRUSTED_CIDRS/);
    assert.match(proxy, /process\.env\.VERCEL !== "1"/);
    assert.match(proxy, /request\.headers\.get\("x-real-ip"\)/);
    assert.match(proxy, /"Cache-Control": "private, no-store"/);
    assert.match(proxy, /status: 404/);
    assert.match(proxy, /"\/private\/:path\*"/);
    assert.match(proxy, /"\/api\/private\/:path\*"/);
    assert.doesNotMatch(proxy, /cf-connecting-ip/i);
  },
);
