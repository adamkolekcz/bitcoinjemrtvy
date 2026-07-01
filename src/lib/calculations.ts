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
  quoteIsCs?: boolean;
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

/**
 * Naškáluje výsledek investice na jinou částku za úmrtí. Všechny korunové veličiny
 * (totalInvested, totalBtc, currentValue) jsou v částce lineární — viz calculateInvestment —
 * takže stačí násobit faktorem (= nová částka / původní částka). ROI je poměr dvou
 * lineárních veličin, tedy na částce nezávislé → zůstává beze změny.
 * Škálování je matematicky identické s přepočtem calculateInvestment, jen nepotřebuje deaths.
 */
export function scaleInvestmentResult(base: InvestmentResult, factor: number): InvestmentResult {
  return {
    totalInvested: base.totalInvested * factor,
    totalBtc: base.totalBtc * factor,
    currentValue: base.currentValue * factor,
    roi: base.roi,
    numberOfDeaths: base.numberOfDeaths,
  };
}

// ── „Je koruna mrtvá?" — cash counterfactual ────────────────────────────────
// Protějšek k BTC ROI: stejné vklady, ale držené v hotovosti a užírané inflací.
// Metoda převzata z forku nktrjsk/bitcoinjemrtvy (MIT).

export interface CashCounterfactualResult {
  /** Nominální součet vkladů (počet × vklad) — pod polštářem se nemění. */
  nominal: number;
  /** Reálná kupní síla těch vkladů v dnešních korunách. */
  realValue: number;
  /** Procentní ztráta kupní síly (záporné). */
  lossPct: number;
  /** Poslední uzavřený rok v CPI tabulce (referenční „dnešek"). */
  latestYear: number;
}

/**
 * Z ročních měr inflace (%) sestaví kumulativní cenový index (báze = první rok = 100).
 * Index_rok = Index_předchozí × (1 + míra/100). Slouží jen jako poměr, báze je libovolná.
 */
export function buildCpiIndex(rates: Record<string, number>): Record<number, number> {
  const years = Object.keys(rates)
    .map(Number)
    .sort((a, b) => a - b);
  const index: Record<number, number> = {};
  let acc = 100;
  years.forEach((yr, i) => {
    if (i === 0) {
      acc = 100;
    } else {
      acc *= 1 + rates[String(yr)] / 100;
    }
    index[yr] = acc;
  });
  return index;
}

/**
 * Spočítá, co by ze stejných vkladů zbylo, kdyby ležely v hotovosti.
 * Pro každou událost vklad `perDepositCzk` v roce události; jeho reálná hodnota dnes
 * = vklad × (CPI_rokUdálosti / CPI_poslední).
 *
 * „Dnešek" = běžící kalendářní rok (`options.now`). Roky po poslední vyplněné hodnotě
 * v tabulce se dopočítají provizorním odhadem `options.estimateRate` (% za rok, výchozí
 * 2,5 %), takže výpočet nezamrzne, když se tabulka roky nedoplní. Jakmile přidáš skutečné
 * číslo ČSÚ, odhad se sám posune na následující rok. Roky událostí mimo rozsah
 * [první rok tabulky, dnešek] se clampnou (vklad z dnešního roku ztratil 0 %).
 */
export function calculateCashCounterfactual(
  deaths: DeathEvent[],
  perDepositCzk: number,
  rates: Record<string, number>,
  options: { estimateRate?: number; now?: Date } = {},
): CashCounterfactualResult {
  const estimateRate = options.estimateRate ?? 2.5;
  const now = options.now ?? new Date();

  const cpi = buildCpiIndex(rates);
  const tableYears = Object.keys(cpi).map(Number);
  const minYear = Math.min(...tableYears);
  const lastTableYear = Math.max(...tableYears);

  // Dopočet nevyplněných roků odhadem až po běžící rok; „dnešek" = pozdější z obou.
  const latestYear = Math.max(lastTableYear, now.getFullYear());
  for (let y = lastTableYear + 1; y <= latestYear; y++) {
    cpi[y] = cpi[y - 1] * (1 + estimateRate / 100);
  }
  const cpiLatest = cpi[latestYear];

  let realValue = 0;
  for (const death of deaths) {
    const eventYear = parseDate(death.date).getFullYear();
    const clampedYear = Math.min(Math.max(eventYear, minYear), latestYear);
    realValue += perDepositCzk * (cpi[clampedYear] / cpiLatest);
  }

  const nominal = deaths.length * perDepositCzk;
  const lossPct = nominal > 0 ? ((realValue - nominal) / nominal) * 100 : 0;

  return { nominal, realValue, lossPct, latestYear };
}

/**
 * Naškáluje cash counterfactual na jinou částku. nominal i realValue jsou v částce
 * lineární; lossPct je poměr (na částce nezávislý) → beze změny. Stejný princip jako
 * scaleInvestmentResult.
 */
export function scaleCashResult(base: CashCounterfactualResult, factor: number): CashCounterfactualResult {
  return {
    nominal: base.nominal * factor,
    realValue: base.realValue * factor,
    lossPct: base.lossPct,
    latestYear: base.latestYear,
  };
}

/**
 * Slovní popis ztráty kupní síly v akuzativu pro footnote: „ztratila <X> kupní síly".
 * Vybere nejbližší „hezký" zlomek; do ±2 p.b. holé slovo, jinak kvalifikátor.
 */
export function describeLossFraction(absLossPct: number): string {
  const fractions = [
    { pct: 10, word: "desetinu" },
    { pct: 20, word: "pětinu" },
    { pct: 25, word: "čtvrtinu" },
    { pct: 100 / 3, word: "třetinu" },
    { pct: 50, word: "polovinu" },
  ];
  let nearest = fractions[0];
  for (const f of fractions) {
    if (Math.abs(absLossPct - f.pct) < Math.abs(absLossPct - nearest.pct)) {
      nearest = f;
    }
  }
  const diff = absLossPct - nearest.pct;
  if (Math.abs(diff) <= 2) return nearest.word;
  return diff > 0 ? `více než ${nearest.word}` : `téměř ${nearest.word}`;
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
          quoteIsCs: !!death.quote_cs,
          person: death.person,
          jobTitle: death.jobTitle,
          publicationName: death.publicationName,
          slug: generateDeathSlug(death),
        },
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

// ── Title tag ────────────────────────────────────────────────────────────────
// Ahrefs hlásí „Title too long" nad ~60 znaků. H1 na stránce zůstává plný,
// zkracujeme jen <title>: plný headline+suffix pokud se vejde, jinak samotný
// headline, jinak zkrácení na hranici slova + elipsa.
const TITLE_SUFFIX = " — Bitcoin je mrtvý";
const TITLE_MAX = 60;

export function buildPageTitle(headline: string): string {
  const trimmed = headline.trim();
  const withSuffix = `${trimmed}${TITLE_SUFFIX}`;
  if (withSuffix.length <= TITLE_MAX) return withSuffix;
  if (trimmed.length <= TITLE_MAX) return trimmed;
  const cut = trimmed.slice(0, TITLE_MAX - 1).replace(/\s+\S*$/, "").trimEnd();
  return `${cut}…`;
}
