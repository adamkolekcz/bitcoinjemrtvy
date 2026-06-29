import {
  formatCurrency,
  describeLossFraction,
  type InvestmentResult,
  type CashCounterfactualResult,
} from "@/lib/calculations";

interface TwoPathsCardProps {
  investment: InvestmentResult;
  cash: CashCounterfactualResult;
}

export function TwoPathsCard({ investment, cash }: TwoPathsCardProps) {
  return (
    <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
      <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">
        A co kdybyste místo Bitcoinu těch {formatCurrency(cash.nominal)} schovávali pod
        polštář?
      </h3>
      <p className="mb-6 text-sm leading-relaxed text-neutral-400 sm:text-base">
        Ležely by tam dál — jenže inflace je každý rok ukrojí.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--bitcoin-orange)]/30 bg-[var(--bitcoin-orange)]/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-300">
            V Bitcoinu
          </p>
          <p className="mt-2 text-2xl font-bold text-green-500 sm:text-3xl">
            +{Math.round(investment.roi).toLocaleString("cs-CZ")}&nbsp;%
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            {formatCurrency(investment.currentValue)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--death-red)]/30 bg-[var(--death-red)]/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-300">
            Pod polštářem
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--death-red)] sm:text-3xl">
            &minus;{Math.round(Math.abs(cash.lossPct)).toLocaleString("cs-CZ")}&nbsp;%
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            kupní síla dnes jen {formatCurrency(cash.realValue)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-neutral-500">
        Koruna v hotovosti od roku&nbsp;2010 ztratila{" "}
        {describeLossFraction(Math.abs(cash.lossPct))} kupní síly. Ne Bitcoin, ale{" "}
        <strong className="text-neutral-300">koruna pod polštářem pomalu umírá</strong>{" "}
        &mdash; užírá ji inflace. Přepočteno přes průměrnou roční inflaci ČSÚ (kupní síla
        v&nbsp;korunách roku&nbsp;{cash.latestYear}).
      </p>
    </div>
  );
}
