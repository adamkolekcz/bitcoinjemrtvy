# Bitcoin je mrtvý 💀

> Kolikrát už byl Bitcoin prohlášen za mrtvý — a přesto pořád žije.

[![Web](https://img.shields.io/badge/web-bitcoinjemrtvy.cz-f7931a)](https://www.bitcoinjemrtvy.cz)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Český web, který sbírá „nekrology" Bitcoinu z [bitcoindeaths.com](https://bitcoindeaths.com)
a překládá je do češtiny. Každé mediální prohlášení „Bitcoin je mrtvý" se zobrazí jako bod
v grafu ceny BTC — a vedle toho propočet, kolik bys měl dnes, kdybys při každém takovém
prohlášení nakoupil za 1 000 Kč.

**→ [www.bitcoinjemrtvy.cz](https://www.bitcoinjemrtvy.cz)**

![Náhled webu Bitcoin je mrtvý](docs/preview.png)

## Co web umí

- 📈 **Graf ceny BTC** s vyznačenými body všech „úmrtí" — přepínání období (1/3/5 let, celé období) a lineární/log osy
- 🗓️ **Chronologická timeline** všech nekrologů s citacemi a odkazy na původní články
- 🧮 **Investiční kalkulačka** — kolik by vydělal, kdo při každém prohlášení o smrti nakoupil
- ⏳ **Počítadlo věku Bitcoinu** od genesis bloku (3. 1. 2009)
- 🇨🇿 **Automatický překlad** nových článků do češtiny přes Claude API
- ♿ Důraz na přístupnost (WCAG AA kontrast) a výkon (ISR, lazy-load grafu i analytiky)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Recharts · pnpm · deploy na Vercel.

## Vývoj

```bash
pnpm install
pnpm dev          # dev server (Turbopack)
pnpm build        # produkční build (z commitnutých dat)
pnpm lint         # ESLint
pnpm test         # node:test (čisté funkce překladového skriptu)
```

Ruční aktualizace dat (jinak je řeší denní GitHub Action):

```bash
node scripts/sync-deaths.mjs          # deaths.json z bitcoindeaths.com
node scripts/fetch-source-urls.mjs    # source-urls.json
```

## Jak to funguje

**Datový tok.** Data se za běhu načítají živě z bitcoindeaths.com (ISR), s fallbackem na
statický `src/data/deaths.json`. České překlady titulků a citátů jsou v
`src/data/translations-cs.json`; záznamy bez překladu se na webu vůbec nezobrazí (nevzniká
anglický slug).

**Automatický překlad.** Nové články překládá **denní GitHub Action**
([`.github/workflows/translate.yml`](.github/workflows/translate.yml)) přes Claude API — atomicky
po článku, nikdy nepřepisuje existující (ručně upravené) překlady a má threshold guard proti
runaway nákladům.

**Ceny.** Cena BTC i kurz USD/CZK mají vícezdrojový fallback řetězec
(Kraken → Coinbase → CoinGecko; Frankfurter → ČNB). Všechna data jsou v USD, přepočet na CZK
probíhá až při zobrazení.

Podrobná architektura, konvence a gotchas (slugy, Recharts, server/client komponenty):
viz [`CLAUDE.md`](./CLAUDE.md).

## Licence

Kód je pod licencí [MIT](./LICENSE) — © 2026 Adam Kolek.

Týká se to **zdrojového kódu této aplikace**. Samotná data nekrologů (titulky, citace, odkazy)
pocházejí z [bitcoindeaths.com](https://bitcoindeaths.com) a jsou majetkem jejich autorů —
MIT licence se na ně nevztahuje.

## Kredity

Postaveno nad daty z [Bitcoin Obituaries (bitcoindeaths.com)](https://bitcoindeaths.com).
Český překlad a zpracování [Adam Kolek](https://www.linkedin.com/in/adamkolek/).

> ⚠️ Není to investiční doporučení. Web slouží k pobavení a edukaci o mediálních předpovědích.
