import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, serializeJsonLd } from "@/lib/metadata";
import { AnalyticsLazy } from "@/components/AnalyticsLazy";
import "./globals.css";

// Jen sdílené výchozí hodnoty. Canonical + OG/Twitter (url) si nastavuje každá stránka sama —
// v layoutu by je zdědily i 404 a noindex embed widgety (canonical/og:url na homepage).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  keywords: ["bitcoin", "bitcoin je mrtvý", "bitcoin deaths", "bitcoin obituary", "kryptoměny"],
  verification: {
    other: { "seznam-wmt": "W9RWO4OeCBgNuUwvTSkE6jOLGCSpAmOA" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": SITE_NAME,
              "url": SITE_URL,
              "inLanguage": "cs",
              "description": "Kolikrát byl Bitcoin prohlášen za mrtvý? Kompletní přehled všech nekrologů od roku 2010.",
            }),
          }}
        />
        {children}
        <AnalyticsLazy />
      </body>
    </html>
  );
}
