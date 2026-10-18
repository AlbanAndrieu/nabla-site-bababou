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
] as const;

test("Preview does not serve repository internals or Python source", async ({
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
