import type { MetadataRoute } from "next";
import { getDeathsData } from "@/lib/deaths-data";
import { generateDeathSlug, parseDate } from "@/lib/calculations";

const BASE_URL = "https://www.bitcoinjemrtvy.cz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { deaths } = await getDeathsData();
  // Homepage i výpis se mění jen s novým prohlášením → lastmod = datum nejnovějšího.
  // (new Date() by měnil lastmod při každém requestu a Google by ho přestal brát vážně.)
  const latest = new Date(Math.max(...deaths.map((d) => parseDate(d.date).getTime())));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: latest,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/prohlaseni`,
      lastModified: latest,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/embed`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic pages for each death event
  const deathPages: MetadataRoute.Sitemap = deaths.map((death) => ({
    url: `${BASE_URL}/prohlaseni/${generateDeathSlug(death)}`,
    lastModified: parseDate(death.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...deathPages];
}
