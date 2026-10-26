import type { MetadataRoute } from "next";
import { LOTS, lotHref } from "@/lib/lots";
import { SITE_URL } from "@/lib/site";
import { landingPaths } from "@/lib/seo-pages";
import { ARTICLES, articleHref } from "@/lib/articles";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const newest = LOTS[0]?.date;
  return [
    { url: `${SITE_URL}/`, lastModified: newest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog/`, lastModified: newest, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/podbor/`, changeFrequency: "monthly", priority: 0.8 },
    ...(ARTICLES.length ? [{ url: `${SITE_URL}/stati/`, lastModified: ARTICLES[0].date, changeFrequency: "weekly" as const, priority: 0.7 }] : []),
    ...ARTICLES.map((a) => ({ url: `${SITE_URL}${articleHref(a)}`, lastModified: a.updated || a.date, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...landingPaths().map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: p.date, changeFrequency: "daily" as const, priority: 0.8 })),
    ...LOTS.map((l) => ({ url: `${SITE_URL}${lotHref(l)}`, lastModified: l.date, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
