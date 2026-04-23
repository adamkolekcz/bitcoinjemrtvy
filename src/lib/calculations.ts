export interface DeathEvent {
  date: string;
  bitcoinPrice: number;
  articleTitle: string;
  articleTitle_cs?: string;
  person: string;
  publicationName: string;
  jobTitle: string;
  slug: string;
  type: string;
  quote?: string;
  quote_cs?: string;
  sourceUrl?: string;
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  price: number;
  death?: DeathEvent;
  isCurrentPrice?: boolean;
}

export interface InvestmentResult {
  totalInvested: number;
  totalBtc: number;
  currentValue: number;
  roi: number;
  numberOfDeaths: number;
}

export function parseDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

export function formatCzechDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generateDeathSlug(death: DeathEvent): string {
  const date = parseDate(death.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const title = death.articleTitle_cs ?? death.articleTitle;
  const titleSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return `${day}-${month}-${year}-${titleSlug}`;
}

export function formatCurrency(value: number, currency: string = "CZK"): string {
  if (currency === "CZK") {
    const formatted = new Intl.NumberFormat("cs-CZ", {
      maximumFractionDigits: 0,
    }).format(value);
    return `${formatted} Kč`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function calculateInvestment(
  deaths: DeathEvent[],
  investmentPerDeath: number,
  currentBtcPrice: number,
  czkToUsd: number = 0.042
): InvestmentResult {
  const investmentInUsd = investmentPerDeath * czkToUsd;

  let totalBtc = 0;
  for (const death of deaths) {
    if (death.bitcoinPrice > 0) {
      totalBtc += investmentInUsd / death.bitcoinPrice;
    }
  }

  const currentValueUsd = totalBtc * currentBtcPrice;
  const currentValueCzk = currentValueUsd / czkToUsd;
  const totalInvested = deaths.length * investmentPerDeath;
  const roi = ((currentValueCzk - totalInvested) / totalInvested) * 100;

  return {
    totalInvested,
    totalBtc,
    currentValue: currentValueCzk,
    roi,
    numberOfDeaths: deaths.length,
  };
}

export function prepareChartData(deaths: DeathEvent[]): ChartDataPoint[] {
  return deaths
    .filter((d) => d.bitcoinPrice > 0)
    .map((death) => {
      const date = parseDate(death.date);
      return {
        timestamp: date.getTime(),
        date: death.date,
        price: death.bitcoinPrice,
        death,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}
