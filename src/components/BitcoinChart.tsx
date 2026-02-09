"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/calculations";
import { formatCzechDate } from "@/lib/calculations";

const USD_TO_CZK = 23.81; // 1 / 0.042

interface BitcoinChartProps {
  data: ChartDataPoint[];
  currentPriceUsd: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const point = payload[0].payload;
  const death = point.death;

  // Current price tooltip (no death event)
  if (!death) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[#1a1a1a] p-3 shadow-xl">
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm font-medium text-green-500">Aktuální cena</span>
          <span className="text-sm font-bold text-green-500">
            {(point.price * USD_TO_CZK).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          {formatCzechDate(point.date)}
        </p>
      </div>
    );
  }

  // Truncate quote for mobile display
  const truncatedQuote = death.quote && death.quote.length > 120
    ? death.quote.slice(0, 120) + "..."
    : death.quote;

  return (
    <div className="max-w-[260px] sm:max-w-xs rounded-lg border border-[var(--card-border)] bg-[#1a1a1a] p-2 sm:p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-2 sm:gap-4">
        <span className="text-xs text-neutral-400 whitespace-nowrap">
          {formatCzechDate(death.date)}
        </span>
        <span className="text-xs sm:text-sm font-bold text-[var(--bitcoin-orange)] whitespace-nowrap">
          {(death.bitcoinPrice * USD_TO_CZK).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
        </span>
      </div>
      <p className="mb-2 text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2">
        {death.articleTitle}
      </p>
      {truncatedQuote && (
        <p className="mb-2 border-l-2 border-[var(--death-red)] pl-2 text-xs italic text-neutral-400 line-clamp-3">
          &ldquo;{truncatedQuote}&rdquo;
        </p>
      )}
      <p className="text-xs text-neutral-400 truncate">
        {death.person}
        {death.jobTitle ? ` — ${death.jobTitle}` : ""}
      </p>
      <p className="text-xs text-neutral-500 truncate">{death.publicationName}</p>
    </div>
  );
}

const YEAR_TICKS = [
  new Date(2012, 0, 1).getTime(),
  new Date(2014, 0, 1).getTime(),
  new Date(2016, 0, 1).getTime(),
  new Date(2018, 0, 1).getTime(),
  new Date(2020, 0, 1).getTime(),
  new Date(2022, 0, 1).getTime(),
  new Date(2024, 0, 1).getTime(),
  new Date(2026, 0, 1).getTime(),
];

const MONTH_NAMES = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"];

function formatXTick(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.getMonth();
  const year = date.getFullYear();

  // If it's January, show only year; otherwise show month abbreviation + year
  if (month === 0) {
    return year.toString();
  }
  return `${MONTH_NAMES[month]} ${year.toString().slice(-2)}`;
}

function formatYTick(value: number): string {
  const czk = value * USD_TO_CZK;
  if (czk === 0) return "0 Kč";
  if (czk >= 1_000_000) {
    const millions = czk / 1_000_000;
    // Show .5 only if it's exactly half million
    return millions % 0.5 === 0 && millions % 1 !== 0
      ? `${millions.toFixed(1)}M Kč`
      : `${Math.round(millions)}M Kč`;
  }
  if (czk >= 1_000) return `${(czk / 1_000).toFixed(0)}k Kč`;
  if (czk >= 1) return `${czk.toFixed(0)} Kč`;
  return `${czk.toFixed(2)} Kč`;
}

// Combined scatter shape - red for death events, green pulsing for current price
function ChartMarker(props: Record<string, unknown>) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload?: { isCurrentPrice?: boolean; death?: unknown } };
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  // Current price marker (green, pulsing)
  if (payload?.isCurrentPrice) {
    return (
      <g>
        {/* Pulsing outer ring */}
        <circle cx={cx} cy={cy} r={4} fill="#22C55E" opacity={0.4}>
          <animate
            attributeName="r"
            values="4;12;4"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;0;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Solid center dot */}
        <circle cx={cx} cy={cy} r={4} fill="#22C55E" />
      </g>
    );
  }

  // Death event marker (red) - only show if has death event
  if (payload?.death) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--death-red)"
      />
    );
  }

  // No marker for other points
  return null;
}


type Period = "all" | "5y" | "3y" | "1y";

export function BitcoinChart({ data, currentPriceUsd }: BitcoinChartProps) {
  const [scale, setScale] = useState<"log" | "linear">("linear");
  const [period, setPeriod] = useState<Period>("all");

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
    return [minTime - 86400000 * 30, maxTime + 86400000 * 30] as [number, number];
  }, [filteredChartData]);

  // Calculate nice Y-axis ticks for linear scale
  const yTicksLinear = useMemo(() => {
    if (filteredChartData.length === 0) return [];

    const maxPrice = Math.max(...filteredChartData.map(d => d.price));
    const maxCzk = maxPrice * USD_TO_CZK;

    // Nice intervals in CZK - aim for 5-6 ticks on the Y axis
    const niceIntervals = [100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];

    // Find suitable interval that gives us 4-7 ticks
    const interval = niceIntervals.find(i => {
      const tickCount = Math.ceil(maxCzk / i);
      return tickCount >= 4 && tickCount <= 7;
    }) || 5_000_000;

    // Generate ticks from 0 up to max value
    const ticks: number[] = [];
    for (let czk = 0; czk <= maxCzk * 1.05; czk += interval) {
      ticks.push(czk / USD_TO_CZK); // Convert back to USD for YAxis
    }

    return ticks;
  }, [filteredChartData]);

  // Calculate nice Y-axis ticks for logarithmic scale
  const yTicksLog = useMemo(() => {
    if (filteredChartData.length === 0) return [];

    const minPrice = Math.min(...filteredChartData.filter(d => d.price > 0).map(d => d.price));
    const maxPrice = Math.max(...filteredChartData.map(d => d.price));

    // Extended logarithmic values in CZK with finer steps for narrow ranges
    const niceLogValues = [
      100, 200, 500,
      1_000, 2_000, 5_000,
      10_000, 20_000, 50_000,
      100_000, 200_000, 300_000, 500_000, 750_000,
      1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000,
      10_000_000,
    ];

    const minCzk = minPrice * USD_TO_CZK;
    const maxCzk = maxPrice * USD_TO_CZK;

    // Filter values within data range (tight upper bound to avoid irrelevant values)
    let ticks = niceLogValues
      .filter(czk => czk >= minCzk * 0.5 && czk <= maxCzk * 1.15)
      .map(czk => czk / USD_TO_CZK); // Convert back to USD

    // If we have too many ticks, keep only every other one
    if (ticks.length > 6) {
      ticks = ticks.filter((_, i) => i % 2 === 0);
    }

    return ticks;
  }, [filteredChartData]);

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

    // For 1 year period, show monthly ticks (every 4 months)
    if (period === "1y") {
      const ticks: number[] = [];
      const startDate = new Date(minTime);

      // Start from the first month in range, aligned to quarter
      let year = startDate.getFullYear();
      let month = Math.floor(startDate.getMonth() / 4) * 4; // Align to 0, 4, 8

      while (true) {
        const tick = new Date(year, month, 1).getTime();
        if (tick > maxTime + 86400000 * 30) break;
        if (tick >= minTime - 86400000 * 30) {
          ticks.push(tick);
        }
        month += 4;
        if (month >= 12) {
          month = 0;
          year++;
        }
      }

      return ticks;
    }

    // For other periods (3y, 5y), generate yearly ticks
    const ticks: number[] = [];
    const startYear = new Date(minTime).getFullYear();
    const endYear = new Date(maxTime).getFullYear();

    for (let year = startYear; year <= endYear + 1; year++) {
      const tick = new Date(year, 0, 1).getTime();
      if (tick >= minTime - 86400000 * 30 && tick <= maxTime + 86400000 * 30) {
        ticks.push(tick);
      }
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
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                period === option.value
                  ? "bg-[var(--bitcoin-orange)] text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Scale selector - right side */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-1">
          <button
            onClick={() => setScale("log")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              scale === "log"
                ? "bg-[var(--bitcoin-orange)] text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Log
          </button>
          <button
            onClick={() => setScale("linear")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              scale === "linear"
                ? "bg-[var(--bitcoin-orange)] text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Lineární
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={filteredChartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bitcoin-orange)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--bitcoin-orange)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={domain}
            ticks={xTicks}
            tickFormatter={formatXTick}
            stroke="#404040"
            tick={{ fill: "#737373", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
          />

          <YAxis
            dataKey="price"
            scale={scale}
            domain={scale === "log" ? ["auto", "auto"] : [0, "auto"]}
            ticks={scale === "linear" ? yTicksLinear : yTicksLog}
            tickFormatter={formatYTick}
            stroke="#404040"
            tick={{ fill: "#737373", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
            width={80}
          />

          <Tooltip
            content={<CustomTooltip />}
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
          />

          <Scatter
            dataKey="price"
            shape={<ChartMarker />}
          />

        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 hidden sm:flex flex-wrap items-center justify-center gap-6 px-4 text-xs text-neutral-400 sm:px-0">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6 bg-[var(--bitcoin-orange)]" />
          <span>Cena BTC (CZK)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--death-red)]" />
          <span>Bitcoin je mrtvý</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2 items-center justify-center">
            <div className="absolute h-2 w-2 animate-ping-slow rounded-full bg-green-500 opacity-75" />
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </div>
          <span>Aktuální cena</span>
        </div>
      </div>
    </div>
  );
}
