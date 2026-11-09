import Link from "next/link";
import { LOTS, Lot, likeLink, lotHref, typeLabel } from "@/lib/lots";
import { motoSpec } from "@/lib/moto-specs";
import { dateRu, groups, money } from "@/lib/format";
import LotMedia from "./LotMedia";
import LikeButton from "./LikeButton";

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
export function facts(l: Lot) {
  const ms = l.type === "moto" ? motoSpec(l) : { cc: null, cls: null };
  const text = (l.body || []).map((b) => b.t).join(" ") + " " + l.features.join(" ");
  return {
    cls: ms.cls ? CLASS_ONE[ms.cls] || ms.cls : null,
    cc: l.volume || (ms.cc ? `${groups(ms.cc)} см³` : null),
    noCrash: /без\s+дтп|не\s+бит|без\s+падений|не\s+участвовал/i.test(text),
    deal: deal(l),
  };
}
function Badges({ f, cls = "" }: { f: ReturnType<typeof facts>; cls?: string }) {
  if (!f.noCrash && !f.deal) return null;
  return (
    <ul className={"cw-badges " + cls}>
      {f.deal && <li className="cw-deal"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /></svg>Ниже рынка · −{f.deal.pct}%</li>}
      {f.noCrash && <li className="cw-ok"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.6 9.5 3.6" /></svg>Без ДТП</li>}
    </ul>
  );
}

/* Итог: метки на фото, крупные год / пробег / объём (из «Ценника»), цена с кнопкой (из «Постера») */
/** Motorcycle card in the catalog. */
export default function MotoCard({ lot, yaw, eager }: { lot: Lot; yaw: number; eager?: boolean }) {
  const f = facts(lot), href = lotHref(lot);
  return (
    <article className="lot cw6 tn-glass" data-light="">
      <div className="cw3-media"><LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} eager={eager} /><Badges f={f} cls="cw3-b" /></div>
      <div className="lot-body">
        <div><span className="cw-mono">{lot.brand}{f.cls ? ` · ${f.cls}` : ""}</span><h3 className="lot-t cw6-t"><Link href={href}>{lot.model}</Link></h3></div>
        <dl className="cw2-nums cw6-nums">
          <div><dt>год</dt><dd>{lot.year}</dd></div>
          <div><dt>пробег, км</dt><dd>{lot.km ? groups(lot.km) : "новый"}</dd></div>
          <div><dt>объём, см³</dt><dd>{f.cc ? f.cc.replace(/\s*см³/, "") : "—"}</dd></div>
        </dl>
        <div className="cw1-foot cw6-foot"><div><b>{money(lot.price)}</b><em>под ключ · {dateRu(lot.date)}</em></div><LikeButton className="lot-cta" tgHref={likeLink(lot)} /></div>
      </div>
    </article>
  );
}
