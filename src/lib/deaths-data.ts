import type { DeathEvent } from "./calculations";
import staticDeathsData from "@/data/deaths.json";
import sourceUrlsData from "@/data/source-urls.json";
import { applyTranslations } from "./translations";

const sourceUrls = sourceUrlsData as Record<string, string>;

function applySourceUrls(deaths: DeathEvent[]): DeathEvent[] {
  return deaths.map((death) => {
    const url = sourceUrls[death.slug];
    if (!url) return death;
    return { ...death, sourceUrl: url };
  });
}

const BITCOINDEATHS_URL = "https://bitcoindeaths.com";
const REVALIDATE_SECONDS = 3600; // 1 hodina

interface DeathsDataResult {
  deaths: DeathEvent[];
  source: "live" | "static";
}

/**
 * Extrahuje chartData JSON z HTML stránky bitcoindeaths.com
 * Data jsou uložena v Next.js __NEXT_DATA__ scriptu jako JSON
 */
function parseChartDataFromHtml(html: string): DeathEvent[] | null {
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
          chartData?: DeathEvent[];
        };
      };
    };

    const chartData = nextData?.props?.pageProps?.chartData;

    if (!chartData || !Array.isArray(chartData)) {
      return null;
    }

    // Data jsou již ve správném formátu (camelCase)
    return chartData;
  } catch {
    return null;
  }
}

/**
 * Validuje, že data mají správnou strukturu
 */
function validateDeathsData(data: unknown): data is DeathEvent[] {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  // Kontrola prvního záznamu
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

/**
 * Načte data o Bitcoin obituaries
 * Primárně z bitcoindeaths.com, s fallbackem na statický JSON
 */
const BINANCE_PRICE_API = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";
const FRANKFURTER_API = "https://api.frankfurter.app/latest?base=USD&symbols=CZK";
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=czk,usd&include_market_cap=true";
const BLOCKCHAIN_SUPPLY_API = "https://blockchain.info/q/totalbc";
const FALLBACK_USD_TO_CZK = 23.0;

interface BtcCoinGeckoData {
  priceCzk: number | null;
  marketCapCzk: number | null;
  usdToCzk: number;
}

/**
 * Načte aktuální cenu BTC a kurz USD/CZK.
 * Primárně: Binance (cena BTC/USD) + Frankfurter (kurz USD/CZK).
 * Záloha: CoinGecko (pokud selžou primární zdroje).
 * Market cap: CoinGecko (volitelně, tiché selhání).
 */
export async function getBtcCoinGeckoData(revalidateSeconds = REVALIDATE_SECONDS): Promise<BtcCoinGeckoData> {
  // Primární zdroje: Binance + Frankfurter (spolehlivé, bez rate limitů)
  try {
    const [binanceRes, fxRes] = await Promise.all([
      fetch(BINANCE_PRICE_API, {
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(8_000),
      }),
      fetch(FRANKFURTER_API, {
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(8_000),
      }),
    ]);

    if (!binanceRes.ok) throw new Error(`Binance HTTP ${binanceRes.status}`);
    if (!fxRes.ok) throw new Error(`Frankfurter HTTP ${fxRes.status}`);

    const binanceData = (await binanceRes.json()) as { price?: string };
    const fxData = (await fxRes.json()) as { rates?: { CZK?: number } };

    const priceUsd = binanceData?.price ? parseFloat(binanceData.price) : null;
    if (!priceUsd || isNaN(priceUsd)) throw new Error("Invalid Binance price");

    const usdToCzk = fxData?.rates?.CZK ?? FALLBACK_USD_TO_CZK;
    const priceCzk = priceUsd * usdToCzk;

    // Volitelně spočítá market cap z počtu BTC v oběhu (Blockchain.info)
    let marketCapCzk: number | null = null;
    try {
      const supplyRes = await fetch(BLOCKCHAIN_SUPPLY_API, {
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(5_000),
      });
      if (supplyRes.ok) {
        const satoshis = parseInt(await supplyRes.text(), 10);
        if (!isNaN(satoshis) && satoshis > 0) {
          const circulatingBtc = satoshis / 1e8;
          marketCapCzk = circulatingBtc * priceUsd * usdToCzk;
        }
      }
    } catch {
      // market cap je volitelný, tiché selhání
    }

    console.log(`[deaths-data] BTC: ${Math.round(priceCzk).toLocaleString("cs-CZ")} Kč (USD: ${priceUsd.toFixed(0)}, USD/CZK: ${usdToCzk.toFixed(3)}, marketCap: ${marketCapCzk ? "OK" : "N/A"})`);
    return { priceCzk, marketCapCzk, usdToCzk };

  } catch (primaryError) {
    console.warn(
      "[deaths-data] Primární zdroje selhaly, zkouším CoinGecko:",
      primaryError instanceof Error ? primaryError.message : String(primaryError)
    );

    // Záloha: CoinGecko
    try {
      const response = await fetch(COINGECKO_API, {
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);

      const data = (await response.json()) as {
        bitcoin?: { czk?: number; usd?: number; czk_market_cap?: number };
      };
      const priceCzk = data?.bitcoin?.czk ?? null;
      const priceUsd = data?.bitcoin?.usd ?? null;
      const marketCapCzk = data?.bitcoin?.czk_market_cap ?? null;
      const usdToCzk =
        typeof priceCzk === "number" && typeof priceUsd === "number" && priceUsd > 0
          ? priceCzk / priceUsd
          : FALLBACK_USD_TO_CZK;

      console.log(`[deaths-data] BTC z CoinGecko zálohy: ${priceCzk?.toLocaleString("cs-CZ")} Kč`);
      return { priceCzk, marketCapCzk, usdToCzk };

    } catch (fallbackError) {
      console.warn(
        "[deaths-data] Všechny zdroje selhaly:",
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      );
      return { priceCzk: null, marketCapCzk: null, usdToCzk: FALLBACK_USD_TO_CZK };
    }
  }
}

export async function getDeathsData(revalidateSeconds = REVALIDATE_SECONDS): Promise<DeathsDataResult> {
  try {
    const response = await fetch(BITCOINDEATHS_URL, {
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const deaths = parseChartDataFromHtml(html);

    if (!deaths || !validateDeathsData(deaths)) {
      throw new Error("Invalid data structure");
    }

    console.log(`[deaths-data] Loaded ${deaths.length} obituaries from bitcoindeaths.com`);
    return { deaths: applySourceUrls(applyTranslations(deaths)), source: "live" };
  } catch (error) {
    console.warn(
      "[deaths-data] Failed to fetch from bitcoindeaths.com, using static fallback:",
      error instanceof Error ? error.message : "Unknown error"
    );

    const staticDeaths = staticDeathsData as DeathEvent[];
    return { deaths: applySourceUrls(applyTranslations(staticDeaths)), source: "static" };
  }
}
