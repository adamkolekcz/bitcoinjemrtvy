/**
 * ping-indexnow.mjs
 *
 * Odešle změněné URL přes IndexNow (sdílí Bing, Seznam, Yandex, …) — rychlejší
 * indexace nového obsahu. Best-effort: případné selhání NIKDY neshodí workflow.
 *
 * Režimy:
 *   node scripts/ping-indexnow.mjs           → odešle URL z .indexnow-urls.txt
 *                                               (zapisuje translate-deaths.mjs)
 *   node scripts/ping-indexnow.mjs --all      → jednorázově odešle celou sitemapu
 *                                               (bootstrap stávajících stránek)
 *
 * Klíč je VEŘEJNÝ (hostovaný na /<key>.txt) — není to secret.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const URLS_FILE = resolve(__dirname, "../.indexnow-urls.txt");

const HOST = "www.bitcoinjemrtvy.cz";
const KEY = "071702e68a9447d05bc21faa02241db2"; // = public/071702e68a9447d05bc21faa02241db2.txt
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

async function urlsFromSitemap() {
  const res = await fetch(`https://${HOST}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function urlsFromFile() {
  if (!existsSync(URLS_FILE)) return [];
  return readFileSync(URLS_FILE, "utf-8")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
}

async function main() {
  const all = process.argv.includes("--all");
  const urlList = all ? await urlsFromSitemap() : urlsFromFile();

  if (urlList.length === 0) {
    console.log("[indexnow] Žádné URL k odeslání.");
    return;
  }

  // IndexNow přijímá max 10 000 URL na request.
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: urlList.slice(0, 10000),
    }),
  });

  // 200 OK / 202 Accepted = přijato. Jiné = problém (jen warning, best-effort).
  console.log(`[indexnow] Odesláno ${urlList.length} URL → HTTP ${res.status}`);
  if (res.status !== 200 && res.status !== 202) {
    const body = await res.text().catch(() => "");
    console.warn(`[indexnow] VAROVÁNÍ: neočekávaný status ${res.status}. ${body}`);
  }
}

main().catch((e) => {
  // SEO ping je best-effort — nesmí shodit datový pipeline.
  console.warn("[indexnow] Ping selhal (best-effort):", e.message ?? e);
});
