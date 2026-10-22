"use client";
import { useEffect, useState } from "react";

/** Live local time for a time zone, "--:--" until the page is hydrated. */
export default function Clock({ tz }: { tz: string }) {
  const [t, setT] = useState("--:--");
  useEffect(() => {
    const f = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: tz });
    const tick = () => setT(f.format(new Date()));
    tick(); const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [tz]);
  return <b data-tz={tz} suppressHydrationWarning>{t}</b>;
}
