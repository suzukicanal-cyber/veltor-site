"use client";
import { useEffect } from "react";

/**
 * Site-wide motion (chosen by the owner 2026-11-09):
 *  5. a faint film grain over the dark background (CSS, html.grain);
 *  6. smooth wheel scrolling with inertia on computers;
 *  7. the card photo flies into the big photo of the lot page (catalog → lot).
 * Everything is off for people who ask the system for less motion.
 */
export default function Motion() {
  // 5 + 6 + 7 (click side) — once
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    const root = document.documentElement;
    const off: (() => void)[] = [];
    if (!reduce) root.classList.add("grain");

    // 6 — inertial wheel scrolling; native scroll position stays the truth (sticky, observers, anchors keep working)
    if (fine && !reduce) {
      let target = scrollY, cur = scrollY, raf = 0, ours = false;
      const max = () => root.scrollHeight - innerHeight;
      const step = () => {
        cur += (target - cur) * 0.12;
        if (Math.abs(target - cur) < 0.5) { cur = target; raf = 0; }
        ours = true; scrollTo({ top: cur, behavior: "instant" as ScrollBehavior });
        if (raf) raf = requestAnimationFrame(step);
      };
      const scrollsInside = (el: Element | null, dy: number) => {
        for (; el && el !== document.body; el = el.parentElement) {
          const s = getComputedStyle(el);
          if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1) {
            if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
          }
        }
        return false;
      };
      const wheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        if (root.classList.contains("lb-lock") || root.classList.contains("mnav-lock")) return;
        const dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1);
        if (scrollsInside(e.target as Element, dy)) return;
        e.preventDefault();
        if (!raf) { cur = scrollY; target = scrollY; }
        target = Math.max(0, Math.min(max(), target + dy));
        if (!raf) raf = requestAnimationFrame(step);
      };
      const sync = () => { if (ours) { ours = false; return; } if (!raf) { target = cur = scrollY; } };
      const stop = () => { cancelAnimationFrame(raf); raf = 0; target = cur = scrollY; };
      addEventListener("wheel", wheel, { passive: false }); addEventListener("scroll", sync, { passive: true });
      addEventListener("keydown", stop); addEventListener("pointerdown", stop);
      off.push(() => { removeEventListener("wheel", wheel); removeEventListener("scroll", sync); removeEventListener("keydown", stop); removeEventListener("pointerdown", stop); cancelAnimationFrame(raf); });
    }

    // 7 — remember the card photo when a lot link is clicked; LotGallery lands it
    if (!reduce) {
      const click = (e: MouseEvent) => {
        const a = (e.target as Element).closest?.("a[href^='/catalog/']") as HTMLAnchorElement | null;
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
        const card = a.closest(".lot");
        const im = card?.querySelector<HTMLImageElement>(".lot-gal img.on") || card?.querySelector<HTMLImageElement>(".lot-gal img");
        if (!im || !im.complete || !im.naturalWidth) return;
        const r = im.getBoundingClientRect();
        try { sessionStorage.setItem("veltor-fly", JSON.stringify({ href: new URL(a.href).pathname, src: im.currentSrc || im.src, r: [r.left, r.top, r.width, r.height], t: Date.now() })); } catch { /* storage off */ }
      };
      document.addEventListener("click", click, true);
      off.push(() => document.removeEventListener("click", click, true));
    }
    return () => { off.forEach((f) => f()); root.classList.remove("grain"); };
  }, []);
  return null;
}

/** 7 — called by the lot gallery once it is laid out: the remembered card photo flies into the stage. */
export function landFly(stage: HTMLElement | null) {
  if (!stage) return;
  let d: { href: string; src: string; r: number[]; t: number } | null = null;
  try { d = JSON.parse(sessionStorage.getItem("veltor-fly") || "null"); sessionStorage.removeItem("veltor-fly"); } catch { return; }
  if (!d || Date.now() - d.t > 4000 || d.href.replace(/\/$/, "") !== location.pathname.replace(/\/$/, "")) return;
  const to = stage.getBoundingClientRect();
  if (to.bottom < 0 || to.top > innerHeight) return;
  const f = document.createElement("img");
  f.src = d.src; f.className = "fly-img"; f.alt = "";
  Object.assign(f.style, { left: d.r[0] + "px", top: d.r[1] + "px", width: d.r[2] + "px", height: d.r[3] + "px" });
  document.body.appendChild(f);
  stage.classList.add("is-landing");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    Object.assign(f.style, { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px", borderRadius: "8px" });
  }));
  setTimeout(() => { stage.classList.remove("is-landing"); f.style.opacity = "0"; }, 720);
  setTimeout(() => f.remove(), 1100);
}
