import raw from "@/data/lots.json";
import redirectsRaw from "@/data/redirects.json";
import { tgText } from "./site";
import { kmLabel, money, dateRu } from "./format";
import { motoSpec } from "./moto-specs";

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
  const cc = l.volume || (l.type === "moto" && motoSpec(l).cc ? `${motoSpec(l).cc} см³` : null);
  if (cc) s.push({ v: cc, k: "объём" });
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
/** How far two lots are apart: price (relative), year and mileage. */
function gap(a: Lot, b: Lot) {
  return Math.abs(a.price - b.price) / Math.max(a.price, 1) + Math.abs(a.year - b.year) * 0.08 + Math.abs((a.km || 0) - (b.km || 0)) / Math.max(20000, a.km || 0) * 0.5;
}
/** «Похожие»: first the same model of close year / mileage / price; then the same class
 *  (sportbike, cruiser…) of close price, year and mileage; then anything of the same type, nearest first. */
export function similar(l: Lot, n = 4) {
  const others = LOTS.filter((x) => x.id !== l.id && x.type === l.type);
  const near = (x: Lot, dp: number, dy: number) => Math.abs(x.price - l.price) <= l.price * dp && Math.abs(x.year - l.year) <= dy;
  const kmOk = (x: Lot) => Math.abs((x.km || 0) - (l.km || 0)) <= Math.max(8000, (l.km || 0) * 0.6);
  const cls = l.type === "moto" ? motoSpec(l).cls : null;
  const tiers = [
    others.filter((x) => x.brand === l.brand && x.model === l.model && near(x, .25, 2) && kmOk(x)),
    others.filter((x) => x.brand === l.brand && x.model === l.model),
    others.filter((x) => (cls ? motoSpec(x).cls === cls : true) && near(x, .3, 3) && kmOk(x)),
    others.filter((x) => (cls ? motoSpec(x).cls === cls : true) && near(x, .45, 4)),
    others,
  ];
  const out: Lot[] = [];
  for (const t of tiers) {
    for (const x of t.slice().sort((a, b) => gap(l, a) - gap(l, b))) { if (out.length >= n) break; if (!out.includes(x)) out.push(x); }
    if (out.length >= n) break;
  }
  return out;
}

export const yawFor = (i: number) => (i % 2 ? -0.55 : 0.6);
