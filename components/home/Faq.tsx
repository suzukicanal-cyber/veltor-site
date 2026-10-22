import { FAQ } from "@/data/content";

export default function Faq() {
  return (
    <section className="section wrap" id="faq">
      <div className="inner">
        <div className="sec-head reveal">
          <div><p className="eyebrow">Частые вопросы</p><h2>Мотоциклы и авто из Кореи: ответы на вопросы</h2></div>
          <p className="lead">VELTOR подбирает, проверяет и привозит мотоциклы и автомобили из Южной Кореи под ключ. Собрали ответы на то, что чаще всего спрашивают перед покупкой.</p>
        </div>
        <div className="faq">
          {FAQ.map((f, i) => (
            <details className="faq-i" key={f.q}>
              <summary><span className="faq-n">{String(i + 1).padStart(2, "0")}</span><h3 className="faq-q">{f.q}</h3><i className="faq-x" aria-hidden="true"></i></summary>
              <div className="faq-a"><p>{f.a}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
