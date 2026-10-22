"use client";
import { useEffect, useRef, useState } from "react";

/** "Листайте" dots under a horizontally scrolling row (phones). */
export default function SwipeHint({ target }: { target: string }) {
  const [count, setCount] = useState(0);
  const [on, setOn] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = document.querySelector<HTMLElement>(target); if (!row) return;
    const items = () => [...row.children] as HTMLElement[];
    setCount(items().length);
    const upd = () => {
      const r = row.getBoundingClientRect(), c = r.left + r.width / 2; let best = 0, bd = 1e9;
      items().forEach((it, i) => { const b = it.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - c); if (d < bd) { bd = d; best = i; } });
      setOn(best);
    };
    row.addEventListener("scroll", upd, { passive: true }); upd();
    return () => row.removeEventListener("scroll", upd);
  }, [target]);
  return (
    <div className="swipe-hint" ref={ref}>
      <span className="swipe-dots">{Array.from({ length: count }, (_, i) => <i key={i} className={i === on ? "on" : undefined}></i>)}</span>
      <span>Листайте</span>
    </div>
  );
}
