"use client";
import { useEffect } from "react";

/** Lot page motion: chapters and blocks rise in as they scroll into view; the route and the price plot play once visible. */
export default function LotFx() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".lv3-c, .lv-route, .lv-market, .lv-buy, .lv-sim");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
    document.documentElement.classList.add("lv-fx");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
