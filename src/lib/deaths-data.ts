import { cache } from "react";
import { isValidDeath, type DeathEvent } from "./calculations";
import staticDeathsData from "@/data/deaths.json";
import sourceUrlsData from "@/data/source-urls.json";
import { applyTranslations } from "./translations";

const sourceUrls = sourceUrlsData as Record<string, string | null>;

function applySourceUrls(deaths: DeathEvent[]): DeathEvent[] {
  return deaths.map((death) => {
    const url = sourceUrls[death.slug];
    if (!url) return death;
    return { ...death, sourceUrl: url };
  });
}

// /posts má kompletní data (quote + jobTitle); homepage `chartData` o ně přišla.
const BITCOINDEATHS_URL = "https://bitcoindeaths.com/posts";
const REVALIDATE_SECONDS = 3600; // 1 hodina

interface DeathsDataResult {
  deaths: DeathEvent[];
  source: "live" | "static";
}

/**
 * Extrahuje posts JSON z HTML stránky bitcoindeaths.com/posts
 * Data jsou uložena v Next.js __NEXT_DATA__ scriptu jako JSON.
 * Pozn.: /posts má kompletní záznamy (quote + jobTitle), na rozdíl od
 * homepage `chartData`, ze které bitcoindeaths.com tato pole odstranil.
 */
function parsePostsFromHtml(html: string): unknown[] | null {
  // Hledáme __NEXT_DATA__ script tag
  const nextDataMatch = html.match(
    /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );

  if (!nextDataMatch?.[1]) {
    return null;
  }

  try {
    const nextData = JSON.parse(nextDataMatch[1]) as {
      props?: {
        pageProps?: {
          posts?: unknown[];
        };
      };
    };

    const posts = nextData?.props?.pageProps?.posts;

    if (!posts || !Array.isArray(posts)) {
      return null;
    }

    // Data jsou již ve správném formátu (camelCase)
    return posts;
  } catch {
    return null;
  }
}

/**
 * Načte data o Bitcoin obituaries
 * Primárně z bitcoindeaths.com, s fallbackem na statický JSON
 */
const KRAKEN_PRICE_API = "https://api.kraken.com/0/public/Ticker?pair=XBTUSD";
const COINBASE_PRICE_API = "https://api.coinbase.com/v2/prices/BTC-USD/spot";
const FRANKFURTER_API = "https://api.frankfurter.app/latest?base=USD&symbols=CZK";
const CNB_API = "https://api.cnb.cz/cnbapi/exrates/daily?lang=EN";
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=czk,usd&include_market_cap=true";
// Absolutní záchrana — použije se jen pokud selžou Frankfurter i ČNB
const FALLBACK_USD_TO_CZK = 20.75;

interface BtcCoinGeckoData {
  priceCzk: number | null;
  marketCapCzk: number | null;
  usdToCzk: number;
}

/**
 * Načte aktuální cenu BTC v CZK a kurz USD/CZK.
 *
 * Řetězec zdrojů pro cenu:
 *   1. Kraken + Frankfurter (primární — bez geo-restrikcí, bez rate limitů)
 *   2. Coinbase + Frankfurter (záloha 1 — spolehlivý US exchange, veřejné API)
 *   3. CoinGecko             (záloha 2 — vrací BTC/CZK přímo, ale rate-limitovaný)
 *   4. null + FALLBACK_USD_TO_CZK (totální výpadek)
 *
 * Market cap (volitelný, jen pro homepage):
 *   CoinGecko — tiché selhání, nezablokuje zobrazení ceny.
 */
// cache(): homepage i detail volají v jednom renderu víckrát (stránka + generateMetadata);
// AbortSignal v opts vypíná fetch dedup Next.js, takže bez cache() by šly requesty 2×.
export const getBtcCoinGeckoData = cache(async function getBtcCoinGeckoData(
  revalidateSeconds = REVALIDATE_SECONDS,
  includeMarketCap = true,
): Promise<BtcCoinGeckoData> {
  const opts = (timeout = 4_000) => ({
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(timeout),
  });

  // CoinGecko (market cap i záloha ceny) — jeden request, sdílený. Při includeMarketCap
  // startuje hned souběžně s Krakenem, ne až po něm.
  let coinGeckoP: Promise<CoinGeckoResponse | null> | undefined;
  const getCoinGecko = () => (coinGeckoP ??= fetchCoinGecko());
  if (includeMarketCap) void getCoinGecko();
  const fetchMarketCap = async () => (await getCoinGecko())?.bitcoin?.czk_market_cap ?? null;

  // --- Pomocná funkce: načte kurz USD/CZK ---
  // Řetězec: Frankfurter → ČNB → hardcoded fallback
  async function fetchUsdToCzk(): Promise<number> {
    // 1. Frankfurter
    try {
      const res = await fetch(FRANKFURTER_API, opts());
      if (res.ok) {
        const data = (await res.json()) as { rates?: { CZK?: number } };
        if (data?.rates?.CZK) return data.rates.CZK;
      }
    } catch {}

    // 2. ČNB
    try {
      const res = await fetch(CNB_API, opts());
      if (res.ok) {
        const data = (await res.json()) as { rates?: { currencyCode: string; rate: number }[] };
        const usd = data?.rates?.find((r) => r.currencyCode === "USD");
        if (usd?.rate) {
          console.warn("[btc] Frankfurter selhal, použit kurz ČNB");
          return usd.rate;
        }
      }
    } catch {}

    console.warn("[btc] Frankfurter i ČNB selhaly, použit hardcoded fallback");
    return FALLBACK_USD_TO_CZK;
  }

  // Kurz se stahuje jednou a sdílí ho Kraken i Coinbase větev (dřív 2× při výpadku Krakenu).
  const usdToCzkP = fetchUsdToCzk();

  // --- 1. Kraken + Frankfurter ---
  try {
    const [krakenRes, usdToCzk] = await Promise.all([
      fetch(KRAKEN_PRICE_API, opts()).then(async (r) => {
        if (!r.ok) throw new Error(`Kraken HTTP ${r.status}`);
        return r.json() as Promise<{ result?: { XXBTZUSD?: { c?: string[] } } }>;
      }),
      usdToCzkP,
    ]);

    const priceUsd = krakenRes?.result?.XXBTZUSD?.c?.[0]
      ? parseFloat(krakenRes.result.XXBTZUSD.c[0])
      : null;
    if (!priceUsd || isNaN(priceUsd)) throw new Error("Invalid Kraken price");

    const priceCzk = priceUsd * usdToCzk;
    const marketCapCzk = includeMarketCap ? await fetchMarketCap() : null;
    logInfo(`[btc] Kraken: ${fmt(priceCzk)} Kč | USD/CZK: ${usdToCzk.toFixed(3)} | marketCap: ${marketCapCzk ? "OK" : "N/A"}`);
    return { priceCzk, marketCapCzk, usdToCzk };

  } catch (e1) {
    console.warn("[btc] Kraken selhal:", msg(e1));
  }

  // --- 2. Coinbase + Frankfurter ---
  try {
    const [coinbaseRes, usdToCzk] = await Promise.all([
      fetch(COINBASE_PRICE_API, opts()).then(async (r) => {
        if (!r.ok) throw new Error(`Coinbase HTTP ${r.status}`);
        return r.json() as Promise<{ data?: { amount?: string } }>;
      }),
      usdToCzkP,
    ]);

    const priceUsd = coinbaseRes?.data?.amount ? parseFloat(coinbaseRes.data.amount) : null;
    if (!priceUsd || isNaN(priceUsd)) throw new Error("Invalid Coinbase price");

    const priceCzk = priceUsd * usdToCzk;
    const marketCapCzk = includeMarketCap ? await fetchMarketCap() : null;
    logInfo(`[btc] Coinbase: ${fmt(priceCzk)} Kč | USD/CZK: ${usdToCzk.toFixed(3)} | marketCap: ${marketCapCzk ? "OK" : "N/A"}`);
    return { priceCzk, marketCapCzk, usdToCzk };

  } catch (e2) {
    console.warn("[btc] Coinbase selhal:", msg(e2));
  }

  // --- 3. CoinGecko (záloha pro vše) ---
  try {
    const data = await getCoinGecko();
    if (!data) throw new Error("CoinGecko nedostupný");
    const priceCzk = data?.bitcoin?.czk ?? null;
    const priceUsdCg = data?.bitcoin?.usd ?? null;
    const marketCapCzk = includeMarketCap ? (data?.bitcoin?.czk_market_cap ?? null) : null;
    const usdToCzk =
      typeof priceCzk === "number" && typeof priceUsdCg === "number" && priceUsdCg > 0
        ? priceCzk / priceUsdCg
        : FALLBACK_USD_TO_CZK;

    logInfo(`[btc] CoinGecko záloha: ${priceCzk?.toLocaleString("cs-CZ")} Kč`);
    return { priceCzk, marketCapCzk, usdToCzk };

  } catch (e3) {
    console.warn("[btc] Všechny zdroje selhaly:", msg(e3));
    return { priceCzk: null, marketCapCzk: null, usdToCzk: FALLBACK_USD_TO_CZK };
  }

  // --- Pomocné funkce ---
  async function fetchCoinGecko(): Promise<CoinGeckoResponse | null> {
    try {
      const res = await fetch(COINGECKO_API, opts(5_000));
      if (!res.ok) return null;
      return (await res.json()) as CoinGeckoResponse;
    } catch {
      return null;
    }
  }
});

interface CoinGeckoResponse {
  bitcoin?: { czk?: number; usd?: number; czk_market_cap?: number };
}

function fmt(n: number) { return Math.round(n).toLocaleString("cs-CZ"); }
function msg(e: unknown) { return e instanceof Error ? e.message : String(e); }
// Info logy potlačíme v dev (šum při každém načtení), v produkci se logují (monitoring zdrojů dat/cen).
function logInfo(message: string) { if (process.env.NODE_ENV !== "development") console.log(message); }

// Jen záznamy, které umíme vykreslit, s českým překladem (nepřeložené se na webu neobjeví).
function prepareDeaths(records: unknown[]): DeathEvent[] {
  const valid = records.filter(isValidDeath);
  if (valid.length < records.length) {
    console.warn(`[deaths-data] Vyřazeno ${records.length - valid.length} nevalidních záznamů`);
  }
  return applySourceUrls(applyTranslations(valid).filter((d) => d.articleTitle_cs));
}

// cache(): stránka i generateMetadata v jednom renderu sdílí jeden parse (~440 KB HTML).
export const getDeathsData = cache(async function getDeathsData(
  revalidateSeconds = REVALIDATE_SECONDS,
): Promise<DeathsDataResult> {
  try {
    const response = await fetch(BITCOINDEATHS_URL, {
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const posts = parsePostsFromHtml(await response.text());
    const deaths = posts ? prepareDeaths(posts) : [];
    if (deaths.length === 0) {
      throw new Error("Invalid data structure");
    }

    logInfo(`[deaths-data] Loaded ${deaths.length} obituaries from bitcoindeaths.com`);
    return { deaths, source: "live" };
  } catch (error) {
    console.warn(
      "[deaths-data] Failed to fetch from bitcoindeaths.com, using static fallback:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return { deaths: prepareDeaths(staticDeathsData), source: "static" };
  }
});
