import Link from "next/link";

const CATS = [
  { word: "МОТО", h: "Мотоциклы и мототехника", p: "Найдём модель, год, пробег и цвет под ваш бюджет и осмотрим мотоцикл на месте до покупки.", chips: ["Мотоциклы", "Скутеры", "Квадроциклы и багги"], pick: "moto", cta: "Подобрать мототехнику", cat: { href: "/moto/", t: "Мотоциклы из Кореи — цены и каталог" } },
  { word: "АВТО", h: "Автомобили", p: "Подберём по комплектации, пробегу и бюджету и сопроводим сделку до получения ключей.", chips: ["Седан", "Кроссовер", "Внедорожник", "Минивэн", "Купе"], pick: "car", cta: "Подобрать автомобиль", cat: { href: "/auto/", t: "Автомобили из Кореи — цены и каталог" } },
  { word: "АКВА", h: "Водный транспорт", p: "Подберём яхту, катер или гидроцикл под ваши задачи и проверим до покупки.", chips: ["Яхты", "Катера", "Гидроциклы"], pick: "water", cta: "Подобрать водную технику", cat: null },
];

export default function Cats() {
  return (
    <section className="section wrap" id="cats">
      <div className="inner">
        <div className="sec-head reveal">
          <div><p className="eyebrow">Направления</p><h2>Что везём из Кореи</h2></div>
          <p className="lead">Подбираем технику под ваши параметры: модель, год, пробег, цвет, комплектацию, тюнинг и бюджет.</p>
        </div>
        <div className="split">
          {CATS.map((c) => (
            <article className="panel" data-light="" key={c.word}>
              <div className="panel-word" data-light="" aria-hidden="true">{c.word}</div>
              <div className="panel-body">
                <h3>{c.h}</h3>
                <p>{c.p}</p>
                <ul className="chips">{c.chips.map((x) => <li key={x}>{x}</li>)}</ul>
                <div className="panel-links">
                  <Link className="link arrow" href="/#contact" data-pick={c.pick}>{c.cta}</Link>
                  {c.cat && <Link className="link link-q" href={c.cat.href}>{c.cat.t}</Link>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
