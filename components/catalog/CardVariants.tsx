"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Lot, hdSrc, likeLink, lotHref, typeLabel } from "@/lib/lots";
import { motoSpec } from "@/lib/moto-specs";
import { dateRu, groups, kmLabel, money } from "@/lib/format";
import { PHONE, PHONE_HREF, asset } from "@/lib/site";
import LotMedia from "./LotMedia";
import LikeButton from "./LikeButton";

/* ---------- facts every variant can show; all computed from the post, nothing invented ---------- */
const NOW = new Date();
const CLASS_ONE: Record<string, string> = { "Спортбайки": "Спортбайк", "Нейкеды": "Нейкед", "Круизеры": "Круизер", "Туристические": "Турист", "Спорт-туристы": "Спорт-турист", "Эндуро-туристы": "Эндуро-турист", "Ретро и классика": "Классика", "Скутеры": "Скутер", "Трициклы": "Трицикл" };
export function facts(l: Lot) {
  const ms = l.type === "moto" ? motoSpec(l) : { cc: null, cls: null };
  const cc = l.volume || (ms.cc ? `${groups(ms.cc)} см³` : null);
  const age = Math.max(1, NOW.getFullYear() - l.year);
  const perYear = l.km ? Math.round(l.km / age / 100) * 100 : 0;
  const fresh = (NOW.getTime() - new Date(l.date).getTime()) / 864e5 <= 3;
  const isNew = !l.km || l.km < 300;
  const lowKm = !isNew && perYear > 0 && perYear <= 3000;
  const eta = new Date(NOW.getTime() + 45 * 864e5).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const text = (l.body || []).filter((b) => b.k === "p" || b.k === "li").map((b) => b.t).join(" ");
  const sentences = text.split(/(?<=[.!])\s+/).filter((s) => s.length > 20 && !s.startsWith(l.name));
  const badges: { t: string; k: string }[] = [];
  if (isNew) badges.push({ t: "Новый", k: "new" });
  if (lowKm) badges.push({ t: "Малый пробег", k: "low" });
  if (fresh) badges.push({ t: "Свежее", k: "fresh" });
  if (/один владелец/i.test(text)) badges.push({ t: "1 владелец", k: "own" });
  if (/без дтп|не бит|не участвовал/i.test(text)) badges.push({ t: "Без ДТП", k: "ok" });
  return { cls: ms.cls ? CLASS_ONE[ms.cls] || ms.cls : null, cc, perYear, isNew, eta, excerpt: sentences.slice(0, 2).join(" "), badges };
}
const Badges = ({ b, max = 3 }: { b: { t: string; k: string }[]; max?: number }) =>
  b.length ? <ul className="cv-badges">{b.slice(0, max).map((x) => <li key={x.k} className={"cv-b-" + x.k}>{x.t}</li>)}</ul> : null;

/* 1 — Витрина: badges and price over the photo, icon specs, one big action */
export function CardShowcase({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot);
  return (
    <article className="lot cv1" data-light="">
      <div className="cv1-media">
        <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
        <Badges b={f.badges} />
        <div className="cv1-price"><b>{money(lot.price)}</b><span>под ключ · {dateRu(lot.date)}</span></div>
      </div>
      <div className="cv1-body">
        <div className="cv1-ttl"><h3><Link href={href}>{lot.name}</Link></h3>{f.cls && <span>{f.cls}</span>}</div>
        <ul className="cv1-specs">
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg><b>{lot.year}</b></li>
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16a8 8 0 1 1 16 0" /><path d="M12 16l4-5" /></svg><b>{kmLabel(lot.km)}</b></li>
          {f.cc && <li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="8" width="14" height="10" rx="1.5" /><path d="M8 8V5h8v3M2 12h3M19 12h3" /></svg><b>{f.cc}</b></li>}
        </ul>
        {lot.features.length > 0 && <ul className="lot-chips">{lot.features.slice(0, 2).map((x) => <li key={x}>{x}</li>)}</ul>}
        <div className="cv1-foot"><LikeButton className="lot-cta cv-wide" tgHref={likeLink(lot)} /></div>
      </div>
    </article>
  );
}

/* 2 — Техпаспорт: spec sheet with mileage per year and the delivery date */
export function CardSheet({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot);
  const rows: [string, string][] = [
    ["Год", String(lot.year)], ["Пробег", kmLabel(lot.km)],
    ["Объём", f.cc || "—"], ["Тип", f.cls || "—"],
    ["В год", f.isNew ? "—" : `≈ ${groups(f.perYear)} км`], ["В Москве", `≈ к ${f.eta}`],
  ];
  return (
    <article className="lot cv2" data-light="">
      <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
      <div className="lot-body">
        <div><span className="cv-mono">{lot.brand}</span><h3 className="lot-t"><Link href={href}>{lot.model}</Link></h3></div>
        <dl className="cv2-sheet">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        {f.excerpt && <p className="cv2-ex">{f.excerpt}</p>}
        <div className="cv2-price"><b>{money(lot.price)}</b><span>под ключ, на {dateRu(lot.date)}</span></div>
        <div className="lot-foot"><LikeButton className="lot-cta" tgHref={likeLink(lot)} /><Link className="lot-tg" href={href}>Подробнее →</Link></div>
      </div>
    </article>
  );
}

/* 3 — Строка: wide row for a list view — photo, story, price column */
export function CardRow({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot);
  return (
    <article className="lot cv3" data-light="">
      <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
      <div className="cv3-mid">
        <Badges b={f.badges} />
        <h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>
        <p className="cv3-line">{lot.year} · {kmLabel(lot.km)}{f.cc ? ` · ${f.cc}` : ""}{f.cls ? ` · ${f.cls}` : ""}</p>
        {f.excerpt && <p className="cv3-ex">{f.excerpt}</p>}
        {lot.features.length > 0 && <ul className="lot-chips">{lot.features.slice(0, 4).map((x) => <li key={x}>{x}</li>)}</ul>}
      </div>
      <div className="cv3-side">
        <div><b className="cv3-price">{money(lot.price)}</b><span className="cv-mono">под ключ · {dateRu(lot.date)}</span></div>
        <p className="cv3-eta">Доставка до 45 дней — ориентировочно к {f.eta}</p>
        <LikeButton className="lot-cta cv-wide" tgHref={likeLink(lot)} />
        <a className="cv3-call" href={PHONE_HREF}>Позвонить: {PHONE}</a>
      </div>
    </article>
  );
}

/* 4 — Быстрый просмотр: compact card, everything else in an overlay without leaving the catalog */
function QuickView({ lot, onClose }: { lot: Lot; onClose: () => void }) {
  const f = facts(lot); const [i, setI] = useState(0);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k); document.documentElement.classList.add("lb-lock");
    return () => { document.removeEventListener("keydown", k); document.documentElement.classList.remove("lb-lock"); };
  }, [onClose]);
  const src = (p: string) => asset(lot.hd ? hdSrc(p) : p);
  return createPortal(
    <div className="qv" role="dialog" aria-modal="true" aria-label={lot.name} onClick={onClose}>
      <div className="qv-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="qv-x" aria-label="Закрыть" onClick={onClose}>×</button>
        <div className="qv-gal">
          <img src={src(lot.photos[i])} alt={`${lot.name}, фото ${i + 1}`} />
          <div className="qv-th">{lot.photos.map((p, k) => <button type="button" key={p} className={k === i ? "is-on" : ""} onClick={() => setI(k)} aria-label={`Фото ${k + 1}`}><img src={asset(p)} alt="" /></button>)}</div>
        </div>
        <div className="qv-info">
          <Badges b={f.badges} max={5} />
          <h3>{lot.name}</h3>
          <dl className="cv2-sheet">
            {([["Год", String(lot.year)], ["Пробег", kmLabel(lot.km)], ["Объём", f.cc || "—"], ["Тип", f.cls || "—"]] as [string, string][]).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {f.excerpt && <p className="qv-ex">{f.excerpt}</p>}
          {lot.features.length > 0 && <ul className="lot-chips">{lot.features.map((x) => <li key={x}>{x}</li>)}</ul>}
          <div className="cv2-price"><b>{money(lot.price)}</b><span>под ключ, на {dateRu(lot.date)} · доставка до 45 дней</span></div>
          <div className="qv-act"><LikeButton className="lot-cta" tgHref={likeLink(lot)} /><a className="qv-call" href={PHONE_HREF}>Позвонить</a><Link className="lot-tg" href={lotHref(lot)}>Страница объявления →</Link></div>
        </div>
      </div>
    </div>, document.body);
}
export function CardQuick({ lot, yaw, open: start }: { lot: Lot; yaw: number; open?: boolean }) {
  const f = facts(lot), href = lotHref(lot); const [open, setOpen] = useState(!!start);
  return (
    <article className="lot cv4" data-light="">
      <div className="cv4-media">
        <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
        <button type="button" className="cv4-qv" onClick={() => setOpen(true)}>Быстрый просмотр</button>
      </div>
      <div className="lot-body">
        <h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>
        <p className="cv3-line">{lot.year} · {kmLabel(lot.km)}{f.cc ? ` · ${f.cc}` : ""}</p>
        <Badges b={f.badges} />
        <div className="cv4-row"><b className="cv4-price">{money(lot.price)}</b><button type="button" className="cv4-more" onClick={() => setOpen(true)} aria-label={`Быстрый просмотр: ${lot.name}`}>Смотреть</button></div>
      </div>
      {open && <QuickView lot={lot} onClose={() => setOpen(false)} />}
    </article>
  );
}

/* 5 — Минимал + шторка: photo, name and price; on hover a panel slides up with specs, story and actions */
export function CardReveal({ lot, yaw }: { lot: Lot; yaw: number }) {
  const f = facts(lot), href = lotHref(lot);
  return (
    <article className="lot cv5" data-light="">
      <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} />
      <div className="cv5-base">
        <div><h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3><span className="cv-mono">{lot.year} · {kmLabel(lot.km)}</span></div>
        <b>{money(lot.price)}</b>
      </div>
      <div className="cv5-panel">
        <Badges b={f.badges} />
        <dl className="cv2-sheet cv5-sheet">
          {([["Объём", f.cc || "—"], ["Тип", f.cls || "—"], ["В год", f.isNew ? "—" : `≈ ${groups(f.perYear)} км`], ["В Москве", `≈ к ${f.eta}`]] as [string, string][]).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        {f.excerpt && <p className="cv5-ex">{f.excerpt}</p>}
        <div className="lot-foot"><LikeButton className="lot-cta" tgHref={likeLink(lot)} /><Link className="lot-tg" href={href}>Подробнее →</Link></div>
      </div>
    </article>
  );
}
