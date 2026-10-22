const FACTS = [
  { t: "Уверенность", d: "Каждый этап сделки подтверждается фото- и видеоотчётами" },
  { t: "Прозрачность", d: "Лучшая цена на технику без скрытых комиссий" },
  { t: "Удобство", d: "Любая форма оплаты, включая оплату с юридического лица" },
  { t: "Доступность", d: "Индивидуальные условия кредита в 10+ банках-партнёрах" },
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
