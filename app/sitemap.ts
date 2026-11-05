import type { MetadataRoute } from "next";
import { LOTS, lotHref } from "@/lib/lots";
import { SITE_URL } from "@/lib/site";
import { landingPaths } from "@/lib/seo-pages";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const newest = LOTS[0]?.date;
  return [
    { url: `${SITE_URL}/`, lastModified: newest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog/`, lastModified: newest, changeFrequency: "daily", priority: 0.9 },
    ...landingPaths().map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: p.date, changeFrequency: "daily" as const, priority: 0.8 })),
    ...LOTS.map((l) => ({ url: `${SITE_URL}${lotHref(l)}`, lastModified: l.date, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
