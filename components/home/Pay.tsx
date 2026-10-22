"use client";
import { useEffect, useRef, useState } from "react";
import { prefersReduced } from "@/lib/cloud";

type Form = "full" | "pre" | "credit";
type Veh = "moto" | "car";
type Ev = { n: string; a: string; d: string; w?: boolean; x?: boolean };

const PNOTE: Record<Form, string> = {
  full: "Наиболее выгодный вариант по цене, без комиссии партнёров. Полная стоимость техники вносится перед её выкупом в Корее.",
  pre: "Мы понимаем, что заказывать технику из-за границы страшно. Поэтому, как официальный партнёр премиального автосалона Da Motors, мы заключаем договор через автосалон, а основную оплату (90%) вы вносите только после получения техники в России. Предоплата всего 10%.",
  credit: "Покупка в кредит в одном из более чем 10 банков-партнёров. Условия рассчитываются индивидуально.",
};
const PBADGE: Record<Form, string> = { full: "Выгоднее всего по цене", pre: "Есть комиссия партнёра", credit: "" };
const CAR_NOTE = " Таможенная пошлина и утильсбор оплачиваются отдельно, когда автомобиль прибывает на таможню.";
const NODE_NAMES: Record<string, string> = { order: "Заказ", buy: "Выкуп в Корее", customs: "Прибытие на таможню", receive: "Получение в России" };
const FORMS: { k: Form; t: string }[] = [{ k: "full", t: "Полная оплата" }, { k: "pre", t: "Предоплата 10%" }, { k: "credit", t: "Кредит" }];

function payEvents(form: Form, veh: Veh) {
  const e: Ev[] = [];
  if (form === "full") e.push(veh === "car"
    ? { n: "buy", a: "Оплата ТС и расходов", d: "В оплату входит стоимость ТС, наша комиссия за работу, расходы по логистике, услуги таможенного брокера", w: true }
    : { n: "buy", a: "100%", d: "Полная стоимость техники до выкупа" });
  if (form === "pre") e.push({ n: "order", a: "10%", d: "Предоплата от стоимости по договору" });
  if (form === "credit") e.push({ n: "buy", a: "Кредит", d: "Оформление в банке-партнёре до выкупа" });
  if (veh === "car") e.push({ n: "customs", a: "Пошлина и утильсбор", d: "Оплачиваются при прибытии автомобиля на таможню", x: true });
  if (form === "pre") e.push({ n: "receive", a: "90%", d: "Оставшаяся сумма после получения в России" });
  return e;
}

/** Payment forms as a timeline: the fill follows the cursor, plays on its own, and on phones follows the scroll. */
export default function Pay() {
  const [form, setForm] = useState<Form>("full");
  const [veh, setVeh] = useState<Veh>("moto");
  const boxRef = useRef<HTMLDivElement>(null), trackRef = useRef<HTMLDivElement>(null), fillRef = useRef<HTMLElement>(null), nodesRef = useRef<HTMLDivElement>(null);

  const ev = payEvents(form, veh);
  const nodes = veh === "car" ? ["order", "buy", "customs", "receive"] : ["order", "buy", "receive"];
  const half = (100 / nodes.length / 2).toFixed(3) + "%";
  const note = PNOTE[form] + (veh === "car" && form !== "pre" ? CAR_NOTE : "");

  useEffect(() => {
    const box = boxRef.current!, track = trackRef.current!, fill = fillRef.current!, tn = nodesRef.current!;
    const reduce = prefersReduced(), phone = matchMedia("(max-width:700px)");
    let t = 0, hover: number | null = null, vis = false, last = 0, raf = 0;
    const move = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; const r = track.getBoundingClientRect(); if (r.width) hover = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
    const leave = () => { hover = null; };
    box.addEventListener("pointermove", move, { passive: true }); box.addEventListener("pointerleave", leave);
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; }, { threshold: 0 }); io.observe(box);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop); const dt = Math.min(64, now - last || 16); last = now; if (!vis) return;
      if (phone.matches) {
        const r = tn.getBoundingClientRect(), lastN = tn.lastElementChild as HTMLElement | null, th = lastN ? lastN.offsetTop : r.height;
        tn.style.setProperty("--th", th + "px"); t = (innerHeight * .66 - r.top - 9) / Math.max(1, th);
        tn.style.setProperty("--vp", Math.min(1, Math.max(0, t)).toFixed(3));
      } else if (hover !== null) t += (hover - t) * .12; else if (reduce) t = 1; else { t += dt / 5200; if (t > 1.3) t = 0; }
      const k = Math.min(1, Math.max(0, t)), ns = tn.children, n = ns.length;
      fill.style.width = (k * 100).toFixed(2) + "%";
      for (let i = 0; i < n; i++) ns[i].classList.toggle("on", k >= i / (n - 1) - .002);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave); };
  }, []);

  return (
    <section className="section wrap" id="pay">
      <div className="inner">
        <div className="sec-head reveal">
          <div><p className="eyebrow">Оплата</p><h2>Три формы оплаты техники из Кореи</h2></div>
          <p className="lead">Форму оплаты выбираете вы. Для автомобилей оплата поэтапная: таможенная пошлина и утильсбор вносятся в момент прибытия автомобиля на таможню.</p>
        </div>
        <div className="pay-ctrl">
          <div className="tabs" id="form-tabs" role="group" aria-label="Форма оплаты">
            {FORMS.map((f) => <button key={f.k} type="button" className="tab" aria-pressed={form === f.k} onClick={() => setForm(f.k)}>{f.t}</button>)}
          </div>
          <div className="seg" id="veh-seg" role="group" aria-label="Тип техники">
            <button type="button" aria-pressed={veh === "moto"} onClick={() => setVeh("moto")}>Мото</button>
            <button type="button" aria-pressed={veh === "car"} onClick={() => setVeh("car")}>Авто</button>
          </div>
        </div>

        <div className="tl" id="tl" ref={boxRef}>
          <div className="tl-track" id="tl-track" ref={trackRef} style={{ left: half, right: half }}><i className="tl-fill" id="tl-fill" ref={fillRef}></i></div>
          <div className="tl-nodes" id="tl-nodes" ref={nodesRef} style={{ ["--n" as string]: nodes.length }}>
            {nodes.map((n) => (
              <div key={n} className={"tn" + (n === "customs" ? " xc" : "")}>
                <i className="tn-dot"></i><span className="tn-name">{NODE_NAMES[n]}</span>
                {ev.filter((e) => e.n === n).map((e) => (
                  <div key={e.a} className={"tn-pay" + (e.x ? " xc" : "") + (e.w ? " tw" : "")}><b>{e.a}</b><span>{e.d}</span></div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="pay-note" id="pay-note2">{note}</p>
        <span className="badge" id="pay-badge" hidden={!PBADGE[form]}>{PBADGE[form]}</span>

        <div className="pay-methods reveal">
          <h3>Способы оплаты</h3>
          <ul className="pm">
            <li><svg viewBox="0 0 26 26" aria-hidden="true"><rect x="3" y="6" width="20" height="14" rx="2" /><path d="M3 11h20M7 16h4" /></svg><b>Безналичная оплата</b></li>
            <li><svg viewBox="0 0 26 26" aria-hidden="true"><rect x="2" y="7" width="22" height="12" rx="1.5" /><circle cx="13" cy="13" r="2.8" /><path d="M6 10.5v5M20 10.5v5" /></svg><b>Наличный расчёт</b></li>
            <li><svg viewBox="0 0 26 26" aria-hidden="true"><path d="M5 22V5h10v17M15 10h6v12M3 22h20M8.5 9h3M8.5 13h3M8.5 17h3" /></svg><b>Оплата с юр. лица</b></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
