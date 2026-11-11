import type { Metadata } from "next";
import { LINKS, PHONE, PHONE_HREF, tgText } from "@/lib/site";

export const metadata: Metadata = {
  title: "Партнёрская программа VELTOR",
  description:
    "Партнёрская программа VELTOR для блогеров, автосалонов, мотосалонов, дилеров и подборщиков: техника из Южной Кореи под ключ. Условия индивидуальные и зависят от объёма покупок в месяц.",
  alternates: { canonical: "/partners/" },
  openGraph: {
    type: "website", locale: "ru_RU", siteName: "VELTOR", url: "/partners/",
    title: "Партнёрам — VELTOR",
    description: "Ищем партнёров в мото- и авто-теме. Подбор, осмотр, выкуп, доставка и документы — на нас. Условия под ваш объём.",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
};

const TG = tgText("Здравствуйте! Хочу обсудить партнёрство с VELTOR");

const WHO: [string, string][] = [
  ["Блогеры и медиа", "YouTube, Telegram-каналы, мото- и автоблоги. Обзоры техники из Кореи, интеграции и заявки от вашей аудитории."],
  ["Автосалоны и дилеры", "Пополнение стока автомобилями с понятной историей и проверкой до покупки."],
  ["Мотосалоны и клубы", "Мотоциклы под заказ клиентов и для витрины: BMW, Harley-Davidson, Ducati, Yamaha и другие."],
  ["Подборщики и эксперты", "Ваши клиенты и экспертиза, наши выкуп, логистика и оформление."],
  ["Сервисы и тюнинг", "Сервисы, детейлинг, тюнинг-ателье: рекомендации клиентам и совместные проекты."],
];

const GIVE: [string, string][] = [
  ["Условия под ваш объём", "Цены зависят от объёма покупок в месяц. Индивидуальные условия."],
  ["Живой осмотр в Корее", "До покупки всегда проверяем технику на месте и снимаем фото- и видеоотчёт. Только вы принимаете решение о покупке."],
  ["Доставка под ключ", "Доставка под ключ в любой город."],
  ["Документы", "Таможня, СБКТС и ЭПТС — всё прозрачно. Техника готова к постановке на учёт."],
  ["Персональный менеджер", "Режим «Единого окна»: все вопросы решаются через одного специалиста."],
  ["Контент для соцсетей", "Фото и видео техники из Кореи для ваших публикаций."],
];

const TIERS: { k: string; t: string; d: string; w: string; hi?: boolean }[] = [
  { k: "Формат A", t: "Разовые сделки", d: "Знакомство с форматом на одной-двух единицах.", w: "33%" },
  { k: "Формат B", t: "Регулярные закупки", d: "Поток техники каждый месяц и улучшенные условия.", w: "66%" },
  { k: "Формат C", t: "Крупный объём", d: "Лучшие условия, приоритет в подборе, план поставок.", w: "100%", hi: true },
];

const STEPS: [string, string][] = [
  ["Заявка", "Telegram или звонок: кто вы и с какой техникой работаете."],
  ["Знакомство", "Обсуждаем модели, бюджеты и объём в месяц."],
  ["Условия", "Предлагаем индивидуальные условия и фиксируем договорённости."],
  ["Первая сделка", "Подбираем, проверяем и привозим первую единицу."],
];

const MARQUEE = ["Подбор в Корее", "Живой осмотр", "Выкуп", "Доставка в любой город", "СБКТС и ЭПТС", "Отчёт на каждом этапе"];

export default function PartnersPage() {
  return (
    <div className="pt" id="top">
      <section className="pt-hero wrap">
        <div className="inner">
          <div className="pt-meta"><span>№ 01 — Сотрудничество</span><span>Мото · Авто · Южная Корея</span></div>
          <h1 className="pt-h1">
            <span className="pt-l"><span className="pt-up">Партнёрская</span></span>
            <span className="pt-l"><span className="pt-up pt-d1">программа</span></span>
            <span className="pt-l"><span className="pt-up pt-d2"><b>VELTOR</b><i>.</i></span></span>
          </h1>
          <div className="pt-intro">
            <p className="pt-big pt-fade">Ищем тех, кто покупает и продаёт мото и авто. Мы привозим технику из Южной Кореи под ключ: подбор, проверка, доставка и документы — на нас.</p>
            <div className="pt-cols pt-fade pt-d2">
              <p>Блогеры, автосалоны, мотосалоны, дилеры, подборщики и сервисы — всем, кто работает с техникой, предложим свой формат.</p>
              <p>Условия сотрудничества индивидуальные и зависят от объёма покупок в месяц.</p>
            </div>
            <a className="pt-seal" href="#pt-who" aria-label="К разделу «Кого мы ищем»">
              <svg className="pt-spin" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="pt-circ" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" /></defs><text><textPath href="#pt-circ" textLength="500" lengthAdjust="spacing">Партнёрская программа · VELTOR · Корея · </textPath></text></svg>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="pt-rule" />
        </div>
      </section>

      <div className="pt-marq" aria-hidden="true">
        <div className="pt-marq-in">
          {[0, 1].map((k) => MARQUEE.map((m) => (<span key={k + m}>{m}<i>✳</i></span>)))}
        </div>
      </div>

      <section className="pt-sec wrap" id="pt-who">
        <div className="inner">
          <div className="pt-head">
            <h2 className="pt-h2">Кого<br />мы ищем</h2>
            <p>Пять форматов партнёрства. Если вашего нет в списке, но вы связаны с покупкой или продажей техники, — всё равно напишите.</p>
          </div>
          <div className="pt-rows">
            {WHO.map(([t, d], i) => (
              <div className="pt-row" key={t}>
                <span className="pt-n">({String(i + 1).padStart(2, "0")})</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-sec pt-band wrap">
        <div className="inner">
          <div className="pt-head">
            <h2 className="pt-h2">Что вы<br />получаете</h2>
            <span className="pt-chap">Глава 02</span>
          </div>
          <div className="pt-give">
            {GIVE.map(([t, d], i) => (
              <div key={t}>
                <div className="pt-num">{String(i + 1).padStart(2, "0")}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-sec wrap">
        <div className="inner">
          <p className="pt-chap">Глава 03 — Условия</p>
          <blockquote className="pt-quote">Условия индивидуальные и зависят от <b>объёма покупок</b> в месяц.</blockquote>
          <div className="pt-tiers">
            {TIERS.map((x) => (
              <div className={"pt-tier" + (x.hi ? " is-hi" : "")} key={x.k}>
                <span>{x.k}</span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
                <i style={{ width: x.w }} />
              </div>
            ))}
          </div>
          <p className="pt-note">Точные цифры обсуждаем лично, после знакомства с вашим объёмом.</p>
        </div>
      </section>

      <section className="pt-steps-w wrap">
        <div className="inner">
          <h2 className="pt-h2 pt-h2s">Как начать</h2>
          <ol className="pt-steps">
            {STEPS.map(([t, d], i) => (
              <li key={t} className={i === STEPS.length - 1 ? "is-last" : undefined}>
                <span>Шаг {i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pt-cta wrap">
        <div className="inner pt-cta-in">
          <h2 className="pt-ctah">Открыты к сотрудничеству —<br /><b>свяжитесь с нами<i>.</i></b></h2>
          <div className="pt-btns">
            <a className="pt-btn" href={TG} target="_blank" rel="noopener">Написать в Telegram <span>↗</span></a>
            <a className="pt-btn pt-btn-o" href={PHONE_HREF}>{PHONE} <span aria-hidden="true">☏</span></a>
            <a className="pt-alt" href={LINKS.channel} target="_blank" rel="noopener">Наш Telegram-канал с подборами ↗</a>
          </div>
        </div>
      </section>
    </div>
  );
}
