import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Timeline } from "@/components/Timeline";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";
import { buildSocialMeta } from "@/lib/metadata";

export const revalidate = 3600; // ISR - revalidace každou hodinu

const LISTING_URL = "https://www.bitcoinjemrtvy.cz/prohlaseni";
const LISTING_DESC =
  "Kompletní chronologický přehled všech více než 470 mediálních prohlášení o smrti Bitcoinu od roku 2010 až do současnosti — s citací, autorem a cenou BTC v den prohlášení.";

export const metadata: Metadata = {
  title: "Timeline — Bitcoin je mrtvý",
  description: LISTING_DESC,
  alternates: { canonical: LISTING_URL },
  ...buildSocialMeta({ title: "Timeline — Bitcoin je mrtvý", description: LISTING_DESC, url: LISTING_URL }),
};

export default async function PostsPage() {
  const [{ deaths }, coinGeckoData] = await Promise.all([
    getDeathsData(),
    getBtcCoinGeckoData(3600, false),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header deathCount={deaths.length} />

      <main>
        <Timeline deaths={deaths} usdToCzk={coinGeckoData.usdToCzk} />
      </main>

      <Footer />
    </div>
  );
}
