import Link from "next/link";
import { Lot, likeLink, lotHref, typeLabel } from "@/lib/lots";
import { dateRu, money } from "@/lib/format";
import LotMedia from "./LotMedia";
import LikeButton from "./LikeButton";
import { badges, daysAgo, km, kmPerYear, moto, priceVsModel, split } from "./cardInfo";

type P = { lot: Lot; yaw: number; eager?: boolean };

const Badges = ({ lot, max = 3 }: { lot: Lot; max?: number }) => {
  const b = badges(lot).slice(0, max);
  return b.length ? <ul className="cv-badges">{b.map((x) => <li key={x.t} className={"cv-b-" + x.k}>{x.t}</li>)}</ul> : null;
};
const Deal = ({ lot }: { lot: Lot }) => {
  const p = priceVsModel(lot);
  if (!p || p.d > -3) return null;
  return <span className="cv-deal">на {-p.d}% ниже средней цены {lot.model} в каталоге</span>;
};
const Fresh = ({ lot }: { lot: Lot }) => {
  const d = daysAgo(lot);
  return <span className="cv-fresh">{d === 0 ? "Опубликовано сегодня" : d === 1 ? "Опубликовано вчера" : `Цена на ${dateRu(lot.date)}`}</span>;
};
const Media = ({ lot, yaw, eager }: P) => <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={lotHref(lot)} kind={typeLabel(lot.type)} eager={eager} />;

/* A — spec sheet: badges on the photo, 4 key numbers, condition ticks, price with the model comparison */
export function CardSpec({ lot, yaw, eager }: P) {
  const m = moto(lot), { cond, extra } = split(lot), href = lotHref(lot);
  return (
    <article className="lot cv cvA" data-light="">
      <div className="cv-mw"><Media lot={lot} yaw={yaw} eager={eager} /><Badges lot={lot} /></div>
      <div className="lot-body">
        <div><span className="cv-cls">{m.cls || "Мотоцикл"}</span><h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3></div>
        <dl className="cvA-grid">
          <div><dt>Год</dt><dd>{lot.year}</dd></div>
          <div><dt>Пробег</dt><dd>{km(lot)}</dd></div>
          <div><dt>Объём</dt><dd>{m.cc ? m.cc + " см³" : "—"}</dd></div>
          <div><dt>В год</dt><dd>{kmPerYear(lot) !== null ? "~" + kmPerYear(lot)!.toLocaleString("ru-RU") + " км" : "—"}</dd></div>
        </dl>
        {(cond.length > 0 || extra.length > 0) && (
          <ul className="cvA-ticks">
            {cond.slice(0, 2).map((f) => <li key={f}>{f}</li>)}
            {extra.slice(0, 3 - Math.min(2, cond.length)).map((f) => <li key={f} className="is-extra">{f}</li>)}
          </ul>
        )}
        <div className="lot-price"><b>{money(lot.price)}</b><span className="lot-pl">Под ключ · <Fresh lot={lot} /></span><Deal lot={lot} /></div>
        <div className="lot-foot"><LikeButton className="lot-cta" tgHref={likeLink(lot)} /><Link className="lot-tg" href={href}>Подробнее</Link></div>
      </div>
    </article>
  );
}

/* B — telemetry: mileage gauge against 30 000 km, age, km/year, all in mono like an instrument panel */
export function CardTelemetry({ lot, yaw, eager }: P) {
  const m = moto(lot), href = lotHref(lot), { cond, extra } = split(lot);
  const kmPct = Math.min(100, Math.round(((lot.km || 0) / 30000) * 100));
  const age = Math.max(0, new Date().getFullYear() - lot.year);
  return (
    <article className="lot cv cvB" data-light="">
      <div className="cv-mw"><Media lot={lot} yaw={yaw} eager={eager} />
        <div className="cvB-over"><b>{money(lot.price)}</b><span>под ключ</span></div>
      </div>
      <div className="lot-body">
        <h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>
        <div className="cvB-meters">
          <div className="cvB-m"><div className="cvB-row"><span>Пробег</span><b>{km(lot)}</b></div><i><s style={{ width: kmPct + "%" }}></s></i><em>шкала до 30 000 км</em></div>
          <div className="cvB-m"><div className="cvB-row"><span>Возраст</span><b>{age === 0 ? "этого года" : age + " " + (age === 1 ? "год" : age < 5 ? "года" : "лет")}</b></div><i><s style={{ width: Math.min(100, age * 12.5) + "%" }}></s></i><em>{lot.year} год выпуска</em></div>
        </div>
        <ul className="cvB-tags">
          {m.cls && <li>{m.cls}</li>}{m.cc && <li>{m.cc} см³</li>}{kmPerYear(lot) !== null && <li>~{kmPerYear(lot)!.toLocaleString("ru-RU")} км/год</li>}
          {[...cond, ...extra].slice(0, 2).map((f) => <li key={f} className="is-f">{f}</li>)}
        </ul>
        <div className="lot-foot"><LikeButton className="lot-cta" tgHref={likeLink(lot)} /><span className="cvB-date"><Fresh lot={lot} /></span></div>
      </div>
    </article>
  );
}

/* C — showroom: tall photo, everything on a glass panel; hover slides up the full list of features */
export function CardShowroom({ lot, yaw, eager }: P) {
  const m = moto(lot), href = lotHref(lot), { cond, extra } = split(lot);
  const all = [...cond, ...extra];
  return (
    <article className="lot cv cvC" data-light="">
      <Media lot={lot} yaw={yaw} eager={eager} />
      <Badges lot={lot} max={2} />
      <div className="cvC-panel">
        <h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>
        <p className="cvC-line">{lot.year} · {km(lot)}{m.cc ? ` · ${m.cc} см³` : ""}{m.cls ? ` · ${m.cls.toLowerCase()}` : ""}</p>
        {all.length > 0 && <ul className="cvC-more">{all.slice(0, 4).map((f) => <li key={f}>{f}</li>)}</ul>}
        <div className="cvC-bottom"><div><b>{money(lot.price)}</b><span>под ключ · <Fresh lot={lot} /></span></div><LikeButton className="lot-cta" tgHref={likeLink(lot)} /></div>
      </div>
    </article>
  );
}

/* D — buyer's checklist: what is known about this bike and what we guarantee, then the price */
export function CardChecklist({ lot, yaw, eager }: P) {
  const m = moto(lot), href = lotHref(lot), { cond, extra } = split(lot);
  return (
    <article className="lot cv cvD" data-light="">
      <div className="cv-mw"><Media lot={lot} yaw={yaw} eager={eager} /><Badges lot={lot} max={2} /></div>
      <div className="lot-body">
        <h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>
        <p className="cvD-specs"><b>{lot.year}</b><b>{km(lot)}</b>{m.cc && <b>{m.cc} см³</b>}{m.cls && <b>{m.cls}</b>}</p>
        <div className="cvD-lists">
          <div><span className="cvD-h">Об этом мотоцикле</span><ul>{(cond.length ? cond : ["Состояние — в фото- и видеоотчёте"]).slice(0, 2).map((f) => <li key={f}>{f}</li>)}{extra.slice(0, 1).map((f) => <li key={f}>{f}</li>)}</ul></div>
          <div><span className="cvD-h">С VELTOR</span><ul className="is-we"><li>Осмотр на месте до покупки</li><li>Доставка до 45 дней</li><li>Документы для учёта</li></ul></div>
        </div>
        <div className="lot-price"><b>{money(lot.price)}</b><span className="lot-pl">Под ключ · <Fresh lot={lot} /></span><Deal lot={lot} /></div>
        <div className="lot-foot"><LikeButton className="lot-cta" tgHref={likeLink(lot)} /><a className="lot-tg" href={lot.post} target="_blank" rel="noopener">Пост ↗</a></div>
      </div>
    </article>
  );
}

/* E — wide row: photo left, details right; denser list for comparing many bikes at once */
export function CardRow({ lot, yaw, eager }: P) {
  const m = moto(lot), href = lotHref(lot), { cond, extra } = split(lot);
  return (
    <article className="lot cv cvE" data-light="">
      <div className="cv-mw"><Media lot={lot} yaw={yaw} eager={eager} /><Badges lot={lot} max={2} /></div>
      <div className="cvE-body">
        <div className="cvE-head"><div><span className="cv-cls">{m.cls || "Мотоцикл"}</span><h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3></div><div className="cvE-price"><b>{money(lot.price)}</b><span>под ключ</span></div></div>
        <dl className="cvE-specs">
          <div><dt>Год</dt><dd>{lot.year}</dd></div><div><dt>Пробег</dt><dd>{km(lot)}</dd></div>
          <div><dt>Объём</dt><dd>{m.cc ? m.cc + " см³" : "—"}</dd></div><div><dt>Пробег в год</dt><dd>{kmPerYear(lot) !== null ? "~" + kmPerYear(lot)!.toLocaleString("ru-RU") + " км" : "—"}</dd></div>
        </dl>
        {[...cond, ...extra].length > 0 && <ul className="lot-chips">{[...cond, ...extra].slice(0, 4).map((f) => <li key={f}>{f}</li>)}</ul>}
        <div className="cvE-foot"><Fresh lot={lot} /><Deal lot={lot} /><span className="cvE-acts"><a className="lot-tg" href={lot.post} target="_blank" rel="noopener">Пост ↗</a><LikeButton className="lot-cta" tgHref={likeLink(lot)} /></span></div>
      </div>
    </article>
  );
}
