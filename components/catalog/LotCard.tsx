import Link from "next/link";
import { Lot, likeLink, lotHref, specs, typeLabel } from "@/lib/lot-base";
import type { Facts } from "@/lib/lot-facts";
import { dateRu, groups, money } from "@/lib/format";
import LotMedia from "./LotMedia";
import LikeButton from "./LikeButton";
import MotoCard from "./MotoCard";

/** Catalog card. data-* attributes are what the client-side filters read. */
export default function LotCard({ lot, f, yaw, eager }: { lot: Lot; f: Facts; yaw: number; eager?: boolean }) {
  if (lot.type === "moto") return <MotoCard lot={lot} f={f} yaw={yaw} eager={eager} />;
  const href = lotHref(lot);
  return (
    <article className="lot" data-light="">
      <LotMedia hd={lot.hd} photos={lot.photos} name={lot.name} shape={lot.type} yaw={yaw} href={href} kind={typeLabel(lot.type)} eager={eager} />
      <div className="lot-body">
        <h3 className="lot-t"><Link href={href}>{lot.name}</Link></h3>
        <ul className="lot-specs">{specs(lot).map((s) => <li key={s.k}><b>{s.v}</b><span>{s.k}</span></li>)}</ul>
        {lot.features.length > 0 && <ul className="lot-chips">{lot.features.slice(0, 3).map((f) => <li key={f}>{f}</li>)}</ul>}
        <div className="lot-price"><b>{money(lot.price)}</b><span className="lot-pl">Актуально на <em>{dateRu(lot.date)}</em></span></div>
        <div className="lot-foot">
          <LikeButton className="lot-cta" tgHref={likeLink(lot)} />
          <a className="lot-tg" href={lot.post} target="_blank" rel="noopener">Пост ↗</a>
        </div>
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
