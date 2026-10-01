import { getDeathsData } from "@/lib/deaths-data";
import { prepareChartData } from "@/lib/calculations";

// Data grafu (~215 KB) mimo HTML homepage: graf se renderuje jen na klientu (ssr:false),
// takže v RSC payloadu byla zbytečně — a přes prefetch odkazů na „/" se stahovala i z podstránek.
// Statická route s ISR → servíruje CDN.
export const revalidate = 3600;

export async function GET() {
  const { deaths } = await getDeathsData();
  return Response.json(prepareChartData(deaths));
}
