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
      <Header deathCount={deaths.length} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <article>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <time
              dateTime={parseDate(death.date).toISOString().split("T")[0]}
              className="text-sm text-neutral-300"
            >
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
                <p className="mt-1 text-lg font-bold text-[var(--bitcoin-orange)]">
                  {priceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Aktuální cena</p>
                <p className={`mt-1 text-lg font-bold ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
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
          {next ? (
            <Link
              href={`/prohlaseni/${generateDeathSlug(next)}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 transition-all hover:border-[var(--bitcoin-orange)]/40 hover:bg-[var(--card-bg)]/80"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300">
                <path d="M10 12L6 8L10 4" />
              </svg>
              <span className="text-sm font-medium text-white">Starší</span>
            </Link>
          ) : (
            <div />
          )}

          {prev ? (
            <Link
              href={`/prohlaseni/${generateDeathSlug(prev)}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 transition-all hover:border-[var(--bitcoin-orange)]/40 hover:bg-[var(--card-bg)]/80"
            >
              <span className="text-sm font-medium text-white">Novější</span>
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
            href="https://invity.onelink.me/OfI3/c1u1hmh3"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Invity - koupit Bitcoin"
            className="block rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 transition-colors hover:border-[var(--bitcoin-orange)]/50"
          >
            <h3 className="mb-6 text-center text-lg font-bold text-white">
              Kde koupit bitcoin?
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <svg width="128" height="41" viewBox="68 62 362 116" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M347.804 150.693H356.493V138.447H350.077C348.354 138.447 346.74 137.787 345.531 136.614C344.321 135.441 343.661 133.864 343.661 132.214V96.7223H356.53V84.4762H343.661V65.9971H328.665V84.4762H320.855V96.7223H328.665V132.214C328.665 137.127 330.681 141.82 334.274 145.267C337.868 148.75 342.707 150.693 347.804 150.693ZM385.129 159.529C384.249 162.059 381.792 163.746 379.043 163.746H372.223V175.992H379.299C387.256 175.955 394.369 171.152 397.118 163.929C402.17 150.716 407.23 137.493 412.29 124.27L412.306 124.229C417.378 110.975 422.45 97.7211 427.514 84.4762H411.674L410.61 87.4811L409.485 90.6543L408.755 92.7129L408.614 93.1131L408.52 93.378L408.457 93.5549L408.452 93.5686C404.358 105.119 400.268 116.657 396.202 128.217C395.688 126.767 395.174 125.317 394.661 123.868L393.049 119.323L392.986 119.145C388.89 107.587 384.798 96.0433 380.729 84.4762H364.89C368.943 95.0762 372.996 105.667 377.049 116.258L377.059 116.284C381.105 126.859 385.152 137.433 389.199 148.017C388.521 149.939 387.844 151.853 387.166 153.766L387.163 153.776C386.485 155.691 385.807 157.605 385.129 159.529ZM180.685 100.279C178.228 102.406 176.725 105.339 176.725 108.565H176.798V150.693H161.802V84.4765H176.798V88.8029C184.461 83.0465 194.838 82.0933 203.49 86.3464C207.707 88.4363 211.263 91.6262 213.72 95.5493C216.177 99.4725 217.46 103.982 217.46 108.565V150.693H202.464V108.565C202.464 105.339 200.961 102.369 198.504 100.279C196.047 98.1892 192.858 97.0892 189.594 97.0892C186.331 97.0892 183.141 98.1892 180.685 100.279ZM254.456 128.217L269.965 84.4762H285.768L260.432 150.693H248.479L223.144 84.4762H238.983L254.456 128.217ZM295.41 84.4762H310.406V150.693H295.41V84.4762ZM115.275 111.426H99.7653V96.4284H87.9225V111.426H72.4136V122.902H87.9225V137.897H99.7653V122.902H115.275V111.426ZM120.995 96.0256V84.4761H145.267V150.693H130.271V96.0256H120.995Z" fill="url(#invity-gradient-slug)"/>
                <defs>
                  <linearGradient id="invity-gradient-slug" x1="375.773" y1="95.9684" x2="152.193" y2="204.387" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#374FFF"/>
                    <stop offset="1" stopColor="#8939FF"/>
                  </linearGradient>
                </defs>
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
