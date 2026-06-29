import type { Metadata } from "next";
import { getDeathsData } from "@/lib/deaths-data";
import { CounterWidget } from "@/components/embed/CounterWidget";

export const revalidate = 3600;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CounterEmbed() {
  const { deaths } = await getDeathsData();
  return <CounterWidget count={deaths.length} />;
}
