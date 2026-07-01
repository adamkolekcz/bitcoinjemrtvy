/**
 * check-redirects.mjs — WS5 guard
 *
 * Ověří, že každá `destination` v redirects.json vede na živý CZ slug detailu.
 * Chrání proti stale redirectům (EN→CZ slug, který se po přeložení změnil → 404).
 *
 * Slug se rekonstruuje přes translate-core.mjs (kanonická .mjs kopie slug logiky,
 * byte-identická s calculations.ts) + aplikace překladů z translations-cs.json
 * (stejně jako applyTranslations v runtime).
 *
 * Použití: node scripts/check-redirects.mjs   (exit 1 = nalezeny stale)
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { translationKey, deathSlug } from "./lib/translate-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = (p) => JSON.parse(readFileSync(resolve(__dirname, p), "utf-8"));

const deaths = load("../src/data/deaths.json");
const translations = load("../src/data/translations-cs.json");
const redirects = load("../src/data/redirects.json");

// Živé detaily = přeložené záznamy (mají articleTitle v translations-cs.json),
// slug z českého titulku — přesně jako getDeathsData → generateDeathSlug.
const live = new Set();
for (const d of deaths) {
  const t = translations[translationKey(d)];
  if (!t?.articleTitle) continue;
  live.add(`/prohlaseni/${deathSlug({ ...d, articleTitle_cs: t.articleTitle })}`);
}

const stale = redirects.filter((r) => !live.has(r.destination));
console.log(`redirects: ${redirects.length}, live slugů: ${live.size}, stale destinace: ${stale.length}`);
for (const r of stale) console.log("  STALE:", r.source, "->", r.destination);
process.exit(stale.length ? 1 : 0);
