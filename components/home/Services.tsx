"use client";
import { useEffect, useRef, useState } from "react";
import { finePointer, prefersReduced } from "@/lib/cloud";

const TIX = [
  { code: "SRV-TO", t: "ТО и подготовка", d: "Диагностика, замена технических жидкостей и расходников, другие регламентные работы перед выдачей.", stamp: "Перед выдачей", list: ["Диагностика", "Замена технических жидкостей", "Замена расходников", "Регламентные работы"] },
  { code: "SRV-TN", t: "Тюнинг в Корее", d: "Поможем провести тюнинг ещё в Корее на оригинальных брендированных запчастях.", stamp: "До отправки", list: ["Подбор комплектующих", "Оригинальные брендированные запчасти", "Установка в Корее до отправки"] },
  { code: "SRV-DOC", t: "Оформление документов", d: "Помогаем пройти лабораторию и оформить СБКТС и ЭПТС после прибытия техники.", stamp: "После прибытия", list: ["Прохождение лаборатории", "Оформление СБКТС", "Оформление ЭПТС"] },
  { code: "SRV-STR", t: "Хранение", d: "Если вы не готовы забрать технику сразу, она может остаться на хранении.", stamp: "После прибытия", list: ["Хранение после прибытия", "Выдача, когда вам удобно"] },
];

function Ticket({ x, tease }: { x: (typeof TIX)[number]; tease?: boolean }) {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const tilt = (e: React.PointerEvent) => {
    if (!finePointer() || prefersReduced()) return;
    const c = ref.current!, r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.setProperty("--ry", ((px - .5) * 10).toFixed(2) + "deg"); c.style.setProperty("--rx", ((.5 - py) * 8).toFixed(2) + "deg");
  };
  const reset = () => { const c = ref.current!; c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); };
  return (
    <button type="button" ref={ref} className={"tix" + (tease ? " tease" : "")} aria-pressed={on} onClick={() => setOn(!on)} onPointerMove={tilt} onPointerLeave={reset}>
      <span className="tix-in">
        <span className="tix-face tix-front">
          <span className="tix-head"><span>VELTOR · наряд-заказ</span><span>{x.code}</span></span>
          <b className="tix-t">{x.t}</b><span className="tix-d">{x.d}</span>
          <span className="tix-more" aria-hidden="true">Что входит <i>↻</i></span>
          <span className="tix-stamp">{x.stamp}</span><span className="tix-code" aria-hidden="true"></span>
        </span>
        <span className="tix-face tix-back">
          <span className="tix-head"><span>Что входит</span><span>{x.code}</span></span>
          <span className="tix-list">{x.list.map((l) => <span key={l}>{l}</span>)}</span>
          <span className="tix-hint">Объём работ согласуем под вашу технику</span>
        </span>
      </span>
    </button>
  );
}

/** Extra services as job tickets: tilt toward the cursor, tap flips. */
export default function Services() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [tease, setTease] = useState(false);

  // on touch screens the first ticket nudges once to show that it turns over
  useEffect(() => {
    const first = rowRef.current?.querySelector(".tix");
    if (!first || prefersReduced() || !matchMedia("(pointer:coarse),(max-width:760px)").matches) return;
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return; io.disconnect();
      t1 = setTimeout(() => { if (first.getAttribute("aria-pressed") !== "true") { setTease(true); t2 = setTimeout(() => setTease(false), 1400); } }, 500);
    }, { threshold: .6 });
    io.observe(first);
    return () => { io.disconnect(); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section className="section wrap" id="services">
      <div className="inner">
        <div className="sec-head reveal">
          <div><p className="eyebrow">Дополнительные услуги</p><h2>Подготовим технику к выдаче</h2></div>
          <p className="lead">Работы выполняем по вашему запросу. Объём зависит от конкретной техники.</p>
        </div>
        <div className="spv">
          <p className="tix-tip"><span className="tix-tap" aria-hidden="true"></span>Нажмите на наряд — на обороте список работ</p>
          <div className="tixs" ref={rowRef}>
            {TIX.map((x, i) => <Ticket key={x.code} x={x} tease={i === 0 && tease} />)}
          </div>
          <p className="route-hint" style={{ marginTop: "16px" }}><span className="hint-fine">Наведите на наряд, чтобы перевернуть его</span><span className="hint-touch">Коснитесь наряда, чтобы перевернуть его</span></p>
        </div>
      </div>
    </section>
  );
}
