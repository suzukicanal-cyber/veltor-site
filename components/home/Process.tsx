import { PROCESS } from "@/data/content";

export default function Process() {
  return (
    <section className="section wrap" id="process">
      <div className="inner">
        <div className="sec-head reveal">
          <div><p className="eyebrow">Процесс · ответы на вопросы</p><h2>Всё, что важно знать о покупке из Кореи</h2></div>
          <p className="lead">Ответы на вопросы, которые обычно возникают перед покупкой техники из Кореи, по каждому этапу сделки.</p>
        </div>
        <ol className="steps">
          {PROCESS.map((s, i) => (
            <li className="step" data-light="" key={s.q}>
              <span className="step-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="step-t">{s.q}</h3><p className="step-d">{s.a}</p><span className="step-m">{s.tag}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
