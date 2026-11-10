const FACTS = [
  { t: "Фото и видео на каждом этапе", d: "Отчёт подтверждает каждый шаг сделки" },
  { t: "Без скрытых комиссий", d: "Платите цену техники и согласованные услуги" },
  { t: "Оплата с юрлица", d: "А также безналичный и наличный расчёт" },
  { t: "Кредит в банках-партнёрах", d: "Поможем оформить в одном из 10+ банков" },
];

export default function Facts() {
  return (
    <section className="facts wrap" aria-label="Коротко о работе">
      <div className="inner">
        <div className="facts-grid">
          {FACTS.map((f) => <div className="fact" key={f.t}><b className="ft">{f.t}</b><p>{f.d}</p></div>)}
        </div>
      </div>
    </section>
  );
}
