import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AnalyticsLazy } from "@/components/AnalyticsLazy";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bitcoinjemrtvy.cz"),
  title: "Bitcoin je mrtvý — Kolikrát byl Bitcoin prohlášen za mrtvý?",
  description:
    'Bitcoin byl více než 470× prohlášen za mrtvý, a přesto žije. Kolik byste vydělali, kdybyste při každém "úmrtí" Bitcoin nakoupili?',
  keywords: ["bitcoin", "bitcoin je mrtvý", "bitcoin deaths", "bitcoin obituary", "kryptoměny"],
  alternates: {
    canonical: "https://www.bitcoinjemrtvy.cz",
  },
  verification: {
    other: { "seznam-wmt": "W9RWO4OeCBgNuUwvTSkE6jOLGCSpAmOA" },
  },
  openGraph: {
    title: "Bitcoin je mrtvý — Kolikrát byl Bitcoin prohlášen za mrtvý?",
    description:
      'Bitcoin byl více než 470× prohlášen za mrtvý, a přesto žije. Kolik byste vydělali, kdybyste při každém "úmrtí" Bitcoin nakoupili?',
    type: "website",
    locale: "cs_CZ",
    url: "https://www.bitcoinjemrtvy.cz",
    siteName: "Bitcoin je mrtvý",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitcoin je mrtvý — Kolikrát byl Bitcoin prohlášen za mrtvý?",
    description:
      'Bitcoin byl více než 470× prohlášen za mrtvý, a přesto žije. Kolik byste vydělali, kdybyste při každém "úmrtí" Bitcoin nakoupili?',
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
        className={`${geistSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Bitcoin je mrtvý",
              "url": "https://www.bitcoinjemrtvy.cz",
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
