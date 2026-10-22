import Link from "next/link";
import { LINKS } from "@/lib/site";
import { teaser, yawFor } from "@/lib/lots";
import LotCard from "../catalog/LotCard";
import SwipeHint from "../SwipeHint";

/** Home teaser of the catalog: the newest lots from the Telegram channel. */
export default function Stock() {
  return (
    <section className="section wrap" id="stock">
      <div className="inner">
        <div className="sec-head reveal">
          <div><p className="eyebrow">Каталог</p><h2>Что мы подбираем в Корее</h2></div>
          <p className="lead">Это варианты, которые мы подбирали и публиковали в Telegram-канале. Конкретный экземпляр мог уже уйти к новому владельцу, но мы найдём аналогичный. Цены указаны на дату публикации и меняются вместе с курсом валют.</p>
        </div>
        <div className="lots lots-teaser">
          {teaser().map((l, i) => <LotCard key={l.id} lot={l} yaw={yawFor(i)} />)}
        </div>
        <SwipeHint target=".lots-teaser" />
        <div className="stock-foot">
          <Link className="btn btn-primary arrow" data-magnetic="" href="/catalog/">Открыть каталог</Link>
          <a className="btn btn-ghost arrow" href={LINKS.channel} target="_blank" rel="noopener">Telegram-канал</a>
        </div>
      </div>
    </section>
  );
}
