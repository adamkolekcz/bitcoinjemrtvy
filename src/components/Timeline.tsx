"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DeathEvent } from "@/lib/calculations";
import { parseDate, formatCzechDate, generateDeathSlug } from "@/lib/calculations";

interface TimelineProps {
  deaths: DeathEvent[];
  usdToCzk: number;
}

interface GroupedDeaths {
  year: number;
  month: number;
  monthName: string;
  deaths: DeathEvent[];
}

const CZECH_MONTHS = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
];

export function Timeline({ deaths, usdToCzk }: TimelineProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const groupedDeaths = useMemo(() => {
    const sorted = [...deaths].sort((a, b) => {
      const dateA = parseDate(a.date).getTime();
      const dateB = parseDate(b.date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    const groups: GroupedDeaths[] = [];
    let currentGroup: GroupedDeaths | null = null;

    for (const death of sorted) {
      const date = parseDate(death.date);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (!currentGroup || currentGroup.year !== year || currentGroup.month !== month) {
        currentGroup = {
          year,
          month,
          monthName: CZECH_MONTHS[month],
          deaths: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.deaths.push(death);
    }

    return groups;
  }, [deaths, sortOrder]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-end gap-2">
        <span className="text-sm text-neutral-300">Řazení:</span>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-1">
          <button
            type="button"
            onClick={() => setSortOrder("newest")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              sortOrder === "newest"
                ? "bg-[var(--bitcoin-orange)] text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            Nejnovější
          </button>
          <button
            type="button"
            onClick={() => setSortOrder("oldest")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              sortOrder === "oldest"
                ? "bg-[var(--bitcoin-orange)] text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            Nejstarší
          </button>
        </div>
      </div>

      {groupedDeaths.map((group) => (
        <div key={`${group.year}-${group.month}`} className="mb-12">
          <div className="sticky top-0 z-10 mb-4 bg-[var(--background)] py-2">
            <h2 className="text-lg font-bold text-white">
              {group.monthName} {group.year}
            </h2>
            <div className="mt-1 h-px bg-gradient-to-r from-[var(--bitcoin-orange)] to-transparent" />
          </div>

          <div className="space-y-6">
            {group.deaths.map((death, i) => (
              <TimelineCard key={`${death.slug}-${i}`} death={death} usdToCzk={usdToCzk} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TimelineCardProps {
  death: DeathEvent;
  usdToCzk: number;
}

function TimelineCard({ death, usdToCzk }: TimelineCardProps) {
  const slug = generateDeathSlug(death);

  return (
    <Link href={`/prohlaseni/${slug}`} className="block">
      <article className="group rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-all hover:border-[var(--death-red)]/40 hover:shadow-lg hover:shadow-[var(--death-red)]/5 cursor-pointer">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <time className="text-sm text-neutral-300">
            {formatCzechDate(death.date)}
          </time>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--bitcoin-orange)]/10 px-2 py-0.5 text-sm font-semibold text-[var(--bitcoin-orange)]">
              {(death.bitcoinPrice * usdToCzk).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
            </span>
          </div>
        </div>

        <h3 className="mb-1 text-base font-semibold leading-snug text-white group-hover:text-[var(--death-red)] transition-colors">
          {death.articleTitle_cs ?? death.articleTitle}
        </h3>
        {death.articleTitle_cs && (
          <p className="mb-2 text-xs text-neutral-500 italic leading-snug">{death.articleTitle}</p>
        )}

        {death.quote && (
          <blockquote className="mb-3 border-l-2 border-[var(--death-red)]/50 pl-3 text-sm italic text-neutral-300">
            &ldquo;{death.quote_cs ?? death.quote}&rdquo;
          </blockquote>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span className="font-medium text-neutral-300">{death.person}</span>
          {death.jobTitle && (
            <>
              <span className="text-neutral-500">•</span>
              <span>{death.jobTitle}</span>
            </>
          )}
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-300">{death.publicationName}</span>
        </div>
      </article>
    </Link>
  );
}
