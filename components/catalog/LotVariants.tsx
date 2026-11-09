import Link from "next/link";
import { BodyLine, LOTS, Lot, likeLink, lotHref, similar, yawFor, hdSrc } from "@/lib/lots";
import { dateLong, dateRu, groups, kmLabel, money } from "@/lib/format";
import { PHONE, PHONE_HREF, asset, LINKS } from "@/lib/site";
import { AVITO_RATING, TEAM } from "@/data/content";
import { facts } from "./MotoCard";
import LotGallery from "./LotGallery";
import LotCard from "./LotCard";
import LikeButton from "./LikeButton";

/* ---------------- data shared by all five lot-page designs (everything from the post or the site's own facts) ---------------- */
function sections(body: BodyLine[]) {
  const out: { h: string; items: string[] }[] = []; const warn: string[] = []; const about: string[] = [];
  for (const b of body) {
    if (b.k === "warn") warn.push(b.t); else if (b.k === "p") about.push(b.t);
    else if (b.k === "h") out.push({ h: b.t, items: [] });
    else { if (!out.length) out.push({ h: "Комплектация", items: [] }); out[out.length - 1].items.push(b.t); }
  }
  return { out: out.filter((s) => s.items.length), warn, about };
}
export function lotData(l: Lot) {
  const f = facts(l);
  const s = sections(l.body);
  const peers = LOTS.filter((x) => x.type === l.type && x.brand === l.brand && x.model === l.model).map((x) => ({ id: x.id, year: x.year, price: x.price, km: x.km, me: x.id === l.id }));
  const eta = new Date(Date.now() + 45 * 864e5).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const nums = [
    { k: "Год", v: String(l.year), u: "" },
    { k: "Пробег", v: l.km ? groups(l.km) : "новый", u: l.km ? "км" : "" },
    { k: "Объём", v: f.cc ? f.cc.replace(/\s*см³/, "") : "—", u: f.cc ? "см³" : "" },
  ];
  return { f, ...s, peers, eta, nums, pre: Math.round(l.price * 0.1 / 1000) * 1000 };
}
type D = ReturnType<typeof lotData>;

/* ---------------- building blocks ---------------- */
const Check = () => <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.6 9.5 3.6" /></svg>;
function Badges({ d }: { d: D }) {
  if (!d.f.noCrash && !d.f.deal) return null;
  return <ul className="cw-badges tn-glass lv-badges">
    {d.f.deal && <li className="cw-deal"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /></svg>Ниже рынка · −{d.f.deal.pct}%</li>}
    {d.f.noCrash && <li className="cw-ok"><Check />Без ДТП</li>}
  </ul>;
}
function Nums({ d, cls = "" }: { d: D; cls?: string }) {
  return <dl className={"lv-nums " + cls}>{d.nums.map((n) => <div key={n.k}><dt>{n.k}{n.u ? `, ${n.u}` : ""}</dt><dd>{n.v}</dd></div>)}</dl>;
}
function Price({ l, d, big }: { l: Lot; d: D; big?: boolean }) {
  return (
    <div className={"lv-price" + (big ? " is-big" : "")}>
      <b>{money(l.price)}</b>
      <span>под ключ · актуально на {dateRu(l.date)}</span>
      {d.f.deal && <span className="lv-deal">На {d.f.deal.pct}% ниже средней цены {l.model} в нашем каталоге ({money(d.f.deal.avg)})</span>}
    </div>
  );
}
function Cta({ l, stack }: { l: Lot; stack?: boolean }) {
  return (
    <div className={"lv-cta" + (stack ? " is-stack" : "")}>
      <LikeButton className="btn btn-primary" tgHref={likeLink(l)} />
      <a className="btn btn-ghost" href={PHONE_HREF}>Позвонить {PHONE}</a>
    </div>
  );
}
function Trust() {
  return (
    <ul className="lv-trust">
      <li><b>{AVITO_RATING.score}★</b><span>{AVITO_RATING.count} отзывов на Авито</span></li>
      <li><b>до 45 дн</b><span>доставка, рекорд — 25</span></li>
      <li><b>10%</b><span>предоплата — остальное по прибытии</span></li>
    </ul>
  );
}
function Team({ compact }: { compact?: boolean }) {
  return (
    <div className={"lv-team" + (compact ? " is-compact" : "")}>
      <div className="lv-faces">{TEAM.map((m) => <img key={m.name} src={asset(m.photo)} alt="" width={48} height={48} loading="lazy" />)}</div>
      <p>Ева, Сергей и Анатолий ответят в Telegram и помогут с выбором</p>
    </div>
  );
}
function Desc({ d }: { d: D }) {
  return (
    <div className="lv-desc">
      {d.about.map((t) => <p key={t} className="lv-about">{t}</p>)}
      {d.warn.length > 0 && <div className="lp-warn" role="note"><b>Важно знать</b>{d.warn.map((w) => <p key={w}>{w}</p>)}</div>}
      <div className="lv-secs">
        {d.out.map((s) => <div key={s.h}><h3>{s.h}</h3><ul>{s.items.map((t, i) => <li key={i}><Check />{t}</li>)}</ul></div>)}
      </div>
    </div>
  );
}
const ROUTE = [
  { t: "Осмотр в Корее", s: "фото- и видеоотчёт, 12 500 ₽" },
  { t: "Договор и оплата", s: "от 10% предоплаты" },
  { t: "Выкуп и отправка", s: "каждый шаг на фото и видео" },
  { t: "Доставка", s: "до 45 дней с отплытия" },
  { t: "Москва", s: "" },
];
function Route({ d, vertical }: { d: D; vertical?: boolean }) {
  return (
    <ol className={"lv-route" + (vertical ? " is-v" : "")}>
      {ROUTE.map((r, i) => <li key={r.t} className={i === ROUTE.length - 1 ? "is-end" : ""}><i aria-hidden="true"></i><b>{r.t}</b><span>{i === ROUTE.length - 1 ? `ориентировочно к ${d.eta}` : r.s}</span></li>)}
    </ol>
  );
}
function Buy({ l, d }: { l: Lot; d: D }) {
  return (
    <div className="lv-buy">
      <div><span className="cw-mono">Предоплата 10%</span><b>≈ {money(d.pre)}</b><p>Договор через автосалон-партнёр Da Motors, 90% — после получения в России. Есть комиссия партнёра.</p></div>
      <div><span className="cw-mono">Кредит</span><b>10+ банков</b><p>Условия рассчитываем индивидуально.</p></div>
      <div><span className="cw-mono">Полная оплата</span><b>{money(l.price)}</b><p>Безнал, наличные или с юрлица.</p></div>
    </div>
  );
}
/** Dot plot: every listing of the same model in the catalog by price; this one highlighted. */
function Market({ l, d }: { l: Lot; d: D }) {
  const p = d.peers; if (p.length < 3) return null;
  const lo = Math.min(...p.map((x) => x.price)), hi = Math.max(...p.map((x) => x.price)), span = Math.max(1, hi - lo);
  const avg = d.f.deal?.avg ?? p.reduce((a, x) => a + x.price, 0) / p.length;
  const pos = (v: number) => `${4 + (v - lo) / span * 92}%`;
  return (
    <div className="lv-market">
      <div className="lv-m-head"><h3>Цена против рынка</h3><span className="cw-mono">{p.length} объявлений {l.brand} {l.model} в каталоге</span></div>
      <div className="lv-m-plot" role="img" aria-label={`Цена ${money(l.price)} среди ${p.length} похожих объявлений, средняя ${money(avg)}`}>
        <div className="lv-m-axis"></div>
        {p.filter((x) => !x.me).map((x, i) => <i key={x.id} className="lv-m-dot" style={{ left: pos(x.price), top: `${30 + (i * 37) % 40}%` }} title={`${x.year}, ${money(x.price)}`}></i>)}
        <s className="lv-m-avg" style={{ left: pos(avg) }}><em>средняя {money(avg)}</em></s>
        <b className="lv-m-me" style={{ left: pos(l.price) }}><em>этот · {money(l.price)}</em></b>
      </div>
      <div className="lv-m-lbl"><span>{money(lo)}</span><span>{money(hi)}</span></div>
    </div>
  );
}
function Similar({ l }: { l: Lot }) {
  return (
    <div className="lv-sim">
      <div className="lv-sim-h"><h2>Похожие варианты</h2><Link className="link arrow" href="/catalog/">Весь каталог</Link></div>
      <div className="lots">{similar(l).map((x, i) => <LotCard key={x.id} lot={x} yaw={yawFor(i)} />)}</div>
    </div>
  );
}
const Note = ({ l }: { l: Lot }) => <p className="lv-note">Опубликовано в нашем Telegram-канале {dateLong(l.date)}. Если этот экземпляр уже продан — найдём такой же по году, пробегу и бюджету.</p>;
function MobileBar({ l }: { l: Lot }) {
  return <div className="lv-mbar"><div><b>{money(l.price)}</b><span>под ключ</span></div><LikeButton className="btn btn-primary" tgHref={likeLink(l)} /></div>;
}
const Crumbs = ({ l }: { l: Lot }) => <nav className="lp-crumbs" aria-label="Навигация"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href="/catalog/">Каталог</Link><span aria-hidden="true">/</span><span>{l.name}</span></nav>;
const Kicker = ({ l, d }: { l: Lot; d: D }) => <span className="cw-mono lv-kick">{l.brand}{d.f.cls ? ` · ${d.f.cls}` : ""} · {l.year}</span>;

/* ================= 1 — Магазин: gallery + sticky buy panel ================= */
export function LotShop({ l }: { l: Lot }) {
  const d = lotData(l);
  return (
    <section className="catalog-page lv lv1 wrap"><div className="inner">
      <Crumbs l={l} />
      <div className="lv1-top">
        <div className="lv1-left">
          <LotGallery photos={l.photos} name={l.name} shape={l.type} hd={l.hd} />
          <section className="lv-block"><h2 className="lv-h2">Описание и состояние</h2><Desc d={d} /></section>
          <section className="lv-block"><h2 className="lv-h2">Путь до вас</h2><Route d={d} /></section>
          <section className="lv-block"><h2 className="lv-h2">Как купить</h2><Buy l={l} d={d} /></section>
        </div>
        <aside className="lv1-panel">
          <Badges d={d} />
          <Kicker l={l} d={d} />
          <h1 className="lv-h1">{l.name}</h1>
          <Nums d={d} />
          <Price l={l} d={d} />
          <Cta l={l} stack />
          <Team compact />
          <Trust />
          <Note l={l} />
        </aside>
      </div>
      <Similar l={l} />
    </div><MobileBar l={l} /></section>
  );
}

/* ================= 2 — Кино: full-bleed hero photo, name and price on it ================= */
export function LotCinema({ l }: { l: Lot }) {
  const d = lotData(l);
  const src = (p: string) => asset(l.hd ? hdSrc(p) : p);
  return (
    <section className="lv lv2">
      <div className="lv2-hero">
        <img src={src(l.photos[0])} alt={`${l.name} из Южной Кореи`} />
        <div className="lv2-shade" aria-hidden="true"></div>
        <div className="lv2-over wrap"><div className="inner">
          <Crumbs l={l} />
          <div className="lv2-row">
            <div><Badges d={d} /><Kicker l={l} d={d} /><h1 className="lv2-h1">{l.model}</h1></div>
            <div className="lv2-buy"><Price l={l} d={d} big /><Cta l={l} /></div>
          </div>
        </div></div>
      </div>
      <div className="wrap"><div className="inner">
        <div className="lv2-strip">{l.photos.slice(1).map((p, i) => <img key={p} src={src(p)} alt={`${l.name}, фото ${i + 2}`} loading="lazy" />)}</div>
        <Nums d={d} cls="lv2-nums" />
        <div className="lv2-cols">
          <div><h2 className="lv-h2">Описание и состояние</h2><Desc d={d} /></div>
          <aside className="lv2-side">
            <h3>Как купить</h3><Buy l={l} d={d} />
            <Team /><Cta l={l} stack />
          </aside>
        </div>
        <section className="lv-block"><h2 className="lv-h2">Путь до вас</h2><Route d={d} /></section>
        <Note l={l} />
        <Similar l={l} />
      </div></div>
      <MobileBar l={l} />
    </section>
  );
}

/* ================= 3 — Досье: numbered chapters, sticky photo and price ================= */
export function LotDossier({ l }: { l: Lot }) {
  const d = lotData(l);
  const ch = [
    { n: "01", t: "Техника", c: <><Nums d={d} /><dl className="lv-table">{[["Марка", l.brand], ["Модель", l.model], ["Тип", d.f.cls || "—"], ["Год", String(l.year)], ["Пробег", kmLabel(l.km)], ["Объём", d.f.cc || "—"]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></> },
    { n: "02", t: "Состояние", c: <Desc d={d} /> },
    { n: "03", t: "Цена", c: <><Price l={l} d={d} big /><Market l={l} d={d} /></> },
    { n: "04", t: "Доставка", c: <Route d={d} vertical /> },
    { n: "05", t: "Покупка", c: <Buy l={l} d={d} /> },
  ];
  return (
    <section className="catalog-page lv lv3 wrap"><div className="inner">
      <Crumbs l={l} />
      <header className="lv3-head"><span className="cw-mono">Досье № {l.id} · {dateRu(l.date)}</span><h1 className="lv3-h1">{l.name}</h1><Badges d={d} /></header>
      <div className="lv3-grid">
        <div className="lv3-ch">{ch.map((c) => <section key={c.n} className="lv3-c"><div className="lv3-n"><span>{c.n}</span><h2>{c.t}</h2></div><div className="lv3-body">{c.c}</div></section>)}</div>
        <aside className="lv3-side">
          <LotGallery photos={l.photos} name={l.name} shape={l.type} hd={l.hd} />
          <div className="lv3-card"><Price l={l} d={d} /><Cta l={l} stack /><Team compact /></div>
        </aside>
      </div>
      <Similar l={l} />
    </div><MobileBar l={l} /></section>
  );
}

/* ================= 4 — Выгода: price analysis and payment up front ================= */
export function LotValue({ l }: { l: Lot }) {
  const d = lotData(l);
  return (
    <section className="catalog-page lv lv4 wrap"><div className="inner">
      <Crumbs l={l} />
      <div className="lv4-top">
        <LotGallery photos={l.photos} name={l.name} shape={l.type} hd={l.hd} />
        <div className="lv4-info">
          <Badges d={d} /><Kicker l={l} d={d} /><h1 className="lv-h1">{l.name}</h1>
          <Nums d={d} />
          <div className="lv4-pay">
            <div className="lv4-pay-main"><span className="cw-mono">Цена под ключ</span><b>{money(l.price)}</b>{d.f.deal && <em>−{d.f.deal.pct}% к средней по рынку</em>}</div>
            <div className="lv4-pay-pre"><span className="cw-mono">Чтобы начать</span><b>≈ {money(d.pre)}</b><em>предоплата 10%, остальное — по прибытии</em></div>
          </div>
          <Cta l={l} stack />
          <Trust />
        </div>
      </div>
      <Market l={l} d={d} />
      <div className="lv4-cols">
        <section><h2 className="lv-h2">Описание и состояние</h2><Desc d={d} /></section>
        <section><h2 className="lv-h2">Путь до вас</h2><Route d={d} vertical /><Team /></section>
      </div>
      <section className="lv-block"><h2 className="lv-h2">Способы оплаты</h2><Buy l={l} d={d} /></section>
      <Note l={l} />
      <Similar l={l} />
    </div><MobileBar l={l} /></section>
  );
}

/* ================= 5 — Галерея-история: photos scroll, info stays ================= */
export function LotStory({ l }: { l: Lot }) {
  const d = lotData(l);
  const src = (p: string) => asset(l.hd ? hdSrc(p) : p);
  return (
    <section className="lv lv5">
      <div className="lv5-split">
        <div className="lv5-photos">{l.photos.map((p, i) => <img key={p} src={src(p)} alt={`${l.name} из Южной Кореи — фото ${i + 1}`} loading={i ? "lazy" : "eager"} />)}</div>
        <aside className="lv5-info">
          <Crumbs l={l} />
          <Badges d={d} /><Kicker l={l} d={d} /><h1 className="lv-h1">{l.name}</h1>
          <Nums d={d} />
          <Price l={l} d={d} />
          <Cta l={l} stack />
          <div className="lv5-desc"><Desc d={d} /></div>
          <Route d={d} vertical />
          <Team compact />
          <Trust />
        </aside>
      </div>
      <div className="wrap"><div className="inner"><Similar l={l} /></div></div>
      <MobileBar l={l} />
    </section>
  );
}
