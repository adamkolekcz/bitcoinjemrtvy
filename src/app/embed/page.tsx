import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyEmbedCode } from "@/components/embed/CopyEmbedCode";
import { EMBED_ORIGIN, EMBED_WIDGETS, buildEmbedSnippet, type EmbedWidgetKey } from "@/lib/embed-config";

export const metadata: Metadata = {
  title: "Embed widgety — Bitcoin je mrtvý",
  description:
    "Vložte si na web živé počítadlo a statistiku, kolikrát byl Bitcoin prohlášen za mrtvý. Stačí zkopírovat HTML kód.",
  alternates: { canonical: `${EMBED_ORIGIN}/embed` },
};

const SECTIONS: { key: EmbedWidgetKey; title: string; description: string }[] = [
  {
    key: "counter",
    title: "Počítadlo úmrtí",
    description:
      "Kompaktní odznak s počtem úmrtí Bitcoinu. Hodí se do postranního panelu, patičky nebo článku.",
  },
  {
    key: "stats",
    title: "Statistická karta",
    description:
      "Větší karta s počtem úmrtí, živým investičním přepočtem a datem poslední aktualizace. Ideální do článků a na blog.",
  },
];

export default function EmbedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Embed widgety
        </h1>
        <p className="mt-2 text-base leading-relaxed text-neutral-300 sm:text-lg">
          Přidejte na svůj web, blog nebo newsletter živá data z&nbsp;Bitcoin je mrtvý.
          Zkopírujte kód níže a&nbsp;vložte ho do svého HTML. Widgety se automaticky
          aktualizují a&nbsp;odkazují zpět na databázi.
        </p>

        {SECTIONS.map((s) => {
          const w = EMBED_WIDGETS[s.key];
          return (
            <section key={s.key} className="mt-10">
              <h2 className="text-xl font-bold text-white sm:text-2xl">{s.title}</h2>
              <p className="mt-1 text-sm text-neutral-400 sm:text-base">{s.description}</p>

              <div className="mt-4 flex justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]/40 p-6">
                <iframe
                  src={`/embed/${w.key}`}
                  width={w.width}
                  height={w.height}
                  style={{ border: "none", borderRadius: "12px", overflow: "hidden" }}
                  title={w.title}
                />
              </div>

              <CopyEmbedCode code={buildEmbedSnippet(s.key)} />
            </section>
          );
        })}
      </main>

      <Footer />
    </div>
  );
}
