import { NextResponse, type NextRequest } from "next/server";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";
import { sliceTimeline, TIMELINE_PAGE_SIZE } from "@/lib/timeline-item";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const order = sp.get("order") === "oldest" ? "oldest" : "newest";
  const offset = Math.max(0, Number.parseInt(sp.get("offset") ?? "0", 10) || 0);
  const rawLimit = Number.parseInt(sp.get("limit") ?? String(TIMELINE_PAGE_SIZE), 10) || TIMELINE_PAGE_SIZE;
  const limit = Math.min(60, Math.max(1, rawLimit));

  const [{ deaths }, coinGecko] = await Promise.all([
    getDeathsData(),
    getBtcCoinGeckoData(3600, false),
  ]);

  const slice = sliceTimeline(deaths, { order, offset, limit, usdToCzk: coinGecko.usdToCzk });
  return NextResponse.json(slice);
}
