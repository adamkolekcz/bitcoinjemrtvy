# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Projekt používá **pnpm** (verze přes `packageManager` field + corepack).

```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # produkční build (z commitnutých dat)
pnpm lint         # ESLint
node scripts/sync-deaths.mjs          # ruční aktualizace deaths.json
node scripts/fetch-source-urls.mjs    # ruční aktualizace source-urls.json
```

Data (`deaths.json`, `source-urls.json`, `translations-cs.json`) udržuje **denní GitHub Action** (`.github/workflows/translate.yml`), ne build. `pnpm build` staví z commitnutých dat; `getDeathsData` navíc za runtime fetchuje živá data s fallbackem na `deaths.json`. Skripty `sync-deaths.mjs` / `fetch-source-urls.mjs` jdou spustit i ručně.

Build skripty (`sharp`, `unrs-resolver`) jsou whitelistnuté v `pnpm-workspace.yaml` (`allowBuilds`). Tamtéž je `overrides` na `postcss` (bezpečnostní patch).

Testy: `pnpm test` (`node:test`) pokrývají čisté funkce v `scripts/lib/translate-core.mjs`. Jiná testovací sada není.

## Architektura

### Datový tok

```
bitcoindeaths.com/posts (__NEXT_DATA__ → pageProps.posts; homepage `chartData` přišla o quote+jobTitle, proto čteme /posts)
  → src/data/deaths.json (statický fallback)
  → src/lib/deaths-data.ts (getDeathsData) — odfiltruje nepřeložené (bez articleTitle_cs)
  → src/lib/translations.ts (applyTranslations z translations-cs.json)
  → src/app/page.tsx / prohlaseni/[slug]/page.tsx
```

Živá data se načítají za runtime přes ISR (`revalidate = 3600` na homepage, `86400` na slug stránkách). Při selhání se použije statický `deaths.json`.

`getDeathsData` odfiltruje záznamy bez českého překladu (`articleTitle_cs`), takže nepřeložené články se na webu (graf, výpis, sitemap i detail) vůbec neobjeví — nevzniká anglický slug.

### Automatický překlad nových článků

`scripts/translate-deaths.mjs` (volá ho denní GitHub Action `.github/workflows/translate.yml`) najde záznamy, jejichž `translationKey` chybí v `translations-cs.json`, přeloží titulek + citát přes Claude API (model `claude-sonnet-4-6`, structured tool output) ve stylu stávajících překladů a zapíše je. Čisté funkce jsou v `scripts/lib/translate-core.mjs` (testy `pnpm test`). Klíčové vlastnosti:

- **Nikdy nepřepisuje** existující překlad → ruční úpravy v `translations-cs.json` jsou trvalé.
- **Atomicky po článku**: když neprojde sanity-check kterékoli pole (titulek/citát), zahodí se celý záznam — žádný polostav „CZ titulek + EN citát".
- **Threshold guard**: při > 15 chybějících abortuje (ochrana proti driftu klíče a runaway nákladům); legitimní velkou dávku pustíš `workflow_dispatch` vstupem `override`.
- **Self-test** na startu ověří paritu `translationKey` se zdrojem (zamrzlé páry) — viz „Slugy a překlady".
- API klíč `ANTHROPIC_API_KEY` je **GitHub secret**, ne ve Vercelu. Spec + plán: `docs/superpowers/`.

### Deploy (Vercel)

Auto-deploy na Vercel proběhne **při každém pushi do `main`** (i workflow-only změny — Vercel nefiltruje cesty), takže každý push = 1 build. Denní Action navíc commitne (→ deploy) **jen když se změní `src/data/`** (gate `git diff --quiet -- src/data/`) — bez nového obsahu nic necommitne ani nedeployuje. Install command na Vercelu je `pnpm install`; build staví z commitnutých dat (prebuild nefetchuje).

### Ceny BTC a kurz USD/CZK

`getBtcCoinGeckoData()` v `src/lib/deaths-data.ts` má dvojitý fallback řetězec:

- **Cena BTC**: Kraken → Coinbase → CoinGecko → `null`
- **Kurz USD/CZK**: Frankfurter → ČNB → hardcoded `20.75`
- **Market cap**: CoinGecko `czk_market_cap` (tiché selhání, neblokuje render)

Všechny ceny v datech jsou v **USD**. Přepočet na CZK se provádí výhradně při zobrazení pomocí `usdToCzk` multiplikátoru.

### Server vs. Client komponenty

- `src/app/page.tsx` je async Server Component — zde se dělá veškeré data fetching
- `BitcoinChart` používá Recharts (browser-only), takže nelze použít `ssr: false` přímo v Server Componentě
- Řešení: `BitcoinChartLazy.tsx` je thin `"use client"` wrapper, který volá `dynamic(..., { ssr: false })`; Server Componenta importuje wrapper

Tento pattern je nutný kdykoli chceš `next/dynamic` s `ssr: false` — nikdy neimportuj `dynamic()` přímo ze Server Componenty.

### Slugy a překlady

- Slug se generuje z **českého titulu** (`articleTitle_cs ?? articleTitle`), zkráceno na 80 znaků
- Klíč pro lookup v `translations-cs.json` se generuje z **anglického titulu bez zkrácení** — obě funkce (`generateDeathSlug` a `translationKey`) jsou záměrně oddělené
- **Pozor na duplikaci:** `scripts/lib/translate-core.mjs` má vlastní kopii `translationKey`, `parseDate` a normalizace slugu (skript je `.mjs`, nemůže importovat TS). Musí zůstat bajt-identická s `translations.ts` / `calculations.ts`. Když měníš logiku klíče/slugu, **uprav obě místa** — drift hlídá self-test v `translate-deaths.mjs` + unit testy, ale aktivně se o synchronizaci postarej.

### Statická data (`src/data/`)

| Soubor | Obsah | Aktualizace |
|--------|-------|-------------|
| `deaths.json` | Bitcoin obituaries (z `bitcoindeaths.com/posts`) | `sync-deaths.mjs` (denní GitHub Action) |
| `translations-cs.json` | České překlady titulků a citátů | auto: `translate-deaths.mjs` (denní Action, Claude API); ruční úpravy chráněné (skript nepřepisuje) |
| `source-urls.json` | URL zdrojových článků indexované slugem | `fetch-source-urls.mjs` (denní Action) |
| `redirects.json` | 301 přesměrování (české → anglické slugy) | ruční |

### Recharts — důležité gotchas

- `Area.baseValue` musí být nastaven na stejnou hodnotu jako `domain` minimum, jinak Recharts vyplní oblast od nuly a vznikne velká mezera pod daty (zvláště patrné na lineárním scale při krátkých časových úsecích)
- Y-axis `domain` a `ticks` se počítají z rozsahu viditelných dat, ne od nuly — viz `yTicksLinear` / `yDomainMinLinear` v `BitcoinChart.tsx`
- X-axis ticks jsou generovány dynamicky podle zvoleného periodu (1y/3y/5y/all)

### CSS proměnné

Globální barvy jsou definovány v `src/app/globals.css` jako CSS proměnné:
- `--bitcoin-orange` — oranžová barva Bitcoinu
- `--death-red` — červená pro "počet úmrtí"
- `--card-bg`, `--card-border` — pozadí a border karet
- `--background` — hlavní pozadí stránky
