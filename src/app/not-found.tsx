import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
        <div className="mb-8">
          <span className="text-8xl font-bold text-[var(--bitcoin-orange)]">404</span>
        </div>

        <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
          Tato stránka je mrtvá
        </h2>

        <p className="mb-8 text-neutral-400">
          Na rozdíl od&nbsp;Bitcoinu, tato stránka skutečně neexistuje.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--bitcoin-orange)] px-6 py-3 font-semibold text-black transition-colors hover:bg-[var(--bitcoin-orange)]/80"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 12L6 8L10 4" />
          </svg>
          Zpět na hlavní stránku
        </Link>
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
