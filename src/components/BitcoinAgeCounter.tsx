"use client";

import { useEffect, useState } from "react";

// Genesis block (block 0) timestamp: 2009-01-03 18:15:05 UTC
// Prague (CET, UTC+1): 2009-01-03 19:15:05
const GENESIS = new Date("2009-01-03T18:15:05Z");

interface TimeDiff {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateDiff(): TimeDiff {
  const now = new Date();

  // Calculate full years using actual calendar dates (handles leap years)
  let years = now.getUTCFullYear() - GENESIS.getUTCFullYear();
  const anniversary = new Date(GENESIS);
  anniversary.setUTCFullYear(GENESIS.getUTCFullYear() + years);
  if (now.getTime() < anniversary.getTime()) {
    years--;
    anniversary.setUTCFullYear(GENESIS.getUTCFullYear() + years);
  }

  // Remaining seconds after full years
  let remaining = Math.floor((now.getTime() - anniversary.getTime()) / 1000);

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
    // Čas se počítá jen na klientu (jinak hydration mismatch). Jednorázová inicializace
    // při mountu, ne cascading render — proto je synchronní setState tady v pořádku.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <p className="mt-3 border-t border-[var(--card-border)] pt-3 text-sm font-medium text-[var(--bitcoin-orange)]">
        Ve stejný den roku 1977 vznikla společnost Apple.
      </p>
    </div>
  );
}
