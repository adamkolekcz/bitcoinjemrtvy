import type { DeathEvent } from "./calculations";
import staticDeathsData from "@/data/deaths.json";

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
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=czk";

/**
 * Načte aktuální cenu BTC v CZK z CoinGecko API
 */
export async function getBtcPriceCzk(): Promise<number | null> {
  try {
    const response = await fetch(COINGECKO_API, {
      next: { revalidate: 300 }, // 5 minut cache
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as { bitcoin?: { czk?: number } };
    const price = data?.bitcoin?.czk;

    if (typeof price !== "number") {
      throw new Error("Invalid price data");
    }

    console.log(`[deaths-data] BTC price from CoinGecko: ${price.toLocaleString("cs-CZ")} Kč`);
    return price;
  } catch (error) {
    console.warn(
      "[deaths-data] Failed to fetch BTC price from CoinGecko:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

export async function getDeathsData(): Promise<DeathsDataResult> {
  try {
    const response = await fetch(BITCOINDEATHS_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
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
    return { deaths, source: "live" };
  } catch (error) {
    console.warn(
      "[deaths-data] Failed to fetch from bitcoindeaths.com, using static fallback:",
      error instanceof Error ? error.message : "Unknown error"
    );

    const staticDeaths = staticDeathsData as DeathEvent[];
    return { deaths: staticDeaths, source: "static" };
  }
}
