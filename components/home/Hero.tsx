"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COL, D, PIV, getClouds, prefersReduced } from "@/lib/cloud";

/** First screen: 3D point-cloud scan of a motorcycle / car that turns after the cursor (drag on touch). */
export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef<HTMLElement>(null);
  const setShapeRef = useRef<(i: number) => void>(() => {});
  const [shape, setShape] = useState(0);

  useEffect(() => {
    const hero = heroRef.current!, cv = cvRef.current!, hud = hudRef.current!, angleEl = angleRef.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = prefersReduced();
    const { SH, FLOOR, N, R } = getClouds();
    let W = 0, H = 0, dpr = 1, F = 1, CX = 0, CY = 0, narrow = false;
    let yaw = .55, pitch = .22, tYaw = .55, tPitch = .22;
    let px = -9999, py = -9999, inside = false, lastMove = -1e9, dragX: number | null = null;
    let visible = true, lastAngle = "", raf = 0;
    const ox = new Float32Array(N), oy = new Float32Array(N);
    const noise = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) noise[i] = R() * 2 - 1;
    const curPos = new Float32Array(SH[0].pos), curBr = new Float32Array(SH[0].br);
    const fromPos = new Float32Array(N * 3), fromBr = new Float32Array(N);
    let fromCol = SH[0].col, target = 0, mStart = 0, morphing = false;
    let tagEls: HTMLDivElement[] = [];

    function buildTags(idx: number) {
      hud.textContent = "";
      tagEls = SH[idx].tags.map((g) => {
        const el = document.createElement("div"); el.className = "tag";
        el.innerHTML = '<i class="tag-dot"></i><i class="tag-line"></i><span class="tag-text"></span>';
        el.querySelector(".tag-text")!.textContent = g.t; hud.appendChild(el); return el;
      });
    }
    buildTags(0);

    setShapeRef.current = (idx: number) => {
      if (idx === target && !morphing) return;
      fromPos.set(curPos); fromBr.set(curBr); fromCol = SH[target].col;
      target = idx; mStart = performance.now(); morphing = true;
      hud.classList.remove("on"); buildTags(idx);
    };

    function resize() {
      const r = hero.getBoundingClientRect(); W = r.width; H = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      narrow = W < 760;
      F = narrow ? Math.min(W * 1.05, 540) : Math.min(W * 1.12, H * 1.9);
      CX = W / 2; CY = narrow ? 250 : H * .47;
    }
    const ro = new ResizeObserver(resize); ro.observe(hero); resize();
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }); io.observe(hero);

    const move = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; inside = true; lastMove = performance.now();
      const nx = px / r.width, ny = py / r.height;
      hero.style.setProperty("--px", (nx - .5).toFixed(3)); hero.style.setProperty("--py", (ny - .5).toFixed(3));
      if (e.pointerType === "touch") { if (dragX !== null) { const dx = e.clientX - dragX; tYaw += dx * .012; dragX = e.clientX; } }
      else { tYaw = .55 + (nx - .5) * 2.8; tPitch = .22 + (ny - .5) * .3; }
    };
    const down = (e: PointerEvent) => { if (e.pointerType === "touch") { dragX = e.clientX; lastMove = performance.now(); } };
    const endDrag = (e: PointerEvent) => { if (e.pointerType === "touch") { dragX = null; inside = false; } };
    const leave = () => { inside = false; dragX = null; };
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerdown", down, { passive: true });
    hero.addEventListener("pointerup", endDrag); hero.addEventListener("pointercancel", endDrag);
    hero.addEventListener("pointerleave", leave);

    const project = (x: number, y: number, z: number, cyw: number, syw: number, cp: number, sp: number) => {
      const X = x * cyw + z * syw, Zr = -x * syw + z * cyw, Y = y - PIV;
      const Y2 = Y * cp + Zr * sp, Z2 = Zr * cp - Y * sp, k = F / (Z2 + D);
      return [CX + X * k, CY - Y2 * k, Z2];
    };

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const idle = now - lastMove > 2600 && dragX === null;
      if (idle && !reduce) { tYaw = .55 + Math.sin(now * .00026) * .8; tPitch = .22 + Math.sin(now * .00041) * .05; }
      yaw += (tYaw - yaw) * .065; pitch += (tPitch - pitch) * .065;
      let e = 1;
      if (morphing) {
        let t = reduce ? 1 : (now - mStart) / 1500;
        if (t >= 1) { t = 1; morphing = false; curPos.set(SH[target].pos); curBr.set(SH[target].br); hud.classList.add("on"); }
        e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
      const S = SH[target], tp = S.pos, tb = S.br, tc = S.col, bump = morphing ? Math.sin(Math.PI * e) * .5 : 0;
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = COL[0];
      for (let i = 0; i < FLOOR.length; i++) { const p = FLOOR[i], q = project(p[0], p[1], p[2], cyw, syw, cp, sp); ctx.globalAlpha = p[3] * (q[2] < 0 ? 1 : .55); ctx.fillRect(q[0] - .6, q[1] - .6, 1.2, 1.2); }

      let scanX = 99; if (!reduce) { const s = (now % 6800) / 6800; if (s < .7) scanX = -1.45 + 2.9 * (s / .7); }
      const RAD = 120, R2 = inside ? RAD * RAD : 0;
      let last = -1;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3; let x, y, z, b, c;
        if (morphing) {
          x = fromPos[i3] + (tp[i3] - fromPos[i3]) * e + noise[i3] * bump;
          y = fromPos[i3 + 1] + (tp[i3 + 1] - fromPos[i3 + 1]) * e + noise[i3 + 1] * bump * .6;
          z = fromPos[i3 + 2] + (tp[i3 + 2] - fromPos[i3 + 2]) * e + noise[i3 + 2] * bump;
          b = fromBr[i] + (tb[i] - fromBr[i]) * e; c = e < .5 ? fromCol[i] : tc[i];
          curPos[i3] = x; curPos[i3 + 1] = y; curPos[i3 + 2] = z; curBr[i] = b;
        } else { x = tp[i3]; y = tp[i3 + 1]; z = tp[i3 + 2]; b = tb[i]; c = tc[i]; }
        const X = x * cyw + z * syw, Zr = -x * syw + z * cyw, Y = y - PIV;
        const Y2 = Y * cp + Zr * sp, Z2 = Zr * cp - Y * sp, k = F / (Z2 + D);
        let sx = CX + X * k, sy = CY - Y2 * k, tx = 0, ty = 0, boost = 0;
        if (R2) { const dx = sx - px, dy = sy - py, d2 = dx * dx + dy * dy; if (d2 < R2) { const d = Math.sqrt(d2) + .01, q = 1 - d / RAD; tx = dx / d * q * q * 70; ty = dy / d * q * q * 70; boost = q; } }
        ox[i] += (tx - ox[i]) * .16; oy[i] += (ty - oy[i]) * .16;
        sx += ox[i]; sy += oy[i];
        const df = Math.min(1, Math.max(.12, .55 - Z2 * .42));
        let a = b * (.28 + .8 * df) + boost * .55, cc = c;
        const sd = Math.abs(x - scanX); if (sd < .035) { a += (1 - sd / .035) * .7; cc = 3; }
        if (a > 1) a = 1;
        const sz = (.75 + b * .85) * (D / (Z2 + D)) * (1 + boost * .6);
        if (cc !== last) { ctx.fillStyle = COL[cc]; last = cc; }
        ctx.globalAlpha = a; ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;

      if (!morphing && !narrow) {
        const tags = S.tags;
        for (let j = 0; j < tags.length; j++) {
          const el = tagEls[j]; if (!el) continue; const a = tags[j].a, q = project(a[0], a[1], a[2], cyw, syw, cp, sp);
          el.style.transform = `translate3d(${q[0].toFixed(1)}px,${q[1].toFixed(1)}px,0)`;
          el.classList.toggle("left", q[0] < CX); el.classList.toggle("back", q[2] > .18);
        }
      }
      const deg = String(Math.round(((yaw * 57.2958) % 360 + 360) % 360)).padStart(3, "0") + "°";
      if (deg !== lastAngle) { angleEl.textContent = deg; lastAngle = deg; }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerdown", down);
      hero.removeEventListener("pointerup", endDrag); hero.removeEventListener("pointercancel", endDrag); hero.removeEventListener("pointerleave", leave);
    };
  }, []);

  const pick = (i: number) => { setShape(i); setShapeRef.current(i); };

  return (
    <section className="hero" id="top" data-cursor="Вращайте" ref={heroRef}>
      <div className="hero-light" data-light=""></div>
      <div className="hero-word" aria-hidden="true">VELTOR</div>
      <canvas id="scan" ref={cvRef} aria-hidden="true"></canvas>
      <div className="hud on" id="hud" ref={hudRef} aria-hidden="true"></div>
      <p className="sr">Интерактивный 3D-скан мотоцикла или автомобиля: он поворачивается вслед за курсором.</p>

      <div className="hero-ui">
        <div className="hero-meta wrap">
          <div className="inner meta-row">
            <span>Южная Корея → Россия</span>
            <span>Порт Инчхон · 37.45° N 126.60° E</span>
            <span>Доставка в среднем 45 дней</span>
          </div>
        </div>
        <div className="wrap">
          <div className="inner foot-row">
            <div className="hero-copy">
              <h1 className="eyebrow">Мотоциклы и автомобили из Южной Кореи под ключ</h1>
              <p className="h1-look">Ваша мечта уже ждёт вас в Южной Корее</p>
              <p>Вы выбираете мечту, мы берём на себя её путь до вашего гаража. Подбор, осмотр, выкуп, доставка и документы проходят спокойно, а вы просто ждёте встречи.</p>
              <div className="ctas">
                <Link className="btn btn-primary" data-magnetic="" href="/#contact">Подобрать технику</Link>
                <Link className="btn btn-ghost" data-magnetic="" href="/#process">Как мы работаем</Link>
              </div>
            </div>
            <div className="hero-ctrl">
              <div className="seg" role="group" aria-label="Что показать в 3D-скане">
                <button type="button" aria-pressed={shape === 0} onClick={() => pick(0)}>Мото</button>
                <button type="button" aria-pressed={shape === 1} onClick={() => pick(1)}>Авто</button>
              </div>
              <p className="readout"><span>Угол обзора</span><b id="angle" ref={angleRef}>032°</b></p>
              <p className="hint"><span className="hint-fine">Ведите курсором по экрану, чтобы осмотреть технику со всех сторон</span><span className="hint-touch">Проведите пальцем по экрану, чтобы повернуть технику</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
