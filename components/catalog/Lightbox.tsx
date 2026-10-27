"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = { photos: string[]; start: number; name: string; href?: string; onClose: () => void };

/** Full-screen photo viewer: arrows, keys ← → Esc, swipe, thumbnails. */
export default function Lightbox({ photos, start, name, href, onClose }: Props) {
  const n = photos.length;
  const [i, setI] = useState(start);
  const x0 = useRef<number | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const go = (d: number) => setI((k) => (k + d + n) % n);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", key);
    document.documentElement.classList.add("lb-lock");
    return () => { removeEventListener("keydown", key); document.documentElement.classList.remove("lb-lock"); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (thumbs.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [i]);

  return createPortal(
    <div className="lb" role="dialog" aria-modal="true" aria-label={`${name} — фото`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lb-top">
        <span className="lb-t">{name}</span>
        <span className="lb-n">{i + 1} / {n}</span>
        {href && <Link className="lb-go" href={href} onClick={onClose}>Подробнее об объявлении →</Link>}
        <button type="button" className="lb-x" aria-label="Закрыть" onClick={onClose}>×</button>
      </div>
      <div
        className="lb-stage"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        onPointerDown={(e) => { x0.current = e.clientX; }}
        onPointerUp={(e) => { if (x0.current !== null && Math.abs(e.clientX - x0.current) > 50) go(e.clientX < x0.current ? 1 : -1); x0.current = null; }}
      >
        <img key={photos[i]} src={photos[i]} alt={`${name} — фото ${i + 1} из ${n}`} draggable={false} />
        {n > 1 && <>
          <button type="button" className="lb-arr prev" aria-label="Предыдущее фото" onClick={() => go(-1)}>←</button>
          <button type="button" className="lb-arr next" aria-label="Следующее фото" onClick={() => go(1)}>→</button>
        </>}
      </div>
      {n > 1 && (
        <div className="lb-thumbs" ref={thumbs}>
          {photos.map((p, k) => (
            <button key={p} type="button" className={k === i ? "on" : undefined} aria-label={`Фото ${k + 1}`} onClick={() => setI(k)}>
              <img src={p} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
