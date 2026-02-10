import Link from "next/link";

interface HeaderProps {
  deathCount?: number;
  btcPriceCzk?: number;
}

export function Header({ deathCount, btcPriceCzk }: HeaderProps) {
  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        {/* Mobile: title + death count on same row */}
        <div className="flex items-center justify-between sm:hidden">
          <Link href="/" className="group">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-[var(--bitcoin-orange)] transition-colors group-hover:text-[var(--bitcoin-orange)]/80">
                Bitcoin
              </span>{" "}
              je mrtvý
            </h1>
          </Link>

          {deathCount !== undefined && (
            <Link
              href="/prohlaseni"
              className="flex items-center gap-1.5 rounded-lg bg-[var(--death-red)]/10 px-3 py-1 border border-[var(--death-red)]/20 transition-colors hover:bg-[var(--death-red)]/20 hover:border-[var(--death-red)]/40"
            >
              <span className="text-sm font-bold text-[var(--death-red)]">
                {deathCount}&times;
              </span>
              <span className="text-xs text-[var(--death-red)]">
                prohlášen za&nbsp;mrtvý
              </span>
            </Link>
          )}
        </div>
        <p className="mt-1.5 text-xs text-neutral-300 sm:hidden">
          Sledujeme každé prohlášení o&nbsp;úmrtí Bitcoinu již od&nbsp;roku 2010
        </p>

        {/* Desktop: full layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="group">
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-[var(--bitcoin-orange)] transition-colors group-hover:text-[var(--bitcoin-orange)]/80">
                  Bitcoin
                </span>{" "}
                je mrtvý
              </h1>
            </Link>
            <p className="mt-1 text-sm text-neutral-300 whitespace-nowrap">
              Sledujeme každé prohlášení o&nbsp;úmrtí Bitcoinu již od&nbsp;roku 2010
            </p>
          </div>

          {(deathCount !== undefined || btcPriceCzk) && (
            <div className="flex items-center gap-3">
              {btcPriceCzk && (
                <div className="hidden lg:flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 border border-green-500/20">
                  <span className="text-3xl font-bold text-green-500">
                    {btcPriceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-sm text-green-500">
                    Kč<br />za BTC
                  </span>
                </div>
              )}

              {deathCount !== undefined && (
                <Link
                  href="/prohlaseni"
                  className="flex items-center gap-2 rounded-lg bg-[var(--death-red)]/10 px-4 py-2 border border-[var(--death-red)]/20 transition-colors hover:bg-[var(--death-red)]/20 hover:border-[var(--death-red)]/40"
                >
                  <span className="text-3xl font-bold text-[var(--death-red)]">
                    {deathCount}&times;
                  </span>
                  <span className="text-sm text-[var(--death-red)]">
                    prohlášen<br />za mrtvý
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
