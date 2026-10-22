import Clock from "./Clock";

export default function Footer() {
  return (
    <footer className="footer wrap">
      <div className="inner">
        <div className="f5">
          <div className="f5-clocks">
            <div className="f5-c"><em>Инчхон · Южная Корея</em><Clock tz="Asia/Seoul" /><span>Пока вы спите, мы смотрим технику для вас</span></div>
            <div className="f5-mid" aria-hidden="true"><i></i><span>45 дней</span></div>
            <div className="f5-c f5-r"><em>Москва · Россия</em><Clock tz="Europe/Moscow" /><span>Утром — фото и видео осмотра</span></div>
          </div>
          <div className="fbot">
            <span>© {new Date().getFullYear()} VELTOR · Мото и авто из Южной Кореи под ключ</span>
            <span className="fleg">Цены в каталоге указаны на дату публикации и не являются публичной офертой.</span>
            <a className="ftop" href="#top">Наверх ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
