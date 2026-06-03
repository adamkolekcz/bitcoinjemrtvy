import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFabias, getYearsTracking } from "./calculations.ts";

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

test("formatFabias: 27 bilionů CZK → ~64,3 milionu", () => {
  assert.equal(formatFabias(27_000_000_000_000), "64,3 milionu");
});

test("formatFabias: přesně 1 milion fabií", () => {
  assert.equal(formatFabias(1_000_000 * 419_900), "1,0 milionu");
});

test("formatFabias: 0 → 0,0 milionu", () => {
  assert.equal(formatFabias(0), "0,0 milionu");
});
