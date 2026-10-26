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
    const s = document.createElement("script");
    s.async = true; s.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
    document.head.appendChild(s);
    ym(METRIKA_ID, "init", { ssr: true, webvisor: true, clickmap: true, ecommerce: "dataLayer", accurateTrackBounce: true, trackLinks: true });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a") as HTMLAnchorElement | null;
      if (!a || !window.ym) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("tel:")) window.ym(METRIKA_ID, "reachGoal", "phone_click");
      else if (/^https:\/\/t\.me\/veltor_kor/i.test(href)) window.ym(METRIKA_ID, "reachGoal", "tg_click");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
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
