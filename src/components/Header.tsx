import Link from "next/link";
import { getBitcoinAgeYears } from "@/lib/calculations";

interface HeaderProps {
  deathCount?: number;
  /** Když je logo primárním nadpisem stránky (homepage), vykreslí se jako <h1>; jinak je to jen branding (<span>). */
  asPageHeading?: boolean;
}

export function Header({ deathCount, asPageHeading = false }: HeaderProps) {
  const years = getBitcoinAgeYears();
  return (
    <header className="bg-[var(--background)]">
      {/* Jediný <h1> stránky (sr-only): logo se responzivně vykresluje dvakrát
          (mobil + desktop), takže jako <h1> by vzniklo dvakrát → Bing hlásí
          „more than one h1". Nadpis je proto tady, viditelná loga jsou <span>. */}
      {asPageHeading && <h1 className="sr-only">Bitcoin je mrtvý</h1>}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        {/* Mobile: title + death count on same row */}
        <div className="flex items-center justify-between sm:hidden">
          <Link href="/" tabIndex={-1}>
            <span className="block text-2xl font-bold tracking-tight">
              <span className="text-[var(--bitcoin-orange)]">
                Bitcoin
              </span>{" "}
              je mrtvý
            </span>
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
        <p className="mt-1.5 text-sm text-neutral-300 sm:hidden">
          Již {years}&nbsp;let sledujeme, jak Bitcoin umírá
        </p>

        {/* Desktop: full layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div>
            <Link href="/" tabIndex={-1}>
              <span className="block text-3xl font-bold tracking-tight">
                <span className="text-[var(--bitcoin-orange)]">
                  Bitcoin
                </span>{" "}
                je mrtvý
              </span>
            </Link>
            <p className="mt-1 text-base text-neutral-300 whitespace-nowrap">
              Již {years}&nbsp;let sledujeme, jak Bitcoin umírá
            </p>
          </div>

          {deathCount !== undefined && (
            <div className="flex items-center gap-3">
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
