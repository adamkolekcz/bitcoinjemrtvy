"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { ChartDataPoint } from "@/lib/calculations";

function ChartSkeleton() {
  return (
    <div className="h-[320px] sm:h-[500px] w-full animate-pulse rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]" />
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
  usdToCzk: number;
}

export function BitcoinChartLazy(props: BitcoinChartLazyProps) {
  // Recharts je ~1,8 s evaluace JS. Načtení (a tím i import chunku) odložíme až
  // za první vykreslení / nečinnost prohlížeče, aby neblokovalo hlavní vlákno
  // během initial loadu → lepší TBT a LCP. Skeleton drží 500px (= výška grafu
  // na mobilu, kde nejsou ovládací prvky ani legenda), takže žádný CLS.
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setMount(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(() => setMount(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!mount) return <ChartSkeleton />;
  return <BitcoinChart {...props} />;
}
