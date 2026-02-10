"use client";

import dynamic from "next/dynamic";
import type { ChartDataPoint } from "@/lib/calculations";

function ChartSkeleton() {
  return (
    <div className="h-[500px] w-full animate-pulse rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]" />
  );
}

const BitcoinChart = dynamic(
  () => import("@/components/BitcoinChart").then((mod) => ({ default: mod.BitcoinChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface BitcoinChartLazyProps {
  data: ChartDataPoint[];
  currentPriceUsd: number;
  currentPriceCzk: number;
}

export function BitcoinChartLazy({ data, currentPriceUsd, currentPriceCzk }: BitcoinChartLazyProps) {
  return <BitcoinChart data={data} currentPriceUsd={currentPriceUsd} currentPriceCzk={currentPriceCzk} />;
}
