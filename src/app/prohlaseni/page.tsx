import { Header } from "@/components/Header";
import { Timeline } from "@/components/Timeline";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";

export const revalidate = 3600; // ISR - revalidace každou hodinu

export const metadata = {
  title: "Timeline — Bitcoin je mrtvý",
  description: "Chronologický přehled všech prohlášení o smrti Bitcoinu od roku 2010 do současnosti.",
};

export default async function PostsPage() {
  const [{ deaths }, coinGeckoData] = await Promise.all([
    getDeathsData(),
    getBtcCoinGeckoData(),
  ]);
  const btcPriceCzk = coinGeckoData.priceCzk;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header deathCount={deaths.length} btcPriceCzk={btcPriceCzk ?? undefined} />

      <main>
        <Timeline deaths={deaths} usdToCzk={coinGeckoData.usdToCzk} />
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
