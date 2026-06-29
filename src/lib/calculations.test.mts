import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getYearsTracking,
  getBitcoinAgeYears,
  buildCpiIndex,
  calculateCashCounterfactual,
  describeLossFraction,
  type DeathEvent,
} from "./calculations.ts";

function makeDeath(date: string): DeathEvent {
  return {
    date,
    bitcoinPrice: 100,
    articleTitle: "x",
    person: "x",
    publicationName: "x",
    jobTitle: "x",
    slug: "x",
    type: "x",
  };
}

test("den před výročím 2026 = 15 let", () => {
  assert.equal(getYearsTracking(new Date(2026, 9, 14)), 15);
});

test("v den výročí 2026 (15.10.) = 16 let", () => {
  assert.equal(getYearsTracking(new Date(2026, 9, 15)), 16);
});

test("dnes (2026-06-03) = 15 let", () => {
  assert.equal(getYearsTracking(new Date(2026, 5, 3)), 15);
});

test("den po výročí 2026 = 16 let", () => {
  assert.equal(getYearsTracking(new Date(2026, 9, 16)), 16);
});

test("v den výročí 2027 (15.10.) = 17 let", () => {
  assert.equal(getYearsTracking(new Date(2027, 9, 15)), 17);
});

test("těsně po startu (16.10.2010) = 0 let", () => {
  assert.equal(getYearsTracking(new Date(2010, 9, 16)), 0);
});

test("první výročí (15.10.2011) = 1 rok", () => {
  assert.equal(getYearsTracking(new Date(2011, 9, 15)), 1);
});

test("věk BTC: dnes (2026-06-18) = 17 let", () => {
  assert.equal(getBitcoinAgeYears(new Date(2026, 5, 18)), 17);
});

test("věk BTC: den před výročím (2026-01-02) = 16 let", () => {
  assert.equal(getBitcoinAgeYears(new Date(2026, 0, 2)), 16);
});

test("věk BTC: v den výročí (2026-01-03) = 17 let", () => {
  assert.equal(getBitcoinAgeYears(new Date(2026, 0, 3)), 17);
});

test("věk BTC: přechod na 18 (2027-01-03) = 18 let", () => {
  assert.equal(getBitcoinAgeYears(new Date(2027, 0, 3)), 18);
});

test("věk BTC: genesis (2009-01-03) = 0 let", () => {
  assert.equal(getBitcoinAgeYears(new Date(2009, 0, 3)), 0);
});

test("věk BTC: první výročí (2010-01-03) = 1 rok", () => {
  assert.equal(getBitcoinAgeYears(new Date(2010, 0, 3)), 1);
});

// ── cash counterfactual ──────────────────────────────────────────────────────

test("CPI index: báze prvního roku = 100, kumulace měr", () => {
  const idx = buildCpiIndex({ "2020": 5, "2021": 10, "2022": 2 });
  assert.equal(idx[2020], 100);
  assert.ok(Math.abs(idx[2021] - 110) < 1e-9);
  assert.ok(Math.abs(idx[2022] - 112.2) < 1e-9);
});

test("koruna: vklad v posledním roce neztratí nic (0 %)", () => {
  const r = calculateCashCounterfactual([makeDeath("6/1/2022")], 1000, {
    "2020": 5,
    "2021": 10,
    "2022": 2,
  });
  assert.equal(r.nominal, 1000);
  assert.equal(r.latestYear, 2022);
  assert.ok(Math.abs(r.realValue - 1000) < 1e-9);
  assert.ok(Math.abs(r.lossPct - 0) < 1e-9);
});

test("koruna: starší vklad ztratil kupní sílu (záporné %)", () => {
  const r = calculateCashCounterfactual([makeDeath("6/1/2020")], 1000, {
    "2020": 5,
    "2021": 10,
    "2022": 2,
  });
  assert.ok(Math.abs(r.realValue - (1000 * 100) / 112.2) < 1e-6);
  assert.ok(r.lossPct < 0);
  assert.ok(Math.abs(r.lossPct - ((100 / 112.2 - 1) * 100)) < 1e-6);
});

test("koruna: rok mimo tabulku se clampne (neúplný letošek ~0 %)", () => {
  const rates = { "2020": 5, "2021": 10, "2022": 2 };
  const future = calculateCashCounterfactual([makeDeath("6/1/2026")], 1000, rates);
  assert.ok(Math.abs(future.realValue - 1000) < 1e-9);
  const past = calculateCashCounterfactual([makeDeath("6/1/2015")], 1000, rates);
  assert.ok(Math.abs(past.realValue - (1000 * 100) / 112.2) < 1e-6);
});

test("koruna: nominál = počet × vklad", () => {
  const r = calculateCashCounterfactual(
    [makeDeath("6/1/2020"), makeDeath("6/1/2021"), makeDeath("6/1/2022")],
    1000,
    { "2020": 5, "2021": 10, "2022": 2 },
  );
  assert.equal(r.nominal, 3000);
});

// ── slovní zlomek ────────────────────────────────────────────────────────────

test("zlomek: 25 % = čtvrtinu (holé slovo)", () => {
  assert.equal(describeLossFraction(25), "čtvrtinu");
});

test("zlomek: 26 % = čtvrtinu (do ±2 p.b. holé)", () => {
  assert.equal(describeLossFraction(26), "čtvrtinu");
});

test("zlomek: 29 % = více než čtvrtinu", () => {
  assert.equal(describeLossFraction(29), "více než čtvrtinu");
});

test("zlomek: 30 % = téměř třetinu", () => {
  assert.equal(describeLossFraction(30), "téměř třetinu");
});

test("zlomek: 20 % = pětinu, 50 % = polovinu", () => {
  assert.equal(describeLossFraction(20), "pětinu");
  assert.equal(describeLossFraction(50), "polovinu");
});