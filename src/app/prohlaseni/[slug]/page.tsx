import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PartnerCards } from "@/components/PartnerCards";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";
import { formatCzechDate, generateDeathSlug, parseDate, buildDeathMetaDescription, buildPageTitle } from "@/lib/calculations";
import type { DeathEvent } from "@/lib/calculations";
import { SITE_NAME, SITE_URL, buildSocialMeta, serializeJsonLd } from "@/lib/metadata";

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { deaths } = await getDeathsData(86400);
  const death = findDeathBySlug(deaths, slug);

  if (!death) {
    return { title: "Nenalezeno", robots: { index: false } };
  }

  const url = `${SITE_URL}/prohlaseni/${slug}`;
  const description = buildDeathMetaDescription(death);

  const fullTitle = `${death.articleTitle_cs ?? death.articleTitle} — Bitcoin je mrtvý`;

  return {
    title: buildPageTitle(death.articleTitle_cs ?? death.articleTitle),
    description,
    alternates: {
      canonical: url,
    },
    ...buildSocialMeta({ title: fullTitle, description, url, type: "article" }),
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
  // Bez aktuální ceny (výpadek všech API) změnu neukazujeme — dřív se dosadila cena
  // z data prohlášení a stránka 24 h tvrdila „Změna +0 %“.
  const priceChange = btcPriceCzk === null ? null : ((btcPriceCzk - priceCzk) / priceCzk) * 100;
  const changeColor =
    priceChange === null ? "text-neutral-300" : priceChange >= 0 ? "text-green-500" : "text-[var(--death-red)]";
  const isoDate = parseDate(death.date).toISOString().split("T")[0];
  const url = `${SITE_URL}/prohlaseni/${slug}`;

  // Stránka je náš český záznam o cizím článku → WebPage, původní článek jako citation.
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": death.articleTitle_cs ?? death.articleTitle,
    "url": url,
    "inLanguage": "cs",
    "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": SITE_URL },
    "citation": {
      "@type": "NewsArticle",
      "headline": death.articleTitle,
      "inLanguage": "en",
      "datePublished": isoDate,
      "author": { "@type": "Person", "name": death.person },
      "publisher": { "@type": "Organization", "name": death.publicationName },
      ...(death.sourceUrl ? { "url": death.sourceUrl } : {}),
    },
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header deathCount={deaths.length} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <article>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <time
              dateTime={isoDate}
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
            <p className="mb-6 text-sm text-neutral-400 italic">{death.articleTitle}</p>
          )}
          {!death.articleTitle_cs && <div className="mb-6" />}

          {death.quote && (
            <blockquote className="mb-8 border-l-4 border-[var(--death-red)] bg-[var(--card-bg)] p-6 rounded-r-xl">
              <p className="text-lg italic text-white leading-relaxed">
                {death.quote_cs ? (
                  <>&bdquo;{death.quote_cs}&ldquo;</>
                ) : (
                  <>&ldquo;{death.quote}&rdquo;</>
                )}
              </p>
              {death.quote_cs && (
                <p className="mt-3 text-sm italic text-neutral-400">
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
                <p className={`mt-1 text-lg font-bold ${changeColor}`}>
                  {btcPriceCzk === null
                    ? "Nedostupná"
                    : `${btcPriceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Změna</p>
                <p className={`mt-1 text-lg font-bold ${changeColor}`}>
                  {priceChange === null
                    ? "—"
                    : `${priceChange >= 0 ? "+" : ""}${priceChange.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} %`}
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

        <PartnerCards headingClassName="text-lg" />
      </main>

      <Footer />
    </div>
  );
}
