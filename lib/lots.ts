import raw from "@/data/lots.json";
import redirectsRaw from "@/data/redirects.json";
import focusRaw from "@/data/focus.json";
import mainRaw from "@/data/main-photo.json";
import { motoSpec } from "./moto-specs";
import type { Lot } from "./lot-base";

export * from "./lot-base";

type Focus = { v: string; d: number; fb?: number; b?: number[]; p43?: number[]; p11?: number[] };
const FOCUS = focusRaw as Record<string, Focus>;
const SHOWS_FRONT = new Set(["side", "front"]);
/** share of the photo taken by the vehicle; a small one is a picture on a booklet, a key fob or a far-away shot */
const area = (f?: Focus) => (f?.b ? (f.b[2] - f.b[0]) * (f.b[3] - f.b[1]) : 0);
/** a main photo that hides the front: a close-up, a car interior (no car found on it), a clear view from behind,
 *  or a vehicle too small to be the subject (e.g. the bike pictured on a service book) */
const hidesFront = (f: Focus | undefined, type: string) =>
  !!f && (f.v === "detail" || (f.v === "none" && type === "car") || (f.v === "rear" && (f.fb ?? 0) < -0.03) || (!!f.b && area(f) < 0.12));
const goodMain = (f?: Focus) => !!f && SHOWS_FRONT.has(f.v) && area(f) >= 0.12;
/** manual picks: { "9273": 2 } puts photo №2 of lot 9273 first (when the automatic choice is wrong) */
const MAIN = mainRaw as Record<string, number>;

/** The main photo must show the vehicle's front: if the first one is a rear view or a detail shot,
 *  the first side / front view goes first. Each photo also gets its crop position (scripts/focus.py). */
function framed(l: Lot): Lot {
  let photos = l.photos;
  const pick = MAIN[String(l.id)];
  if (pick && pick > 1 && pick <= photos.length) {
    photos = [photos[pick - 1], ...photos.slice(0, pick - 1), ...photos.slice(pick)];
  } else if (hidesFront(FOCUS[photos[0]], l.type)) {
    const i = photos.findIndex((p) => goodMain(FOCUS[p]));
    if (i > 0) photos = [photos[i], ...photos.slice(0, i), ...photos.slice(i + 1)];
  }
  const focus = photos.map((p) => { const f = FOCUS[p]; return f?.p43 && f.p11 ? [...f.p43, ...f.p11] : null; });
  return { ...l, photos, focus: focus.some(Boolean) ? focus : undefined };
}

/** All lots, newest first (the order of publication in the Telegram channel). */
export const LOTS: Lot[] = (raw as Lot[]).map(framed).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

export const lotBySlug = (slug: string) => LOTS.find((l) => l.slug === slug);

/** Addresses of reposted (removed) listings → the newest post of the same vehicle (scripts/dedupe.py). */
export const REDIRECTS = redirectsRaw as Record<string, string>;
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

