import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEmbedSnippet, EMBED_WIDGETS } from "./embed-config.ts";

test("snippet counter má správné URL a rozměry", () => {
  const s = buildEmbedSnippet("counter");
  assert.ok(s.includes('src="https://www.bitcoinjemrtvy.cz/embed/counter"'));
  assert.ok(s.includes('width="300"'));
  assert.ok(s.includes('height="72"'));
  assert.ok(s.includes('scrolling="no"'));
});

test("snippet stats odkazuje na /embed/stats", () => {
  const s = buildEmbedSnippet("stats");
  assert.ok(s.includes("/embed/stats"));
  assert.ok(s.includes('width="460"'));
});

test("EMBED_WIDGETS má oba widgety", () => {
  assert.equal(EMBED_WIDGETS.counter.key, "counter");
  assert.equal(EMBED_WIDGETS.stats.key, "stats");
});
