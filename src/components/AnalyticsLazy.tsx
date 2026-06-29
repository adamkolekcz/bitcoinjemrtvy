"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => ({ default: mod.Analytics })),
  { ssr: false }
);

export function AnalyticsLazy() {
  const pathname = usePathname();
  // Embed widgety běží v iframe na cizích webech — nevkládáme tam tracking.
  if (pathname === "/embed/counter" || pathname === "/embed/stats") return null;
  return <Analytics />;
}
