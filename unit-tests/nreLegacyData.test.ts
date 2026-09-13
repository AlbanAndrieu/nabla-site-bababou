import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseNreLegacyRows } from "../lib/nreLegacyData.ts";

async function readLegacySource(fileName: string) {
  return readFile(new URL(`../public/${fileName}`, import.meta.url), "utf8");
}

test("French NRE parser accepts retained ordinal markup and Unicode dash", async () => {
  const rows = parseNreLegacyRows(await readLegacySource("nre-fr.html"), "fr");
  const april2017 = rows.find((row) => row.year === 2017 && row.month === 4);

  assert.ok(april2017);
  assert.deepEqual(
    {
      startDay: april2017.startDay,
      endDay: april2017.endDay,
      status: april2017.status,
    },
    { startDay: 1, endDay: 2, status: "nre" },
  );
});

test("English NRE parser keeps the matching retained weekend range", async () => {
  const rows = parseNreLegacyRows(await readLegacySource("nre-en.html"), "en");
  const april2017 = rows.find((row) => row.year === 2017 && row.month === 4);

  assert.ok(april2017);
  assert.equal(april2017.startDay, 1);
  assert.equal(april2017.endDay, 2);
});

test("NRE parser accepts compact and spaced ordinal forms", () => {
  const html = `
    <table><tbody>
      <tr data-nre="true">
        <td>Avril 2017</td>
        <td>1<sup>er</sup> – 2 avril 2017</td>
        <td class="status-nre">NRE</td>
      </tr>
      <tr data-exception="true">
        <td>Mai 2017</td>
        <td>1er-2 mai 2017</td>
        <td class="status-exception">Exception</td>
      </tr>
    </tbody></table>
  `;

  const rows = parseNreLegacyRows(html, "fr");
  assert.deepEqual(
    rows.map(({ month, startDay, endDay, status }) => ({
      month,
      startDay,
      endDay,
      status,
    })),
    [
      { month: 4, startDay: 1, endDay: 2, status: "nre" },
      { month: 5, startDay: 1, endDay: 2, status: "exception" },
    ],
  );
});
