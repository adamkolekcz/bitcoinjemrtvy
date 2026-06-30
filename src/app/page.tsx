import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BitcoinChartLazy } from "@/components/BitcoinChartLazy";
import { StatsSection } from "@/components/StatsSection";
import { prepareChartData, calculateInvestment, calculateCashCounterfactual, parseDate } from "@/lib/calculations";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";
import inflationCz from "@/data/inflation-cz.json";

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

  const cash = calculateCashCounterfactual(
    deaths,
    INVESTMENT_PER_DEATH_CZK,
    inflationCz.rates
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header deathCount={deaths.length} asPageHeading />

      <main>
        <section className="mx-auto w-full max-w-7xl px-4 pt-8 pb-0 sm:px-6 lg:px-8">
          <BitcoinChartLazy data={chartData} currentPriceUsd={currentBtcPriceUsd} currentPriceCzk={currentBtcPriceCzk} usdToCzk={usdToCzk} />
        </section>

        <StatsSection
          investment={investment}
          cash={cash}
          currentBtcPriceCzk={currentBtcPriceCzk}
          investmentPerDeath={INVESTMENT_PER_DEATH_CZK}
          btcMarketCapCzk={btcMarketCapCzk}
        />
      </main>

      <Footer />
    </div>
  );
}
