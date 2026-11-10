/** Card facts computed on the server (they compare a lot with the whole catalog). */
import { LOTS, Lot } from "./lots";
import { motoSpec } from "./moto-specs";
import { groups } from "./format";

/* ---------- facts: specs, «без ДТП» from the post text, «выгодно» against the same model in the catalog ---------- */
const CLASS_ONE: Record<string, string> = { "Спортбайки": "Спортбайк", "Нейкеды": "Нейкед", "Круизеры": "Круизер", "Туристические": "Турист", "Спорт-туристы": "Спорт-турист", "Эндуро-туристы": "Эндуро-турист", "Ретро и классика": "Классика", "Скутеры": "Скутер", "Трициклы": "Трицикл" };
const median = (a: number[]) => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Cheaper than the same model of the same years (±1) in the catalog, without more mileage: a fair «выгодно». */
export function deal(l: Lot) {
  const c = LOTS.filter((x) => x.id !== l.id && x.type === l.type && x.brand === l.brand && x.model === l.model && Math.abs(x.year - l.year) <= 1);
  if (c.length < 2) return null;
  const mp = median(c.map((x) => x.price)), mk = median(c.map((x) => x.km || 0));
  const pct = Math.round((mp - l.price) / mp * 100);
  if (pct < 7 || (l.km || 0) > mk * 1.3 + 3000) return null;
  const ps = c.map((x) => x.price);
  return { pct, avg: mp, min: Math.min(...ps, l.price), max: Math.max(...ps, l.price), n: c.length };
}
export type Facts = { cls: string | null; cc: string | null; deal: ReturnType<typeof deal> };
export function facts(l: Lot): Facts {
  const ms = l.type === "moto" ? motoSpec(l) : { cc: null, cls: null };
  return {
    cls: ms.cls ? CLASS_ONE[ms.cls] || ms.cls : null,
    cc: l.volume || (ms.cc ? `${groups(ms.cc)} см³` : null),
    deal: deal(l),
  };
}
