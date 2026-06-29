import { EMBED_ORIGIN } from "@/lib/embed-config";
import { formatCurrency, formatCzkCompact } from "@/lib/calculations";

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
      <span className="text-base font-bold tracking-tight">
        <span className="text-[var(--bitcoin-orange)]">Bitcoin</span>{" "}
        <span className="text-white">je mrtvý</span>
      </span>

      <p className="text-lg font-bold leading-snug text-white">
        Bitcoin byl{" "}
        <span className="text-[var(--death-red)]">{count.toLocaleString("cs-CZ")}&times;</span>{" "}
        prohlášen za&nbsp;mrtvý
      </p>

      <p className="text-sm leading-snug text-neutral-300">
        {formatCurrency(perDeposit)} při každém prohlášení by dnes mělo hodnotu{" "}
        <span className="font-bold text-[var(--death-red)]">{formatCzkCompact(currentValue)}</span>{" "}
        <span className="font-bold text-green-500">(+{Math.round(roi).toLocaleString("cs-CZ")}&nbsp;%)</span>
      </p>

      <p className="text-xs text-neutral-500">Aktualizováno {updated}</p>
    </a>
  );
}
