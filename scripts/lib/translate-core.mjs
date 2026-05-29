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
