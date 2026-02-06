import { Header } from "@/components/Header";
import { Timeline } from "@/components/Timeline";
import { getDeathsData, getBtcPriceCzk } from "@/lib/deaths-data";

export const revalidate = 3600; // ISR - revalidace každou hodinu

export const metadata = {
  title: "Timeline — Bitcoin je mrtvý",
  description: "Chronologický přehled všech prohlášení o\u00A0smrti Bitcoinu od\u00A0roku 2010 do\u00A0současnosti.",
};

export default async function PostsPage() {
  const [{ deaths }, btcPriceCzk] = await Promise.all([
    getDeathsData(),
    getBtcPriceCzk(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header deathCount={deaths.length} btcPriceCzk={btcPriceCzk ?? undefined} />

      <main>
        <Timeline deaths={deaths} />
      </main>

      <footer className="border-t border-[var(--card-border)] py-8 text-center text-sm text-neutral-500">
        <p className="flex items-center justify-center gap-1 flex-wrap">
          Původní verzi{" "}
          <a href="https://bitcoindeaths.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Bitcoinisdead
          </a>{" "}
          přeložil a upravil{" "}
          <a href="https://x.com/adkolek" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Adam Kolek
          </a>
        </p>
      </footer>
    </div>
  );
}
