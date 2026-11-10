/** Lot type and helpers with no catalog data inside, safe to import in client components
 *  (importing lib/lots there would ship the whole lots.json to the browser). */
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
  /** per photo: object-position for the 4:3 and the 1:1 card, [x43, y43, x11, y11] in % (scripts/focus.py) */
  focus?: (number[] | null)[];
};

/** Sharper ×2 copy of a local catalog photo. */
export const hdSrc = (p: string) => p.replace(/\.jpg$/, "@2x.jpg");

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

export const yawFor = (i: number) => (i % 2 ? -0.55 : 0.6);
