import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDate, slugifyTitle, translationKey, deathSlug } from "./translate-core.mjs";
import { isFieldSane, isTranslationSane } from "./translate-core.mjs";

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

test("deathSlug: z českého titulku, bez diakritiky (drift guard vs calculations.ts)", () => {
  assert.equal(
    deathSlug({ date: "2/24/2026", articleTitle_cs: "Bitcoin je mrtvý" }),
    "24-02-2026-bitcoin-je-mrtvy"
  );
});

test("deathSlug: fallback na articleTitle bez _cs", () => {
  assert.equal(
    deathSlug({ date: "2/24/2026", articleTitle: "$BTC is done. Cooked. Toast. El Finito." }),
    "24-02-2026-btc-is-done-cooked-toast-el-finito"
  );
});

test("deathSlug: ořezává titulkovou část na max 80 znaků, bez koncové pomlčky", () => {
  const slug = deathSlug({
    date: "6/16/2026",
    articleTitle_cs:
      "Peter Schiff vysvětluje, proč Bitcoin nesměřuje k nule — ale pro většinu investorů to bude jako nula vypadat",
  });
  assert.equal(
    slug,
    "16-06-2026-peter-schiff-vysvetluje-proc-bitcoin-nesmeruje-k-nule-ale-pro-vetsinu-investoru"
  );
  const titlePart = slug.replace(/^\d{2}-\d{2}-\d{4}-/, "");
  assert.ok(titlePart.length <= 80);
  assert.ok(!titlePart.endsWith("-"));
});

test("isFieldSane: prázdné/krátké/dlouhé odmítne, rozumné přijme", () => {
  assert.equal(isFieldSane("Bitcoin is dead", "Bitcoin je mrtvý"), true);
  assert.equal(isFieldSane("Bitcoin is dead", ""), false);
  assert.equal(isFieldSane("Bitcoin is dead", "   "), false);
  assert.equal(isFieldSane("Bitcoin is dead", 42), false); // non-string
  assert.equal(isFieldSane("Hello world here", "x"), false); // moc krátké (ratio < 0.3)
});

test("isTranslationSane: článek bez citátu kontroluje jen titulek", () => {
  const death = { articleTitle: "Bitcoin is dead" };
  assert.equal(isTranslationSane(death, { articleTitle: "Bitcoin je mrtvý" }), true);
});

test("isTranslationSane: článek s citátem vyžaduje oba (atomicky)", () => {
  const death = { articleTitle: "Bitcoin is dead", quote: "It will go to zero soon." };
  assert.equal(
    isTranslationSane(death, { articleTitle: "Bitcoin je mrtvý", quote: "Brzy půjde na nulu." }),
    true
  );
  assert.equal(
    isTranslationSane(death, { articleTitle: "Bitcoin je mrtvý", quote: "" }),
    false // citát selhal → celý článek nevalidní
  );
});

import { findMissing, mergeTranslations } from "./translate-core.mjs";

test("findMissing vrátí death objekty, jejichž klíč není v překladech", () => {
  const deaths = [
    { date: "2/24/2026", articleTitle: "$BTC is done. Cooked. Toast. El Finito." },
    { date: "1/1/2020", articleTitle: "Brand new article" },
  ];
  const translations = { "24-02-2026-btc-is-done-cooked-toast-el-finito": { articleTitle: "..." } };
  const missing = findMissing(deaths, translations);
  assert.equal(missing.length, 1);
  assert.equal(missing[0].articleTitle, "Brand new article");
});

test("mergeTranslations nikdy nepřepíše existující klíč", () => {
  const existing = { a: { articleTitle: "PŮVODNÍ" } };
  const additions = { a: { articleTitle: "NOVÝ" }, b: { articleTitle: "B" } };
  const merged = mergeTranslations(existing, additions);
  assert.equal(merged.a.articleTitle, "PŮVODNÍ"); // ruční překlad chráněn
  assert.equal(merged.b.articleTitle, "B");
});

import {
  czechifyQuotes,
  normalizeTitleQuotes,
  normalizeQuoteQuotes,
} from "./translate-core.mjs";

test("normalizeTitleQuotes: rovné/single/americké/mix → primární „ “", () => {
  assert.equal(normalizeTitleQuotes("Bitcoin už není 'digitální zlato'"), "Bitcoin už není „digitální zlato“");
  assert.equal(normalizeTitleQuotes('Je to "konec" Bitcoinu'), "Je to „konec“ Bitcoinu");
  assert.equal(normalizeTitleQuotes("‚Bitcoin je zpět‘"), "„Bitcoin je zpět“");
  assert.equal(normalizeTitleQuotes("„už české“"), "„už české“"); // idempotence
});

test("normalizeQuoteQuotes: odstraní obalení (rendering ho přidá)", () => {
  assert.equal(normalizeQuoteQuotes('"Celý citát je obalený."'), "Celý citát je obalený.");
  assert.equal(normalizeQuoteQuotes("„Celý citát je obalený.“"), "Celý citát je obalený.");
});

test("normalizeQuoteQuotes: vnitřní citace → vnořené ‚ ‘", () => {
  assert.equal(
    normalizeQuoteQuotes("Tradiční 'fundamentální' argument je mýtus."),
    "Tradiční ‚fundamentální‘ argument je mýtus."
  );
  assert.equal(
    normalizeQuoteQuotes('Říká, že „digitální zlato“ je podvod.'),
    "Říká, že ‚digitální zlato‘ je podvod."
  );
  assert.equal(normalizeQuoteQuotes("Říká ‚trhy‘ jsou podvod"), "Říká ‚trhy‘ jsou podvod"); // idempotence
});

test("normalize: apostrofy (písmeno-'-písmeno) zachované", () => {
  assert.equal(normalizeQuoteQuotes("Jusqu'ici tout va bien"), "Jusqu'ici tout va bien");
  assert.equal(normalizeTitleQuotes("O'Leary o bitcoinu"), "O'Leary o bitcoinu");
});

test("czechifyQuotes: non-string vrátí beze změny", () => {
  assert.equal(czechifyQuotes(null), null);
  assert.equal(czechifyQuotes(undefined), undefined);
});
