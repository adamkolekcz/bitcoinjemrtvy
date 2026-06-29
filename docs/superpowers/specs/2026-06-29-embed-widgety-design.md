# Spec: Embed widgety (Death Counter + Stats Card)

**Datum:** 2026-06-29
**Stav:** návrh k implementaci

## Cíl

Umožnit ostatním vložit si na vlastní web/blog/newsletter **živý widget** z bitcoinjemrtvy.cz
(à la <https://bitcoindeaths.com/embed>). Implementujeme **jen první dva** widgety —
**Death Counter** (odznak) a **Stats Card** (karta) — v češtině, v současném vizuálním stylu
webu, s tmavým („černým") pozadím (ne bílé jako originál). Plus galerijní/návodovou stránku
`/embed` se stejnými (přeloženými) texty a copy-paste kódem.

**Mimo rozsah:** třetí widget z originálu (Obituary Card), script-embed, statické obrázky.

## Mechanismus

**iframe.** Každý widget je samostatná „lean" Next route, kterou si host vloží přes
`<iframe>`. Izolovaný styl, robustní, shoduje se s originálem.

## Routes & layout

| Route | Obsah | Layout |
|---|---|---|
| `/embed` | Galerie/návod (Header + Footer, styl webu) | normální stránka |
| `/embed/counter` | Death Counter | **lean** — jen widget, bez Header/Footer |
| `/embed/stats` | Stats Card | **lean** — jen widget |

- Widget routes renderují **pouze** widget (žádný Header/Footer), `<body>` root layoutu je obalí.
- Widget routes: `export const metadata = { robots: { index: false, follow: false } }` (bare
  widget se nemá indexovat jako stránka).
- **Analytika se na widget routes nesmí spouštět** (nevkládat tracking na cizí weby):
  `AnalyticsLazy` dostane pathname guard a na `/embed/counter` + `/embed/stats` nevykreslí nic.
- JSON-LD v root layoutu zůstává (v iframu neškodný).
- ISR `revalidate = 3600` na widget i galerijní routes → auto-update počtu/ceny.

## Widgety (tmavé, styl webu)

Pozadí `var(--card-bg)`, rámeček `var(--card-border)`, oranžová `var(--bitcoin-orange)`,
zelená `text-green-500`, font webu. Celý widget je odkaz na `https://www.bitcoinjemrtvy.cz`
(`target="_blank" rel="noopener"`), aby vedl zpět na web.

### Death Counter — `/embed/counter` (~300×72)

Kompaktní odznak:
```
₿ Bitcoin je mrtvý
475× a počítáme            (475 oranžově, tučně)
```
Data: `deaths.length`.

### Stats Card — `/embed/stats` (~460×220)

```
₿ Bitcoin je mrtvý                          (nahoře, branding)
Bitcoin byl 475× prohlášen za mrtvý         (475 oranžově)
1 000 Kč při každém prohlášení by dnes
mělo hodnotu 626 mil. Kč (+131 703 %)       (hodnota oranžově, ROI zeleně)
Aktualizováno 29. 6. 2026                   (datum renderu, šedě)
```
Data: `deaths.length`, `calculateInvestment` (currentValue + roi) z `getDeathsData` +
`getBtcCoinGeckoData` (jako homepage), `INVESTMENT_PER_DEATH_CZK = 1000`.
„Aktualizováno" = datum renderu (`new Date()`, formát `formatCzechDate`-style), obnovuje se ISR.

Velké číslo hodnoty formátovat lidsky (např. „626 mil. Kč") — kompaktní zápis kvůli šířce.

## Galerie `/embed`

Header + Footer, styl webu. Obsah (stejné prolozené texty, přeložené):

- **Intro:** „Přidejte na svůj web, blog nebo newsletter živá data z Bitcoin je mrtvý.
  Zkopírujte kód níže a vložte ho do svého HTML. Widgety se automaticky aktualizují a
  odkazují zpět na databázi."
- **Sekce „Počítadlo úmrtí"** — popis: „Kompaktní odznak s počtem úmrtí Bitcoinu. Hodí se do
  postranního panelu, patičky nebo článku." + živý náhled (`<iframe src="/embed/counter">`) +
  box s kódem + tlačítko „Kopírovat kód".
- **Sekce „Statistická karta"** — popis: „Větší karta s počtem úmrtí, živým investičním
  přepočtem a datem poslední aktualizace. Ideální do článků a na blog." + náhled + kód + tlačítko.

Náhledy = reálné `<iframe>` na widget routes (přesně to, co host dostane).

Copy-paste snippet (absolutní produkční URL):
```html
<iframe src="https://www.bitcoinjemrtvy.cz/embed/counter" width="300" height="72"
  frameborder="0" scrolling="no" style="border:none;overflow:hidden;"
  title="Bitcoin je mrtvý — počítadlo úmrtí"></iframe>
```
(obdobně `stats`, 460×220).

## Meta (galerie `/embed`)

- `title`: „Embed widgety — Bitcoin je mrtvý"
- `description`: „Vložte si na web živé počítadlo a statistiku, kolikrát byl Bitcoin prohlášen
  za mrtvý. Stačí zkopírovat HTML kód."
- `alternates.canonical`: `https://www.bitcoinjemrtvy.cz/embed`

## Soubory

| Soubor | Akce | Obsah |
|---|---|---|
| `src/components/embed/CounterWidget.tsx` | nový | Prezentace odznaku (props: count). |
| `src/components/embed/StatsWidget.tsx` | nový | Prezentace karty (props: count, value, roi, updated). |
| `src/components/embed/CopyEmbedCode.tsx` | nový | Client: code box + „Kopírovat kód" (clipboard). |
| `src/app/embed/counter/page.tsx` | nový | Lean route → CounterWidget + data + noindex. |
| `src/app/embed/stats/page.tsx` | nový | Lean route → StatsWidget + data + noindex. |
| `src/app/embed/page.tsx` | nový | Galerie (Header/Footer, intro, 2 sekce, náhledy, kód). |
| `src/components/AnalyticsLazy.tsx` | upravit | Guard: na `/embed/counter`+`/embed/stats` nic. |

Pomocná konstanta pro produkční původ (`https://www.bitcoinjemrtvy.cz`) — vzít z
`metadataBase` / hardcode v galerii. Rozměry widgetů držet na jednom místě (sdílená konstanta),
ať sedí snippet i náhled i `width`/`height`.

## Data flow

```
getDeathsData (count) [+ getBtcCoinGeckoData + calculateInvestment pro Stats]
  → widget page (ISR revalidate 3600)
  → CounterWidget / StatsWidget (čistá prezentace)
```
Fallback: stejný jako zbytek webu (getDeathsData má statický fallback).

## Testing

Widgety jsou převážně prezentace nad existujícími (otestovanými) funkcemi
(`calculateInvestment`, `formatCurrency`). Nová čistá logika je minimální:
- Pokud vznikne helper pro „lidský" formát velké částky (626 mil. Kč) nebo pro generování
  iframe snippetu, pokrýt unit testem (`pnpm test`).
- Jinak ověření vizuálně přes dev server (render widgetů + galerie, copy tlačítko).

## Otevřené drobnosti (doladit při implementaci)

- Přesné px rozměry widgetů tak, aby se obsah vešel bez scrollu (start 300×72 / 460×220).
- Formát velké částky v Stats Card (kompaktní „626 mil. Kč" vs plné) — zvolit dle šířky.
