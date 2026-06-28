/**
 * sync-deaths.mjs
 *
 * Prebuild skript — stáhne aktuální data z bitcoindeaths.com
 * a aktualizuje src/data/deaths.json.
 *
 * Pokud fetch selže nebo data nejsou validní, stávající soubor zůstane beze změny.
 *
 * Použití:
 *   node scripts/sync-deaths.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEATHS_JSON_PATH = resolve(__dirname, "../src/data/deaths.json");
// /posts má kompletní data (quote + jobTitle); homepage `chartData` o ně přišla.
const BITCOINDEATHS_URL = "https://bitcoindeaths.com/posts";
const FETCH_TIMEOUT_MS = 30_000;

/** Extrahuje posts z HTML stránky /posts (stejná logika jako deaths-data.ts) */
function parsePostsFromHtml(html) {
  const nextDataMatch = html.match(
    /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );

  if (!nextDataMatch?.[1]) {
    return null;
  }

  try {
    const nextData = JSON.parse(nextDataMatch[1]);
    const posts = nextData?.props?.pageProps?.posts;

    if (!posts || !Array.isArray(posts)) {
      return null;
    }

    return posts;
  } catch {
    return null;
  }
}

/** Validuje strukturu dat — kontrola povinných polí prvního záznamu */
function validateDeathsData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  const first = data[0];
  return (
    typeof first === "object" &&
    first !== null &&
    typeof first.date === "string" &&
    typeof first.bitcoinPrice === "number" &&
    typeof first.articleTitle === "string" &&
    typeof first.person === "string"
  );
}

async function main() {
  console.log("[sync-deaths] Fetching data from bitcoindeaths.com...");

  let html;
  try {
    const response = await fetch(BITCOINDEATHS_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    html = await response.text();
  } catch (error) {
    console.warn(
      `[sync-deaths] Fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    console.log("[sync-deaths] Keeping existing deaths.json unchanged.");
    return;
  }

  const deaths = parsePostsFromHtml(html);

  if (!deaths || !validateDeathsData(deaths)) {
    console.warn("[sync-deaths] Failed to parse valid data from HTML.");
    console.log("[sync-deaths] Keeping existing deaths.json unchanged.");
    return;
  }

  // Načíst stávající soubor a porovnat počet záznamů
  let existingCount = 0;
  try {
    const existing = JSON.parse(readFileSync(DEATHS_JSON_PATH, "utf-8"));
    existingCount = Array.isArray(existing) ? existing.length : 0;
  } catch {
    // Soubor neexistuje nebo není validní JSON — přepíšeme
  }

  if (deaths.length < existingCount) {
    console.warn(
      `[sync-deaths] Fetched ${deaths.length} entries, but existing file has ${existingCount}. Skipping update to prevent data loss.`
    );
    return;
  }

  writeFileSync(DEATHS_JSON_PATH, JSON.stringify(deaths, null, 2) + "\n");
  console.log(
    `[sync-deaths] Updated deaths.json: ${existingCount} → ${deaths.length} entries.`
  );
}

main();
