"use client";
import { useEffect, useRef } from "react";
import { finePointer, prefersReduced } from "@/lib/cloud";

/**
 * Site-wide pointer effects, delegated on the document so they work for any page and any
 * element rendered later: cursor light on [data-light] surfaces, the custom cursor,
 * magnetic buttons [data-magnetic], glow on the manager plate .mgr.
 */
export default function Effects() {
  const curRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = finePointer(), reduce = prefersReduced();
    const off: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => { addEventListener(t, f, o); off.push(() => removeEventListener(t, f, o)); };

    // light under the cursor
    let lx = -9999, ly = -9999, lq = false;
    const updLights = () => {
      lq = false;
      document.querySelectorAll<HTMLElement>("[data-light]").forEach((el) => {
        const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
        el.style.setProperty("--lx", (lx - r.left).toFixed(0) + "px"); el.style.setProperty("--ly", (ly - r.top).toFixed(0) + "px");
      });
    };
    on("pointermove", (e) => { lx = e.clientX; ly = e.clientY; if (!lq) { lq = true; requestAnimationFrame(updLights); } }, { passive: true });

    // custom cursor
    let raf = 0;
    if (fine && curRef.current) {
      document.documentElement.classList.add("has-cursor");
      const cur = curRef.current, ring = ringRef.current!, dot = dotRef.current!, lab = labRef.current!;
      let mx = -100, my = -100, rx = -100, ry = -100;
      on("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        mx = e.clientX; my = e.clientY; cur.classList.remove("is-off");
        const t = e.target as Element;
        cur.classList.toggle("is-off", !!t.closest?.("input,textarea,select"));
        const act = t.closest?.("a,button,label,[role=tab]");
        const h = !act && (t.closest?.("[data-cursor]") as HTMLElement | null);
        ring.classList.toggle("is-hover", !!act); ring.classList.toggle("has-label", !!h);
        lab.textContent = h ? h.dataset.cursor || "" : "";
      }, { passive: true });
      const leave = () => cur.classList.add("is-off");
      document.addEventListener("pointerleave", leave); off.push(() => document.removeEventListener("pointerleave", leave));
      const loop = () => {
        rx += (mx - rx) * .2; ry += (my - ry) * .2;
        dot.style.transform = `translate3d(${mx}px,${my}px,0)`; ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    // magnetic buttons + manager plate glow
    let mag: HTMLElement | null = null;
    on("pointermove", (e) => {
      const t = e.target as Element;
      const m = fine && !reduce ? (t.closest?.("[data-magnetic]") as HTMLElement | null) : null;
      if (mag && mag !== m) mag.style.transform = "";
      mag = m;
      if (m) { const r = m.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); m.style.transform = `translate(${(dx * .18).toFixed(1)}px,${(dy * .3).toFixed(1)}px)`; }
      const g = t.closest?.(".mgr") as HTMLElement | null;
      if (g) { const r = g.getBoundingClientRect(); g.style.setProperty("--lx", e.clientX - r.left + "px"); g.style.setProperty("--ly", e.clientY - r.top + "px"); }
    }, { passive: true });

    return () => { off.forEach((f) => f()); cancelAnimationFrame(raf); document.documentElement.classList.remove("has-cursor"); };
  }, []);

  return (
    <div className="cursor is-off" id="cursor" ref={curRef} aria-hidden="true">
      <div className="c-ring" id="c-ring" ref={ringRef}><span className="c-label" id="c-label" ref={labRef}></span></div>
      <div className="c-dot" id="c-dot" ref={dotRef}></div>
    </div>
  );
}
