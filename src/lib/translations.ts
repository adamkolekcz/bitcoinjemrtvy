import translationsCs from "@/data/translations-cs.json";
import type { DeathEvent } from "./calculations";
import { generateDeathSlug } from "./calculations";

interface Translation {
  articleTitle?: string;
  quote?: string;
}

const translations = translationsCs as Record<string, Translation>;

export function applyTranslations(deaths: DeathEvent[]): DeathEvent[] {
  return deaths.map((death) => {
    const slug = generateDeathSlug(death);
    const t = translations[slug];
    if (!t) return death;
    return {
      ...death,
      ...(t.articleTitle ? { articleTitle_cs: t.articleTitle } : {}),
      ...(t.quote ? { quote_cs: t.quote } : {}),
    };
  });
}
