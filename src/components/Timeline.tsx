"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatCzechDate, parseDate } from "@/lib/calculations";
import { TIMELINE_PAGE_SIZE, type TimelineItem, type TimelineSlice } from "@/lib/timeline-item";

const CZECH_MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];

type Order = "newest" | "oldest";

interface TimelineProps {
  initialSlice: TimelineSlice;
  total: number;
}

interface GroupedItems {
  year: number;
  month: number;
  monthName: string;
  items: TimelineItem[];
}

function groupByMonth(items: TimelineItem[]): GroupedItems[] {
  const groups: GroupedItems[] = [];
  let current: GroupedItems | null = null;
  for (const item of items) {
    const date = parseDate(item.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (!current || current.year !== year || current.month !== month) {
      current = { year, month, monthName: CZECH_MONTHS[month], items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}

export function Timeline({ initialSlice, total }: TimelineProps) {
  const [order, setOrder] = useState<Order>("newest");
  const [items, setItems] = useState<TimelineItem[]>(initialSlice.items);
  const [hasMore, setHasMore] = useState(initialSlice.hasMore);
  const [loading, setLoading] = useState(false);
  const offsetRef = useRef(initialSlice.items.length);
  const didMount = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (nextOrder: Order, offset: number, replace: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deaths?order=${nextOrder}&offset=${offset}&limit=${TIMELINE_PAGE_SIZE}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const slice: TimelineSlice = await res.json();
      setItems((prev) => (replace ? slice.items : [...prev, ...slice.items]));
      offsetRef.current = offset + slice.items.length;
      setHasMore(slice.hasMore);
    } catch {
      // ponech stávající stav; observer to zkusí znovu při dalším scrollu
    } finally {
      setLoading(false);
    }
  }, []);

  // Změna řazení → reset a načtení od začátku (první render „newest" přeskoč — máme SSR dávku).
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setItems([]);
    offsetRef.current = 0;
    setHasMore(true);
    void loadPage(order, 0, true);
  }, [order, loadPage]);

  // Infinite scroll přes IntersectionObserver.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          void loadPage(order, offsetRef.current, false);
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [order, hasMore, loading, loadPage]);

  const groups = useMemo(() => groupByMonth(items), [items]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Prohlášení o&nbsp;úmrtích Bitcoinu
          </h1>
          <p className="mt-2 text-base text-neutral-300">
            Chronologický přehled všech {total}&nbsp;prohlášení o&nbsp;úmrtích
            Bitcoinu od&nbsp;roku&nbsp;2010 do&nbsp;současnosti.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm text-neutral-300">Řazení:</span>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-1">
            <button
              type="button"
              onClick={() => setOrder("newest")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                order === "newest" ? "bg-[var(--bitcoin-orange)] text-black" : "text-neutral-300 hover:text-white"
              }`}
            >
              Nejnovější
            </button>
            <button
              type="button"
              onClick={() => setOrder("oldest")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                order === "oldest" ? "bg-[var(--bitcoin-orange)] text-black" : "text-neutral-300 hover:text-white"
              }`}
            >
              Nejstarší
            </button>
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={`${group.year}-${group.month}`} className="mb-12">
          <div className="sticky top-0 z-10 mb-4 bg-[var(--background)] py-2">
            <h2 className="text-lg font-bold text-white">
              {group.monthName} {group.year}
            </h2>
            <div className="mt-1 h-px bg-gradient-to-r from-[var(--bitcoin-orange)] to-transparent" />
          </div>

          <div className="space-y-6">
            {group.items.map((item) => (
              <TimelineCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
      ))}

      {hasMore && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}
      {loading && <p className="py-6 text-center text-sm text-neutral-400">Načítám&hellip;</p>}
    </div>
  );
}

function TimelineCard({ item }: { item: TimelineItem }) {
  return (
    <Link href={`/prohlaseni/${item.slug}`} className="block">
      <article className="group rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-all hover:border-[var(--bitcoin-orange)]/40 hover:shadow-lg hover:shadow-[var(--bitcoin-orange)]/5 cursor-pointer">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <time className="text-sm text-neutral-300">{formatCzechDate(item.date)}</time>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--bitcoin-orange)]/10 px-2 py-0.5 text-sm font-semibold text-[var(--bitcoin-orange)]">
              {item.priceCzk.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
            </span>
          </div>
        </div>

        {/* Ve výpisu jen český nadpis; anglický originál zobrazujeme jen na detailu článku */}
        <h3 className="mb-2 text-base font-semibold leading-snug text-white group-hover:text-[var(--bitcoin-orange)] transition-colors">
          {item.title}
        </h3>

        {item.quote && (
          <blockquote className="mb-3 border-l-2 border-[var(--death-red)]/50 pl-3 text-sm italic text-white">
            {item.quoteIsCs ? (
              <>&bdquo;{item.quote}&ldquo;</>
            ) : (
              <>&ldquo;{item.quote}&rdquo;</>
            )}
          </blockquote>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span className="font-medium text-neutral-300">{item.person}</span>
          {item.jobTitle && (
            <>
              <span className="text-neutral-400">&bull;</span>
              <span>{item.jobTitle}</span>
            </>
          )}
          <span className="text-neutral-400">&bull;</span>
          <span className="text-neutral-300">{item.publicationName}</span>
        </div>
      </article>
    </Link>
  );
}
