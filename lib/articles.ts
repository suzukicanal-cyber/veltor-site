import fs from "node:fs";
import path from "node:path";

/**
 * Articles: one JSON file per article in data/articles/ (written by the weekly content
 * agent or by hand). Format and rules — data/articles/README.md; check with
 * `node scripts/check-articles.mjs`.
 */
export type Block =
  | { h2: string }
  | { p: string }
  | { list: string[] }
  | { ol: string[] }
  | { note: string };
export type Article = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  date: string;
  updated?: string;
  query?: string;
  blocks: Block[];
  faq: { q: string; a: string }[];
  sources?: { title: string; url: string }[];
};

const DIR = path.join(process.cwd(), "data", "articles");

function read(): Article[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const a = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Article;
      if (`${a.slug}.json` !== f) throw new Error(`data/articles/${f}: slug must match the file name`);
      return a;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const ARTICLES: Article[] = read();
export const articleHref = (a: Pick<Article, "slug">) => `/stati/${a.slug}/`;
export const findArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug);

/** Rough reading time in minutes. */
export function readMinutes(a: Article) {
  const text = a.blocks.map((b) => Object.values(b).flat().join(" ")).join(" ") + a.faq.map((f) => f.q + f.a).join(" ");
  return Math.max(2, Math.round(text.split(/\s+/).length / 180));
}

export const ruDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
