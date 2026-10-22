"use client";
import { useEffect, useRef } from "react";
import { prefersReduced } from "@/lib/cloud";
import { dayWord } from "@/lib/format";

const STOPS = [{ d: 5, t: "Китай", l: "11.11%" }, { d: 15, t: "Кашгар", l: "33.33%" }, { d: 20, t: "Бишкек", l: "44.44%" }];
const DAYS = [0, 5, 15, 20, 45];

/** Delivery: a 0–45 day scale (cursor / autoplay) on desktop, a scroll-driven journey on phones. */
export default function Route() {
  const barRef = useRef<HTMLDivElement>(null), fillRef = useRef<HTMLElement>(null), dotRef = useRef<HTMLElement>(null);
  const dayRef = useRef<HTMLElement>(null), unitRef = useRef<HTMLSpanElement>(null), recRef = useRef<HTMLSpanElement>(null), stRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null), mDayRef = useRef<HTMLElement>(null), mUnitRef = useRef<HTMLSpanElement>(null);

  // desktop scale
  useEffect(() => {
    const bar = barRef.current!, wrap = bar.parentElement!, fill = fillRef.current!, dot = dotRef.current!, day = dayRef.current!, unit = unitRef.current!, rec = recRef.current!;
    const sms = [...stRef.current!.children] as HTMLElement[];
    const reduce = prefersReduced();
    let t = 0, hover: number | null = null, vis = false, last = 0, shown = -1, raf = 0;
    const move = (e: PointerEvent) => { if (e.pointerType !== "mouse" && e.pointerType !== "touch") return; const r = bar.getBoundingClientRect(); hover = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
    const leave = () => { hover = null; };
    wrap.addEventListener("pointermove", move, { passive: true }); wrap.addEventListener("pointerleave", leave);
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; }, { threshold: 0 }); io.observe(bar);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop); const dt = Math.min(64, now - last || 16); last = now; if (!vis) return;
      if (hover !== null) t += (hover - t) * .15; else if (reduce) t = 1; else { t += dt / 6500; if (t > 1.25) t = 0; }
      const k = Math.min(1, Math.max(0, t)), d = Math.round(k * 45);
      fill.style.width = (k * 100).toFixed(2) + "%"; dot.style.left = (k * 100).toFixed(2) + "%";
      if (d !== shown) { shown = d; day.textContent = String(d); unit.textContent = dayWord(d) + " в пути"; rec.classList.toggle("on", d >= 25); sms.forEach((m) => m.classList.toggle("on", d >= +(m.dataset.d || 0))); }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); wrap.removeEventListener("pointermove", move); wrap.removeEventListener("pointerleave", leave); };
  }, []);

  // phones: the journey follows the scroll
  useEffect(() => {
    const list = listRef.current!, day = mDayRef.current!, unit = mUnitRef.current!;
    const items = [...list.children] as HTMLElement[], phone = matchMedia("(max-width:700px)");
    let shown = -1, ticking = false;
    const upd = () => {
      ticking = false; if (!phone.matches) return;
      const r = list.getBoundingClientRect(), th = items[items.length - 1].offsetTop; list.style.setProperty("--th", th + "px");
      const p = Math.min(1, Math.max(0, (innerHeight * .66 - r.top - 9) / Math.max(1, th))); list.style.setProperty("--vp", p.toFixed(3));
      const x = p * (DAYS.length - 1), i = Math.min(DAYS.length - 2, Math.floor(x)), d = Math.round(DAYS[i] + (DAYS[i + 1] - DAYS[i]) * (x - i));
      if (d !== shown) { shown = d; day.textContent = String(d); unit.innerHTML = dayWord(d) + "<br>в пути"; }
      items.forEach((li, k) => li.classList.toggle("on", p >= k / (items.length - 1) - .001));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } };
    addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", upd); upd();
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", upd); };
  }, []);

  return (
    <section className="section wrap" id="route">
      <div className="inner">
        <div className="route-head">
          <div className="copy reveal">
            <p className="eyebrow">Доставка из Кореи в Москву</p>
            <h2>Каждый день приближает <em>вас к мечте</em></h2>
            <p className="lead">Инчхон → Китай → Кашгар → Бишкек → Москва. Каждый этап сопровождаем фото- и видеоотчётами.</p>
          </div>
          <div className="dstats reveal">
            <div><b>45</b><span>дней в среднем до Москвы с даты отплытия</span></div>
            <div><b>25</b><span>дней — рекорд по сроку доставки</span></div>
          </div>
        </div>
        <div className="rpv">
          <div className="dterm" id="dterm">
            <div className="dt-read"><b id="dt-day" ref={dayRef}>0</b><span id="dt-unit" ref={unitRef}>дней в пути</span></div>
            <div className="dt-bar" id="dt-bar" ref={barRef}>
              <i className="dt-fill" id="dt-fill" ref={fillRef}></i><i className="dt-dot" id="dt-dot" ref={dotRef}></i>
              <span className="dt-mk rec" id="dt-rec" ref={recRef} style={{ left: "55.56%" }}><em>25 дней</em>рекорд</span>
              <span className="dt-mk avg" style={{ left: "100%" }}><em>45 дней</em>в среднем</span>
            </div>
            <div className="dt-st" aria-hidden="true" ref={stRef}>
              {STOPS.map((s) => <span key={s.t} className="dt-sm" data-d={s.d} style={{ left: s.l }}>{s.t}</span>)}
            </div>
            <div className="dt-ticks" aria-hidden="true">{[0, 5, 10, 15, 20, 25, 30, 35, 40, 45].map((n) => <span key={n}>{n}</span>)}</div>
          </div>
          <div className="dmob" id="dmob">
            <div className="dm-read"><b id="dm-day" ref={mDayRef}>0</b><span id="dm-unit" ref={mUnitRef}>дней<br />в пути</span></div>
            <ol className="dm-list" id="dm-list" ref={listRef}>
              <li data-p="0"><i></i><b>Инчхон</b><em>отплытие · день 0</em></li>
              <li data-p="1"><i></i><b>Китай</b><em>5-й день</em></li>
              <li data-p="2"><i></i><b>Кашгар</b><em>15-й день</em></li>
              <li data-p="3"><i></i><b>Бишкек</b><em>20-й день</em></li>
              <li data-p="4"><i></i><b>Москва</b><em>в среднем 45 дней</em><em className="dm-rec">рекорд — 25 дней</em></li>
            </ol>
          </div>
          <ol className="dchain" aria-label="Маршрут">
            <li>Инчхон</li><li className="ar" aria-hidden="true">→</li><li>Китай</li><li className="ar" aria-hidden="true">→</li><li>Кашгар</li><li className="ar" aria-hidden="true">→</li><li>Бишкек</li><li className="ar" aria-hidden="true">→</li><li>Москва</li>
          </ol>
          <p className="route-hint" style={{ marginTop: "18px" }}><span className="hint-fine">Ведите курсором по шкале</span><span className="hint-touch">Коснитесь шкалы</span></p>
        </div>
      </div>
    </section>
  );
}
