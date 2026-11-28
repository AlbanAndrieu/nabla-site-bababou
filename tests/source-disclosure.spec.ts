import { expect, test } from "@playwright/test";

/**
 * P1/ZAP 10099: a Python-disclosure warning on public copy is not proof of
 * source exposure. Check the actual deployment boundary against direct reads
 * of repository metadata, credentials, scripts and source filenames.
 * Run on the exact-SHA protected Preview; never probe internal homelab hosts.
 */
const privateSourcePaths = [
  "/.env",
  "/.git/config",
  "/.github/workflows/ci.yml",
  "/package.json",
  "/pyproject.toml",
  "/scripts/prepare-security-audit-skill.sh",
  "/server.py",
  // PHP is not part of this Next.js site; ZAP 10099 must not be a real 200.
  "/index.php",
  "/info.php",
  "/wp-config.php",
  "/composer.json",
  "/vendor/composer/installed.json",
] as const;

test("Preview does not expose repository internals, Python or PHP sources", async ({
  request,
}) => {
  for (const path of privateSourcePaths) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(
      [403, 404],
      `Internal path ${path} returned HTTP ${response.status()}`,
    ).toContain(response.status());
  }
});

test("ZAP 10098: public HTML never grants reflected or wildcard credentialed CORS", async ({ request }) => {
  const maliciousOrigin = "https://untrusted.invalid";
  for (const path of ["/", "/en", "/api/hello"]) {
    const response = await request.get(path, {
      headers: { Origin: maliciousOrigin },
      maxRedirects: 0,
    });
    const origin = response.headers()["access-control-allow-origin"]?.trim();
    const credentials = response.headers()["access-control-allow-credentials"]?.trim();
    expect(origin, `CORS wildcard/reflection on ${path}`).not.toBe("*");
    expect(origin, `CORS reflection on ${path}`).not.toBe(maliciousOrigin);
    expect(credentials, `Credentialed CORS on ${path}`).not.toBe("true");
  }
});
