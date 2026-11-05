// Selling facts for catalog cards, all computed from the post itself and the catalog — nothing invented.
import { LOTS, Lot } from "@/lib/lots";
import { motoSpec } from "@/lib/moto-specs";
import { groups } from "@/lib/format";

const COND = /дтп|падени|аварий|скольж|владел|состояни|пробег|сервис|то пройден|обслуж/i;

/** Clean feature lines: drop parser noise like "*25,5" and the "Тюнинг:" prefix. */
export function features(l: Lot) {
  return l.features
    .filter((f) => /[a-zа-яё]{3}/i.test(f))
    .map((f) => f.replace(/^Тюнинг:\s*/i, "").replace(/^\S/, (c) => c.toUpperCase()));
}
/** Condition facts (no accidents, one owner…) and equipment / tuning, separately. */
export function split(l: Lot) {
  const all = features(l);
  return { cond: all.filter((f) => COND.test(f)), extra: all.filter((f) => !COND.test(f)) };
}

const NOW_Y = new Date().getFullYear();
/** Kilometres per year of use: shows how gently the bike was ridden. */
export function kmPerYear(l: Lot) {
  if (!l.km) return null;
  const years = Math.max(1, NOW_Y - l.year + .5);
  return Math.round(l.km / years / 100) * 100;
}

/** Price against the same model in the catalog: negative = cheaper than the average. */
const avgBy = (() => {
  const m = new Map<string, number[]>();
  for (const x of LOTS) { const k = x.brand + "|" + x.model; m.set(k, [...(m.get(k) || []), x.price]); }
  return m;
})();
export function priceVsModel(l: Lot) {
  const ps = avgBy.get(l.brand + "|" + l.model) || [];
  if (ps.length < 3) return null;
  const avg = ps.reduce((a, b) => a + b, 0) / ps.length;
  const d = Math.round((l.price - avg) / avg * 100);
  return { d, n: ps.length };
}

export const daysAgo = (l: Lot) => Math.max(0, Math.floor((Date.now() - new Date(l.date).getTime()) / 864e5));

/** Short badges for the photo: fresh post, nearly new, no accidents, one owner. */
export function badges(l: Lot) {
  const b: { t: string; k: string }[] = [];
  if (daysAgo(l) <= 3) b.push({ t: "Новинка", k: "new" });
  if (!l.km) b.push({ t: "Новый", k: "km" });
  else if (l.km < 3000) b.push({ t: "Почти новый", k: "km" });
  const f = features(l).join(" ").toLowerCase();
  if (/без дтп|без аварий/.test(f)) b.push({ t: "Без ДТП", k: "ok" });
  if (/один владелец|1 владелец/.test(f)) b.push({ t: "1 владелец", k: "ok" });
  return b;
}

const ONE: Record<string, string> = { "Спортбайки": "Спортбайк", "Нейкеды": "Нейкед", "Круизеры": "Круизер", "Туристические": "Туристический", "Спорт-туристы": "Спорт-турист", "Эндуро-туристы": "Эндуро-турист", "Ретро и классика": "Классика", "Скутеры": "Скутер", "Трициклы": "Трицикл" };
export function moto(l: Lot) {
  const s = motoSpec(l);
  const cc = l.volume ? l.volume.replace(/\s*см.*$/, "") : s.cc ? String(s.cc) : null;
  return { cc, cls: s.cls ? ONE[s.cls] || s.cls : null };
}
export const km = (l: Lot) => (l.km ? `${groups(l.km)} км` : "новый");
