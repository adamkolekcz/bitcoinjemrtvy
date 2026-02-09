import type { MetadataRoute } from "next";
import { getDeathsData } from "@/lib/deaths-data";
import { generateDeathSlug, parseDate } from "@/lib/calculations";

const BASE_URL = "https://www.bitcoinjemrtvy.cz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { deaths } = await getDeathsData();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/prohlaseni`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
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
