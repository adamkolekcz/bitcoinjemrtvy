import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Timeline } from "@/components/Timeline";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";

export const revalidate = 3600; // ISR - revalidace každou hodinu

export const metadata: Metadata = {
  title: "Timeline — Bitcoin je mrtvý",
  description: "Chronologický přehled všech prohlášení o smrti Bitcoinu od roku 2010 do současnosti.",
  alternates: {
    canonical: "https://www.bitcoinjemrtvy.cz/prohlaseni",
  },
  openGraph: {
    title: "Timeline — Bitcoin je mrtvý",
    description: "Chronologický přehled všech prohlášení o smrti Bitcoinu od roku 2010 do současnosti.",
    url: "https://www.bitcoinjemrtvy.cz/prohlaseni",
    siteName: "Bitcoin je mrtvý",
  },
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
