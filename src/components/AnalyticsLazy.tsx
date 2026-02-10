"use client";

import dynamic from "next/dynamic";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => ({ default: mod.Analytics })),
  { ssr: false }
);

export function AnalyticsLazy() {
  return <Analytics />;
}
