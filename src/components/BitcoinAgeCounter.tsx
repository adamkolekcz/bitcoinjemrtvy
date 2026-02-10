"use client";

import { useEffect, useState } from "react";

const GENESIS_TIME = new Date("2009-01-03T18:15:05Z").getTime();

interface TimeDiff {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateDiff(): TimeDiff {
  const now = Date.now();
  let remaining = Math.floor((now - GENESIS_TIME) / 1000);

  const years = Math.floor(remaining / (365.25 * 24 * 3600));
  remaining -= Math.floor(years * 365.25 * 24 * 3600);

  const days = Math.floor(remaining / (24 * 3600));
  remaining -= days * 24 * 3600;

  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining - minutes * 60;

  return { years, days, hours, minutes, seconds };
}

function formatAge(diff: TimeDiff): string {
  return `${diff.years} let, ${diff.days}d ${String(diff.hours).padStart(2, "0")}h ${String(diff.minutes).padStart(2, "0")}m ${String(diff.seconds).padStart(2, "0")}s`;
}

export function BitcoinAgeCounter() {
  const [diff, setDiff] = useState<TimeDiff | null>(null);

  useEffect(() => {
    setDiff(calculateDiff());
    const id = setInterval(() => setDiff(calculateDiff()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-300">
        Jak dlouho žije Bitcoin?
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-green-500">
        {diff ? formatAge(diff) : "—"}
      </p>
      <p className="mt-1 text-xs text-neutral-400">Od 3. ledna 2009</p>
    </div>
  );
}
