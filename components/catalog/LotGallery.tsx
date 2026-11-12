"use client";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/site";
import { hdSrc } from "@/lib/lot-base";
import MiniCanvas from "../MiniCanvas";
import Lightbox from "./Lightbox";
import { landFly } from "../Motion";

/** Lot page gallery: large photo, arrows / keys / swipe, thumbnails. Falls back to the point-cloud preview.
 *  The first photo loads alone and first; the others and the thumbnails follow once it is in (they sat in the same
 *  spot, so lazy loading did not hold them back, and all of them competed with the photo people came for). */
export default function LotGallery({ photos, name, shape, hd }: { photos: string[]; name: string; shape: "moto" | "car"; hd?: boolean }) {
  const n = photos.length;
  const [i, setI] = useState(0);
  const [warm, setWarm] = useState(false);
  const [broken, setBroken] = useState(false);
  const [lb, setLb] = useState(false);
  const x0 = useRef<number | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLImageElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => { landFly(stage.current); }, []);
  const go = (d: number) => setI((k) => (k + d + n) % n);

  // the first photo may have failed before hydration (expired Telegram link) — show the point cloud then
  useEffect(() => {
    const im = first.current;
    if (im && im.complete && im.naturalWidth === 0) setBroken(true);
    else if (im && im.complete) setWarm(true);
  }, []);

  // keep the current thumbnail centred in its strip; only the strip scrolls (scrollIntoView also scrolled the page
  // down to the strip on load when it sat below the fold), and nothing moves until the photo is changed
  const moved = useRef(false);
  useEffect(() => {
    const box = thumbs.current, t = box?.children[i] as HTMLElement | undefined;
    if (!moved.current) { moved.current = true; return; }
    if (!box || !t) return;
    const b = box.getBoundingClientRect(), r = t.getBoundingClientRect();
    box.scrollTo({ left: box.scrollLeft + r.left - b.left - (b.width - r.width) / 2, behavior: "smooth" });
  }, [i]);

  if (!n || broken) return <div className="lp-stage lp-empty"><MiniCanvas shape={shape} yaw={0.6} /></div>;
  return (
    <div className="lp-gal">
      <div
        ref={stage} className="lp-stage" tabIndex={0} aria-roledescription="галерея" aria-label={`Фото ${i + 1} из ${n}`}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
        onPointerDown={(e) => { x0.current = e.clientX; }}
        onPointerUp={(e) => { const moved = x0.current !== null && Math.abs(e.clientX - x0.current) > 40; if (moved) go(e.clientX < x0.current! ? 1 : -1); else if ((e.target as Element).tagName === "IMG") setLb(true); x0.current = null; }}
        data-cursor="Открыть фото"
      >
        {photos.map((p, k) => (k === 0 || k === i || warm) && (
          <img key={p} ref={k === 0 ? first : undefined} src={asset(hd ? hdSrc(p) : p)} alt={`${name} из Южной Кореи — фото ${k + 1} из ${n}`} className={k === i ? "on" : undefined}
            loading={k === 0 ? "eager" : "lazy"} fetchPriority={k === 0 ? "high" : undefined} decoding="async" draggable={false}
            onLoad={k === 0 ? () => setWarm(true) : undefined} onError={k === 0 ? () => setBroken(true) : undefined} />
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
              {warm && <img src={asset(p)} alt="" loading="lazy" decoding="async" />}
            </button>
          ))}
        </div>
      )}
      {lb && <Lightbox photos={photos.map((p) => asset(hd ? hdSrc(p) : p))} start={i} name={name} onClose={() => setLb(false)} />}
    </div>
  );
}
