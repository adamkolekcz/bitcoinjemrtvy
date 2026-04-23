import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";
import { formatCzechDate, generateDeathSlug, parseDate } from "@/lib/calculations";
import type { DeathEvent } from "@/lib/calculations";

export const revalidate = 86400; // ISR - revalidace jednou za 24 hodin (historická data se mění zřídka)

export async function generateStaticParams() {
  const { deaths } = await getDeathsData();
  return deaths.map((death) => ({
    slug: generateDeathSlug(death),
  }));
}

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
  const { deaths } = await getDeathsData(86400);
  const death = findDeathBySlug(deaths, slug);

  if (!death) {
    return { title: "Nenalezeno" };
  }

  const url = `https://www.bitcoinjemrtvy.cz/prohlaseni/${slug}`;

  return {
    title: `${death.articleTitle_cs ?? death.articleTitle} — Bitcoin je mrtvý`,
    description: death.quote_cs ?? death.quote ?? `${death.person} prohlásil Bitcoin za mrtvý`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${death.articleTitle_cs ?? death.articleTitle} — Bitcoin je mrtvý`,
      description: death.quote_cs ?? death.quote ?? `${death.person} prohlásil Bitcoin za mrtvý`,
      url,
      siteName: "Bitcoin je mrtvý",
      type: "article",
    },
  };
}

export default async function DeathDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [{ deaths }, coinGeckoData] = await Promise.all([
    getDeathsData(86400),
    getBtcCoinGeckoData(86400, false),
  ]);
  const btcPriceCzk = coinGeckoData.priceCzk;
  const usdToCzk = coinGeckoData.usdToCzk;

  const death = findDeathBySlug(deaths, slug);

  if (!death) {
    notFound();
  }

  const { prev, next } = getAdjacentDeaths(deaths, death);
  const priceCzk = death.bitcoinPrice * usdToCzk;
  const currentPriceCzk = btcPriceCzk ?? death.bitcoinPrice * usdToCzk;
  const priceChange = ((currentPriceCzk - priceCzk) / priceCzk) * 100;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": death.articleTitle,
    "author": { "@type": "Person", "name": death.person },
    "publisher": { "@type": "Organization", "name": death.publicationName },
    "datePublished": parseDate(death.date).toISOString().split("T")[0],
    "url": `https://www.bitcoinjemrtvy.cz/prohlaseni/${slug}`,
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header deathCount={deaths.length} btcPriceCzk={btcPriceCzk ?? undefined} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <article>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <time className="text-sm text-neutral-300">
              {formatCzechDate(death.date)}
            </time>
            <div className="flex items-center gap-3">
              <span className="rounded bg-[var(--bitcoin-orange)]/10 px-3 py-1 text-sm font-semibold text-[var(--bitcoin-orange)]">
                {priceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
              </span>
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
            {death.articleTitle_cs ?? death.articleTitle}
          </h1>
          {death.articleTitle_cs && (
            <p className="mb-6 text-sm text-neutral-500 italic">{death.articleTitle}</p>
          )}
          {!death.articleTitle_cs && <div className="mb-6" />}

          {death.quote && (
            <blockquote className="mb-8 border-l-4 border-[var(--death-red)] bg-[var(--card-bg)] p-6 rounded-r-xl">
              <p className="text-lg italic text-neutral-300 leading-relaxed">
                &ldquo;{death.quote_cs ?? death.quote}&rdquo;
              </p>
              {death.quote_cs && (
                <p className="mt-3 text-sm italic text-neutral-500">
                  &ldquo;{death.quote}&rdquo;
                </p>
              )}
            </blockquote>
          )}

          <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Autor</p>
                <p className="mt-1 text-white font-medium">{death.person}</p>
                {death.jobTitle && (
                  <p className="text-sm text-neutral-300">{death.jobTitle}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Zdroj</p>
                {death.sourceUrl ? (
                  <a
                    href={death.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-white underline underline-offset-2 hover:text-[var(--bitcoin-orange)] transition-colors"
                  >
                    {death.publicationName}
                  </a>
                ) : (
                  <p className="mt-1 text-white">{death.publicationName}</p>
                )}
              </div>
            </div>

          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-400">
              Vývoj ceny od&nbsp;prohlášení
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-neutral-400">Cena v&nbsp;den prohlášení</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {priceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Aktuální cena</p>
                <p className="mt-1 text-lg font-bold text-[var(--bitcoin-orange)]">
                  {currentPriceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Změna</p>
                <p className={`mt-1 text-lg font-bold ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {priceChange >= 0 ? "+" : ""}{priceChange.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} %
                </p>
              </div>
            </div>
          </div>
        </article>

        <nav aria-label="Navigace mezi prohlášeními" className="mt-12 flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/prohlaseni/${generateDeathSlug(prev)}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 transition-all hover:border-[var(--bitcoin-orange)]/40 hover:bg-[var(--card-bg)]/80"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300">
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
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300">
                <path d="M6 12L10 8L6 4" />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </nav>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <a
            href="https://www.anycoin.cz/?ref=gj8cyz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Anycoin - koupit Bitcoin"
            className="block rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 transition-colors hover:border-[var(--bitcoin-orange)]/50"
          >
            <h3 className="mb-6 text-center text-lg font-bold text-white">
              Kde koupit bitcoin?
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-8">
                <svg width="197.6" height="52" viewBox="0 0 190 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#00bbe0" d="M23.932 0C10.769 0 0 10.71 0 23.802c0 13.09 10.77 23.801 23.932 23.801 13.163 0 23.932-10.71 23.932-23.801C47.864 10.71 37.094 0 23.932 0Zm0 43.942c-11.138 0-20.25-9.063-20.25-20.14s9.112-20.14 20.25-20.14 20.25 9.063 20.25 20.14-9.112 20.14-20.25 20.14Z"/>
                  <path fill="#00bbe0" d="m23.489 17.94-.66 4.043c1.15.186 4.716 1.035 5.09-1.252.389-2.386-3.28-2.605-4.43-2.79ZM22.496 24.024l-.727 4.458c1.38.221 5.662 1.206 6.07-1.308.429-2.623-3.962-2.927-5.343-3.15Z"/>
                  <path fill="#00bbe0" d="M23.932 7.007c-9.326 0-16.887 7.52-16.887 16.795 0 9.276 7.56 16.795 16.887 16.795 9.326 0 16.887-7.52 16.887-16.795 0-9.276-7.56-16.795-16.887-16.795Zm7.866 21.214c-.82 3.15-3.355 3.62-6.81 3.263l-.548 3.358-2.036-.328.541-3.313a76.882 76.882 0 0 1-1.624-.278l-.543 3.329-2.033-.329.548-3.364c-.476-.08-.96-.167-1.453-.247l-2.65-.427.8-2.353s1.502.266 1.48.239c.576.092.796-.295.874-.547l1.487-9.113c-.011-.424-.202-.943-1.027-1.077.03-.023-1.478-.237-1.478-.237l.352-2.163 2.808.454-.001.01c.422.068.856.13 1.298.192l.543-3.325 2.035.328-.532 3.26c.545.077 1.094.155 1.63.241l.528-3.239 2.036.329-.543 3.326c2.59.653 4.541 1.793 4.382 4.229-.114 1.783-1.024 2.717-2.302 3.124 1.868.778 2.898 2.123 2.238 4.658Z"/>
                  <path fill="#ffffff" d="m68.23 26.122-2.503-7.136-2.504 7.136h5.008ZM63.91 14.024h3.935l7.31 19.476h-4.158l-1.571-4.123h-7.418L60.459 33.5h-3.86l7.31-19.476ZM78.93 14.024h3.739l8.933 12.96v-12.96h3.926V33.5h-3.74l-8.932-12.96V33.5H78.93V14.024ZM106.707 26.025l-7.45-12h4.606l4.877 8.026 4.578-8.027h4.215l-6.891 12V33.5h-3.935v-7.475ZM119.35 23.9v-.556c0-6.765 3.889-9.645 8.719-9.645 4.364 0 7.828 2.068 8.159 6.631h-4.103c-.438-2.277-1.935-3.32-4.056-3.32-2.373 0-4.616 1.572-4.616 6.334v.556c0 5.018 2.406 6.613 4.616 6.613 2.256 0 3.744-1.187 4.056-3.32h4.103c-.401 4.799-3.749 6.63-8.159 6.63-4.994 0-8.719-2.837-8.719-9.922ZM154.13 23.9v-.556c0-4.655-2.406-6.334-5.035-6.334-2.63 0-5.036 1.679-5.036 6.334v.556c0 4.962 2.406 6.613 5.036 6.613 2.629 0 5.035-1.651 5.035-6.613Zm-14.173 0v-.556c0-6.77 4.312-9.645 9.138-9.645 4.825 0 9.138 2.875 9.138 9.645v.556c0 7.072-4.313 9.924-9.138 9.924-4.826 0-9.138-2.852-9.138-9.923ZM167.342 14.024h-3.935V33.5h3.935V14.024ZM173.402 14.024h3.739l8.933 12.96v-12.96H190V33.5h-3.739l-8.933-12.96V33.5h-3.926V14.024Z"/>
                </svg>
            </div>
          </a>

          <a
            href="https://affil.trezor.io/SH10i"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Trezor - hardwarová peněženka pro Bitcoin"
            className="block rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 transition-colors hover:border-[var(--bitcoin-orange)]/50"
          >
            <h3 className="mb-6 text-center text-lg font-bold text-white">
              Jak bezpečně uchovat bitcoin?
            </h3>
            <div className="flex flex-wrap items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 161.768 40.771" fill="none" width="162" height="41">
                  <path fill="#ffffff" d="M24.306 9.461C24.306 4.29 19.761 0 14.228 0 8.694 0 4.148 4.292 4.148 9.46v3.025H0v21.75l14.225 6.536 14.233-6.534V12.581H24.31l-.003-3.121Zm-15.02 0c0-2.438 2.175-4.389 4.942-4.389 2.767 0 4.94 1.951 4.94 4.389v3.024H9.287V9.461Zm13.44 21.264-8.502 3.904-8.499-3.901V17.655h17v13.07z" />
                  <path fill="#ffffff" d="M40.019 12.485h17.886v5.17h-6.127v16.678h-5.731V17.655h-6.028ZM78.46 19.8c0-4.39-3.064-7.218-7.609-7.218H60.474v21.75h5.732v-7.314h2.174l4.051 7.314h6.627l-4.842-8.094c2.07-.78 4.244-2.83 4.244-6.438zm-8.296 2.146h-3.958v-4.39h3.953c1.482 0 2.47.879 2.47 2.147 0 1.365-.988 2.243-2.47 2.243zm10.963-9.461h16.009v5.072H86.858v3.219h9.982v4.974h-9.982v3.51h10.278v5.073H81.127Zm48.125-.294c-6.719 0-11.46 4.78-11.46 11.218 0 6.437 4.839 11.22 11.46 11.22s11.562-4.779 11.562-11.217c0-6.438-4.842-11.22-11.562-11.22zm0 17.363c-3.359 0-5.633-2.536-5.633-6.14 0-3.707 2.274-6.142 5.633-6.142 3.36 0 5.732 2.537 5.732 6.141 0 3.605-2.372 6.14-5.732 6.14zm27.67-3.316c2.074-.78 4.25-2.83 4.25-6.438 0-4.39-3.064-7.218-7.61-7.218h-10.375v21.75h5.731v-7.314h2.178l4.051 7.314h6.621zm-4.052-4.292h-3.952v-4.39h3.952c1.484 0 2.471.879 2.471 2.147 0 1.365-.987 2.243-2.471 2.243zm-52.967-9.461h16.898v4.389l-9.19 12.29h9.19v5.169H99.903v-4.39l9.19-12.288h-9.19z" />
                </svg>
            </div>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
