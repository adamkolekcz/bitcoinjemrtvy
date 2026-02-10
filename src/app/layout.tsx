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
  title: "Bitcoin je mrtvý — Kolikrát byl Bitcoin prohlášen za mrtvý",
  description:
    "Kolikrát byl Bitcoin prohlášen za mrtvý? Kompletní přehled všech nekrologů od roku 2010 s interaktivním grafem a statistikami.",
  keywords: ["bitcoin", "bitcoin je mrtvý", "bitcoin deaths", "bitcoin obituary", "kryptoměny"],
  openGraph: {
    title: "Bitcoin je mrtvý — Kolikrát byl Bitcoin prohlášen za mrtvý",
    description:
      "Kolikrát byl Bitcoin prohlášen za mrtvý? Kompletní přehled všech nekrologů od roku 2010 s interaktivním grafem a statistikami.",
    type: "website",
    locale: "cs_CZ",
    url: "https://www.bitcoinjemrtvy.cz",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitcoin je mrtvý",
    description:
      "Kolikrát byl Bitcoin prohlášen za mrtvý? Kompletní přehled všech nekrologů od roku 2010 s interaktivním grafem a statistikami.",
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
        {children}
        <AnalyticsLazy />
      </body>
    </html>
  );
}
