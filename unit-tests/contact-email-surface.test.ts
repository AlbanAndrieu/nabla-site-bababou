import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const LOCALES = ["fr", "en", "de", "no"] as const;
const RETIRED_EMAIL_DOMAINS = ["@albanandrieu.com", "@albandrieu.com"];

test("contact hero no longer exposes a CV action", async () => {
  const page = await readFile(
    new URL("../app/[locale]/contact/page.tsx", import.meta.url),
    "utf8",
  );
  const hero = await readFile(
    new URL("../components/ContactHero.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(page, /hero\.cvCta/);
  assert.doesNotMatch(page, /cvHref=/);
  assert.doesNotMatch(hero, /cvCta/);
  assert.doesNotMatch(hero, /cvHref/);
});

test("email page publishes only bababou.com addresses and no Google migration notice", async () => {
  const page = await readFile(
    new URL("../app/[locale]/email/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(page, /support\.google\.com/);
  assert.doesNotMatch(page, /reasonLine[1-4]/);

  for (const locale of LOCALES) {
    const raw = await readFile(
      new URL(`../messages/email/${locale}.json`, import.meta.url),
      "utf8",
    );
    const catalog = JSON.parse(raw) as {
      email: {
        cards: Array<{ email: string }>;
        automatedList: string[];
        [key: string]: unknown;
      };
    };
    const addresses = [
      ...catalog.email.cards.map((card) => card.email),
      ...catalog.email.automatedList,
    ];

    assert.ok(addresses.length > 0, `${locale} should expose contact addresses`);
    for (const address of addresses) {
      assert.ok(
        address.endsWith("@bababou.com"),
        `${locale} should expose only bababou.com addresses: ${address}`,
      );
    }
    for (const domain of RETIRED_EMAIL_DOMAINS) {
      assert.equal(raw.includes(domain), false, `${locale} still contains ${domain}`);
    }
    assert.equal("reasonLine1" in catalog.email, false);
    assert.equal("reasonLine2" in catalog.email, false);
    assert.equal("reasonLine3" in catalog.email, false);
    assert.equal("reasonLine4" in catalog.email, false);
  }
});
