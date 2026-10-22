"use client";
import { useEffect, useRef, useState } from "react";
import { REVIEWS, Review } from "@/data/content";

function Card({ r }: { r: Review }) {
  const tRef = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { const t = tRef.current!; setLong(t.scrollHeight > t.clientHeight + 4); }, []);
  return (
    <article className={"rv" + (long ? " long" : "") + (open ? " open" : "")} data-light="">
      <div className="rv-top"><span className="rv-src">Авито</span><span className="rv-ok">Сделка состоялась</span></div>
      <div className="rv-txt" ref={tRef}>{r.text.map((p, i) => <p key={i}>{p}</p>)}</div>
      <button type="button" className="rv-more" hidden={!long} onClick={() => setOpen(!open)}>{open ? "Свернуть" : "Читать целиком"}</button>
      <div className="rv-who"><span className="rv-av" aria-hidden="true">{r.name[0]}</span><span><b>{r.name}</b><em>{r.date}</em></span></div>
    </article>
  );
}

/** Reviews from Avito: horizontal row with arrows, drag with the mouse, "Читать целиком" for long ones. */
export default function Reviews() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const row = rowRef.current!;
    const upd = () => setEdge({ start: row.scrollLeft < 4, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 4 });
    row.addEventListener("scroll", upd, { passive: true }); upd();
    let down = false, x0 = 0, s0 = 0;
    const pd = (e: PointerEvent) => { if (e.pointerType !== "mouse" || (e.target as Element).closest("button")) return; down = true; x0 = e.clientX; s0 = row.scrollLeft; };
    const pm = (e: PointerEvent) => { if (!down) return; if (Math.abs(e.clientX - x0) > 4) row.classList.add("down"); row.scrollLeft = s0 - (e.clientX - x0); };
    const pu = () => { if (!down) return; down = false; row.classList.remove("down"); };
    row.addEventListener("pointerdown", pd); addEventListener("pointermove", pm); addEventListener("pointerup", pu);
    return () => { row.removeEventListener("scroll", upd); row.removeEventListener("pointerdown", pd); removeEventListener("pointermove", pm); removeEventListener("pointerup", pu); };
  }, []);

  const go = (d: number) => {
    const row = rowRef.current!, c = row.querySelector(".rv");
    row.scrollBy({ left: d * (c ? c.getBoundingClientRect().width + 16 : 300), behavior: "smooth" });
  };

  return (
    <div className="rv-wrap">
      <div className="rv-head">
        <p className="eyebrow">Отзывы с Авито</p>
        <div className="rv-nav">
          <button type="button" className="vo-b" aria-label="Предыдущие отзывы" disabled={edge.start} onClick={() => go(-1)}>←</button>
          <button type="button" className="vo-b" aria-label="Следующие отзывы" disabled={edge.end} onClick={() => go(1)}>→</button>
        </div>
      </div>
      <div className="rv-row" ref={rowRef} tabIndex={0} aria-label="Отзывы клиентов, листайте в сторону">
        {REVIEWS.map((r) => <Card key={r.name + r.date} r={r} />)}
      </div>
    </div>
  );
}
