import assert from "node:assert/strict";
import test from "node:test";

import { parsePrivacyPolicy, scanText } from "../scripts/privacy-gate.ts";

const POLICY = parsePrivacyPolicy(`# Privacy test fixture

- **Address**: Home address must not be disclosed. Use "La Défense" instead of 123 Example Street, 75000 Example City.
- **Private phone**: Last 2 digits of +33 6 12 34 56 78 must not be disclosed outside Contact/Email; use +33 6 12 34 56 XX when the number is shown elsewhere.
`);

const PUBLIC_PHONE = "+33 6 12 34 56 78";

test("generated Contact/Email phone exceptions are locale-agnostic", () => {
  for (const locale of ["fr", "en", "de", "no", "future-locale"]) {
    assert.deepEqual(
      scanText(
        PUBLIC_PHONE,
        `.next/server/app/${locale}/contact.html`,
        POLICY,
      ),
      [],
    );
    assert.deepEqual(
      scanText(
        PUBLIC_PHONE,
        `.next/server/app/${locale}/email.rsc`,
        POLICY,
      ),
      [],
    );
    assert.deepEqual(
      scanText(
        PUBLIC_PHONE,
        `.next/server/app/${locale}/contact.segments/_full.segment.rsc`,
        POLICY,
      ),
      [],
    );
  }

  assert.deepEqual(
    scanText(PUBLIC_PHONE, ".next/server/app/de/link.html", POLICY).map(
      (finding) => finding.category,
    ),
    ["private-phone"],
  );
});
