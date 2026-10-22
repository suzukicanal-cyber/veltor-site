"use client";
import { useEffect, useRef, useState } from "react";
import { prefersReduced } from "@/lib/cloud";

type P = { x: number; y: number; v: number; s: number; a: number };

/** "Наша миссия" with particles flowing along the line. */
export default function Mission() {
  const ref = useRef<HTMLDivElement>(null), cvRef = useRef<HTMLCanvasElement>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const m = ref.current!, cv = cvRef.current!, g = cv.getContext("2d")!;
    const reduce = prefersReduced();
    let P: P[] = [], W = 0, H = 0, vis = false, raf = 0;
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; setIn(vis); }, { threshold: .2 }); io.observe(m);
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0);
      P = Array.from({ length: Math.round(W / 5) }, () => ({ x: Math.random() * W, y: H / 2 + (Math.random() - .5) * Math.random() * H * .9, v: .3 + Math.random() * 1.6, s: Math.random() * 1.4 + .4, a: Math.random() }));
    };
    const ro = new ResizeObserver(size); ro.observe(cv);
    const t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame); if (!vis || !W) return; const t = (now - t0) / 1000; g.clearRect(0, 0, W, H);
      for (const p of P) {
        if (!reduce) { p.x += p.v; if (p.x > W + 4) { p.x = -4; p.y = H / 2 + (Math.random() - .5) * Math.random() * H * .9; } }
        const edge = Math.min(1, p.x / (W * .15), (W - p.x) / (W * .15)), mid = 1 - Math.abs(p.y - H / 2) / (H / 2);
        g.globalAlpha = Math.max(0, edge) * (.25 + .75 * mid) * (.5 + .5 * Math.sin(t * 3 + p.a * 6)); g.fillStyle = mid > .8 ? "#fff" : "#CFE0FF"; g.fillRect(p.x, p.y, p.s + p.v * .8, p.s);
      }
      g.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);
  return (
    <div className={"mission" + (inView ? " in" : "")} ref={ref}>
      <p className="eyebrow">Наша миссия</p>
      <p className="mission-t">Команда VELTOR делает привоз техники из Южной Кореи доступным и удобным для каждого</p>
      <div className="mfx" aria-hidden="true">
        <div className="fx fx4" style={{ display: "block" }}><canvas className="fx4-c" ref={cvRef}></canvas></div>
      </div>
    </div>
  );
}
