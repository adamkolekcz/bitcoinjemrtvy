# Embed widgety — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embeddable iframe widgety (Death Counter + Stats Card) v češtině + galerijní stránka `/embed` s návodem a copy-paste kódem, v tmavém stylu webu.

**Architecture:** Každý widget je samostatná „lean" Next route (`/embed/counter`, `/embed/stats`) renderující jen widget (root layout ji obalí `<html><body>`), s `noindex` a ISR. Host si je vloží přes `<iframe>`. Galerie `/embed` je normální stránka (Header/Footer) se živými náhledy (iframe) a copy kódem. Analytika se na widget routes vypne.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind 4, `node --test`.

## Global Constraints

- TypeScript: žádné `any`, explicitní typy; `interface` pro tvary objektů.
- JSX: HTML entity (`&nbsp;`, `&minus;`), ne literální znaky.
- Server Components výchozí; `"use client"` jen kde je interakce (CopyEmbedCode, AnalyticsLazy).
- Tmavé widgety: pozadí `var(--card-bg)` (#141414), rámeček `var(--card-border)`, oranžová `var(--bitcoin-orange)`, zelená `text-green-500`. Žádné bílé pozadí.
- Produkční origin: `https://www.bitcoinjemrtvy.cz` (konstanta `EMBED_ORIGIN`).
- Rozměry widgetů (jeden zdroj pravdy, `EMBED_WIDGETS`): counter 300×72, stats 460×220 (px lze doladit na dev serveru, ať se obsah vejde bez scrollu).
- Vklad: `INVESTMENT_PER_DEATH_CZK = 1000`.
- Testy: `pnpm test` (node --test, auto-discovery `*.test.mts`). Lint: `pnpm lint`. Build: `pnpm build`.
- Nepushovat (deploy-economics) — commituj lokálně.

---

## File Structure

| Soubor | Odpovědnost |
|--------|-------------|
| `src/lib/calculations.ts` | + `formatCzkCompact` (kompaktní částka). |
| `src/lib/embed-config.ts` | `EMBED_ORIGIN`, `EMBED_WIDGETS`, `buildEmbedSnippet`. |
| `src/lib/embed-config.test.mts` | testy snippetu. |
| `src/components/embed/CounterWidget.tsx` | prezentace odznaku. |
| `src/components/embed/StatsWidget.tsx` | prezentace karty. |
| `src/components/embed/CopyEmbedCode.tsx` | client: kód + tlačítko Kopírovat. |
| `src/app/embed/counter/page.tsx` | lean route → CounterWidget. |
| `src/app/embed/stats/page.tsx` | lean route → StatsWidget. |
| `src/app/embed/page.tsx` | galerie. |
| `src/components/AnalyticsLazy.tsx` | guard: vypnout na widget routes. |

---

## Task 1: Kompaktní formát částky (`formatCzkCompact`)

**Files:**
- Modify: `src/lib/calculations.ts` (přidat za `formatCurrency`)
- Test: `src/lib/calculations.test.mts`

**Interfaces:**
- Consumes: existující `formatCurrency`.
- Produces: `formatCzkCompact(value: number): string`

- [ ] **Step 1: Napiš padající testy**

V `src/lib/calculations.test.mts` přidej `formatCzkCompact` a `formatCurrency` do importu z `./calculations.ts` a na konec souboru přidej:

```ts
// ── kompaktní částka ─────────────────────────────────────────────────────────

test("formatCzkCompact: miliony", () => {
  assert.equal(formatCzkCompact(626192431), "626 mil. Kč");
});

test("formatCzkCompact: miliardy s desetinou", () => {
  assert.equal(formatCzkCompact(1234567890), "1,2 mld. Kč");
});

test("formatCzkCompact: pod milion deleguje na formatCurrency", () => {
  assert.equal(formatCzkCompact(50000), formatCurrency(50000));
});
```

(Import řádek rozšiř o `formatCurrency,` a `formatCzkCompact,`.)

- [ ] **Step 2: Spusť testy — musí padat**

Run: `pnpm test`
Expected: FAIL — `formatCzkCompact` neexistuje.

- [ ] **Step 3: Implementuj**

V `src/lib/calculations.ts` **za** funkci `formatCurrency` přidej:

```ts
/** Kompaktní český zápis částky pro úzké widgety: „626 mil. Kč", „1,2 mld. Kč". */
export function formatCzkCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    const n = (value / 1_000_000_000).toLocaleString("cs-CZ", { maximumFractionDigits: 1 });
    return `${n} mld. Kč`;
  }
  if (abs >= 1_000_000) {
    const n = Math.round(value / 1_000_000).toLocaleString("cs-CZ");
    return `${n} mil. Kč`;
  }
  return formatCurrency(value);
}
```

- [ ] **Step 4: Spusť testy — musí projít**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculations.ts src/lib/calculations.test.mts
git commit -m "feat: formatCzkCompact — kompaktní zápis částky pro widgety"
```

---

## Task 2: Embed konfigurace + snippet (`embed-config.ts`)

**Files:**
- Create: `src/lib/embed-config.ts`
- Test: `src/lib/embed-config.test.mts`

**Interfaces:**
- Produces:
  - `EMBED_ORIGIN: string`
  - `EmbedWidgetKey = "counter" | "stats"`
  - `EMBED_WIDGETS: Record<EmbedWidgetKey, { key: EmbedWidgetKey; width: number; height: number; title: string }>`
  - `buildEmbedSnippet(key: EmbedWidgetKey): string`

- [ ] **Step 1: Napiš padající testy**

Create `src/lib/embed-config.test.mts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEmbedSnippet, EMBED_WIDGETS } from "./embed-config.ts";

test("snippet counter má správné URL a rozměry", () => {
  const s = buildEmbedSnippet("counter");
  assert.ok(s.includes('src="https://www.bitcoinjemrtvy.cz/embed/counter"'));
  assert.ok(s.includes('width="300"'));
  assert.ok(s.includes('height="72"'));
  assert.ok(s.includes('scrolling="no"'));
});

test("snippet stats odkazuje na /embed/stats", () => {
  const s = buildEmbedSnippet("stats");
  assert.ok(s.includes("/embed/stats"));
  assert.ok(s.includes('width="460"'));
});

test("EMBED_WIDGETS má oba widgety", () => {
  assert.equal(EMBED_WIDGETS.counter.key, "counter");
  assert.equal(EMBED_WIDGETS.stats.key, "stats");
});
```

- [ ] **Step 2: Spusť testy — musí padat**

Run: `pnpm test`
Expected: FAIL — modul `embed-config.ts` neexistuje.

- [ ] **Step 3: Implementuj**

Create `src/lib/embed-config.ts`:

```ts
export const EMBED_ORIGIN = "https://www.bitcoinjemrtvy.cz";

export type EmbedWidgetKey = "counter" | "stats";

export interface EmbedWidget {
  key: EmbedWidgetKey;
  width: number;
  height: number;
  title: string;
}

export const EMBED_WIDGETS: Record<EmbedWidgetKey, EmbedWidget> = {
  counter: { key: "counter", width: 300, height: 72, title: "Bitcoin je mrtvý — počítadlo úmrtí" },
  stats: { key: "stats", width: 460, height: 220, title: "Bitcoin je mrtvý — statistická karta" },
};

/** Copy-paste iframe snippet pro daný widget. */
export function buildEmbedSnippet(key: EmbedWidgetKey): string {
  const w = EMBED_WIDGETS[key];
  return `<iframe src="${EMBED_ORIGIN}/embed/${w.key}" width="${w.width}" height="${w.height}" frameborder="0" scrolling="no" style="border:none;overflow:hidden;" title="${w.title}"></iframe>`;
}
```

- [ ] **Step 4: Spusť testy — musí projít**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/embed-config.ts src/lib/embed-config.test.mts
git commit -m "feat: embed-config — origin, rozměry widgetů, generátor iframe snippetu"
```

---

## Task 3: Death Counter widget + route

**Files:**
- Create: `src/components/embed/CounterWidget.tsx`
- Create: `src/app/embed/counter/page.tsx`

**Interfaces:**
- Consumes: `EMBED_ORIGIN`, `getDeathsData`.
- Produces: `CounterWidget({ count }: { count: number })`; route `/embed/counter`.

- [ ] **Step 1: Vytvoř komponentu**

Create `src/components/embed/CounterWidget.tsx`:

```tsx
import { EMBED_ORIGIN } from "@/lib/embed-config";

export function CounterWidget({ count }: { count: number }) {
  return (
    <a
      href={EMBED_ORIGIN}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-screen w-full items-center gap-3 border border-[var(--card-border)] bg-[var(--card-bg)] px-4 no-underline"
    >
      <span className="text-2xl font-bold leading-none text-[var(--bitcoin-orange)]">&#8383;</span>
      <span className="leading-tight">
        <span className="block text-xs font-medium uppercase tracking-wider text-neutral-300">
          Bitcoin je mrtvý
        </span>
        <span className="block text-sm font-bold text-white">
          <span className="text-[var(--bitcoin-orange)]">{count.toLocaleString("cs-CZ")}&times;</span>{" "}
          a&nbsp;počítáme
        </span>
      </span>
    </a>
  );
}
```

- [ ] **Step 2: Vytvoř route**

Create `src/app/embed/counter/page.tsx`:

```tsx
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
```

- [ ] **Step 3: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: oba exit 0; v outputu se objeví route `/embed/counter`.

- [ ] **Step 4: Vizuální ověření (dev)**

Run: restartuj dev (`pkill -9 -f "next dev"; pnpm dev &`), pak `curl -s http://localhost:3000/embed/counter`.
Expected: HTML obsahuje „Bitcoin je mrtvý", „a počítáme", číslo počtu (`475`), `bg-[var(--card-bg)]`. Otevři v prohlížeči — tmavý odznak, číslo oranžově.

- [ ] **Step 5: Commit**

```bash
git add src/components/embed/CounterWidget.tsx src/app/embed/counter/page.tsx
git commit -m "feat: Death Counter embed widget (/embed/counter)"
```

---

## Task 4: Stats Card widget + route

**Files:**
- Create: `src/components/embed/StatsWidget.tsx`
- Create: `src/app/embed/stats/page.tsx`

**Interfaces:**
- Consumes: `EMBED_ORIGIN`, `formatCurrency`, `formatCzkCompact` (Task 1), `getDeathsData`, `getBtcCoinGeckoData`, `calculateInvestment`, `parseDate`.
- Produces: `StatsWidget({ count, currentValue, roi, perDeposit, updated })`; route `/embed/stats`.

- [ ] **Step 1: Vytvoř komponentu**

Create `src/components/embed/StatsWidget.tsx`:

```tsx
import { EMBED_ORIGIN } from "@/lib/embed-config";
import { formatCurrency, formatCzkCompact } from "@/lib/calculations";

interface StatsWidgetProps {
  count: number;
  currentValue: number;
  roi: number;
  perDeposit: number;
  updated: string;
}

export function StatsWidget({ count, currentValue, roi, perDeposit, updated }: StatsWidgetProps) {
  return (
    <a
      href={EMBED_ORIGIN}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-screen w-full flex-col justify-between gap-2 border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold leading-none text-[var(--bitcoin-orange)]">&#8383;</span>
        <span className="text-sm font-medium uppercase tracking-wider text-neutral-300">
          Bitcoin je mrtvý
        </span>
      </div>

      <p className="text-lg font-bold leading-snug text-white">
        Bitcoin byl{" "}
        <span className="text-[var(--bitcoin-orange)]">{count.toLocaleString("cs-CZ")}&times;</span>{" "}
        prohlášen za&nbsp;mrtvý
      </p>

      <p className="text-sm leading-snug text-neutral-300">
        {formatCurrency(perDeposit)} při každém prohlášení by dnes mělo hodnotu{" "}
        <span className="font-bold text-[var(--bitcoin-orange)]">{formatCzkCompact(currentValue)}</span>{" "}
        <span className="font-bold text-green-500">(+{Math.round(roi).toLocaleString("cs-CZ")}&nbsp;%)</span>
      </p>

      <p className="text-xs text-neutral-500">Aktualizováno {updated}</p>
    </a>
  );
}
```

- [ ] **Step 2: Vytvoř route**

Create `src/app/embed/stats/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getDeathsData, getBtcCoinGeckoData } from "@/lib/deaths-data";
import { calculateInvestment, parseDate } from "@/lib/calculations";
import { StatsWidget } from "@/components/embed/StatsWidget";

export const revalidate = 3600;

const INVESTMENT_PER_DEATH_CZK = 1000;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StatsEmbed() {
  const [{ deaths }, coinGeckoData] = await Promise.all([
    getDeathsData(),
    getBtcCoinGeckoData(3600, false),
  ]);

  const usdToCzk = coinGeckoData.usdToCzk;
  const czkToUsd = 1 / usdToCzk;
  const btcPriceCzk = coinGeckoData.priceCzk;
  const sortedByDate = [...deaths].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime(),
  );
  const fallbackPriceUsd = sortedByDate[0]?.bitcoinPrice ?? 0;
  const currentBtcPriceUsd = btcPriceCzk ? btcPriceCzk * czkToUsd : fallbackPriceUsd;

  const investment = calculateInvestment(deaths, INVESTMENT_PER_DEATH_CZK, currentBtcPriceUsd, czkToUsd);
  const updated = new Date().toLocaleDateString("cs-CZ");

  return (
    <StatsWidget
      count={deaths.length}
      currentValue={investment.currentValue}
      roi={investment.roi}
      perDeposit={INVESTMENT_PER_DEATH_CZK}
      updated={updated}
    />
  );
}
```

- [ ] **Step 3: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: oba exit 0; route `/embed/stats` v outputu.

- [ ] **Step 4: Vizuální ověření (dev)**

Run: `curl -s http://localhost:3000/embed/stats`
Expected: HTML obsahuje „Bitcoin byl", „prohlášen za mrtvý", „by dnes mělo hodnotu", „mil. Kč", „Aktualizováno". Otevři v prohlížeči — tmavá karta, hodnota oranžově, ROI zeleně. Ověř, že se obsah vejde do 460×220 (jinak uprav výšku v `EMBED_WIDGETS.stats.height`).

- [ ] **Step 5: Commit**

```bash
git add src/components/embed/StatsWidget.tsx src/app/embed/stats/page.tsx
git commit -m "feat: Stats Card embed widget (/embed/stats)"
```

---

## Task 5: Vypnout analytiku na widget routes

**Files:**
- Modify: `src/components/AnalyticsLazy.tsx`

**Interfaces:**
- Consumes: `usePathname` z `next/navigation`.

- [ ] **Step 1: Přidej pathname guard**

Nahraď obsah `src/components/AnalyticsLazy.tsx`:

```tsx
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
```

- [ ] **Step 2: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: oba exit 0.

- [ ] **Step 3: Ověření (dev)**

Run:
```bash
curl -s http://localhost:3000/embed/counter | grep -c "_vercel/insights\|va(" || echo "counter: bez analytiky (OK)"
curl -s http://localhost:3000/ | grep -c "AnalyticsLazy\|insights" >/dev/null && echo "homepage: analytika přítomna (OK)"
```
Expected: na `/embed/counter` se analytika nenačítá; na `/` ano. (Analytika je client-only `ssr:false`, takže v SSR HTML nemusí být skript přímo — hlavní je, že komponenta na widgetu vrací null. Ověř i v prohlížeči přes Network tab, že na widgetu nejde request na insights.)

- [ ] **Step 4: Commit**

```bash
git add src/components/AnalyticsLazy.tsx
git commit -m "feat: vypnout Vercel Analytics na embed widget routes"
```

---

## Task 6: Galerie `/embed` (návod + náhledy + kopírování)

**Files:**
- Create: `src/components/embed/CopyEmbedCode.tsx`
- Create: `src/app/embed/page.tsx`

**Interfaces:**
- Consumes: `Header`, `Footer`, `EMBED_ORIGIN`, `EMBED_WIDGETS`, `buildEmbedSnippet`.
- Produces: `CopyEmbedCode({ code }: { code: string })`; route `/embed`.

- [ ] **Step 1: Vytvoř copy komponentu (client)**

Create `src/components/embed/CopyEmbedCode.tsx`:

```tsx
"use client";

import { useState } from "react";

export function CopyEmbedCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Vložit na web
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded px-3 py-1 text-xs font-medium text-white transition-colors hover:text-[var(--bitcoin-orange)]"
        >
          {copied ? "Zkopírováno ✓" : "Kopírovat kód"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-neutral-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: Vytvoř galerii**

Create `src/app/embed/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyEmbedCode } from "@/components/embed/CopyEmbedCode";
import { EMBED_ORIGIN, EMBED_WIDGETS, buildEmbedSnippet, type EmbedWidgetKey } from "@/lib/embed-config";

export const metadata: Metadata = {
  title: "Embed widgety — Bitcoin je mrtvý",
  description:
    "Vložte si na web živé počítadlo a statistiku, kolikrát byl Bitcoin prohlášen za mrtvý. Stačí zkopírovat HTML kód.",
  alternates: { canonical: `${EMBED_ORIGIN}/embed` },
};

const SECTIONS: { key: EmbedWidgetKey; title: string; description: string }[] = [
  {
    key: "counter",
    title: "Počítadlo úmrtí",
    description:
      "Kompaktní odznak s počtem úmrtí Bitcoinu. Hodí se do postranního panelu, patičky nebo článku.",
  },
  {
    key: "stats",
    title: "Statistická karta",
    description:
      "Větší karta s počtem úmrtí, živým investičním přepočtem a datem poslední aktualizace. Ideální do článků a na blog.",
  },
];

export default function EmbedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Embed widgety
        </h1>
        <p className="mt-2 text-base leading-relaxed text-neutral-300 sm:text-lg">
          Přidejte na svůj web, blog nebo newsletter živá data z&nbsp;Bitcoin je mrtvý.
          Zkopírujte kód níže a&nbsp;vložte ho do svého HTML. Widgety se automaticky
          aktualizují a&nbsp;odkazují zpět na databázi.
        </p>

        {SECTIONS.map((s) => {
          const w = EMBED_WIDGETS[s.key];
          return (
            <section key={s.key} className="mt-10">
              <h2 className="text-xl font-bold text-white sm:text-2xl">{s.title}</h2>
              <p className="mt-1 text-sm text-neutral-400 sm:text-base">{s.description}</p>

              <div className="mt-4 flex justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]/40 p-6">
                <iframe
                  src={`/embed/${w.key}`}
                  width={w.width}
                  height={w.height}
                  scrolling="no"
                  style={{ border: "none", overflow: "hidden" }}
                  title={w.title}
                />
              </div>

              <CopyEmbedCode code={buildEmbedSnippet(s.key)} />
            </section>
          );
        })}
      </main>

      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: oba exit 0; route `/embed` v outputu.

- [ ] **Step 4: Vizuální ověření (dev)**

Run: `curl -s http://localhost:3000/embed`
Expected: obsahuje „Embed widgety", intro text, „Počítadlo úmrtí", „Statistická karta", dva `<iframe src="/embed/...`, dva `<pre>` s kódem, tlačítka „Kopírovat kód".
V prohlížeči: oba živé náhledy se renderují (tmavé widgety), tlačítko Kopírovat funguje (zkopíruje snippet), patička je dole.

- [ ] **Step 5: Commit**

```bash
git add src/components/embed/CopyEmbedCode.tsx src/app/embed/page.tsx
git commit -m "feat: galerie /embed — návod, živé náhledy, kopírování kódu"
```

---

## Self-Review

**Spec coverage:**
- iframe mechanismus → Task 3/4 (lean routes) + Task 6 (snippet/náhled) ✓
- Death Counter → Task 3 ✓
- Stats Card (počet + investice + datum) → Task 4 ✓
- Galerie + přeložené texty + copy → Task 6 ✓
- noindex na widgetech → Task 3/4 metadata ✓
- Analytika vypnutá na widgetech → Task 5 ✓
- Tmavé widgety (--card-bg) → Task 3/4 ✓
- Meta title/description galerie → Task 6 ✓
- Kompaktní částka → Task 1 ✓
- Rozměry jedním zdrojem (EMBED_WIDGETS) → Task 2 ✓
- Odkaz zpět na web (target=_blank) → Task 3/4 (`<a href={EMBED_ORIGIN}>`) ✓

**Placeholder scan:** žádné TBD/„handle later"; px rozměry mají konkrétní hodnoty (300×72/460×220) s poznámkou o doladění výšky na dev serveru. ✓

**Type consistency:** `EmbedWidgetKey` definován v Task 2, použit v Task 6. `formatCzkCompact(value:number):string` Task 1 → použito v Task 4. `CounterWidget({count})`, `StatsWidget({count,currentValue,roi,perDeposit,updated})` konzistentní mezi komponentou a route. `buildEmbedSnippet(key)` Task 2 → Task 6. ✓
