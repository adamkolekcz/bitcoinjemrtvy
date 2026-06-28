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

// Minimální podmnožina DeathEvent, kterou graf reálně vykresluje (tooltip + klik).
// Posílá se klientovi místo celého DeathEvent → výrazně menší dokument + hydratace.
export interface ChartDeath {
  title: string;
  quote?: string;
  person: string;
  jobTitle: string;
  publicationName: string;
  slug: string;
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  price: number;
  death?: ChartDeath;
  isCurrentPrice?: boolean;
}

export interface InvestmentResult {
  totalInvested: number;
  totalBtc: number;
  currentValue: number;
  roi: number;
  numberOfDeaths: number;
}

const TRACKING_START = { year: 2010, month: 10, day: 15 };

export function getYearsTracking(now: Date = new Date()): number {
  let years = now.getFullYear() - TRACKING_START.year;
  const anniversaryThisYear = new Date(
    now.getFullYear(),
    TRACKING_START.month - 1,
    TRACKING_START.day,
  );
  if (now < anniversaryThisYear) years--;
  return years;
}

// Genesis block (block 0): 2009-01-03. Stejný počátek jako counter
// "Jak dlouho žije Bitcoin?" (BitcoinAgeCounter) → čísla zůstávají konzistentní.
const BITCOIN_GENESIS = { year: 2009, month: 1, day: 3 };

export function getBitcoinAgeYears(now: Date = new Date()): number {
  let years = now.getFullYear() - BITCOIN_GENESIS.year;
  const anniversaryThisYear = new Date(
    now.getFullYear(),
    BITCOIN_GENESIS.month - 1,
    BITCOIN_GENESIS.day,
  );
  if (now < anniversaryThisYear) years--;
  return years;
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

// Bohatý, unikátní meta description pro detailní stránku (~120–160 znaků).
// Bez citátu (dřív fallback ~30 znaků) doplní kontextovou větu, ať není moc krátký.
export function buildDeathMetaDescription(death: DeathEvent): string {
  const date = formatCzechDate(death.date);
  const author = death.jobTitle ? `${death.person} (${death.jobTitle})` : death.person;
  const base = `${author} prohlásil Bitcoin za mrtvý — ${death.publicationName}, ${date}.`;
  const quote = death.quote_cs ?? death.quote;
  const full = quote
    ? `${base} „${quote.replace(/\s+/g, " ").trim()}"`
    : `${base} Podívejte se, jak si Bitcoin vedl od tohoto prohlášení až dodnes.`;

  if (full.length <= 160) return full;
  return `${full.slice(0, 159).replace(/\s+\S*$/, "")}…`;
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
      const fullQuote = death.quote_cs ?? death.quote;
      return {
        timestamp: date.getTime(),
        date: death.date,
        price: death.bitcoinPrice,
        death: {
          title: death.articleTitle_cs ?? death.articleTitle,
          quote: fullQuote && fullQuote.length > 120 ? `${fullQuote.slice(0, 120)}...` : fullQuote,
          person: death.person,
          jobTitle: death.jobTitle,
          publicationName: death.publicationName,
          slug: generateDeathSlug(death),
        },
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}
