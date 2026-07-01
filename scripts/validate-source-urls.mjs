/**
 * validate-source-urls.mjs — WS3
 *
 * Projede všechny zdrojové URL v src/data/source-urls.json, klasifikuje je
 * (browser-UA, follow redirects) a upraví JSON:
 *   - redirect (3XX)     → přepíše na finální URL
 *   - dead (404/410)     → Wayback snapshot (CDX API), jinak null (skryje odkaz)
 *   - blocked (401/403…) → ponechá (funguje pro člověka)
 *   - error (5xx)        → ponechá + zaloguje
 * Zapíše i source-urls-report.json s přehledem akcí.
 *
 * Pozn.: Wayback lookup běží SERIÁLNĚ (jen pro mrtvé URL) přes CDX API —
 * availability API rate-limituje bursty (429). CDX je robustnější a vrací
 * konkrétní snapshot; s retry a odstupem.
 *
 * Použití: node scripts/validate-source-urls.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decideAction, classifyStatus, analyzeRedirect } from "./lib/source-url-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_URLS_PATH = resolve(__dirname, "../src/data/source-urls.json");
const REPORT_PATH = resolve(__dirname, "../src/data/source-urls-report.json");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const TIMEOUT_MS = 15_000;
const WAYBACK_TIMEOUT_MS = 30_000;
const CONCURRENCY = 8;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { status: res.status, finalUrl: res.url || url };
  } catch {
    return { status: 0, finalUrl: url }; // timeout/DNS → error → keep
  }
}

// Nejnovější 200 snapshot z Wayback CDX API (robustnější než availability API).
async function waybackCdx(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(
        `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=-1&filter=statuscode:200&fl=timestamp,original`,
        { signal: AbortSignal.timeout(WAYBACK_TIMEOUT_MS), headers: { "User-Agent": UA } },
      );
      if (res.status === 429) { await sleep(3000); continue; }
      if (!res.ok) return null;
      const rows = await res.json(); // [["timestamp","original"], [ts, original], …] nebo []
      if (!Array.isArray(rows) || rows.length < 2) return null;
      const [ts, original] = rows[rows.length - 1];
      return `https://web.archive.org/web/${ts}/${original}`;
    } catch {
      await sleep(1500);
    }
  }
  return null;
}

async function runInBatches(items, fn, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    out.push(...(await Promise.all(batch.map(fn))));
    process.stdout.write(`\r[validate] probe ${Math.min(i + size, items.length)}/${items.length}`);
  }
  process.stdout.write("\n");
  return out;
}

async function main() {
  const existing = JSON.parse(readFileSync(SOURCE_URLS_PATH, "utf-8"));
  const entries = Object.entries(existing).filter(([, url]) => typeof url === "string" && url);

  // 1) Probe (paralelně) — klasifikace bez Waybacku.
  const probed = await runInBatches(
    entries,
    async ([slug, url]) => {
      const { status, finalUrl } = await probe(url);
      return { slug, url, status, finalUrl };
    },
    CONCURRENCY,
  );

  // 2) Wayback pro mrtvé (404/410) i soft-dead (redirect na holou homepage = článek pryč),
  //    SERIÁLNĚ s odstupem — archive.org rate-limituje bursty.
  const needsWayback = probed.filter(
    (p) => classifyStatus(p.status) === "dead" || analyzeRedirect(p.url, p.finalUrl) === "softdead",
  );
  const waybackMap = new Map();
  for (let i = 0; i < needsWayback.length; i++) {
    waybackMap.set(needsWayback[i].url, await waybackCdx(needsWayback[i].url));
    process.stdout.write(`\r[validate] wayback ${i + 1}/${needsWayback.length}`);
    await sleep(500);
  }
  if (needsWayback.length) process.stdout.write("\n");

  // 3) Rozhodnutí + zápis.
  const report = { rewrite: [], wayback: [], remove: [], keptBlocked: [], keptError: [] };
  for (const p of probed) {
    const decision = decideAction({
      status: p.status,
      originalUrl: p.url,
      finalUrl: p.finalUrl,
      waybackUrl: waybackMap.get(p.url) ?? null,
    });
    if (decision.action === "rewrite") { existing[p.slug] = decision.url; report.rewrite.push({ slug: p.slug, from: p.url, to: decision.url }); }
    else if (decision.action === "wayback") { existing[p.slug] = decision.url; report.wayback.push({ slug: p.slug, from: p.url, to: decision.url }); }
    else if (decision.action === "remove") { existing[p.slug] = null; report.remove.push({ slug: p.slug, url: p.url, status: p.status }); }
    else if (classifyStatus(p.status) === "blocked") report.keptBlocked.push({ slug: p.slug, url: p.url, status: p.status });
    else if (classifyStatus(p.status) === "error") report.keptError.push({ slug: p.slug, url: p.url, status: p.status });
  }

  writeFileSync(SOURCE_URLS_PATH, JSON.stringify(existing, null, 2) + "\n");
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log(
    `[validate] rewrite=${report.rewrite.length} wayback=${report.wayback.length} remove=${report.remove.length} keptBlocked=${report.keptBlocked.length} keptError=${report.keptError.length}`,
  );
}

main();
