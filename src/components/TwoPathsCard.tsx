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
    <>
      <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">
          A co kdybyste těch {formatCurrency(cash.nominal)} místo Bitcoinu uložili pod
          matraci?
        </h3>
        <p className="text-base leading-relaxed text-neutral-300 sm:text-lg">
          Naspořené peníze od roku&nbsp;2010{" "}
          <strong className="text-[var(--death-red)]">
            ztratily {describeLossFraction(Math.abs(cash.lossPct))} kupní síly
          </strong>
          . Ne Bitcoin, ale{" "}
          <strong className="text-neutral-300">koruna pod polštářem pomalu umírá</strong>{" "}
          &mdash; užírá ji inflace.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-300">
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
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-300">
            Pod matrací
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--death-red)] sm:text-3xl">
            &minus;{Math.round(Math.abs(cash.lossPct)).toLocaleString("cs-CZ")}&nbsp;%
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            {formatCurrency(cash.realValue)}
          </p>
        </div>
      </div>
    </>
  );
}
