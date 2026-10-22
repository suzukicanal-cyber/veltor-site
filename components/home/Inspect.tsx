"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COL, D, PIV, TAU, getClouds, prefersReduced } from "@/lib/cloud";

const CHECKS = [
  { t: "Состояние мотора", d: "Проверяем запуск, работу на холостом ходу, посторонние шумы и подтёки масла." },
  { t: "Царапины и потёртости", d: "Осматриваем кузов и пластик, фиксируем каждую царапину, скол и потёртость на фото." },
  { t: "Состояние расходников", d: "Оцениваем износ шин, тормозных колодок и дисков, состояние технических жидкостей." },
  { t: "Фиксация пробега", d: "Снимаем показания одометра на видео, чтобы вы видели реальный пробег." },
];

/** "Живой осмотр": the scan walks over four checkpoints; hovering a checkpoint turns the model to it. */
export default function Inspect() {
  const stRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const callRef = useRef<HTMLDivElement>(null);
  const api = useRef({ hover: (_i: number, _until: number) => {}, release: () => {}, shape: (_s: number) => {} });
  const [active, setActive] = useState(0);
  const [shape, setShape] = useState(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const st = stRef.current!, cv2 = cvRef.current!, call = callRef.current!, g = cv2.getContext("2d")!;
    const callBar = call.querySelector<HTMLElement>(".call-bar i")!;
    const reduce = prefersReduced();
    const { SH, FLOOR, N } = getClouds();
    let W = 0, H = 0, dp = 1, F = 1, CX = 0, CY = 0, vis = false, raf = 0;
    let shp = 1, next = -1, fade = 1, yaw = 2.55, pitch = .26, tYaw = 2.55, tPitch = .26;
    const PREF = [[2.2, .3], [2.95, .2], [2.5, .14], [2.0, .5]];
    let mx = -9999, my = -9999, inside = false, lastMove = -1e9, manual = -1, manualUntil = 0, act = 0, activeAt = performance.now(), lastAuto = performance.now(), fin = false;
    const ox = new Float32Array(N), oy = new Float32Array(N); let hp = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    function resize() { const r = st.getBoundingClientRect(); W = r.width; H = r.height; dp = Math.min(2, window.devicePixelRatio || 1); cv2.width = Math.round(W * dp); cv2.height = Math.round(H * dp); F = Math.min(W * 1.25, H * 2); CX = W / 2; CY = H * .58; }
    const ro = new ResizeObserver(resize); ro.observe(st); resize();
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; }, { threshold: 0 }); io.observe(st);
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tYaw = 2.55 + (e.clientX / innerWidth - .5) * 1.8; tPitch = .26 + (e.clientY / innerHeight - .5) * .3; lastMove = performance.now();
      const r = st.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; inside = mx >= 0 && my >= 0 && mx <= r.width && my <= r.height;
    };
    const leave = () => { inside = false; };
    addEventListener("pointermove", move, { passive: true }); st.addEventListener("pointerleave", leave);

    function setAct(k: number, now: number) {
      if (k === act) return; act = k; activeAt = now; fin = false;
      setActive(k); setDone(false);
    }
    api.current = {
      hover: (i, until) => { manual = i; manualUntil = until; setAct(i, performance.now()); },
      release: () => { manual = -1; lastAuto = performance.now(); },
      shape: (s) => { if (s !== shp) next = s; },
    };
    const prefYaw = (j: number) => { let t = PREF[j][0]; while (t - yaw > Math.PI) t -= TAU; while (t - yaw < -Math.PI) t += TAU; return t; };

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!vis || !W) return;
      if (manual >= 0 && now > manualUntil) manual = -1;
      const S = SH[shp], P = S.pos, B = S.br, C = S.col, HS = S.checks;
      const cursorMode = now - lastMove < 2600;
      if (manual >= 0) { tYaw = prefYaw(manual); tPitch = PREF[manual][1]; }
      else if (!cursorMode) {
        if (!reduce && now - lastAuto > 3400) { lastAuto = now; setAct((act + 1) % 4, now); }
        tYaw = prefYaw(act) + (reduce ? 0 : Math.sin(now * .0006) * .3); tPitch = PREF[act][1];
      }
      yaw += (tYaw - yaw) * .05; pitch += (tPitch - pitch) * .05;
      if (next >= 0) { fade -= .08; if (fade <= 0) { fade = 0; shp = next; next = -1; ox.fill(0); oy.fill(0); } }
      else if (fade < 1) fade = Math.min(1, fade + .08);
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const pr = (x: number, y: number, z: number) => { const X = x * cy + z * sy, Zr = -x * sy + z * cy, Y = y - PIV, Y2 = Y * cp + Zr * sp, Z2 = Zr * cp - Y * sp, k = F / (Z2 + D); return [CX + X * k, CY - Y2 * k, Z2]; };
      hp = HS.map((h) => pr(h[0], h[1], h[2]));
      if (manual < 0 && cursorMode) {
        let best = -1, bd = 1e9;
        if (inside) { for (let j = 0; j < 4; j++) { const dx = hp[j][0] - mx, dy = hp[j][1] - my, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = j; } } if (bd > 170 * 170) best = -1; }
        if (best < 0) { let bz = 1e9; for (let j = 0; j < 4; j++) if (hp[j][2] < bz) { bz = hp[j][2]; best = j; } if (best !== act && hp[act][2] - bz < .12) best = act; }
        setAct(best, now);
      }
      g.setTransform(dp, 0, 0, dp, 0, 0); g.clearRect(0, 0, W, H);
      g.fillStyle = COL[0];
      for (let i = 0; i < FLOOR.length; i++) { const p = FLOOR[i], q = pr(p[0], p[1], p[2]); g.globalAlpha = p[3] * (q[2] < 0 ? 1 : .55) * fade; g.fillRect(q[0] - .6, q[1] - .6, 1.2, 1.2); }
      const h = HS[act], R2 = .34 * .34, RAD = 110, CR = inside ? RAD * RAD : 0, pulse = .5 + .5 * Math.sin(now * .006);
      let scanX = 99; if (!reduce) { const s = (now % 4200) / 4200; if (s < .75) scanX = -1.5 + 3 * (s / .75); }
      let last = -1;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3, x = P[i3], y = P[i3 + 1], z = P[i3 + 2];
        const X = x * cy + z * sy, Zr = -x * sy + z * cy, Y = y - PIV, Y2 = Y * cp + Zr * sp, Z2 = Zr * cp - Y * sp, k = F / (Z2 + D);
        let sx = CX + X * k, sy2 = CY - Y2 * k, tx = 0, ty = 0;
        if (CR) { const dx = sx - mx, dy = sy2 - my, d2 = dx * dx + dy * dy; if (d2 < CR) { const d = Math.sqrt(d2) + .01, q = 1 - d / RAD; tx = dx / d * q * q * 50; ty = dy / d * q * q * 50; } }
        ox[i] += (tx - ox[i]) * .16; oy[i] += (ty - oy[i]) * .16; sx += ox[i]; sy2 += oy[i];
        const ax = x - h[0], ay = y - h[1], az = z - h[2], dd = ax * ax + ay * ay + az * az;
        const df = Math.min(1, Math.max(.12, .55 - Z2 * .42));
        let a = B[i] * (.3 + .8 * df), cc = C[i], sz = (.7 + B[i] * .8) * (D / (Z2 + D));
        if (dd < R2) { const q = 1 - dd / R2; a += q * (.5 + .35 * pulse); cc = 3; sz *= 1 + q * .6; }
        const sd = Math.abs(x - scanX); if (sd < .04) { a += (1 - sd / .04) * .6; cc = 3; }
        a *= fade; if (a > 1) a = 1;
        if (cc !== last) { g.fillStyle = COL[cc]; last = cc; }
        g.globalAlpha = a; g.fillRect(sx - sz / 2, sy2 - sz / 2, sz, sz);
      }
      const q = hp[act], prog = reduce ? 1 : Math.min(1, (now - activeAt) / 1500);
      if (fade > .5) {
        const r0 = 24 + pulse * 5; g.strokeStyle = COL[3]; g.lineWidth = 1;
        g.globalAlpha = .3; g.beginPath(); g.arc(q[0], q[1], r0 + 10, 0, TAU); g.stroke();
        g.globalAlpha = .95; g.beginPath(); g.arc(q[0], q[1], r0, -Math.PI / 2, -Math.PI / 2 + TAU * prog); g.stroke();
        g.globalAlpha = .8; g.beginPath();
        for (let t = 0; t < 4; t++) { const a2 = t * Math.PI / 2; g.moveTo(q[0] + Math.cos(a2) * (r0 + 14), q[1] + Math.sin(a2) * (r0 + 14)); g.lineTo(q[0] + Math.cos(a2) * (r0 + 21), q[1] + Math.sin(a2) * (r0 + 21)); }
        g.stroke();
      }
      g.globalAlpha = 1;
      call.style.transform = `translate3d(${q[0].toFixed(1)}px,${q[1].toFixed(1)}px,0)`;
      call.classList.toggle("left", q[0] > W * .56); call.classList.toggle("down", q[1] < 150); call.classList.toggle("on", fade > .5);
      callBar.style.width = (prog * 100).toFixed(1) + "%";
      if (prog >= 1 && !fin) { fin = true; setDone(true); }
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener("pointermove", move); st.removeEventListener("pointerleave", leave); };
  }, []);

  const pickShape = (s: number) => { setShape(s); api.current.shape(s); };

  return (
    <section className="section inspect wrap" id="inspect">
      <div className="inner">
        <div className="sec-head reveal">
          <div><p className="eyebrow">Живой осмотр в Корее</p><h2>Вы видите технику до покупки</h2></div>
          <p className="lead">Специалист осматривает технику на месте в Корее и фиксирует всё на фото и видео. Решение о покупке принимаете только вы.</p>
        </div>
        <div className="scan">
          <div className="scan-stage" id="scan-stage" data-cursor="Осмотр" ref={stRef}>
            <canvas id="scan2" ref={cvRef} aria-hidden="true"></canvas>
            <i className="cn tl"></i><i className="cn tr"></i><i className="cn bl"></i><i className="cn br"></i>
            <div className="scan-top">
              <span className="rec-tag"><i></i>Rec · осмотр</span>
              <div className="seg seg-s" role="group" aria-label="Что показать на скане">
                <button type="button" aria-pressed={shape === 0} onClick={() => pickShape(0)}>Мото</button>
                <button type="button" aria-pressed={shape === 1} onClick={() => pickShape(1)}>Авто</button>
              </div>
            </div>
            <div className={"call on" + (done ? " done" : "")} id="scan-call" ref={callRef} aria-hidden="true">
              <i className="call-line"></i>
              <div className="call-box">
                <span className="call-k">Точка {active + 1} из 4</span>
                <b className="call-t">{CHECKS[active].t}</b>
                <span className="call-s"><i className="call-bar"><i></i></i><em>{done ? "Зафиксировано в отчёте" : "Проверяем…"}</em></span>
              </div>
            </div>
            <p className="scan-hint">Двигайте курсор, чтобы осмотреть технику со всех сторон</p>
          </div>
          <ul className="checks" id="checks" aria-label="Что проверяем при осмотре">
            {CHECKS.map((c, i) => (
              <li key={c.t}>
                <button
                  type="button" className={"chk" + (i === active ? " on" : "")} data-k={i}
                  onPointerEnter={(e) => { if (e.pointerType !== "touch") api.current.hover(i, Infinity); }}
                  onPointerLeave={() => api.current.release()}
                  onFocus={() => api.current.hover(i, Infinity)}
                  onBlur={() => api.current.release()}
                  onClick={() => api.current.hover(i, performance.now() + 5000)}
                >
                  <svg className="chk-ic" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12.5" /><path d="M9 14.5l3.3 3.3 6.7-7.3" /></svg>
                  <b>{c.t}</b><span>{c.d}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="price-row reveal">
          <div className="price-box">
            <div className="price">12 500 ₽</div>
            <div className="price-cap">Стоимость живого осмотра</div>
          </div>
          <div className="price-note">
            <p className="pn-lead">Мы не зарабатываем на осмотре. 12 500 ₽ — это стоимость найма специалиста в Корее.</p>
            <p>Наша задача — заранее подобрать лучший вариант на рынке и осмотреть его непосредственно перед покупкой.</p>
            <Link className="btn btn-primary" data-magnetic="" href="/#contact">Заказать осмотр</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
