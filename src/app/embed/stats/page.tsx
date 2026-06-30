import type { Metadata } from "next";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";
import { calculateInvestment, parseDate } from "@/lib/calculations";
import { StatsWidget } from "@/components/embed/StatsWidget";

export const revalidate = 3600;

const INVESTMENT_PER_DEATH_CZK = 500;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StatsEmbed() {
  const [{ deaths }, coinGeckoData] = await Promise.all([
    getDeathsData(),
    getBtcCoinGeckoData(3600, false),
  ]);

  const usdToCzk = coinGeckoData.usdToCzk;
  const czkToUsd = 1 / usdToCzk;
  const btcPriceCzk = coinGeckoData.priceCzk;
  const sortedByDate = [...deaths].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime(),
  );
  const fallbackPriceUsd = sortedByDate[0]?.bitcoinPrice ?? 0;
  const currentBtcPriceUsd = btcPriceCzk ? btcPriceCzk * czkToUsd : fallbackPriceUsd;

  const investment = calculateInvestment(deaths, INVESTMENT_PER_DEATH_CZK, currentBtcPriceUsd, czkToUsd);
  const updated = new Date().toLocaleDateString("cs-CZ");

  return (
    <StatsWidget
      count={deaths.length}
      currentValue={investment.currentValue}
      roi={investment.roi}
      perDeposit={INVESTMENT_PER_DEATH_CZK}
      updated={updated}
    />
  );
}
