import type { DeathEvent } from "./calculations";
import { parseDate, generateDeathSlug } from "./calculations";

// Kolik položek na dávku (SSR první dávka + každý infinite-scroll fetch).
export const TIMELINE_PAGE_SIZE = 40;

// Odlehčený tvar posílaný klientovi místo celého DeathEvent → menší HTML/payload.
export interface TimelineItem {
  date: string;
  title: string;
  quote?: string;
  quoteIsCs: boolean;
  person: string;
  jobTitle: string;
  publicationName: string;
  slug: string;
  priceCzk: number;
}

export interface TimelineSlice {
  items: TimelineItem[];
  total: number;
  hasMore: boolean;
}

export function toTimelineItem(death: DeathEvent, usdToCzk: number): TimelineItem {
  const quote = death.quote_cs ?? death.quote;
  return {
    date: death.date,
    title: death.articleTitle_cs ?? death.articleTitle,
    quote,
    quoteIsCs: !!death.quote_cs,
    person: death.person,
    jobTitle: death.jobTitle,
    publicationName: death.publicationName,
    slug: generateDeathSlug(death),
    priceCzk: Math.round(death.bitcoinPrice * usdToCzk),
  };
}

interface SliceParams {
  order: "newest" | "oldest";
  offset: number;
  limit: number;
  usdToCzk: number;
}

export function sliceTimeline(deaths: DeathEvent[], { order, offset, limit, usdToCzk }: SliceParams): TimelineSlice {
  const sorted = [...deaths].sort((a, b) => {
    const da = parseDate(a.date).getTime();
    const db = parseDate(b.date).getTime();
    return order === "newest" ? db - da : da - db;
  });
  const page = sorted.slice(offset, offset + limit);
  return {
    items: page.map((d) => toTimelineItem(d, usdToCzk)),
    total: deaths.length,
    hasMore: offset + limit < deaths.length,
  };
}
