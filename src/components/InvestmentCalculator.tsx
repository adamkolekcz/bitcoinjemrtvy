"use client";

import { useState } from "react";
import {
  formatCurrency,
  scaleInvestmentResult,
  scaleCashResult,
  type InvestmentResult,
  type CashCounterfactualResult,
} from "@/lib/calculations";
import { StatCard } from "@/components/StatCard";
import { TwoPathsCard } from "@/components/TwoPathsCard";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 9999;

interface InvestmentCalculatorProps {
  /** Výsledek investice spočítaný serverem při `baseAmount` Kč. */
  investment: InvestmentResult;
  /** Cash counterfactual spočítaný serverem při `baseAmount` Kč. */
  cash: CashCounterfactualResult;
  /** Částka, při které byly base hodnoty spočítány serverem (INVESTMENT_PER_DEATH_CZK). */
  baseAmount: number;
  currentBtcPriceCzk: number;
}

export function InvestmentCalculator({
  investment,
  cash,
  baseAmount,
  currentBtcPriceCzk,
}: InvestmentCalculatorProps) {
  const [amount, setAmount] = useState(baseAmount);
  const [inputValue, setInputValue] = useState(String(baseAmount));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Jen číslice, max 4 (9999). Při platném vstupu (≥1) přepočítej hned.
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setInputValue(digits);
    const n = Number.parseInt(digits, 10);
    if (!Number.isNaN(n) && n >= MIN_AMOUNT) {
      setAmount(Math.min(n, MAX_AMOUNT));
    }
  }

  function handleBlur() {
    // Po opuštění pole ořež na 1–9999; prázdné/nevalidní → poslední platná částka.
    const n = Number.parseInt(inputValue, 10);
    const clamped = Number.isNaN(n)
      ? amount
      : Math.min(Math.max(n, MIN_AMOUNT), MAX_AMOUNT);
    setAmount(clamped);
    setInputValue(String(clamped));
  }

  const factor = amount / baseAmount;
  const inv = scaleInvestmentResult(investment, factor);
  const csh = scaleCashResult(cash, factor);
  const deaths = investment.numberOfDeaths;

  return (
    <>
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">
          Co kdybyste investovali{" "}
          <span className="text-[var(--bitcoin-orange)]">{formatCurrency(amount)}</span> pokaždé,
          když média prohlásila Bitcoin za mrtvý?
        </h2>
        <p className="text-base leading-relaxed text-neutral-300 sm:text-lg">
          Celkem byste investovali{" "}
          <strong className="text-[var(--bitcoin-orange)]">
            {formatCurrency(inv.totalInvested)}
          </strong>
          . Dnes by vaše portfolio mělo hodnotu{" "}
          <strong className="text-green-500">
            {formatCurrency(inv.currentValue)}
          </strong>{" "}
          <span className="whitespace-nowrap">
            s&nbsp;výnosem{" "}
            <strong className="text-green-500">
              +{Math.round(inv.roi).toLocaleString("cs-CZ")}&nbsp;%
            </strong>
            .
          </span>
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Editovatelná karta — částka řídí celou sekci */}
          <div className="rounded-xl border border-[var(--bitcoin-orange)]/30 bg-[var(--bitcoin-orange)]/5 p-5">
            <label
              htmlFor="investment-amount"
              className="text-sm font-medium uppercase tracking-wider text-neutral-300"
            >
              Investice za &bdquo;úmrtí&ldquo;
            </label>
            <div className="mt-2 flex items-center gap-1.5">
              <input
                id="investment-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                aria-label="Částka investovaná při každém prohlášení, 1 až 9999 Kč"
                className="w-20 rounded-md border border-[var(--bitcoin-orange)]/40 bg-[var(--bitcoin-orange)]/10 px-2 py-0.5 text-center text-2xl font-bold tabular-nums text-[var(--bitcoin-orange)] outline-none focus:border-[var(--bitcoin-orange)] focus:ring-1 focus:ring-[var(--bitcoin-orange)]/50"
              />
              <span className="text-2xl font-bold text-[var(--bitcoin-orange)]">Kč</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="ml-0.5 text-[var(--bitcoin-orange)]/60"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{deaths} investic celkem</p>
          </div>

          <StatCard
            label="Celkem investováno"
            value={formatCurrency(inv.totalInvested)}
            sublabel={`${deaths} × ${formatCurrency(amount)}`}
            highlight
          />
          <StatCard
            label="Aktuální hodnota"
            value={formatCurrency(inv.currentValue)}
            sublabel={`${inv.totalBtc.toFixed(4)} BTC`}
            green
          />
          <StatCard
            label="Výnos (ROI)"
            value={`+${Math.round(inv.roi).toLocaleString("cs-CZ")} %`}
            sublabel={`Při ceně BTC ${Math.round(currentBtcPriceCzk).toLocaleString("cs-CZ")} Kč`}
            green
          />
        </div>
      </div>

      <TwoPathsCard investment={inv} cash={csh} />
    </>
  );
}
