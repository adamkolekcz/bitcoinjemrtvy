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
  ReferenceDot,
} from "recharts";
import type { ChartDataPoint } from "@/lib/calculations";
import { formatCzechDate } from "@/lib/calculations";

const USD_TO_CZK = 23.81; // 1 / 0.042

interface BitcoinChartProps {
  data: ChartDataPoint[];
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

  if (!death) return null;

  return (
    <div className="max-w-xs rounded-lg border border-[var(--card-border)] bg-[#1a1a1a] p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs text-neutral-400">
          {formatCzechDate(death.date)}
        </span>
        <span className="text-sm font-bold text-[var(--bitcoin-orange)]">
          {(death.bitcoinPrice * USD_TO_CZK).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
        </span>
      </div>
      <p className="mb-2 text-sm font-semibold text-white leading-snug">
        {death.articleTitle}
      </p>
      {death.quote && (
        <p className="mb-2 border-l-2 border-[var(--death-red)] pl-2 text-xs italic text-neutral-400">
          &ldquo;{death.quote}&rdquo;
        </p>
      )}
      <p className="text-xs text-neutral-400">
        {death.person}
        {death.jobTitle ? ` — ${death.jobTitle}` : ""}
      </p>
      <p className="text-xs text-neutral-500">{death.publicationName}</p>
    </div>
  );
}

const YEAR_TICKS = [
  new Date(2010, 0, 1).getTime(),
  new Date(2012, 0, 1).getTime(),
  new Date(2014, 0, 1).getTime(),
  new Date(2016, 0, 1).getTime(),
  new Date(2018, 0, 1).getTime(),
  new Date(2020, 0, 1).getTime(),
  new Date(2022, 0, 1).getTime(),
  new Date(2024, 0, 1).getTime(),
  new Date(2026, 0, 1).getTime(),
];

function formatXTick(timestamp: number): string {
  return new Date(timestamp).getFullYear().toString();
}

function formatYTick(value: number): string {
  const czk = value * USD_TO_CZK;
  if (czk >= 1_000_000) return `${(czk / 1_000_000).toFixed(1)}M Kč`;
  if (czk >= 1_000) return `${(czk / 1_000).toFixed(0)}k Kč`;
  if (czk >= 1) return `${czk.toFixed(0)} Kč`;
  return `${czk.toFixed(2)} Kč`;
}

// Custom scatter shape - small dot for death events
function DeathMarker(props: Record<string, unknown>) {
  const { cx, cy } = props as { cx: number; cy: number };
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--death-red)"
    />
  );
}


export function BitcoinChart({ data }: BitcoinChartProps) {
  const [scale, setScale] = useState<"log" | "linear">("log");

  const domain = useMemo(() => {
    const timestamps = data.map((d) => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    return [minTime - 86400000 * 30, maxTime + 86400000 * 30] as [number, number];
  }, [data]);

  // Current price point (last data point)
  const currentPrice = useMemo(() => {
    if (data.length === 0) return null;
    const lastPoint = data[data.length - 1];
    return { x: lastPoint.timestamp, y: lastPoint.price };
  }, [data]);

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 px-4 text-xs text-neutral-400 sm:px-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-[var(--bitcoin-orange)]" />
            <span>Cena BTC (CZK)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--death-red)]" />
            <span>&quot;Bitcoin je mrtvý&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-green-600" />
            <span>Aktuální cena</span>
          </div>
        </div>

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
          data={data}
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
            ticks={YEAR_TICKS}
            tickFormatter={formatXTick}
            stroke="#404040"
            tick={{ fill: "#737373", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
          />

          <YAxis
            dataKey="price"
            scale={scale}
            domain={scale === "log" ? ["auto", "auto"] : [0, "auto"]}
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
            fill="var(--death-red)"
            shape={<DeathMarker />}
          />

          {currentPrice && (
            <ReferenceDot
              x={currentPrice.x}
              y={currentPrice.y}
              r={8}
              fill="#22C55E"
              stroke="#16A34A"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
