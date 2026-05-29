# Bitcoin je mrtvý

[bitcoinjemrtvy.cz](https://www.bitcoinjemrtvy.cz) — kolikrát už byl Bitcoin prohlášen za mrtvý, a přesto žije.

Web sbírá „nekrology" Bitcoinu (z [bitcoindeaths.com](https://bitcoindeaths.com)) a zobrazuje je
v češtině: graf ceny BTC s body jednotlivých „úmrtí", chronologickou timeline, počítadlo věku
Bitcoinu a propočet, kolik bys vydělal, kdybys při každém prohlášení o smrti nakoupil.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Recharts · pnpm · deploy na Vercel.

## Vývoj

```bash
pnpm install
pnpm dev          # dev server (Turbopack)
pnpm build        # produkční build
pnpm lint         # ESLint
pnpm test         # node:test (čisté funkce překladového skriptu)
```

## Jak to funguje (stručně)

- Data se za běhu načítají živě z bitcoindeaths.com (ISR), s fallbackem na statický `src/data/deaths.json`.
- České překlady titulků a citátů jsou v `src/data/translations-cs.json`; nepřeložené záznamy se
  na webu nezobrazí. Nové články překládá automaticky **denní GitHub Action**
  (`.github/workflows/translate.yml`) přes Claude API.
- Ceny BTC a kurz USD/CZK mají vícezdrojový fallback řetězec (Kraken → Coinbase → CoinGecko,
  Frankfurter → ČNB).

Podrobná architektura a konvence: viz [`CLAUDE.md`](./CLAUDE.md).
