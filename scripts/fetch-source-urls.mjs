/**
 * fetch-source-urls.mjs
 *
 * Prebuild skript — pro každý záznam v deaths.json stáhne URL originálního
 * zdroje z bitcoindeaths.com/posts/{slug} a uloží do src/data/source-urls.json.
 *
 * Klíče v source-urls.json jsou bitcoindeaths.com slugy (pole `slug` v deaths.json).
 * Existující záznamy se nepřepisují — script přidává pouze nové.
 *
 * Použití:
 *   node scripts/fetch-source-urls.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEATHS_JSON_PATH = resolve(__dirname, "../src/data/deaths.json");
const SOURCE_URLS_PATH = resolve(__dirname, "../src/data/source-urls.json");
const BITCOINDEATHS_POSTS_URL = "https://bitcoindeaths.com/posts";
const FETCH_TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;
const DELAY_BETWEEN_BATCHES_MS = 150;

/** Extrahuje URL originálního zdroje z __NEXT_DATA__ HTML stránky */
function parseSourceUrlFromHtml(html) {
  const nextDataMatch = html.match(
    /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!nextDataMatch?.[1]) return null;

  try {
    const nextData = JSON.parse(nextDataMatch[1]);
    const url = nextData?.props?.pageProps?.post?.url;
    return typeof url === "string" && url.startsWith("http") ? url : null;
  } catch {
    return null;
  }
}

/** Fetch s timeoutem a zpracováním chyb */
async function fetchSourceUrl(slug) {
  try {
    const response = await fetch(`${BITCOINDEATHS_POSTS_URL}/${slug}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bitcoinjemrtvy.cz/1.0)" },
    });

    if (!response.ok) {
      console.warn(`  [${slug}] HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    return parseSourceUrlFromHtml(html);
  } catch (error) {
    console.warn(
      `  [${slug}] Fetch failed: ${error instanceof Error ? error.message : "Unknown"}`
    );
    return null;
  }
}

/** Spouští promises v dávkách po `size` souběžně */
async function runInBatches(items, fn, size, delayMs) {
  const results = new Map();
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const batchResults = await Promise.all(batch.map((item) => fn(item)));
    batch.forEach((item, idx) => results.set(item, batchResults[idx]));

    if (i + size < items.length && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }

    const done = Math.min(i + size, items.length);
    process.stdout.write(
      `\r[fetch-source-urls] ${done}/${items.length} zpracováno...`
    );
  }
  process.stdout.write("\n");
  return results;
}

async function main() {
  // Načíst deaths.json
  let deaths;
  try {
    deaths = JSON.parse(readFileSync(DEATHS_JSON_PATH, "utf-8"));
  } catch {
    console.error("[fetch-source-urls] Nelze načíst deaths.json");
    process.exit(1);
  }

  // Načíst existující source-urls.json
  let existing = {};
  try {
    existing = JSON.parse(readFileSync(SOURCE_URLS_PATH, "utf-8"));
  } catch {
    // Soubor neexistuje nebo není validní — začneme prázdným
  }

  // Chybějící = klíč vůbec není přítomen. Klíč s hodnotou null = „ověřeně mrtvý,
  // nedohledatelný" (nastaveno validate-source-urls.mjs) → NEznovustahovat.
  const missingSlugs = deaths
    .filter((d) => d.slug && !(d.slug in existing))
    .map((d) => d.slug);

  if (missingSlugs.length === 0) {
    console.log(
      `[fetch-source-urls] Vše aktuální — ${Object.keys(existing).length} URL v cache.`
    );
    return;
  }

  console.log(
    `[fetch-source-urls] Stahuju URL pro ${missingSlugs.length} nových záznamů (${CONCURRENCY} souběžně)...`
  );

  const results = await runInBatches(
    missingSlugs,
    fetchSourceUrl,
    CONCURRENCY,
    DELAY_BETWEEN_BATCHES_MS
  );

  // Merge výsledků
  let added = 0;
  let failed = 0;
  for (const [slug, url] of results) {
    if (url) {
      existing[slug] = url;
      added++;
    } else {
      failed++;
    }
  }

  // Uložit aktualizovaný soubor
  writeFileSync(SOURCE_URLS_PATH, JSON.stringify(existing, null, 2) + "\n");

  console.log(
    `[fetch-source-urls] Hotovo: ${added} přidáno, ${failed} selhalo. Celkem ${Object.keys(existing).length} URL.`
  );
}

main();
