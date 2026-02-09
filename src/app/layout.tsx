import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
    "Kolikrát byl Bitcoin prohlášen za mrtvý? Kompletní přehled všech nekrologů od roku 2010 s interaktivním grafem a statistikami.",
  keywords: ["bitcoin", "bitcoin je mrtvý", "bitcoin deaths", "bitcoin obituary", "kryptoměny"],
  openGraph: {
    title: "Bitcoin je mrtvý — Kolikrát byl Bitcoin prohlášen za mrtvý",
    description:
      "Kolikrát byl Bitcoin prohlášen za mrtvý? Kompletní přehled všech nekrologů od roku 2010 s interaktivním grafem a statistikami.",
    type: "website",
    locale: "cs_CZ",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
