"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ComposedChart,
  Area,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint, DeathEvent } from "@/lib/calculations";
import { formatCzechDate, generateDeathSlug } from "@/lib/calculations";

interface BitcoinChartProps {
  data: ChartDataPoint[];
  currentPriceUsd: number;
  currentPriceCzk: number;
  usdToCzk: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
  currentPriceCzk?: number;
  usdToCzk: number;
}

function CustomTooltip({ active, payload, currentPriceCzk, usdToCzk }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const point = payload[0].payload;
  const death = point.death;

  // Current price tooltip (no death event)
  if (!death) {
    const displayPriceCzk = currentPriceCzk ?? point.price * usdToCzk;
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[#1a1a1a] p-3 shadow-xl">
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm font-medium text-green-500">Aktuální cena</span>
          <span className="text-sm font-bold text-green-500">
            {displayPriceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-300">
          {formatCzechDate(point.date)}
        </p>
      </div>
    );
  }

  // Truncate quote for mobile display (preferuje český překlad)
  const displayQuote = death.quote_cs ?? death.quote;
  const truncatedQuote = displayQuote && displayQuote.length > 120
    ? displayQuote.slice(0, 120) + "..."
    : displayQuote;

  return (
    <div className="max-w-[260px] sm:max-w-xs rounded-lg border border-[var(--card-border)] bg-[#1a1a1a] p-2 sm:p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-2 sm:gap-4">
        <span className="text-xs text-neutral-300 whitespace-nowrap">
          {formatCzechDate(death.date)}
        </span>
        <span className="text-xs sm:text-sm font-bold text-[var(--bitcoin-orange)] whitespace-nowrap">
          {(death.bitcoinPrice * usdToCzk).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
        </span>
      </div>
      <p className="mb-2 text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2">
        {death.articleTitle_cs ?? death.articleTitle}
      </p>
      {truncatedQuote && (
        <p className="mb-2 border-l-2 border-[var(--death-red)] pl-2 text-xs italic text-neutral-300 line-clamp-3">
          &ldquo;{truncatedQuote}&rdquo;
        </p>
      )}
      <p className="text-xs text-neutral-300 truncate">
        {death.person}
        {death.jobTitle ? ` — ${death.jobTitle}` : ""}
      </p>
      <p className="text-xs text-neutral-400 truncate">{death.publicationName}</p>
    </div>
  );
}

// Dynamic even-year ticks — auto-extends as time passes
function buildYearTicks(): number[] {
  const ticks: number[] = [];
  const endYear = new Date().getFullYear() + 6;
  for (let y = 2012; y <= endYear; y += 2) {
    ticks.push(new Date(y, 0, 1).getTime());
  }
  return ticks;
}
const YEAR_TICKS = buildYearTicks();

function makeFormatXTick(period: Period) {
  return function(timestamp: number): string {
    const date = new Date(timestamp);
    const month = date.getMonth();
    const year = date.getFullYear();
    const yy = year.toString().slice(-2);
    // 1y: numeric M/YY — e.g. "5/25", "10/25", "1/26"
    if (period === "1y") return `${month + 1}/${yy}`;
    // Other periods: January gets full year, others get M/YY
    if (month === 0) return year.toString();
    return `${month + 1}/${yy}`;
  };
}

function makeFormatYTick(usdToCzk: number) {
  return function formatYTick(value: number): string {
    const czk = Math.round(value * usdToCzk);
    if (czk === 0) return "0 Kč";
    if (czk >= 500_000) {
      const millions = czk / 1_000_000;
      return millions % 1 === 0
        ? `${millions.toFixed(0)}M Kč`
        : `${millions.toFixed(1).replace(".", ",")}M Kč`;
    }
    if (czk >= 1_000) return `${(czk / 1_000).toFixed(0)}k Kč`;
    if (czk >= 1) return `${czk.toFixed(0)} Kč`;
    return `${czk.toFixed(2)} Kč`;
  };
}

interface ChartMarkerProps {
  cx: number;
  cy: number;
  payload?: { isCurrentPrice?: boolean; death?: DeathEvent };
  onDeathClick?: (death: DeathEvent) => void;
}

// Combined scatter shape - red for death events, green for current price
function ChartMarker({ cx, cy, payload, onDeathClick }: ChartMarkerProps) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  // Current price marker (green, solid)
  if (payload?.isCurrentPrice) {
    return <circle cx={cx} cy={cy} r={4} fill="#22C55E" />;
  }

  // Death event marker (red, clickable)
  if (payload?.death) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--death-red)"
        style={{ cursor: "pointer" }}
        onClick={() => onDeathClick?.(payload.death!)}
      />
    );
  }

  return null;
}


type Period = "all" | "5y" | "3y" | "1y";

export function BitcoinChart({ data, currentPriceUsd, currentPriceCzk, usdToCzk }: BitcoinChartProps) {
  const [scale, setScale] = useState<"log" | "linear">("linear");
  const [period, setPeriod] = useState<Period>("all");
  const formatYTick = useMemo(() => makeFormatYTick(usdToCzk), [usdToCzk]);
  const formatXTick = useMemo(() => makeFormatXTick(period), [period]);
  const router = useRouter();

  const handleDeathClick = useCallback((death: DeathEvent) => {
    router.push(`/prohlaseni/${generateDeathSlug(death)}`);
  }, [router]);

  // Merge data with current price point
  const chartData = useMemo(() => {
    const now = new Date();
    // Format: MM/DD/YYYY (expected by parseDate)
    const today = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    const currentPricePoint = {
      timestamp: now.getTime(),
      date: today,
      price: currentPriceUsd,
      isCurrentPrice: true,
    };
    return [...data, currentPricePoint];
  }, [data, currentPriceUsd]);

  // Filter data based on selected period
  const filteredChartData = useMemo(() => {
    if (period === "all" || chartData.length === 0) return chartData;

    // Use the latest timestamp from data (current price point) as reference
    const latestTimestamp = Math.max(...chartData.map(d => d.timestamp));
    const periodMs: Record<Exclude<Period, "all">, number> = {
      "5y": 5 * 365 * 24 * 60 * 60 * 1000,
      "3y": 3 * 365 * 24 * 60 * 60 * 1000,
      "1y": 1 * 365 * 24 * 60 * 60 * 1000,
    };

    const cutoff = latestTimestamp - periodMs[period];
    return chartData.filter(d => d.timestamp >= cutoff);
  }, [chartData, period]);

  const domain = useMemo(() => {
    const timestamps = filteredChartData.map((d) => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    return [minTime, maxTime + 86400000 * 7] as [number, number];
  }, [filteredChartData]);

  // Calculate nice Y-axis ticks and domain min for linear scale
  const { yTicksLinear, yDomainMinLinear, yDomainMaxLinear } = useMemo(() => {
    if (filteredChartData.length === 0) return { yTicksLinear: [], yDomainMinLinear: 0, yDomainMaxLinear: 0 };

    const minPrice = Math.min(...filteredChartData.map(d => d.price));
    const maxPrice = Math.max(...filteredChartData.map(d => d.price));
    const minCzk = minPrice * usdToCzk;
    const maxCzk = maxPrice * usdToCzk;

    // Domain min: 3 % pod minimem dat
    const domainMinCzk = Math.max(0, minCzk * 0.97);
    const domainMaxCzk = maxCzk * 1.05;
    const visibleRange = domainMaxCzk - domainMinCzk;

    // Intervals covering future prices up to 50M+ Kč
    const niceIntervals = [
      50_000, 100_000, 250_000, 500_000,
      1_000_000, 2_500_000, 5_000_000,
      10_000_000, 25_000_000, 50_000_000,
    ];

    // Pick interval so visible range contains 4–6 ticks
    const interval = niceIntervals.find(i => {
      const count = Math.floor(visibleRange / i);
      return count >= 3 && count <= 6;
    }) ?? niceIntervals[niceIntervals.length - 1];

    const firstTickCzk = Math.ceil(domainMinCzk / interval) * interval;
    const ticks: number[] = [];
    for (let czk = firstTickCzk; czk <= domainMaxCzk; czk += interval) {
      ticks.push(czk / usdToCzk);
    }

    return { yTicksLinear: ticks, yDomainMinLinear: domainMinCzk / usdToCzk, yDomainMaxLinear: domainMaxCzk / usdToCzk };
  }, [filteredChartData, usdToCzk]);

  // Calculate nice Y-axis ticks for logarithmic scale
  const { yTicksLog, yDomainMinLog } = useMemo(() => {
    if (filteredChartData.length === 0) return { yTicksLog: [], yDomainMinLog: 1 };

    const minPrice = Math.min(...filteredChartData.filter(d => d.price > 0).map(d => d.price));
    const maxPrice = Math.max(...filteredChartData.map(d => d.price));

    const niceLogValues = [
      100, 200, 500,
      1_000, 2_000, 5_000,
      10_000, 20_000, 50_000,
      100_000, 200_000, 500_000, 750_000,
      1_000_000, 1_500_000, 2_000_000, 2_500_000, 5_000_000,
      10_000_000, 15_000_000, 20_000_000, 25_000_000, 50_000_000,
    ];

    const minCzk = minPrice * usdToCzk;
    const maxCzk = maxPrice * usdToCzk;

    // Filter values within data range (tight upper bound to avoid irrelevant values)
    let ticks = niceLogValues
      .filter(czk => czk >= minCzk * 0.5 && czk <= maxCzk * 1.15)
      .map(czk => czk / usdToCzk); // Convert back to USD

    // If we have too many ticks, keep only every other one
    if (ticks.length > 6) {
      ticks = ticks.filter((_, i) => i % 2 === 0);
    }

    return { yTicksLog: ticks, yDomainMinLog: minPrice * 0.9 };
  }, [filteredChartData, usdToCzk]);

  // Calculate X-axis ticks based on selected period
  const xTicks = useMemo(() => {
    if (filteredChartData.length === 0) return YEAR_TICKS;

    const timestamps = filteredChartData.map(d => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    // For "all" period, use the predefined YEAR_TICKS
    if (period === "all") {
      return YEAR_TICKS.filter(t => t >= minTime && t <= maxTime);
    }

    // For 1 year period: standard quarterly ticks (Jan, Apr, Jul, Oct)
    if (period === "1y") {
      const ticks: number[] = [];
      const startDate = new Date(minTime);
      let year = startDate.getFullYear();
      let month = Math.floor(startDate.getMonth() / 3) * 3; // align to quarter

      while (true) {
        const tick = new Date(year, month, 1).getTime();
        if (tick > maxTime) break;
        if (tick >= minTime) ticks.push(tick);
        month += 3;
        if (month >= 12) { month = 0; year++; }
      }

      return ticks;
    }

    // For 3y / 5y: one tick per year (Jan 1), only if the tick falls within the data
    const ticks: number[] = [];
    const startYear = new Date(minTime).getFullYear();
    const endYear = new Date(maxTime).getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const tick = new Date(year, 0, 1).getTime();
      if (tick >= minTime) ticks.push(tick);
    }

    return ticks;
  }, [filteredChartData, period]);

  const periodOptions: { value: Period; label: string }[] = [
    { value: "all", label: "Celé období" },
    { value: "5y", label: "5 let" },
    { value: "3y", label: "3 roky" },
    { value: "1y", label: "1 rok" },
  ];

  return (
    <div className="w-full overflow-hidden">
      <div className="mb-4 hidden sm:flex flex-wrap items-center justify-between gap-2 px-4 sm:px-0">
        {/* Period selector - left side */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-1">
          {periodOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                period === option.value
                  ? "bg-[var(--bitcoin-orange)] text-black"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Scale selector - right side */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-1">
          <button
            type="button"
            onClick={() => setScale("log")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              scale === "log"
                ? "bg-[var(--bitcoin-orange)] text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            Log
          </button>
          <button
            type="button"
            onClick={() => setScale("linear")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              scale === "linear"
                ? "bg-[var(--bitcoin-orange)] text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            Lineární
          </button>
        </div>
      </div>

      <div
        role="img"
        aria-label="Graf vývoje ceny Bitcoinu v čase s vyznačenými prohlášeními o jeho smrti. Body grafu jsou interaktivní myší; kompletní textový přehled všech prohlášení najdeš na stránce Prohlášení."
        className="select-none"
      >
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={filteredChartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          accessibilityLayer={false}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bitcoin-orange)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--bitcoin-orange)" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={domain}
            ticks={xTicks}
            tickFormatter={formatXTick}
            stroke="#404040"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
          />

          <YAxis
            dataKey="price"
            scale={scale}
            domain={scale === "log" ? [yDomainMinLog, "auto"] : [yDomainMinLinear, yDomainMaxLinear]}
            ticks={scale === "linear" ? yTicksLinear : yTicksLog}
            tickFormatter={formatYTick}
            stroke="#404040"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
            width={80}
          />

          <Tooltip
            content={<CustomTooltip currentPriceCzk={currentPriceCzk} usdToCzk={usdToCzk} />}
            cursor={{ stroke: "#404040", strokeDasharray: "3 3" }}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--bitcoin-orange)"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={false}
            baseValue={scale === "linear" ? yDomainMinLinear : yDomainMinLog}
          />

          <Scatter
            dataKey="price"
            shape={(props) => <ChartMarker {...(props as unknown as ChartMarkerProps)} onDeathClick={handleDeathClick} />}
          />

        </ComposedChart>
      </ResponsiveContainer>
      </div>

      <div className="mt-4 hidden sm:flex flex-wrap items-center justify-center gap-6 px-4 text-xs text-neutral-300 sm:px-0">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6 bg-[var(--bitcoin-orange)]" />
          <span>Vývoj ceny</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--death-red)]" />
          <span>Bitcoin umřel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Aktuální cena</span>
        </div>
      </div>
    </div>
  );
}
