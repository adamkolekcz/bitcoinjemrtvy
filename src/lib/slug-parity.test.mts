// Drift guard: TS (web) a mjs (skripty: překlad, IndexNow, check-redirects) mají vlastní
// kopie slug/klíč/validační logiky. Proženeme přes obě VŠECHNA reálná data + hraniční vstupy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateDeathSlug, translationKey, isValidDeath, type DeathEvent } from "./calculations.ts";
import * as core from "../../scripts/lib/translate-core.mjs";

const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf-8"));
const deaths: DeathEvent[] = readJson("../data/deaths.json");
const translations: Record<string, { articleTitle?: string }> = readJson("../data/translations-cs.json");

test("translationKey: TS === mjs pro všechna data", () => {
  for (const d of deaths) assert.equal(translationKey(d), core.translationKey(d));
});

test("slug: TS === mjs pro všechna data (CZ i EN titulek)", () => {
  for (const d of deaths) {
    const cs = { ...d, articleTitle_cs: translations[translationKey(d)]?.articleTitle };
    assert.equal(generateDeathSlug(cs), core.deathSlug(cs));
    assert.equal(generateDeathSlug(d), core.deathSlug(d));
  }
});

test("slugy přeložených záznamů jsou unikátní (kolize = nedostupný detail)", () => {
  const seen = new Map<string, string>();
  for (const d of deaths) {
    const t = translations[translationKey(d)]?.articleTitle;
    if (!t) continue;
    const slug = generateDeathSlug({ ...d, articleTitle_cs: t });
    assert.ok(!seen.has(slug), `kolize slugu ${slug}: „${seen.get(slug)}" vs „${d.articleTitle}"`);
    seen.set(slug, d.articleTitle);
  }
});

test("isValidDeath: TS === mjs, odmítá vadné záznamy", () => {
  const ok = deaths[0];
  const cases: [unknown, boolean][] = [
    [ok, true],
    [null, false],
    ["x", false],
    [{ ...ok, date: "2026-06-16" }, false],
    [{ ...ok, date: undefined }, false],
    [{ ...ok, bitcoinPrice: 0 }, false],
    [{ ...ok, bitcoinPrice: Number.NaN }, false],
    [{ ...ok, bitcoinPrice: "100" }, false],
    [{ ...ok, articleTitle: "  " }, false],
    [{ ...ok, person: null }, false],
    [{ ...ok, publicationName: undefined }, false],
  ];
  for (const [input, expected] of cases) {
    assert.equal(isValidDeath(input), expected, JSON.stringify(input));
    assert.equal(core.isValidDeath(input), expected, JSON.stringify(input));
  }
  for (const d of deaths) assert.ok(isValidDeath(d), d.articleTitle);
});
