import Link from "next/link";

interface HeaderProps {
  deathCount: number;
  btcPriceCzk?: number;
}

export function Header({ deathCount, btcPriceCzk }: HeaderProps) {
  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="group">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="text-[var(--bitcoin-orange)] transition-colors group-hover:text-[var(--bitcoin-orange)]/80">
                  Bitcoin
                </span>{" "}
                je mrtvý
              </h1>
            </Link>
            <p className="mt-1 text-sm text-neutral-400">
              Sledujeme každé prohlášení o&nbsp;úmrtí Bitcoinu již od&nbsp;roku 2010
            </p>
          </div>

          <div className="flex items-center gap-3">
            {btcPriceCzk && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 border border-green-500/20">
                <span className="text-2xl font-bold text-green-500 sm:text-3xl">
                  {btcPriceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })}
                </span>
                <span className="text-sm text-green-500">
                  Kč<br />za BTC
                </span>
              </div>
            )}

            <Link
              href="/prohlaseni"
              className="flex items-center gap-2 rounded-lg bg-[var(--death-red)]/10 px-4 py-2 border border-[var(--death-red)]/20 transition-colors hover:bg-[var(--death-red)]/20 hover:border-[var(--death-red)]/40"
            >
              <span className="text-2xl font-bold text-[var(--death-red)] sm:text-3xl">
                {deathCount}&times;
              </span>
              <span className="text-sm text-[var(--death-red)]">
                prohlášen<br />za mrtvý
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
