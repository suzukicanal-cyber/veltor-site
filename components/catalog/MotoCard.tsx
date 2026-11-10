import Link from "next/link";
import { Lot, likeLink, lotHref, typeLabel } from "@/lib/lot-base";
import type { Facts } from "@/lib/lot-facts";
import { dateRu, groups, money } from "@/lib/format";
import LotMedia from "./LotMedia";
import LikeButton from "./LikeButton";

function Badges({ f, cls = "" }: { f: Facts; cls?: string }) {
  if (!f.deal) return null;
  return (
    <ul className={"cw-badges " + cls}>
      {f.deal && <li className="cw-deal" title="Цена ниже медианной цены той же модели близких годов выпуска в нашем каталоге"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /></svg><span className="cw-deal-l">Ниже рынка · </span>−{f.deal.pct}%</li>}
    </ul>
  );
}

/* Итог: метки на фото, крупные год / пробег / объём (из «Ценника»), цена с кнопкой (из «Постера») */
/** Motorcycle card in the catalog. */
export default function MotoCard({ lot, f, yaw, eager }: { lot: Lot; f: Facts; yaw: number; eager?: boolean }) {
  const href = lotHref(lot);
  return (
    <article className="lot cw6 tn-glass" data-light="">
      <div className="cw3-media"><LotMedia hd={lot.hd} photos={lot.photos} focus={lot.focus} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} eager={eager} /><Badges f={f} cls="cw3-b" /></div>
      <div className="lot-body">
        <div><span className="cw-mono">{lot.brand}{f.cls ? ` · ${f.cls}` : ""}</span><h3 className="lot-t cw6-t"><Link href={href}>{lot.model}</Link></h3></div>
        <dl className="cw2-nums cw6-nums">
          <div><dt>год</dt><dd>{lot.year}</dd></div>
          <div><dt>пробег, км</dt><dd>{lot.km ? groups(lot.km) : "новый"}</dd></div>
          <div><dt>объём, см³</dt><dd>{f.cc ? f.cc.replace(/\s*см³/, "") : "—"}</dd></div>
        </dl>
        <div className="cw1-foot cw6-foot"><div><b>{money(lot.price)}</b><em>под ключ · {dateRu(lot.date)}</em></div><LikeButton className="lot-cta" tgHref={likeLink(lot)} /></div>
      </div>
      <div className="av">
        <Link className="av-t" href={href}>{lot.name}, {lot.year}, {lot.km ? `${groups(lot.km)}\u00a0км` : "новый"}</Link>
        <LikeButton className="av-like" tgHref={likeLink(lot)} heart />
        <b className="av-p">{money(lot.price)}</b>
        <span className="av-m">под ключ · {dateRu(lot.date)}</span>
      </div>
    </article>
  );
}
