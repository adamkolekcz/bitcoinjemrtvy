import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bitcoin je mrtvý — Kolikrát byl Bitcoin prohlášen za mrtvý",
  description:
    "Kompletní databáze všech případů, kdy byl Bitcoin prohlášen za mrtvý od\u00A0roku 2010. Interaktivní graf, statistiky a\u00A0investiční kalkulačka.",
  keywords: ["bitcoin", "bitcoin je mrtvý", "bitcoin deaths", "bitcoin obituary", "kryptoměny"],
  openGraph: {
    title: "Bitcoin je mrtvý — Kolikrát byl Bitcoin prohlášen za mrtvý",
    description:
      "Kompletní databáze všech případů, kdy byl Bitcoin prohlášen za mrtvý od roku 2010.",
    type: "website",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitcoin je mrtvý",
    description:
      "Kompletní databáze všech případů, kdy byl Bitcoin prohlášen za mrtvý od roku 2010.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
