"use client";
import Link from "next/link";
import { LOTS, Lot, likeLink, lotHref, typeLabel } from "@/lib/lots";
import { motoSpec } from "@/lib/moto-specs";
import { dateRu, groups, kmLabel, money } from "@/lib/format";
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
      {f.deal && <li className="cw-deal">Выгодно · −{f.deal.pct}%</li>}
      {f.noCrash && <li className="cw-ok">Без ДТП</li>}
    </ul>
  );
}

/* 1 — Постер: full-bleed vertical photo, name and price set on it */
export function CardPoster({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot);
  return (
    <article className="lot cw1" data-light="">
      <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
      <Badges f={f} cls="cw1-b" />
      <div className="cw1-over">
        <span className="cw-mono">{lot.brand}{f.cls ? ` · ${f.cls}` : ""}</span>
        <h3 className="cw1-t"><Link href={href}>{lot.model}</Link></h3>
        <p className="cw1-specs"><span>{lot.year}</span><span>{kmLabel(lot.km)}</span>{f.cc && <span>{f.cc}</span>}</p>
        <div className="cw1-foot"><div><b>{money(lot.price)}</b><em>под ключ · {dateRu(lot.date)}</em></div><LikeButton className="lot-cta" tgHref={likeLink(lot)} /></div>
      </div>
    </article>
  );
}

/* 2 — Ценник: big numbers and a price scale against the same model in the catalog */
export function CardPrice({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot), d = f.deal;
  const pos = d ? Math.round((lot.price - d.min) / Math.max(1, d.max - d.min) * 100) : 0;
  return (
    <article className="lot cw2" data-light="">
      <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
      <div className="lot-body">
        <div className="cw2-head"><h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>{f.noCrash && <span className="cw-tag-ok">Без ДТП</span>}</div>
        <dl className="cw2-nums">
          <div><dt>год</dt><dd>{lot.year}</dd></div>
          <div><dt>пробег</dt><dd>{lot.km ? groups(lot.km) : "0"}<small> км</small></dd></div>
          <div><dt>объём</dt><dd>{f.cc ? f.cc.replace(/\s*см³/, "") : "—"}<small> см³</small></dd></div>
        </dl>
        <div className="cw2-price">
          <div className="cw2-pr"><b>{money(lot.price)}</b>{d && <span className="cw2-pct">−{d.pct}% к средней</span>}</div>
          {d ? (
            <div className="cw2-scale" aria-label={`Цена ниже средней по ${d.n} похожим ${lot.model} в каталоге на ${d.pct}%`}>
              <div className="cw2-bar"><i style={{ left: `${pos}%` }}></i><s style={{ left: `${Math.round((d.avg - d.min) / Math.max(1, d.max - d.min) * 100)}%` }}></s></div>
              <div className="cw2-lbl"><span>{money(d.min)}</span><span>средняя {money(d.avg)}</span><span>{money(d.max)}</span></div>
            </div>
          ) : <span className="cw2-note">под ключ, на {dateRu(lot.date)}</span>}
        </div>
        <div className="lot-foot"><LikeButton className="lot-cta" tgHref={likeLink(lot)} /><Link className="lot-tg" href={href}>Подробнее →</Link></div>
      </div>
    </article>
  );
}

/* 3 — Приборка: the mileage as a gauge, year and engine as readouts */
export function CardGauge({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot);
  const v = Math.min(1, (lot.km || 0) / 30000), A = 220, r = 34, L = 2 * Math.PI * r * A / 360;
  return (
    <article className="lot cw3" data-light="">
      <div className="cw3-media"><LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} /><Badges f={f} cls="cw3-b" /></div>
      <div className="lot-body">
        <h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>
        <div className="cw3-dash">
          <div className="cw3-g">
            <svg viewBox="0 0 80 70" aria-hidden="true">
              <circle cx="40" cy="40" r={r} className="cw3-trk" strokeDasharray={`${L} 999`} transform="rotate(160 40 40)" />
              <circle cx="40" cy="40" r={r} className="cw3-val" strokeDasharray={`${Math.max(1.5, L * v)} 999`} transform="rotate(160 40 40)" />
            </svg>
            <b>{lot.km ? groups(lot.km) : "0"}</b><span>км</span>
          </div>
          <dl>
            <div><dt>Год</dt><dd>{lot.year}</dd></div>
            <div><dt>Объём</dt><dd>{f.cc || "—"}</dd></div>
            <div><dt>Тип</dt><dd>{f.cls || "—"}</dd></div>
          </dl>
        </div>
        <div className="cw3-foot"><div><b>{money(lot.price)}</b><em>под ключ · {dateRu(lot.date)}</em></div><LikeButton className="lot-cta" tgHref={likeLink(lot)} /></div>
      </div>
    </article>
  );
}

/* 4 — Типографика: brand small, model huge, price on a dotted leader like a menu */
export function CardType({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot);
  return (
    <article className="lot cw4" data-light="">
      <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
      <div className="lot-body">
        <div className="cw4-top"><span className="cw-mono">{lot.brand}</span><Badges f={f} /></div>
        <h3 className="cw4-t"><Link href={href}>{lot.model}</Link></h3>
        <p className="cw4-specs"><span>{lot.year}</span><i></i><span>{kmLabel(lot.km)}</span>{f.cc && <><i></i><span>{f.cc}</span></>}{f.cls && <><i></i><span>{f.cls}</span></>}</p>
        <div className="cw4-lead"><span>Под ключ</span><i></i><b>{money(lot.price)}</b></div>
        <LikeButton className="cw4-cta" tgHref={likeLink(lot)} />
      </div>
    </article>
  );
}

/* 5 — HUD: the photo is the whole card, specs on a glass panel like the hero's interface */
export function CardHud({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot);
  return (
    <article className="lot cw5" data-light="">
      <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
      <i className="cw5-c cw5-c1"></i><i className="cw5-c cw5-c2"></i><i className="cw5-c cw5-c3"></i><i className="cw5-c cw5-c4"></i>
      <Badges f={f} cls="cw5-b" />
      <div className="cw5-glass">
        <h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>
        <dl className="cw5-row">
          <div><dt>Год</dt><dd>{lot.year}</dd></div>
          <div><dt>Пробег</dt><dd>{kmLabel(lot.km)}</dd></div>
          <div><dt>Объём</dt><dd>{f.cc || "—"}</dd></div>
        </dl>
        <div className="cw5-foot"><b>{money(lot.price)}</b><LikeButton className="lot-cta" tgHref={likeLink(lot)} /></div>
      </div>
    </article>
  );
}
