# Spec: Sekce „Stejné peníze, dvě cesty" (cash counterfactual)

**Datum:** 2026-06-29
**Stav:** návrh k review

## Cíl

Přidat na homepage nový box „Stejné peníze, dvě cesty", který staví výnos BTC investice
proti tomu, co by ze stejných vkladů zbylo, kdyby ležely v hotovosti a užírala je inflace.
Vznikl na forku `nktrjsk/bitcoinjemrtvy` (commit `c7e2819c`); metodu přebíráme, protože je
správná a shoduje se s nezávislým návrhem, ale s odchylkami níže.

Box se umístí **těsně nad** box „Je Bitcoin mrtvý?" v `StatsSection.tsx` (požadavek zadání —
fork ho měl výš, hned za prvním „investovali 1000 Kč" boxem).

## Metoda výpočtu

Per-vklad model, zrcadlová paralela k BTC DCA (`calculateInvestment` nakupuje 1000 Kč při
každém z 475 prohlášení):

```
Pro každé prohlášení (rok události Y):
  vklad perDepositCzk (= 1000 Kč), nominálně se pod polštářem nemění
  reálná kupní síla dnes = perDepositCzk × CPI(Y) / CPI(posledníRok)
realValue = Σ přes všechny události
nominal   = počet události × perDepositCzk
lossPct   = (realValue − nominal) / nominal × 100   (záporné)
```

- **CPI index** se sestaví z ročních měr inflace: `index[prvníRok] = 100`,
  `index[rok] = index[předchozí] × (1 + míra/100)`. Báze je libovolná, používá se jen poměr.
- **Clamp roku** do rozsahu tabulky: vklad z neúplného letošního roku (2026) nebo z roku
  před tabulkou se clampne na nejbližší dostupný rok → ztratil ~0 %, resp. maximum.
- **„Dnešek"** = poslední (nejvyšší) rok v tabulce = `latestYear`, dynamicky.

### Real vs nominál (vědomé rozhodnutí)

BTC strana zobrazuje **nominální** dnešní hodnotu portfolia (`investment.currentValue`,
`investment.roi`, +132 151 %). Koruna zobrazuje **reálnou kupní sílu** (−26 %). Je to záměrný
rétorický kontrast „co bys měl" vs „co tvoje hotovost reálně koupí". Řády se liší o pět řádů,
takže inflační očištění BTC by na sdělení nic nezměnilo. Ve footnote je jasné, že koruna je
měřena kupní silou — nejde o skrytou nesrovnalost.

## Zdroj dat

**Český statistický úřad — průměrná roční míra inflace (%)**,
<https://csu.gov.cz/prumerna-rocni-mira-inflace>.

Ověřeno: hodnoty 2009–2024 se shodují s FRED `FPCPITOTLZGCZE` (World Bank tutéž řadu jen
přebírá); ČSÚ 2025 = **2,5 %** potvrzeno (ČSÚ, ČT24, kurzy.cz). ČSÚ je primární český zdroj
a je aktuálnější než FRED (FRED/World Bank zaostává na 2024). Zdrojové URL existuje.

**Údržba:** jednou ročně, až ČSÚ publikuje další uzavřený rok, přidat řádek do
`rates` a aktualizovat `lastUpdated`. Žádná runtime závislost (vědomě — roční číslo nemá smysl
fetchovat za běhu).

## Soubory a změny

| Soubor | Akce | Obsah |
|--------|------|-------|
| `src/data/inflation-cz.json` | **nový** | Roční míry ČSÚ 2009–2025 (z forku, ověřené). |
| `src/lib/calculations.ts` | rozšířit | `CashCounterfactualResult`, `buildCpiIndex`, `calculateCashCounterfactual` (z forku) + `describeLossFraction` (nové). |
| `src/lib/calculations.test.mts` | rozšířit | Forkové testy CPI/counterfactual + testy `describeLossFraction`. |
| `src/components/TwoPathsCard.tsx` | **nový** | Izolovaná prezentační komponenta boxu. |
| `src/components/StatsSection.tsx` | upravit | Nová prop `cash`; render `<TwoPathsCard>` nad „Je Bitcoin mrtvý?". |
| `src/app/page.tsx` | upravit | Import `calculateCashCounterfactual` + `inflation-cz.json`; výpočet `cash`; předat prop. |

**Mimo rozsah:** forkové změny v `/letak` (tiskový leták — fork-specific feature, nemáme).
Žádný runtime fetch inflace.

### `src/data/inflation-cz.json`

Převzít z forku 1:1 (ověřeno):

```json
{
  "source": "Český statistický úřad — průměrná roční míra inflace (%)",
  "sourceUrl": "https://csu.gov.cz/prumerna-rocni-mira-inflace",
  "lastUpdated": "2026-06-29",
  "note": "Roční průměrná míra inflace v ČR v %. Index kupní síly dopočítává buildCpiIndex/calculateCashCounterfactual v src/lib/calculations.ts. Neúplný letošní rok → vklady z něj se clampnou na poslední uzavřený rok (ztratily ~0 %). Aktualizovat jednou ročně.",
  "rates": {
    "2009": 1.0, "2010": 1.5, "2011": 1.9, "2012": 3.3, "2013": 1.4,
    "2014": 0.4, "2015": 0.3, "2016": 0.7, "2017": 2.5, "2018": 2.1,
    "2019": 2.8, "2020": 3.2, "2021": 3.8, "2022": 15.1, "2023": 10.7,
    "2024": 2.4, "2025": 2.5
  }
}
```

### `calculations.ts` — přebírané funkce (z forku, beze změny logiky)

```ts
export interface CashCounterfactualResult {
  nominal: number;     // počet × vklad — pod polštářem se nemění
  realValue: number;   // reálná kupní síla v dnešních korunách
  lossPct: number;     // procentní ztráta kupní síly (záporné)
  latestYear: number;  // poslední uzavřený rok v CPI tabulce („dnešek")
}

export function buildCpiIndex(rates: Record<string, number>): Record<number, number>
export function calculateCashCounterfactual(
  deaths: DeathEvent[],
  perDepositCzk: number,
  rates: Record<string, number>,
): CashCounterfactualResult
```

### `calculations.ts` — `describeLossFraction` (nové, odchylka od forku)

Fork měl ve footnote natvrdo „ztratila čtvrtinu". Místo toho odvodíme slovní zlomek z čísla,
ať text nikdy neodporuje dynamickému `lossPct`:

```ts
/**
 * Slovní popis ztráty kupní síly v akuzativu pro footnote: „ztratila <X> kupní síly".
 * Vybere nejbližší „hezký" zlomek a podle odchylky doplní kvalifikátor.
 */
export function describeLossFraction(absLossPct: number): string
```

Návrh chování (pure, testovatelné):

- Tabulka zlomků: `desetinu` (10), `pětinu` (20), `čtvrtinu` (25), `třetinu` (33.3),
  `polovinu` (50).
- Vyber nejbližší podle |absLossPct − pct|.
- Kvalifikátor: do ±1,5 p.b. holé slovo; jinak `téměř <slovo>` (když je ztráta menší)
  nebo `více než <slovo>` (když větší).
- Příklady: 26 % → `čtvrtinu`; 23,5 % → `téměř čtvrtinu`; 28 % → `více než čtvrtinu`;
  32 % → `téměř třetinu`.

### UI — `TwoPathsCard.tsx`

Props: `{ investment: InvestmentResult; cash: CashCounterfactualResult }`.

Layout (1:1 dle screenshotu, existující CSS proměnné + `formatCurrency`):

- Nadpis `<h3>` „Stejné peníze, dvě cesty" (text-white, jednotně s ostatními boxy).
- Úvodní věta: „A co kdybyste místo Bitcoinu těch **{formatCurrency(cash.nominal)}** jen
  schovávali pod polštář? Ležely by tam dál — jenže inflace je každý rok ukrojí."
- Grid 2 sloupce (`sm:grid-cols-2`):
  - **V BITCOINU** — border/bg `--bitcoin-orange`, hodnota zelená
    `+{round(investment.roi)} %`, sublabel `{formatCurrency(investment.currentValue)}`.
  - **POD POLŠTÁŘEM** — border/bg `--death-red`, hodnota `--death-red`
    `−{round(abs(cash.lossPct))} %`, sublabel `kupní síla dnes jen {formatCurrency(cash.realValue)}`.
- Footnote (`text-neutral-500`): „Koruna v hotovosti od roku 2010 ztratila
  **{describeLossFraction(abs(cash.lossPct))}** kupní síly. Ne Bitcoin, ale **koruna pod
  polštářem pomalu umírá** — užírá ji inflace. Přepočteno přes průměrnou roční inflaci ČSÚ
  (kupní síla v korunách roku {cash.latestYear})."

Uvozovky a entity dle projektových konvencí (`&minus;`, `&nbsp;`, `text-white`).

### Wiring — `page.tsx`

```ts
import inflationCz from "@/data/inflation-cz.json";
// ...
const cash = calculateCashCounterfactual(deaths, INVESTMENT_PER_DEATH_CZK, inflationCz.rates);
// <StatsSection ... cash={cash} />
```

`StatsSection` dostane prop `cash` a vyrenderuje `<TwoPathsCard investment={investment} cash={cash} />`
těsně před `<div>` s „Je Bitcoin mrtvý?".

## Testy (`pnpm test`)

- Převzít forkové testy: `buildCpiIndex` (báze 100, kumulace), counterfactual
  (poslední rok = 0 %, starší vklad záporné %, clamp budoucího i minulého roku mimo tabulku,
  nominál = počet × vklad).
- Přidat testy `describeLossFraction`: hraniční hodnoty (25 → „čtvrtinu", 23,5 → „téměř
  čtvrtinu", 28 → „více než čtvrtinu", 33 → „třetinu").

## Očekávaný výsledek (na aktuálních datech)

475 vkladů × 1000 Kč → nominál **475 000 Kč**, reálná kupní síla **≈ 351 008 Kč**,
ztráta **≈ −26 %** (reprodukuje forkový screenshot na korunu). Čísla jsou plně dynamická —
přepočítají se s novými prohlášeními i s rozšířením inflační tabulky.

## Atribuce

Fork `nktrjsk/bitcoinjemrtvy` je MIT-licencovaný; převzetí kódu zpět do originálu je čisté.
Atribuci (řádek v commit message / CLAUDE.md) volitelně doplnit dle preference.
```