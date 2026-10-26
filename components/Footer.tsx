import Link from "next/link";
import Clock from "./Clock";
import { TYPE, brandGroups, brandHref, typeHref } from "@/lib/seo";
import { PHONE, PHONE_HREF } from "@/lib/site";

export default function Footer() {
  const moto = brandGroups("moto").slice(0, 7), car = brandGroups("car").slice(0, 4);
  return (
    <footer className="footer wrap">
      <div className="inner">
        <div className="f5">
          <div className="f5-clocks">
            <div className="f5-c"><em>Инчхон · Южная Корея</em><Clock tz="Asia/Seoul" /><span>Пока вы спите, мы смотрим технику для вас</span></div>
            <div className="f5-mid" aria-hidden="true"><i></i><span>45 дней</span></div>
            <div className="f5-c f5-r"><em>Москва · Россия</em><Clock tz="Europe/Moscow" /><span>Утром — фото и видео осмотра</span></div>
          </div>
          <nav className="fseo" aria-label="Мото и авто из Кореи">
            <Link href={typeHref("moto")}>{TYPE.moto.label} из Кореи</Link>
            {moto.map((b) => <Link key={"m" + b.slug} href={brandHref("moto", b.brand)}>{b.brand}</Link>)}
            <Link href={typeHref("car")}>{TYPE.car.label} из Кореи</Link>
            {car.map((b) => <Link key={"c" + b.slug} href={brandHref("car", b.brand)}>{b.brand}</Link>)}
          </nav>
          <div className="fbot">
            <span>© {new Date().getFullYear()} VELTOR · Мото и авто из Южной Кореи под ключ</span>
            <a className="fphone" href={PHONE_HREF}>{PHONE}</a>
            <span className="fleg">Цены в каталоге указаны на дату публикации и не являются публичной офертой.</span>
            <a className="ftop" href="#top">Наверх ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
