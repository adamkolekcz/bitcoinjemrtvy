"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { ChartDataPoint } from "@/lib/calculations";

// Kopíruje rozvržení BitcoinChart (ovládání nad grafem + legenda pod ním jen od sm:),
// aby se po načtení grafu nic neposunulo (CLS).
function ChartSkeleton({ message }: { message?: string }) {
  return (
    <div className="w-full" aria-busy={!message}>
      <div className="mb-4 hidden h-[34px] sm:block" />
      <div className="flex h-[320px] w-full items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] sm:h-[500px]">
        {message ? <p className="text-sm text-neutral-300">{message}</p> : <div className="h-full w-full animate-pulse rounded-xl" />}
      </div>
      <div className="mt-4 hidden h-4 sm:block" />
    </div>
  );
}

const BitcoinChart = dynamic(
  () => import("@/components/BitcoinChart").then((mod) => ({ default: mod.BitcoinChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface BitcoinChartLazyProps {
  currentPriceUsd: number;
  currentPriceCzk: number;
  usdToCzk: number;
}

export function BitcoinChartLazy(props: BitcoinChartLazyProps) {
  // Recharts je ~1,8 s evaluace JS. Načtení (a tím i import chunku a dat) odložíme až
  // za první vykreslení / nečinnost prohlížeče, aby neblokovalo hlavní vlákno
  // během initial loadu → lepší TBT a LCP.
  const [data, setData] = useState<ChartDataPoint[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void import("@/components/BitcoinChart"); // chunk souběžně s daty
      fetch("/api/chart-data")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<ChartDataPoint[]>;
        })
        .then((d) => !cancelled && setData(d))
        .catch(() => !cancelled && setFailed(true));
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(load, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = setTimeout(load, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (failed) return <ChartSkeleton message="Graf se nepodařilo načíst." />;
  if (!data) return <ChartSkeleton />;
  return <BitcoinChart data={data} {...props} />;
}
