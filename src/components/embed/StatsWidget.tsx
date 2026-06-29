import { EMBED_ORIGIN } from "@/lib/embed-config";
import { formatCurrency } from "@/lib/calculations";

interface StatsWidgetProps {
  count: number;
  currentValue: number;
  roi: number;
  perDeposit: number;
  updated: string;
}

export function StatsWidget({ count, currentValue, roi, perDeposit, updated }: StatsWidgetProps) {
  return (
    <a
      href={EMBED_ORIGIN}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-screen w-full flex-col justify-between gap-2 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline"
    >
      <span className="text-xl font-bold tracking-tight">
        <span className="text-[var(--bitcoin-orange)]">Bitcoin</span>{" "}
        <span className="text-white">je mrtvý</span>
      </span>

      <p className="text-xl font-bold leading-snug text-white">
        Bitcoin byl už{" "}
        <span className="text-[var(--death-red)]">{count.toLocaleString("cs-CZ")}&times;</span>{" "}
        prohlášen za&nbsp;mrtvý
      </p>

      <p className="text-base leading-snug text-neutral-300">
        Kdybyste investovali {formatCurrency(perDeposit)} při každém úmrtí, dnes by vaše
        portfolio mělo hodnotu{" "}
        <span className="font-bold text-green-500">{formatCurrency(currentValue)}</span>{" "}
        <span className="whitespace-nowrap">
          s&nbsp;výnosem{" "}
          <span className="font-bold text-green-500">+{Math.round(roi).toLocaleString("cs-CZ")}&nbsp;%</span>.
        </span>
      </p>

      <p className="text-sm text-neutral-500">Aktualizováno {updated}</p>
    </a>
  );
}
