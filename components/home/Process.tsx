import { PROCESS } from "@/data/content";
import ProcessPhotos from "./ProcessPhotos";

export default function Process() {
  return (
    <section className="section wrap" id="process">
      <div className="inner">
        <div className="sec-head reveal">
          <div><p className="eyebrow">Процесс</p><h2>Пять этапов покупки из Кореи</h2></div>
          <p className="lead">От подбора до доставки в Москву. На каждом этапе — фото- и видеоотчёт.</p>
        </div>
        <ol className="steps">
          {PROCESS.map((s, i) => (
            <li className="step" data-light="" key={s.q}>
              <span className="step-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="step-t">{s.t ?? s.q}</h3><p className="step-d">{s.a}</p><span className="step-m">{s.tag}</span>
              {i === 3 && <ProcessPhotos />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
