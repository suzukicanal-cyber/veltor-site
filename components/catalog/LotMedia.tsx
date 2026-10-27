"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { drawMini } from "@/lib/cloud";
import { asset } from "@/lib/site";
import { hdSrc } from "@/lib/lots";

/** Card width: a quarter of the screen on desktop, almost full width on phones — the browser picks 800 or 1600 px. */
const SIZES = "(max-width: 600px) 92vw, (max-width: 1100px) 46vw, 25vw";

type Props = { hd?: boolean; photos: string[]; name: string; shape: "moto" | "car"; yaw: number; href: string; kind: string; eager?: boolean };

/**
 * Card photo: move the cursor (or finger) across it to scrub through the photos.
 * Until a photo loads — or if it can't — a point-cloud preview of the shape is shown and turns instead.
 */
export default function LotMedia({ hd, photos, name, shape, yaw: baseYaw, href, kind, eager }: Props) {
  const n = photos.length;
  const cnvRef = useRef<HTMLCanvasElement>(null);
  const firstRef = useRef<HTMLImageElement>(null);
  const yawRef = useRef({ yaw: baseYaw, t: baseYaw, raf: 0 });
  const [cur, setCur] = useState(0);
  const [photo, setPhoto] = useState<boolean | null>(null);
  const [all, setAll] = useState(false);
  const [touched, setTouched] = useState(false);

  // point-cloud preview, redrawn on resize
  useEffect(() => {
    const c = cnvRef.current!;
    const ro = new ResizeObserver(() => drawMini(c, shape, yawRef.current.yaw));
    ro.observe(c);
    return () => { ro.disconnect(); cancelAnimationFrame(yawRef.current.raf); };
  }, [shape]);

  // the first photo may finish loading before hydration
  useEffect(() => {
    const im = firstRef.current;
    if (im && im.complete) setPhoto(im.naturalWidth > 0);
  }, []);

  function show(i: number) {
    if (i === cur) return;
    setCur(i);
    if (photo) { if (i > 0) setAll(true); return; }
    const y = yawRef.current;
    y.t = baseYaw + (n > 1 ? (i / (n - 1) - .5) * 2.4 : 0);
    if (!y.raf) {
      const spin = () => { y.yaw += (y.t - y.yaw) * .14; if (cnvRef.current) drawMini(cnvRef.current, shape, y.yaw); y.raf = Math.abs(y.t - y.yaw) > .002 ? requestAnimationFrame(spin) : 0; };
      y.raf = requestAnimationFrame(spin);
    }
  }
  const at = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * n)));
  };

  return (
    <Link
      href={href}
      className={"lot-media" + (photo ? " has-ph" : "") + (touched ? " touched" : "")}
      aria-label={`${name}: фото и подробности`}
      onPointerEnter={() => photo && setAll(true)}
      onPointerDown={() => photo && setAll(true)}
      onPointerMove={(e) => { if (e.pointerType === "touch") setTouched(true); if (n) show(at(e)); }}
      onPointerLeave={() => { setTouched(false); show(0); }}
    >
      {n > 0 && photo !== false && (
        <div className="lot-gal">
          <img
            ref={firstRef} src={asset(photos[0])} srcSet={hd ? `${asset(photos[0])} 800w, ${asset(hdSrc(photos[0]))} 1600w` : undefined} sizes={hd ? SIZES : undefined} alt={`${name} из Южной Кореи — фото 1 из ${n}`}
            loading={eager ? "eager" : "lazy"} decoding="async" className={cur === 0 ? "on" : undefined}
            onLoad={() => setPhoto(true)} onError={() => setPhoto(false)}
          />
          {all && photos.slice(1).map((u, i) => (
            <img key={u} src={asset(u)} srcSet={hd ? `${asset(u)} 800w, ${asset(hdSrc(u))} 1600w` : undefined} sizes={hd ? SIZES : undefined} alt={`${name} — фото ${i + 2} из ${n}`} decoding="async" className={cur === i + 1 ? "on" : undefined} />
          ))}
        </div>
      )}
      <canvas className="mini" ref={cnvRef} data-shape={shape} aria-hidden="true"></canvas>
      <span className="lot-kind">{kind}</span>
      {n > 0 && <div className="lot-dots">{photos.map((u, i) => <i key={u} className={i === cur ? "on" : undefined}></i>)}</div>}
      {n > 0 && <span className="lot-n">{cur + 1} / {n}</span>}
    </Link>
  );
}
