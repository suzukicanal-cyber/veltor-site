"use client";
import { useRef } from "react";
import { LINKS, PHONE, PHONE_HREF } from "@/lib/site";
import { AvitoIcon, IgIcon, PhoneIcon, TgIcon } from "../icons";
import Qr from "../Qr";

/** Business card with links; tilts toward the cursor. */
export default function Visitka() {
  const card = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const c = card.current!, r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty("--ry", (x - .5) * 10 + "deg"); c.style.setProperty("--rx", (.5 - y) * 8 + "deg"); c.style.setProperty("--gx", x * 100 + "%"); c.style.setProperty("--gy", y * 100 + "%");
  };
  const leave = () => { const c = card.current!; c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); };
  return (
    <div className="rsv">
      <div className="rs4" data-tilt="" onPointerMove={move} onPointerLeave={leave}>
        <div className="rs4-card" ref={card}>
          <div className="rs4-top"><span className="rs4-logo">VELTOR</span><span className="rs4-sub">Мото и авто из Южной Кореи</span></div>
          <ul>
            <li><a className="rs4-a rs-ph" href={PHONE_HREF}><span className="rs-ic"><PhoneIcon /></span><b>{PHONE}</b></a></li>
            <li><a className="rs4-a rs-tg" href={LINKS.channel} target="_blank" rel="noopener"><span className="rs-ic"><TgIcon /></span><b>Telegram</b></a></li>
            <li><a className="rs4-a rs-ig" href={LINKS.instagram} target="_blank" rel="noopener"><span className="rs-ic"><IgIcon /></span><b>Instagram</b></a></li>
            <li><a className="rs4-a rs-av" href={LINKS.avito} target="_blank" rel="noopener"><span className="rs-ic"><AvitoIcon /></span><b>Авито</b></a></li>
          </ul>
          <div className="rs4-qrw"><Qr className="rs4-qr" /><span>Telegram-канал</span></div>
        </div>
      </div>
    </div>
  );
}
