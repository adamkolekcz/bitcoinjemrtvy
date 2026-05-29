import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDate, slugifyTitle, translationKey } from "./translate-core.mjs";

test("parseDate čte M/D/YYYY", () => {
  const d = parseDate("4/9/2026");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 3); // duben = index 3
  assert.equal(d.getDate(), 9);
});

test("slugifyTitle: lowercase, bez diakritiky, bez zkrácení", () => {
  assert.equal(
    slugifyTitle("$BTC is done. Cooked. Toast. El Finito."),
    "btc-is-done-cooked-toast-el-finito"
  );
});

test("translationKey odpovídá reálným klíčům (drift guard)", () => {
  assert.equal(
    translationKey({
      date: "4/9/2026",
      articleTitle:
        "He Predicted 2008 Crash — Now He Says Bitcoin Could Collapse To Zero. Should Crypto Investors Worry?",
    }),
    "09-04-2026-he-predicted-2008-crash-now-he-says-bitcoin-could-collapse-to-zero-should-crypto-investors-worry"
  );
  assert.equal(
    translationKey({ date: "2/24/2026", articleTitle: "$BTC is done. Cooked. Toast. El Finito." }),
    "24-02-2026-btc-is-done-cooked-toast-el-finito"
  );
});
