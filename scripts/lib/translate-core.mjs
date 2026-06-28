// Čisté, I/O-free helpery pro translate-deaths.mjs.
// MUSÍ zůstat v sync s:
//   - src/lib/translations.ts  → translationKey (DD-MM-YYYY-{en-title-slug}, bez zkrácení)
//   - src/lib/calculations.ts  → parseDate (M/D/YYYY)
// Změna tam = změna tady. Drift hlídá self-test v translate-deaths.mjs + unit testy.

export const MISSING_THRESHOLD = 15;

export function parseDate(dateStr) {
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

export function slugifyTitle(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function translationKey(death) {
  const date = parseDate(death.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}-${slugifyTitle(death.articleTitle)}`;
}

// URL slug detailní stránky — MUSÍ zůstat bajt-identický s generateDeathSlug
// v src/lib/calculations.ts (z ČESKÉHO titulku, zkráceno na 80 znaků).
export function deathSlug(death) {
  const date = parseDate(death.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const title = death.articleTitle_cs ?? death.articleTitle;
  const titleSlug = slugifyTitle(title).slice(0, 80).replace(/-+$/g, "");
  return `${day}-${month}-${year}-${titleSlug}`;
}

export function isFieldSane(source, translated) {
  if (typeof translated !== "string") return false;
  const t = translated.trim();
  if (t.length === 0) return false;
  const ratio = t.length / source.length;
  if (ratio < 0.3 || ratio > 4) return false;
  return true;
}

// Atomická validace: titulek vždy, citát jen pokud v originále existuje.
export function isTranslationSane(death, result) {
  if (!isFieldSane(death.articleTitle, result.articleTitle)) return false;
  if (death.quote && !isFieldSane(death.quote, result.quote)) return false;
  return true;
}

// --- Normalizace uvozovek na české (deterministická, idempotentní) ---
// Garantuje, že AUTOMATICKY přeložené nové články mají stejnou typografii
// jako stávající ručně normalizované — bez ohledu na to, co Claude vrátí.
const QUOTE_CHARS = /[„“”"‚‘’'‛]/u;
function isApostropheAt(s, i) {
  return /[’']/.test(s[i]) && /\p{L}/u.test(s[i - 1] ?? "") && /\p{L}/u.test(s[i + 1] ?? "");
}

// Sjednotí všechny uvozovky na alternující „ … “ (primární české). Apostrofy
// (písmeno-'-písmeno, např. Jusqu'ici) zůstávají nedotčené.
export function czechifyQuotes(s) {
  if (typeof s !== "string") return s;
  let out = "", open = true;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (QUOTE_CHARS.test(c) && !isApostropheAt(s, i)) {
      out += open ? "„" : "“";
      open = !open;
    } else out += c;
  }
  return out;
}

// Titulek se nerenderuje obalený, takže primární citace = „ … “.
export function normalizeTitleQuotes(s) {
  return czechifyQuotes(s);
}

// Citát rendering obaluje do „ … “, takže obalení odstraníme a vnitřní citace
// převedeme na vnořené ‚ … ‘.
export function normalizeQuoteQuotes(s) {
  if (typeof s !== "string") return s;
  let out = czechifyQuotes(s);
  const whole = out.match(/^„([^„“]*)“$/u); // celé obalené → jen text
  if (whole) out = whole[1];
  return out.replace(/„/g, "‚").replace(/“/g, "‘");
}

export function findMissing(deaths, translations) {
  return deaths.filter((d) => !translations[translationKey(d)]);
}

export function mergeTranslations(existing, additions) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(additions)) {
    if (!(key in merged)) merged[key] = value; // nikdy nepřepisuje
  }
  return merged;
}
