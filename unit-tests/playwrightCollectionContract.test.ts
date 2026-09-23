import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const playwrightCli = join(
  repositoryRoot,
  "node_modules",
  "playwright",
  "cli.js",
);

test("Playwright collects the full Chromium suite without starting browsers", async () => {
  await access(playwrightCli);

  const { stdout } = await execFileAsync(
    process.execPath,
    [playwrightCli, "test", "--list", "--project=chromium"],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        BASE_URL: "http://127.0.0.1:9",
        CI: "",
      },
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  assert.match(stdout, /priority-theme-visual\.spec\.ts/);
  assert.match(stdout, /responsive\.spec\.ts/);
  assert.match(stdout, /Total:/);
});
