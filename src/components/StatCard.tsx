import type { ReactNode } from "react";

interface StatCardProps {
  label: ReactNode;
  value: string;
  sublabel: string;
  highlight?: boolean;
  green?: boolean;
}

export function StatCard({ label, value, sublabel, highlight, green }: StatCardProps) {
  const getBorderBg = () => {
    if (green) return "border-green-500/30 bg-green-500/5";
    if (highlight) return "border-[var(--bitcoin-orange)]/30 bg-[var(--bitcoin-orange)]/5";
    return "border-[var(--card-border)] bg-[var(--background)]";
  };

  const getTextColor = () => {
    if (green) return "text-green-500";
    if (highlight) return "text-[var(--bitcoin-orange)]";
    return "text-white";
  };

  return (
    <div className={`rounded-xl border p-5 ${getBorderBg()}`}>
      <p className="text-sm font-medium uppercase tracking-wider text-neutral-300">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${getTextColor()}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-neutral-400">{sublabel}</p>
    </div>
  );
}
