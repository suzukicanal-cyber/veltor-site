"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { METRIKA_ID } from "@/lib/site";

type Ym = ((id: number, action: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number };
declare global { interface Window { ym?: Ym } }

/**
 * Yandex Metrika: counter with Webvisor; page views on client-side navigation;
 * goals "tg_click" (Telegram), "phone_click" (call), "lot_open" (lot page opened).
 */
export default function Metrika() {
  const path = usePathname();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (!METRIKA_ID || window.ym) return;
    const w = window as unknown as Record<string, unknown>;
    const ym: Ym = function (...args: unknown[]) { (ym.a = ym.a || []).push(args); } as Ym;
    ym.l = Date.now();
    w.ym = ym;
    // the counter script (~300 ms of work on a mid phone) starts at the visitor's first action or after 5 s,
    // not while the page is still getting ready (chosen by the owner 2026-11-12); calls made before it wait in ym.a
    let started = false, timer = 0;
    // only things a person does: page scripts scroll too, so "scroll" would start it on its own
    const acts = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"] as const;
    const start = () => {
      if (started) return;
      started = true; clearTimeout(timer);
      acts.forEach((a) => removeEventListener(a, start));
      const s = document.createElement("script");
      s.async = true; s.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
      document.head.appendChild(s);
    };
    acts.forEach((a) => addEventListener(a, start, { passive: true }));
    timer = window.setTimeout(start, 5000);
    ym(METRIKA_ID, "init", { ssr: true, webvisor: true, clickmap: true, ecommerce: "dataLayer", accurateTrackBounce: true, trackLinks: true });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a") as HTMLAnchorElement | null;
      if (!a || !window.ym) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("tel:")) window.ym(METRIKA_ID, "reachGoal", "phone_click");
      else if (/^https:\/\/t\.me\/veltor_kor/i.test(href)) window.ym(METRIKA_ID, "reachGoal", "tg_click");
    };
    document.addEventListener("click", onClick, true);
    return () => { document.removeEventListener("click", onClick, true); clearTimeout(timer); acts.forEach((a) => removeEventListener(a, start)); };
  }, []);

  // page views when moving between pages without reload
  useEffect(() => {
    if (!METRIKA_ID || !window.ym) return;
    const url = location.href;
    if (prev.current !== null && prev.current !== url) window.ym(METRIKA_ID, "hit", url, { referer: prev.current });
    if (/^\/catalog\/[^/]+\/$/.test(path)) window.ym(METRIKA_ID, "reachGoal", "lot_open");
    prev.current = url;
  }, [path]);

  if (!METRIKA_ID) return null;
  return (
    <noscript><div><img src={`https://mc.yandex.ru/watch/${METRIKA_ID}`} style={{ position: "absolute", left: "-9999px" }} alt="" /></div></noscript>
  );
}
