import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getDeathsData, getBtcPriceCzk } from "@/lib/deaths-data";
import { formatCzechDate, generateDeathSlug, parseDate } from "@/lib/calculations";
import type { DeathEvent } from "@/lib/calculations";

export const revalidate = 3600;

const USD_TO_CZK = 23.81;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function findDeathBySlug(deaths: DeathEvent[], slug: string): DeathEvent | undefined {
  return deaths.find((death) => generateDeathSlug(death) === slug);
}

function getAdjacentDeaths(
  deaths: DeathEvent[],
  currentDeath: DeathEvent
): { prev: DeathEvent | null; next: DeathEvent | null } {
  const sorted = [...deaths].sort((a, b) => {
    const dateA = parseDate(a.date).getTime();
    const dateB = parseDate(b.date).getTime();
    return dateB - dateA;
  });

  const currentIndex = sorted.findIndex(
    (d) => generateDeathSlug(d) === generateDeathSlug(currentDeath)
  );

  return {
    prev: currentIndex > 0 ? sorted[currentIndex - 1] : null,
    next: currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const { deaths } = await getDeathsData();
  const death = findDeathBySlug(deaths, slug);

  if (!death) {
    return { title: "Nenalezeno" };
  }

  return {
    title: `${death.articleTitle} — Bitcoin je mrtvý`,
    description: death.quote || `${death.person} prohlásil Bitcoin za mrtvý`,
  };
}

export default async function DeathDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [{ deaths }, btcPriceCzk] = await Promise.all([
    getDeathsData(),
    getBtcPriceCzk(),
  ]);

  const death = findDeathBySlug(deaths, slug);

  if (!death) {
    notFound();
  }

  const { prev, next } = getAdjacentDeaths(deaths, death);
  const priceCzk = death.bitcoinPrice * USD_TO_CZK;
  const currentPriceCzk = btcPriceCzk ?? death.bitcoinPrice * USD_TO_CZK;
  const priceChange = ((currentPriceCzk - priceCzk) / priceCzk) * 100;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header deathCount={deaths.length} btcPriceCzk={btcPriceCzk ?? undefined} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <article>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <time className="text-sm text-neutral-400">
              {formatCzechDate(death.date)}
            </time>
            <div className="flex items-center gap-3">
              <span className="rounded bg-[var(--bitcoin-orange)]/10 px-3 py-1 text-sm font-semibold text-[var(--bitcoin-orange)]">
                {priceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
              </span>
            </div>
          </div>

          <h1 className="mb-6 text-2xl font-bold leading-tight text-white sm:text-3xl">
            {death.articleTitle}
          </h1>

          {death.quote && (
            <blockquote className="mb-8 border-l-4 border-[var(--death-red)] bg-[var(--card-bg)] p-6 rounded-r-xl">
              <p className="text-lg italic text-neutral-300 leading-relaxed">
                &ldquo;{death.quote}&rdquo;
              </p>
            </blockquote>
          )}

          <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Autor</p>
                <p className="mt-1 text-white font-medium">{death.person}</p>
                {death.jobTitle && (
                  <p className="text-sm text-neutral-400">{death.jobTitle}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Zdroj</p>
                <p className="mt-1 text-white">{death.publicationName}</p>
              </div>
            </div>

          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-500">
              Vývoj ceny od&nbsp;prohlášení
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-neutral-500">Cena v&nbsp;den prohlášení</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {priceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Aktuální cena</p>
                <p className="mt-1 text-lg font-bold text-[var(--bitcoin-orange)]">
                  {currentPriceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Změna</p>
                <p className={`mt-1 text-lg font-bold ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {priceChange >= 0 ? "+" : ""}{priceChange.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} %
                </p>
              </div>
            </div>
          </div>
        </article>

        <nav className="mt-12 flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/prohlaseni/${generateDeathSlug(prev)}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 transition-all hover:border-[var(--bitcoin-orange)]/40 hover:bg-[var(--card-bg)]/80"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                <path d="M10 12L6 8L10 4" />
              </svg>
              <span className="text-sm font-medium text-white">Novější</span>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/prohlaseni/${generateDeathSlug(next)}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 transition-all hover:border-[var(--bitcoin-orange)]/40 hover:bg-[var(--card-bg)]/80"
            >
              <span className="text-sm font-medium text-white">Starší</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                <path d="M6 12L10 8L6 4" />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </main>

      <footer className="border-t border-[var(--card-border)] py-8 text-center text-sm text-neutral-500">
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
