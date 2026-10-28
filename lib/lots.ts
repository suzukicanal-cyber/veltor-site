import raw from "@/data/lots.json";
import redirectsRaw from "@/data/redirects.json";
import { tgText } from "./site";
import { kmLabel, money, dateRu } from "./format";

export type LotType = "moto" | "car";
export type BodyLine = { k: "h" | "li" | "warn" | "p"; t: string };
export type Lot = {
  id: number;
  slug: string;
  type: LotType;
  brand: string;
  model: string;
  name: string;
  year: number;
  km: number | null;
  volume: string | null;
  power: string | null;
  drive: string | null;
  gearbox: string | null;
  price: number;
  priceLabel: string;
  date: string;
  features: string[];
  body: BodyLine[];
  photos: string[];
  post: string;
  /** photos have neural ×2 copies "<n>@2x.jpg" (scripts/upscale.py) */
  hd?: boolean;
};

/** Sharper ×2 copy of a local catalog photo. */
export const hdSrc = (p: string) => p.replace(/\.jpg$/, "@2x.jpg");

/** All lots, newest first (the order of publication in the Telegram channel). */
export const LOTS: Lot[] = (raw as Lot[]).slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

export const lotBySlug = (slug: string) => LOTS.find((l) => l.slug === slug);

/** Addresses of reposted (removed) listings → the newest post of the same vehicle (scripts/dedupe.py). */
export const REDIRECTS = redirectsRaw as Record<string, string>;
export const typeLabel = (t: LotType) => (t === "moto" ? "Мото" : "Авто");
export const lotHref = (l: Lot) => `/catalog/${l.slug}/`;

/** Small specs row on a card: year, mileage, engine (and power for cars). */
export function specs(l: Lot) {
  const s: { v: string; k: string }[] = [
    { v: String(l.year), k: "год" },
    { v: kmLabel(l.km), k: "пробег" },
  ];
  if (l.volume) s.push({ v: l.volume, k: "объём" });
  if (l.power && l.type === "car") s.push({ v: l.power, k: "мощность" });
  return s;
}

/** Deep link: Telegram chat with the manager, the lot already described. */
export function likeLink(l: Lot) {
  const sp = specs(l).slice(0, 2).map((s) => s.v).join(", ");
  const text = `Здравствуйте! Хочу подобрать похожий вариант: ${l.name} (${sp}), ${money(l.price)} на ${dateRu(l.date)}.\nПост: ${l.post}`;
  return tgText(text);
}

/** Teaser on the home page: the two newest motorcycles and the two newest cars. */
export function teaser() {
  const m = LOTS.filter((l) => l.type === "moto").slice(0, 2);
  const c = LOTS.filter((l) => l.type === "car").slice(0, 2);
  return [...m, ...c];
}

/** Similar lots for the detail page: same brand first, then same type, close in price. */
export function similar(l: Lot, n = 4) {
  return LOTS.filter((x) => x.id !== l.id)
    .map((x) => ({ x, s: (x.brand === l.brand ? 0 : 1e9) + (x.type === l.type ? 0 : 1e10) + Math.abs(x.price - l.price) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, n)
    .map((o) => o.x);
}

export const yawFor = (i: number) => (i % 2 ? -0.55 : 0.6);
