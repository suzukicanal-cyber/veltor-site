"use client";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/site";
import { hdSrc } from "@/lib/lots";
import MiniCanvas from "../MiniCanvas";

/** Lot page gallery: large photo, arrows / keys / swipe, thumbnails. Falls back to the point-cloud preview. */
export default function LotGallery({ photos, name, shape, hd }: { photos: string[]; name: string; shape: "moto" | "car"; hd?: boolean }) {
  const n = photos.length;
  const [i, setI] = useState(0);
  const [broken, setBroken] = useState(false);
  const x0 = useRef<number | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLImageElement>(null);
  const go = (d: number) => setI((k) => (k + d + n) % n);

  // the first photo may have failed before hydration (expired Telegram link) — show the point cloud then
  useEffect(() => {
    const im = first.current;
    if (im && im.complete && im.naturalWidth === 0) setBroken(true);
  }, []);

  useEffect(() => {
    const t = thumbs.current?.children[i] as HTMLElement | undefined;
    t?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [i]);

  if (!n || broken) return <div className="lp-stage lp-empty"><MiniCanvas shape={shape} yaw={0.6} /></div>;
  return (
    <div className="lp-gal">
      <div
        className="lp-stage" tabIndex={0} aria-roledescription="галерея" aria-label={`Фото ${i + 1} из ${n}`}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
        onPointerDown={(e) => { x0.current = e.clientX; }}
        onPointerUp={(e) => { if (x0.current !== null && Math.abs(e.clientX - x0.current) > 40) go(e.clientX < x0.current ? 1 : -1); x0.current = null; }}
      >
        {photos.map((p, k) => (
          <img key={p} ref={k === 0 ? first : undefined} src={asset(hd ? hdSrc(p) : p)} alt={`${name} из Южной Кореи — фото ${k + 1} из ${n}`} className={k === i ? "on" : undefined}
            loading={k === 0 ? "eager" : "lazy"} decoding="async" draggable={false} onError={k === 0 ? () => setBroken(true) : undefined} />
        ))}
        {n > 1 && <>
          <button type="button" className="lp-arr prev" aria-label="Предыдущее фото" onClick={() => go(-1)}>←</button>
          <button type="button" className="lp-arr next" aria-label="Следующее фото" onClick={() => go(1)}>→</button>
        </>}
        <span className="lp-count">{i + 1} / {n}</span>
      </div>
      {n > 1 && (
        <div className="lp-thumbs" ref={thumbs}>
          {photos.map((p, k) => (
            <button key={p} type="button" className={k === i ? "on" : undefined} aria-label={`Фото ${k + 1}`} aria-pressed={k === i} onClick={() => setI(k)}>
              <img src={asset(p)} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
