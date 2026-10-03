# shellcheck shell=bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

NEXT_ENV="next-env.d.ts"
NEXT_ENV_SNAPSHOT="$(mktemp)"
trap 'cp "${NEXT_ENV_SNAPSHOT}" "${NEXT_ENV}" 2>/dev/null || true; rm -f "${NEXT_ENV_SNAPSHOT}"' EXIT INT TERM

if ! git diff --quiet -- "${NEXT_ENV}"; then
    echo "❌ A11Y_HARNESS_DIRTY_NEXT_ENV: restore next-env.d.ts before running accessibility tests." >&2
    exit 1
fi

cp "${NEXT_ENV}" "${NEXT_ENV_SNAPSHOT}"
rm -rf .next test-results

export PLAYWRIGHT_A11Y=1

if [[ -n "${PLAYWRIGHT_PORT:-}" ]]; then
    if [[ ! "${PLAYWRIGHT_PORT}" =~ ^[0-9]+$ ]] || ((PLAYWRIGHT_PORT < 1 || PLAYWRIGHT_PORT > 65535)); then
        echo "❌ A11Y_HARNESS_INVALID_PORT: PLAYWRIGHT_PORT must be an integer between 1 and 65535." >&2
        exit 2
    fi
else
    PLAYWRIGHT_PORT="$(
        node -e '
const net = require("node:net");
const server = net.createServer();
server.unref();
server.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") {
    process.exit(1);
  }
  process.stdout.write(String(address.port));
  server.close();
});
'
    )"
fi

export PLAYWRIGHT_PORT
export PLAYWRIGHT_REUSE_SERVER=false

npx playwright test tests/accessibility-axe.spec.ts --project=chromium --reporter=line
