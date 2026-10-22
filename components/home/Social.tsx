import { AVITO_RATING, FEED, TEAM } from "@/data/content";
import { LINKS, asset } from "@/lib/site";
import { AvitoIcon, IgIcon, TgIcon } from "../icons";
import Qr from "../Qr";
import MiniCanvas from "../MiniCanvas";
import SwipeHint from "../SwipeHint";
import Reels from "./Reels";
import Reviews from "./Reviews";

/** Reviews, social networks and the team. */
export default function Social() {
  const feed = [...FEED, ...FEED]; // doubled for the endless scroll of the phone feed
  return (
    <section className="section wrap" id="social">
      <div className="inner">
        <div className="sv sv1">
          <div className="sec-head">
            <div><p className="eyebrow">Отзывы и соцсети</p><h2>Истории тех, чья мечта уже в гараже</h2></div>
            <p className="lead">Каждая доставка для нас — чья-то сбывшаяся мечта. Следите за новыми подборами, смотрите, как техника едет из Кореи, и читайте, что говорят те, кто уже прошёл этот путь с нами.</p>
          </div>
          <div className="bento">
            <div className="bx bx-tg" data-light="">
              <div className="bx-copy">
                <span className="bx-ic"><TgIcon /></span>
                <p className="eyebrow">Telegram</p>
                <h3>Новые подборы каждый день</h3>
                <p>Фото, пробег и цена под ключ — первыми видят подписчики канала.</p>
                <a className="btn btn-primary btn-s arrow" href={LINKS.channel} target="_blank" rel="noopener">Подписаться</a>
                <div className="qr"><Qr className="qr-svg" /><span>Наведите камеру телефона, чтобы открыть канал</span></div>
              </div>
              <div className="phone" aria-hidden="true">
                <div className="ph-bar"><span className="ph-ava">V</span><span><b>Мото | Авто из Кореи VELTOR</b><em>канал</em></span></div>
                <div className="ph-feed">
                  <div className="ph-track">
                    {feed.map((f, i) => (
                      <div className="ph-post" key={i}>
                        <div className="ph-img"><MiniCanvas shape={f.shape} yaw={f.yaw} /><img src={asset(f.img)} alt={`${f.name} из Южной Кореи`} width={560} height={420} loading="lazy" decoding="async" /></div>
                        <div className="ph-cap"><b>{f.name}</b><span>{f.sub}</span><span className="ph-pr">{f.price} <em>на {f.date}</em></span></div>
                        <span className="ph-time">{f.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mgr" data-mv="4">
                <span className="mgr-ava"><img src={asset("team/sergey-ava.jpg")} alt="Сергей, партнёр VELTOR" width={56} height={56} loading="lazy" /></span>
                <span className="mgr-t"><b>Есть вопрос по подбору?</b><em>Сергей · партнёр VELTOR — ответит лично и поможет с выбором</em></span>
                <a className="mgr-btn" href={LINKS.manager} target="_blank" rel="noopener"><span className="mgr-bl">Задать вопрос</span><span className="mgr-ar" aria-hidden="true">→</span></a>
              </div>
            </div>

            <Reels>
              <span className="bx-ic"><IgIcon /></span><p className="eyebrow">Instagram</p><h3>Техника из Кореи в фото и видео</h3>
            </Reels>

            <a className="bx bx-av" href={LINKS.avito} target="_blank" rel="noopener" data-light="">
              <span className="bx-ic"><AvitoIcon /></span>
              <p className="eyebrow">Авито · Магазин VELTOR</p>
              <h3>Отзывы клиентов</h3>
              <div className="av-score"><b>{AVITO_RATING.score}</b><span><i className="av-st">★★★★★</i>{AVITO_RATING.count} отзыва</span></div>
              <span className="bx-go">Читать отзывы ↗</span>
            </a>
          </div>
          <Reviews />
        </div>

        <div className="team">
          <div className="sec-head">
            <div><p className="eyebrow">Команда</p><h2>Люди, которые ведут вашу мечту до гаража</h2></div>
            <p className="lead">Каждый отвечает за свой участок пути: от выбора в Корее до документов и доставки. На каждом этапе с вами работает живой человек.</p>
          </div>
          <div className="tms">
            {TEAM.map((m) => (
              <article className="tm" data-light="" key={m.name}>
                <div className="tm-ph"><img src={asset(m.photo)} alt={`${m.name}, партнёр VELTOR`} width={760} height={1350} loading="lazy" decoding="async" /></div>
                <div className="tm-b sr-only"><h3>{m.name}</h3><p>{m.role}</p><ul>{m.duties.map((d) => <li key={d}>{d}</li>)}</ul></div>
              </article>
            ))}
          </div>
          <SwipeHint target=".tms" />
        </div>
      </div>
    </section>
  );
}
