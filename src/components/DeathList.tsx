"use client";

import { useState } from "react";
import type { DeathEvent } from "@/lib/calculations";
import { formatCzechDate } from "@/lib/calculations";

interface DeathListProps {
  deaths: DeathEvent[];
}

const ITEMS_PER_PAGE = 20;

export function DeathList({ deaths }: DeathListProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const sortedDeaths = [...deaths].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  const visibleDeaths = sortedDeaths.slice(0, visibleCount);
  const hasMore = visibleCount < sortedDeaths.length;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">
        Všechna{" "}
        <span className="text-[var(--death-red)]">úmrtí</span>{" "}
        Bitcoinu
      </h2>

      <div className="space-y-3">
        {visibleDeaths.map((death, i) => (
          <div
            key={`${death.slug}-${i}`}
            className="group rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition-colors hover:border-[var(--death-red)]/30"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white leading-snug">
                  {death.articleTitle}
                </h3>
                <p className="mt-1 text-xs text-neutral-400">
                  {death.person}
                  {death.jobTitle ? ` — ${death.jobTitle}` : ""}
                </p>
                {death.quote && (
                  <p className="mt-2 text-xs italic text-neutral-500 line-clamp-2">
                    &ldquo;{death.quote}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                <span className="text-xs text-neutral-500">
                  {formatCzechDate(death.date)}
                </span>
                <span className="text-sm font-bold text-[var(--bitcoin-orange)]">
                  ${death.bitcoinPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-neutral-500">
                  {death.publicationName}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-3 text-sm font-medium text-neutral-300 transition-colors hover:border-[var(--bitcoin-orange)]/50 hover:text-white"
          >
            Zobrazit další ({sortedDeaths.length - visibleCount} zbývá)
          </button>
        </div>
      )}
    </section>
  );
}
