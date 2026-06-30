import { getBtcCoinGeckoData } from "@/lib/deaths-data";

// Cena pro patičku. Reuse stejného fallback řetězce (Kraken → Coinbase → CoinGecko)
// jako zbytek webu, aby cena seděla. Cachuje se hodinu.
export const revalidate = 3600;

export async function GET() {
  const { priceCzk } = await getBtcCoinGeckoData();
  return Response.json({ priceCzk });
}
