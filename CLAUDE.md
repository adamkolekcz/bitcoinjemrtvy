# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The project uses **pnpm** (version pinned via the `packageManager` field + Corepack).

```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # production build (from committed data)
pnpm lint         # ESLint
node scripts/sync-deaths.mjs          # manually refresh deaths.json
node scripts/fetch-source-urls.mjs    # manually refresh source-urls.json
```

Data (`deaths.json`, `source-urls.json`, `translations-cs.json`) is maintained by a **daily GitHub Action** (`.github/workflows/translate.yml`), not by the build. `pnpm build` builds from committed data; `getDeathsData` additionally fetches live data at runtime with a fallback to `deaths.json`. The `sync-deaths.mjs` / `fetch-source-urls.mjs` scripts can also be run manually.

Build scripts (`sharp`, `unrs-resolver`) are whitelisted in `pnpm-workspace.yaml` (`allowBuilds`). The same file holds an `overrides` entry for `postcss` (a security patch).

Tests: `pnpm test` (`node:test`) cover the pure functions in `scripts/lib/translate-core.mjs`. There is no other test suite.

## Architecture

### Data flow

```
bitcoindeaths.com/posts (__NEXT_DATA__ → pageProps.posts; the homepage `chartData` lost quote+jobTitle, so we read /posts)
  → src/data/deaths.json (static fallback)
  → src/lib/deaths-data.ts (getDeathsData) — filters out untranslated records (no articleTitle_cs)
  → src/lib/translations.ts (applyTranslations from translations-cs.json)
  → src/app/page.tsx / prohlaseni/[slug]/page.tsx
```

Live data is fetched at runtime via ISR (`revalidate = 3600` on the homepage, `86400` on slug pages). On failure it falls back to the static `deaths.json`.

`getDeathsData` filters out records without a Czech translation (`articleTitle_cs`), so untranslated articles never appear on the site (chart, listing, sitemap, or detail) — no English slug is ever generated.

### Automatic translation of new articles

`scripts/translate-deaths.mjs` (invoked by the daily GitHub Action `.github/workflows/translate.yml`) finds records whose `translationKey` is missing from `translations-cs.json`, translates the title + quote via the Claude API (model `claude-sonnet-4-6`, structured tool output) in the style of the existing translations, and writes them. The pure functions live in `scripts/lib/translate-core.mjs` (tested by `pnpm test`). Key properties:

- **Never overwrites** an existing translation → manual edits in `translations-cs.json` are permanent.
- **Atomic per article**: if any field (title/quote) fails the sanity check, the whole record is discarded — no half-state of "CZ title + EN quote".
- **Threshold guard**: aborts when > 15 records are missing (protection against key drift and runaway cost); run a legitimate large batch via the `workflow_dispatch` `override` input.
- **Self-test** on startup verifies `translationKey` parity with the source (frozen pairs) — see "Slugs and translations".
- The `ANTHROPIC_API_KEY` is a **GitHub secret**, not stored in Vercel.

### Deploy (Vercel)

A Vercel auto-deploy runs on **every push to `main`** (including workflow-only changes — Vercel does not filter by path), so every push = 1 build. The daily Action additionally commits (→ deploy) **only when `src/data/` changes** (guarded by `git diff --quiet -- src/data/`) — with no new content it commits nothing and deploys nothing. The Vercel install command is `pnpm install`; the build builds from committed data (the prebuild does not fetch).

### BTC price and USD/CZK rate

`getBtcCoinGeckoData()` in `src/lib/deaths-data.ts` has a two-tier fallback chain:

- **BTC price**: Kraken → Coinbase → CoinGecko → `null`
- **USD/CZK rate**: Frankfurter → ČNB → hardcoded `20.75`
- **Market cap**: CoinGecko `czk_market_cap` (silent failure, does not block render)

All prices in the data are in **USD**. Conversion to CZK happens exclusively at render time via the `usdToCzk` multiplier.

### Server vs. Client components

- `src/app/page.tsx` is an async Server Component — all data fetching happens here
- `BitcoinChart` uses Recharts (browser-only), so `ssr: false` cannot be used directly in a Server Component
- Solution: `BitcoinChartLazy.tsx` is a thin `"use client"` wrapper that calls `dynamic(..., { ssr: false })`; the Server Component imports the wrapper

This pattern is required whenever you want `next/dynamic` with `ssr: false` — never import `dynamic()` directly in a Server Component.

### Slugs and translations

- The slug is generated from the **Czech title** (`articleTitle_cs ?? articleTitle`), truncated to 80 characters
- The lookup key for `translations-cs.json` is generated from the **untruncated English title** — the two functions (`generateDeathSlug` and `translationKey`) are intentionally separate
- **Watch out for duplication:** `scripts/lib/translate-core.mjs` has its own copy of `translationKey`, `parseDate`, and the slug normalization (the script is `.mjs` and cannot import TS). It must stay byte-identical with `translations.ts` / `calculations.ts`. When you change the key/slug logic, **update both places** — a self-test in `translate-deaths.mjs` plus unit tests guard against drift, but actively keep them in sync.

### Static data (`src/data/`)

| File | Contents | Updated by |
|------|----------|------------|
| `deaths.json` | Bitcoin obituaries (from `bitcoindeaths.com/posts`) | `sync-deaths.mjs` (daily GitHub Action) |
| `translations-cs.json` | Czech translations of titles and quotes | auto: `translate-deaths.mjs` (daily Action, Claude API); manual edits protected (the script never overwrites) |
| `source-urls.json` | Source article URLs indexed by slug | `fetch-source-urls.mjs` (daily Action) |
| `redirects.json` | 301 redirects (Czech → English slugs) | manual |

### Recharts — important gotchas

- `Area.baseValue` must be set to the same value as the `domain` minimum, otherwise Recharts fills the area from zero and a large gap appears below the data (especially visible on a linear scale over short time ranges)
- The Y-axis `domain` and `ticks` are computed from the range of visible data, not from zero — see `yTicksLinear` / `yDomainMinLinear` in `BitcoinChart.tsx`
- X-axis ticks are generated dynamically based on the selected period (1y/3y/5y/all)

### CSS variables

Global colors are defined in `src/app/globals.css` as CSS variables:
- `--bitcoin-orange` — the Bitcoin orange color
- `--death-red` — red for the "death count"
- `--card-bg`, `--card-border` — card background and border
- `--background` — the main page background
