import translationsCs from "@/data/translations-cs.json";
import type { DeathEvent } from "./calculations";
import { parseDate } from "./calculations";

interface Translation {
  articleTitle?: string;
  quote?: string;
}

const translations = translationsCs as Record<string, Translation>;

/**
 * Generuje klíč pro lookup překladu — vždy z anglického titulu bez zkrácení.
 * Klíče v translations-cs.json byly vytvořeny před zavedením zkracování slugů,
 * proto musíme použít původní formát.
 */
function translationKey(death: DeathEvent): string {
  const date = parseDate(death.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const titleSlug = death.articleTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${day}-${month}-${year}-${titleSlug}`;
}

export function applyTranslations(deaths: DeathEvent[]): DeathEvent[] {
  return deaths.map((death) => {
    const t = translations[translationKey(death)];
    if (!t) return death;
    return {
      ...death,
      ...(t.articleTitle ? { articleTitle_cs: t.articleTitle } : {}),
      ...(t.quote ? { quote_cs: t.quote } : {}),
    };
  });
}
