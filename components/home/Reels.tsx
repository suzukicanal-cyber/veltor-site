"use client";
import { useEffect, useRef, useState } from "react";
import { REELS } from "@/data/content";
import { asset } from "@/lib/site";

/** Instagram reels: playlist, sound toggle, muted autoplay only while on screen. */
export default function Reels({ children }: { children: React.ReactNode }) {
  const vRef = useRef<HTMLVideoElement>(null);
  const [cur, setCur] = useState(0);
  const [sound, setSound] = useState(false);
  const [prog, setProg] = useState(0);
  const st = useRef({ visible: false, cur: 0 });

  useEffect(() => {
    const v = vRef.current!;
    v.muted = true; v.defaultMuted = true; v.setAttribute("muted", "");
    // some browsers allow muted autoplay only after the first interaction with the page, so retry then
    const tryPlay = () => { if (st.current.visible && v.paused) v.play().catch(() => {}); };
    v.addEventListener("loadeddata", tryPlay);
    const evs = ["pointerdown", "touchstart", "keydown", "wheel"] as const;
    evs.forEach((e) => addEventListener(e, tryPlay, { passive: true }));
    const io = new IntersectionObserver((es) => { st.current.visible = es[0].isIntersecting; if (st.current.visible) tryPlay(); else v.pause(); }, { threshold: .2 });
    io.observe(v);
    return () => { io.disconnect(); v.removeEventListener("loadeddata", tryPlay); evs.forEach((e) => removeEventListener(e, tryPlay)); };
  }, []);

  const load = (k: number, play: boolean) => {
    const v = vRef.current!; st.current.cur = k; setCur(k); setProg(0);
    v.poster = asset(REELS[k].poster); v.src = asset(REELS[k].src); v.muted = !sound;
    if (play) v.play().catch(() => {});
  };
  const toggleSound = () => { const v = vRef.current!; const on = v.muted; v.muted = !on; setSound(on); if (on) v.play().catch(() => {}); };

  return (
    <div className="bx bx-ig" data-light="">
      <div className="ig-copy">
        {children}
        <ul className="pl" aria-label="Видео из Instagram">
          {REELS.map((r, k) => (
            <li key={r.src}>
              <button type="button" className={"pl-it" + (k === cur ? " on" : "")} aria-pressed={k === cur} onClick={() => load(k, true)} style={{ ["--p" as string]: k === cur ? prog : 0 }}>
                <img src={asset(r.poster)} alt={`Видео: ${r.title}`} width={36} height={64} loading="lazy" />
                <span><b>{r.title}</b><em>{r.dur}</em></span><i className="pl-bar" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
        <a className="bx-go ig-link" href="https://www.instagram.com/veltor_koreaexport/" target="_blank" rel="noopener">Открыть Instagram ↗</a>
      </div>
      <div className="ig-reel">
        <video
          ref={vRef} className="ph-video" src={asset(REELS[0].src)} poster={asset(REELS[0].poster)} muted playsInline autoPlay preload="metadata"
          onClick={toggleSound}
          onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setProg(v.currentTime / v.duration); }}
          onEnded={() => load((st.current.cur + 1) % REELS.length, st.current.visible)}
        ></video>
        <span className="ph-live">Reels</span>
        <button type="button" className="ig-snd" aria-label={sound ? "Выключить звук" : "Включить звук"} aria-pressed={sound} onClick={(e) => { e.stopPropagation(); toggleSound(); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" /><path className="snd-off" d="m16 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /><path className="snd-on" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}
