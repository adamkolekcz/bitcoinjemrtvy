import type {
  InvestmentResult,
  CashCounterfactualResult,
} from "@/lib/calculations";
import { BitcoinAgeCounter } from "@/components/BitcoinAgeCounter";
import { StatCard } from "@/components/StatCard";
import { InvestmentCalculator } from "@/components/InvestmentCalculator";
import { PartnerCards } from "@/components/PartnerCards";

function formatMarketCapWords(value: number, short = false): string {
  value = Math.round(value);
  const bilion = 1_000_000_000_000;
  const miliarda = 1_000_000_000;
  const milion = 1_000_000;
  const tisic = 1_000;

  if (value >= bilion) {
    const biliony = Math.floor(value / bilion);
    const miliardy = Math.floor((value % bilion) / miliarda);
    const miliony = Math.floor((value % miliarda) / milion);
    if (short) return `${biliony} bilionů ${miliardy} miliard ${miliony} milionů korun`;
    const tisice = Math.floor((value % milion) / tisic);
    const koruny = Math.floor(value % tisic);
    return `${biliony} bilionů ${miliardy} miliard ${miliony} milionů ${tisice} tisíc ${koruny} korun`;
  }
  if (value >= miliarda) {
    const n = Math.floor(value / miliarda);
    const miliony = Math.floor((value % miliarda) / milion);
    if (short) return `${n} miliard ${miliony} milionů korun`;
    const tisice = Math.floor((value % milion) / tisic);
    const koruny = Math.floor(value % tisic);
    return `${n} miliard ${miliony} milionů ${tisice} tisíc ${koruny} korun`;
  }
  return `${Math.round(value).toLocaleString("cs-CZ")} Kč`;
}

interface StatsSectionProps {
  investment: InvestmentResult;
  cash: CashCounterfactualResult;
  currentBtcPriceCzk: number;
  investmentPerDeath: number;
  btcMarketCapCzk: number | null;
}

export function StatsSection({
  investment,
  cash,
  currentBtcPriceCzk,
  investmentPerDeath,
  btcMarketCapCzk,
}: StatsSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <InvestmentCalculator
        investment={investment}
        cash={cash}
        baseAmount={investmentPerDeath}
        currentBtcPriceCzk={currentBtcPriceCzk}
      />

      <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8">
        <h3 className="mb-4 text-xl font-bold text-white sm:text-2xl">
          Je Bitcoin mrtvý?
        </h3>
        <p className="text-base leading-relaxed text-neutral-300 sm:text-lg">
          <strong className="text-white">Ne</strong>, Bitcoin není mrtvý. Bitcoin byl od roku 2010 prohlášen médii za mrtvý více než{" "}
          <strong className="text-[var(--death-red)]">{investment.numberOfDeaths}&times;</strong>, přesto však nadále funguje 24&nbsp;hodin denně, 7&nbsp;dní v&nbsp;týdnu. Nepřetržitě zpracovává transakce. Bitcoin neumírá. Naopak,{" "}
          <strong className="text-green-500">vzkvétá</strong>.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <BitcoinAgeCounter />

          <StatCard
            label={<>Hodnota všech bitcoinů v&nbsp;oběhu</>}
            value={btcMarketCapCzk !== null
              ? `${Math.round(btcMarketCapCzk).toLocaleString("cs-CZ")} Kč`
              : "—"}
            sublabel={
              btcMarketCapCzk !== null ? (
                <>
                  <span className="sm:hidden">
                    {formatMarketCapWords(btcMarketCapCzk, true)}
                  </span>
                  <span className="hidden sm:inline">
                    {formatMarketCapWords(btcMarketCapCzk)}
                  </span>
                </>
              ) : (
                ""
              )
            }
            green
            compact
          />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8">
        <h3 className="mb-6 flex flex-col items-center justify-center gap-2 text-xl font-bold text-white sm:flex-row sm:gap-3 sm:text-2xl">
          <span>Aktuální stav:</span>
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-3 w-3" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75 motion-reduce:animate-none"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
            </span>
            <span className="text-green-500">Živý a aktivní</span>
          </span>
        </h3>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-3xl">⚡</div>
            <p className="mb-2 font-semibold text-white">Běží nepřetržitě</p>
            <p className="text-base text-neutral-300">Bitcoin funguje bez výpadku 24/7</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl">🌐</div>
            <p className="mb-2 font-semibold text-white">Globální decentralizovaná síť</p>
            <p className="text-base text-neutral-300">Neovládá ji žádná společnost ani stát</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl">📈</div>
            <p className="mb-2 font-semibold text-white">Aktivní vývoj</p>
            <p className="text-base text-neutral-300">Bezpečnost i&nbsp;možnosti se stále zlepšují</p>
          </div>
        </div>

      </div>

      <PartnerCards headingClassName="text-xl sm:text-2xl" />
    </section>
  );
}
