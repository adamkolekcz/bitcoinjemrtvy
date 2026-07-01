import type { Metadata } from "next";

export const SITE_NAME = "Bitcoin je mrtvý";
export const SITE_URL = "https://www.bitcoinjemrtvy.cz";

// Statický sdílený OG/Twitter obrázek (route conventions /opengraph-image, /twitter-image).
// metadataBase (v layout.tsx) z relativní cesty vytvoří absolutní URL.
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME };
const TWITTER_IMAGE = "/twitter-image";

interface SocialMetaInput {
  title: string;
  description: string;
  url: string;
  type?: "website" | "article";
}

/**
 * Sjednocený OG + Twitter blok pro všechny stránky. Garantuje og:image a
 * og:url === canonical (Ahrefs: „OG incomplete" a „OG URL not matching canonical").
 */
export function buildSocialMeta({
  title,
  description,
  url,
  type = "website",
}: SocialMetaInput): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: "cs_CZ",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [TWITTER_IMAGE],
    },
  };
}
