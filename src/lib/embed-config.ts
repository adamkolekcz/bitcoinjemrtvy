export const EMBED_ORIGIN = "https://www.bitcoinjemrtvy.cz";

export type EmbedWidgetKey = "counter" | "stats";

export interface EmbedWidget {
  key: EmbedWidgetKey;
  width: number;
  height: number;
  title: string;
}

export const EMBED_WIDGETS: Record<EmbedWidgetKey, EmbedWidget> = {
  counter: { key: "counter", width: 300, height: 72, title: "Bitcoin je mrtvý — počítadlo úmrtí" },
  stats: { key: "stats", width: 460, height: 220, title: "Bitcoin je mrtvý — statistická karta" },
};

/** Copy-paste iframe snippet pro daný widget. */
export function buildEmbedSnippet(key: EmbedWidgetKey): string {
  const w = EMBED_WIDGETS[key];
  return `<iframe src="${EMBED_ORIGIN}/embed/${w.key}" width="${w.width}" height="${w.height}" frameborder="0" scrolling="no" style="border:none;overflow:hidden;" title="${w.title}"></iframe>`;
}
