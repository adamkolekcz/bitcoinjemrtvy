# „Stejné peníze, dvě cesty" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat na homepage box „Stejné peníze, dvě cesty", který staví výnos BTC investice proti reálné kupní síle stejných vkladů držených v hotovosti (inflace).

**Architecture:** Čistá funkce `calculateCashCounterfactual` v `calculations.ts` (per-vklad CPI model, převzato z forku `nktrjsk/bitcoinjemrtvy`, MIT) počítá ztrátu z ročních měr inflace v `src/data/inflation-cz.json` (ČSÚ). Výpočet běží v Server Componentě `page.tsx` a výsledek se předává přes `StatsSection` do nové prezentační komponenty `TwoPathsCard`, vyrenderované nad box „Je Bitcoin mrtvý?".

**Tech Stack:** TypeScript, Next.js (App Router, Server Components), Tailwind, `node:test` (`.mts`), pnpm.

## Global Constraints

- TypeScript: nikdy `any`, vždy explicitní typy; `interface` pro tvary, `type` pro aliasy.
- JSX: žádné literální `"`/`'`/`-`; používej HTML entity (`&minus;`, `&nbsp;`, `&quot;`).
- Server Components jsou výchozí — `TwoPathsCard` je čistě prezentační, **žádné `'use client'`**.
- Testy: `node:test` + `node:assert/strict`, soubor `.mts`, import z `./calculations.ts`.
- Spouštění: `pnpm test`, `pnpm lint`, `pnpm build`.
- **Žádná `.mjs` duplikace:** nové funkce nejsou používány skripty v `scripts/` → `scripts/lib/translate-core.mjs` se NEMĚNÍ. `calculateCashCounterfactual` znovupoužívá existující `parseDate` z `calculations.ts`, neduplikuje ji.
- **Nepushovat** — commituj lokálně po taskách; push se řeší až s celou feature zvlášť (deploy-economics: každý push = 1 Vercel build).
- Vstupní vklad: `INVESTMENT_PER_DEATH_CZK = 1000` (už existuje v `page.tsx`).

---

## File Structure

| Soubor | Odpovědnost |
|--------|-------------|
| `src/data/inflation-cz.json` | Roční míry inflace ČSÚ (data, zdroj pravdy). |
| `src/lib/calculations.ts` | Čisté funkce: CPI index, cash counterfactual, slovní zlomek. |
| `src/lib/calculations.test.mts` | Unit testy výše uvedených funkcí. |
| `src/components/TwoPathsCard.tsx` | Prezentace boxu (props in → JSX). |
| `src/components/StatsSection.tsx` | Skládá `TwoPathsCard` nad „Je Bitcoin mrtvý?". |
| `src/app/page.tsx` | Načte data, spočítá `cash`, předá prop. |

---

## Task 1: Inflační datový soubor

**Files:**
- Create: `src/data/inflation-cz.json`

**Interfaces:**
- Produces: JSON s polem `rates: Record<string, number>` (roky 2009–2025) — konzumuje Task 5.

- [ ] **Step 1: Vytvoř datový soubor**

Create `src/data/inflation-cz.json`:

```json
{
  "source": "Český statistický úřad — průměrná roční míra inflace (%)",
  "sourceUrl": "https://csu.gov.cz/prumerna-rocni-mira-inflace",
  "lastUpdated": "2026-06-29",
  "note": "Roční průměrná míra inflace v ČR v %. Index kupní síly dopočítává buildCpiIndex/calculateCashCounterfactual v src/lib/calculations.ts. Neúplný letošní rok → vklady z něj se clampnou na poslední uzavřený rok (ztratily ~0 %). Aktualizovat jednou ročně.",
  "rates": {
    "2009": 1.0,
    "2010": 1.5,
    "2011": 1.9,
    "2012": 3.3,
    "2013": 1.4,
    "2014": 0.4,
    "2015": 0.3,
    "2016": 0.7,
    "2017": 2.5,
    "2018": 2.1,
    "2019": 2.8,
    "2020": 3.2,
    "2021": 3.8,
    "2022": 15.1,
    "2023": 10.7,
    "2024": 2.4,
    "2025": 2.5
  }
}
```

- [ ] **Step 2: Ověř, že parsuje a má očekávané roky**

Run:
```bash
node -e "const d=require('./src/data/inflation-cz.json'); const y=Object.keys(d.rates); if(d.rates['2009']!==1.0||d.rates['2025']!==2.5||y.length!==17){throw new Error('bad table: '+y.length)} console.log('OK', y.length, 'let, 2022='+d.rates['2022'])"
```
Expected: `OK 17 let, 2022=15.1`

- [ ] **Step 3: Commit**

```bash
git add src/data/inflation-cz.json
git commit -m "data: roční míry inflace ČSÚ (2009–2025) pro cash counterfactual"
```

---

## Task 2: CPI index + cash counterfactual

**Files:**
- Modify: `src/lib/calculations.ts` (přidat za `calculateInvestment`, před `prepareChartData`)
- Test: `src/lib/calculations.test.mts`

**Interfaces:**
- Consumes: existující `DeathEvent`, `parseDate` z `calculations.ts`.
- Produces:
  - `interface CashCounterfactualResult { nominal: number; realValue: number; lossPct: number; latestYear: number; }`
  - `buildCpiIndex(rates: Record<string, number>): Record<number, number>`
  - `calculateCashCounterfactual(deaths: DeathEvent[], perDepositCzk: number, rates: Record<string, number>): CashCounterfactualResult`

- [ ] **Step 1: Napiš padající testy**

V `src/lib/calculations.test.mts` uprav importní řádek a přidej helper + testy.

Změň existující import (přidej nové symboly a typ `DeathEvent`):

```ts
import {
  getYearsTracking,
  getBitcoinAgeYears,
  buildCpiIndex,
  calculateCashCounterfactual,
} from "./calculations.ts";
import type { DeathEvent } from "./calculations.ts";
```

Přidej na konec souboru:

```ts
function makeDeath(date: string): DeathEvent {
  return {
    date,
    bitcoinPrice: 100,
    articleTitle: "x",
    person: "x",
    publicationName: "x",
    jobTitle: "x",
    slug: "x",
    type: "x",
  };
}

// ── cash counterfactual ──────────────────────────────────────────────────────

test("CPI index: báze prvního roku = 100, kumulace měr", () => {
  const idx = buildCpiIndex({ "2020": 5, "2021": 10, "2022": 2 });
  assert.equal(idx[2020], 100);
  assert.ok(Math.abs(idx[2021] - 110) < 1e-9);
  assert.ok(Math.abs(idx[2022] - 112.2) < 1e-9);
});

test("koruna: vklad v posledním roce neztratí nic (0 %)", () => {
  const r = calculateCashCounterfactual([makeDeath("6/1/2022")], 1000, {
    "2020": 5,
    "2021": 10,
    "2022": 2,
  });
  assert.equal(r.nominal, 1000);
  assert.equal(r.latestYear, 2022);
  assert.ok(Math.abs(r.realValue - 1000) < 1e-9);
  assert.ok(Math.abs(r.lossPct - 0) < 1e-9);
});

test("koruna: starší vklad ztratil kupní sílu (záporné %)", () => {
  const r = calculateCashCounterfactual([makeDeath("6/1/2020")], 1000, {
    "2020": 5,
    "2021": 10,
    "2022": 2,
  });
  assert.ok(Math.abs(r.realValue - (1000 * 100) / 112.2) < 1e-6);
  assert.ok(r.lossPct < 0);
  assert.ok(Math.abs(r.lossPct - ((100 / 112.2 - 1) * 100)) < 1e-6);
});

test("koruna: rok mimo tabulku se clampne (neúplný letošek ~0 %)", () => {
  const rates = { "2020": 5, "2021": 10, "2022": 2 };
  const future = calculateCashCounterfactual([makeDeath("6/1/2026")], 1000, rates);
  assert.ok(Math.abs(future.realValue - 1000) < 1e-9);
  const past = calculateCashCounterfactual([makeDeath("6/1/2015")], 1000, rates);
  assert.ok(Math.abs(past.realValue - (1000 * 100) / 112.2) < 1e-6);
});

test("koruna: nominál = počet × vklad", () => {
  const r = calculateCashCounterfactual(
    [makeDeath("6/1/2020"), makeDeath("6/1/2021"), makeDeath("6/1/2022")],
    1000,
    { "2020": 5, "2021": 10, "2022": 2 },
  );
  assert.equal(r.nominal, 3000);
});
```

- [ ] **Step 2: Spusť testy — musí padat**

Run: `pnpm test`
Expected: FAIL — `buildCpiIndex`/`calculateCashCounterfactual` neexistují (import error / not a function).

- [ ] **Step 3: Implementuj funkce**

V `src/lib/calculations.ts`, **za** funkci `calculateInvestment` (končí `}` na řádku s `return { ... };`) a **před** `export function prepareChartData`, vlož:

```ts
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
 * = vklad × (CPI_rokUdálosti / CPI_poslední). Roky mimo tabulku se clampnou do rozsahu
 * (vklad z letošního neuzavřeného roku ztratil ~0 %).
 */
export function calculateCashCounterfactual(
  deaths: DeathEvent[],
  perDepositCzk: number,
  rates: Record<string, number>,
): CashCounterfactualResult {
  const cpi = buildCpiIndex(rates);
  const tableYears = Object.keys(cpi).map(Number);
  const minYear = Math.min(...tableYears);
  const latestYear = Math.max(...tableYears);
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
```

- [ ] **Step 4: Spusť testy — musí projít**

Run: `pnpm test`
Expected: PASS (všechny nové testy zelené, existující beze změny).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculations.ts src/lib/calculations.test.mts
git commit -m "feat: cash counterfactual — CPI index + ztráta kupní síly (z forku, MIT)"
```

---

## Task 3: Slovní zlomek pro footnote (`describeLossFraction`)

**Files:**
- Modify: `src/lib/calculations.ts` (přidat za `calculateCashCounterfactual`)
- Test: `src/lib/calculations.test.mts`

**Interfaces:**
- Produces: `describeLossFraction(absLossPct: number): string` — konzumuje Task 4.

- [ ] **Step 1: Napiš padající testy**

V `src/lib/calculations.test.mts` přidej `describeLossFraction` do importu z `./calculations.ts`:

```ts
import {
  getYearsTracking,
  getBitcoinAgeYears,
  buildCpiIndex,
  calculateCashCounterfactual,
  describeLossFraction,
} from "./calculations.ts";
```

Přidej na konec souboru:

```ts
// ── slovní zlomek ────────────────────────────────────────────────────────────

test("zlomek: 25 % = čtvrtinu (holé slovo)", () => {
  assert.equal(describeLossFraction(25), "čtvrtinu");
});

test("zlomek: 26 % = čtvrtinu (do ±2 p.b. holé)", () => {
  assert.equal(describeLossFraction(26), "čtvrtinu");
});

test("zlomek: 29 % = více než čtvrtinu", () => {
  assert.equal(describeLossFraction(29), "více než čtvrtinu");
});

test("zlomek: 30 % = téměř třetinu", () => {
  assert.equal(describeLossFraction(30), "téměř třetinu");
});

test("zlomek: 20 % = pětinu, 50 % = polovinu", () => {
  assert.equal(describeLossFraction(20), "pětinu");
  assert.equal(describeLossFraction(50), "polovinu");
});
```

- [ ] **Step 2: Spusť testy — musí padat**

Run: `pnpm test`
Expected: FAIL — `describeLossFraction` neexistuje.

- [ ] **Step 3: Implementuj funkci**

V `src/lib/calculations.ts`, **za** `calculateCashCounterfactual` (před `prepareChartData`), vlož:

```ts
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
```

- [ ] **Step 4: Spusť testy — musí projít**

Run: `pnpm test`
Expected: PASS (všech 5 nových testů zelené).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculations.ts src/lib/calculations.test.mts
git commit -m "feat: describeLossFraction — slovní zlomek ztráty kupní síly dynamicky"
```

---

## Task 4: Komponenta `TwoPathsCard`

**Files:**
- Create: `src/components/TwoPathsCard.tsx`

**Interfaces:**
- Consumes: `formatCurrency`, `describeLossFraction`, `InvestmentResult`, `CashCounterfactualResult` z `@/lib/calculations`.
- Produces: `TwoPathsCard({ investment, cash }: { investment: InvestmentResult; cash: CashCounterfactualResult })` — konzumuje Task 5.

- [ ] **Step 1: Vytvoř komponentu**

Create `src/components/TwoPathsCard.tsx`:

```tsx
import {
  formatCurrency,
  describeLossFraction,
  type InvestmentResult,
  type CashCounterfactualResult,
} from "@/lib/calculations";

interface TwoPathsCardProps {
  investment: InvestmentResult;
  cash: CashCounterfactualResult;
}

export function TwoPathsCard({ investment, cash }: TwoPathsCardProps) {
  return (
    <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
      <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">
        Stejné peníze, dvě cesty
      </h3>
      <p className="mb-6 text-sm leading-relaxed text-neutral-400 sm:text-base">
        A co kdybyste místo Bitcoinu těch{" "}
        <strong className="text-white">{formatCurrency(cash.nominal)}</strong>{" "}
        jen schovávali pod polštář? Ležely by tam dál — jenže inflace je každý rok ukrojí.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--bitcoin-orange)]/30 bg-[var(--bitcoin-orange)]/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-300">
            V Bitcoinu
          </p>
          <p className="mt-2 text-2xl font-bold text-green-500 sm:text-3xl">
            +{Math.round(investment.roi).toLocaleString("cs-CZ")}&nbsp;%
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            {formatCurrency(investment.currentValue)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--death-red)]/30 bg-[var(--death-red)]/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-300">
            Pod polštářem
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--death-red)] sm:text-3xl">
            &minus;{Math.round(Math.abs(cash.lossPct)).toLocaleString("cs-CZ")}&nbsp;%
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            kupní síla dnes jen {formatCurrency(cash.realValue)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-neutral-500">
        Koruna v hotovosti od roku&nbsp;2010 ztratila{" "}
        {describeLossFraction(Math.abs(cash.lossPct))} kupní síly. Ne Bitcoin, ale{" "}
        <strong className="text-neutral-300">koruna pod polštářem pomalu umírá</strong>{" "}
        &mdash; užírá ji inflace. Přepočteno přes průměrnou roční inflaci ČSÚ (kupní síla
        v&nbsp;korunách roku&nbsp;{cash.latestYear}).
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Ověř lint (komponenta se zatím nerenderuje)**

Run: `pnpm lint`
Expected: PASS — žádné chyby v `TwoPathsCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/TwoPathsCard.tsx
git commit -m "feat: TwoPathsCard — UI boxu „Stejné peníze, dvě cesty\""
```

---

## Task 5: Zapojení (StatsSection + page.tsx + data)

**Files:**
- Modify: `src/components/StatsSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `TwoPathsCard`, `calculateCashCounterfactual`, `inflation-cz.json` (Task 1), `CashCounterfactualResult`.

- [ ] **Step 1: Rozšiř `StatsSection` o prop `cash` a import**

V `src/components/StatsSection.tsx` změň importní blok (řádky 1–3):

```tsx
import Link from "next/link";
import {
  formatCurrency,
  type InvestmentResult,
  type CashCounterfactualResult,
} from "@/lib/calculations";
import { BitcoinAgeCounter } from "@/components/BitcoinAgeCounter";
import { TwoPathsCard } from "@/components/TwoPathsCard";
```

Rozšiř `interface StatsSectionProps` o `cash`:

```tsx
interface StatsSectionProps {
  investment: InvestmentResult;
  cash: CashCounterfactualResult;
  currentBtcPriceCzk: number;
  investmentPerDeath: number;
  btcMarketCapCzk: number | null;
}
```

A destrukturalizaci v hlavičce funkce:

```tsx
export function StatsSection({
  investment,
  cash,
  currentBtcPriceCzk,
  investmentPerDeath,
  btcMarketCapCzk,
}: StatsSectionProps) {
```

- [ ] **Step 2: Vlož `TwoPathsCard` nad box „Je Bitcoin mrtvý?"**

V `src/components/StatsSection.tsx` najdi blok:

```tsx
      <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8">
        <h3 className="mb-4 text-xl font-bold text-white sm:text-2xl">
          Je Bitcoin mrtvý?
        </h3>
```

a **těsně před** něj vlož:

```tsx
      <TwoPathsCard investment={investment} cash={cash} />

```

(Výsledné pořadí: 4 StatCards grid → `TwoPathsCard` → „Je Bitcoin mrtvý?".)

- [ ] **Step 3: Spočítej `cash` v `page.tsx` a předej prop**

V `src/app/page.tsx` změň importní řádky 5–6:

```tsx
import { prepareChartData, calculateInvestment, calculateCashCounterfactual, parseDate } from "@/lib/calculations";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";
import inflationCz from "@/data/inflation-cz.json";
```

Za blok `const investment = calculateInvestment(...);` (končí `);`) přidej:

```tsx
  const cash = calculateCashCounterfactual(
    deaths,
    INVESTMENT_PER_DEATH_CZK,
    inflationCz.rates
  );
```

A do `<StatsSection ... />` přidej prop `cash` (za `investment`):

```tsx
        <StatsSection
          investment={investment}
          cash={cash}
          currentBtcPriceCzk={currentBtcPriceCzk}
          investmentPerDeath={INVESTMENT_PER_DEATH_CZK}
          btcMarketCapCzk={btcMarketCapCzk}
        />
```

- [ ] **Step 4: Ověř build (type-check) a testy**

Run: `pnpm build`
Expected: PASS — build projde bez type chyb (ověří i `inflationCz.rates` jako `Record<string, number>`).

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Vizuální ověření na dev serveru**

Run: `pnpm dev` a otevři `http://localhost:3000`.
Expected: Box „Stejné peníze, dvě cesty" je **nad** „Je Bitcoin mrtvý?", ukazuje:
- nominál ≈ `475 000 Kč` v úvodní větě,
- V BITCOINU `+~132 151 %` zelená + hodnota portfolia,
- POD POLŠTÁŘEM `−~26 %` červená + „kupní síla dnes jen ~351 008 Kč",
- footnote: „...ztratila čtvrtinu kupní síly... v korunách roku 2025."

- [ ] **Step 6: Commit**

```bash
git add src/components/StatsSection.tsx src/app/page.tsx
git commit -m "feat: homepage box „Stejné peníze, dvě cesty\" nad „Je Bitcoin mrtvý?\""
```

---

## Self-Review

**Spec coverage:**
- Metoda výpočtu (per-vklad CPI, clamp) → Task 2 ✓
- Zdroj dat ČSÚ → Task 1 ✓
- `describeLossFraction` (odchylka od forku) → Task 3 ✓
- UI v samostatné `TwoPathsCard` → Task 4 ✓
- Umístění nad „Je Bitcoin mrtvý?" → Task 5 Step 2 ✓
- Wiring v `page.tsx` → Task 5 Step 3 ✓
- Testy (forkové + nové) → Task 2, Task 3 ✓
- Atribuce (komentář v `calculations.ts` + commit) → Task 2 Step 3 (komentář) + commit message ✓
- Mimo rozsah (`/letak`, runtime fetch) → nezahrnuto ✓
- Real vs nominál → footnote v Task 4 odlišuje „kupní síla" ✓

**Placeholder scan:** žádné TBD/TODO; každý krok má konkrétní kód/příkaz/očekávaný výstup. ✓

**Type consistency:** `CashCounterfactualResult { nominal, realValue, lossPct, latestYear }` definováno v Task 2, konzumováno beze změny názvů v Task 4/5. `describeLossFraction(absLossPct: number): string` konzistentní Task 3 → Task 4. `inflationCz.rates` typu `Record<string, number>` sedí do `calculateCashCounterfactual`. ✓
