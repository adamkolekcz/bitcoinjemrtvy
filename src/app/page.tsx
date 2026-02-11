import { Header } from "@/components/Header";
import { BitcoinChartLazy } from "@/components/BitcoinChartLazy";
import { StatsSection } from "@/components/StatsSection";
import { prepareChartData, calculateInvestment, parseDate } from "@/lib/calculations";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";

export const revalidate = 3600; // ISR - revalidace každou hodinu

const INVESTMENT_PER_DEATH_CZK = 1000;

export default async function Home() {
  const [{ deaths }, coinGeckoData] = await Promise.all([
    getDeathsData(),
    getBtcCoinGeckoData(),
  ]);
  const btcPriceCzk = coinGeckoData.priceCzk;
  const btcMarketCapCzk = coinGeckoData.marketCapCzk;
  const usdToCzk = coinGeckoData.usdToCzk;
  const czkToUsd = 1 / usdToCzk;
  const chartData = prepareChartData(deaths);

  // Fallback na nejnovější záznam pokud CoinGecko selže
  const sortedByDate = [...deaths].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
  );
  const fallbackPriceUsd = sortedByDate[0]?.bitcoinPrice ?? 0;
  const currentBtcPriceCzk = btcPriceCzk ?? fallbackPriceUsd * usdToCzk;
  const currentBtcPriceUsd = btcPriceCzk ? btcPriceCzk * czkToUsd : fallbackPriceUsd;

  const investment = calculateInvestment(
    deaths,
    INVESTMENT_PER_DEATH_CZK,
    currentBtcPriceUsd,
    czkToUsd
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header deathCount={deaths.length} btcPriceCzk={currentBtcPriceCzk} />

      <main>
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <BitcoinChartLazy data={chartData} currentPriceUsd={currentBtcPriceUsd} currentPriceCzk={currentBtcPriceCzk} usdToCzk={usdToCzk} />
        </section>

        <StatsSection
          investment={investment}
          currentBtcPriceCzk={currentBtcPriceCzk}
          investmentPerDeath={INVESTMENT_PER_DEATH_CZK}
          btcMarketCapCzk={btcMarketCapCzk}
        />
      </main>

      <footer className="border-t border-[var(--card-border)] py-8 text-center text-sm text-neutral-400">
        <p className="flex items-center justify-center gap-1 flex-wrap">
          Původní verzi{" "}
          <a href="https://bitcoindeaths.com" target="_blank" rel="noopener noreferrer" className="">
            Bitcoinisdead
          </a>{" "}
          přeložil a upravil{" "}
          <a href="https://x.com/adkolek" target="_blank" rel="noopener noreferrer" className="">
            Adam Kolek
          </a>
        </p>
      </footer>
    </div>
  );
}
