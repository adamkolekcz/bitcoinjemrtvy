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
