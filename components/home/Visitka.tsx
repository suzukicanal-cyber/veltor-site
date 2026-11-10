"use client";
import { useRef } from "react";
import { LINKS, PHONE, PHONE_HREF, asset } from "@/lib/site";
import { TEAM } from "@/data/content";
import { AvitoIcon, PhoneIcon, PlayIcon, TgIcon } from "../icons";
import Qr from "../Qr";

/** Contact business card: the team's faces (each opens their Instagram), contacts and the QR to the channel; tilts toward the cursor. */
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const c = ref.current; if (!c) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty("--ry", (x - .5) * 8 + "deg"); c.style.setProperty("--rx", (.5 - y) * 6 + "deg");
    c.style.setProperty("--gx", x * 100 + "%"); c.style.setProperty("--gy", y * 100 + "%");
  };
  const leave = () => { const c = ref.current; if (!c) return; c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); };
  return { ref, move, leave };
}

const LINKS4 = [
  { k: "ph", href: PHONE_HREF, ic: <PhoneIcon />, t: PHONE, s: "Звонок", ext: false },
  { k: "tg", href: LINKS.channel, ic: <TgIcon />, t: "Telegram", s: "Канал с подборами", ext: true },
  { k: "ig", href: LINKS.instagram, ic: <PlayIcon />, t: "Видео", s: "Рилсы и сторис", ext: true },
  { k: "av", href: LINKS.avito, ic: <AvitoIcon />, t: "Авито", s: "Отзывы клиентов", ext: true },
];
const ext = (e: boolean) => (e ? { target: "_blank", rel: "noopener" } : {});


export default function Visitka() {
  const t = useTilt();
  return (
    <div className="vk vk4" onPointerMove={t.move} onPointerLeave={t.leave}>
      <div className="vk4-card" ref={t.ref}>
        <div className="vk4-head">
          <div className="vk4-faces">
            {TEAM.map((m) => m.ig
              ? <a key={m.name} href={m.ig} target="_blank" rel="noopener" aria-label={`${m.name} в Instagram`}><img src={asset(m.photo)} alt="" width={64} height={64} loading="lazy" /></a>
              : <span key={m.name}><img src={asset(m.photo)} alt={m.name} width={64} height={64} loading="lazy" /></span>)}
          </div>
          <div><span className="vk-logo">VELTOR</span><p>Ева, Сергей и Анатолий — на связи в Москве и Инчхоне</p></div>
        </div>
        <ul className="vk4-list">
          {LINKS4.map((l) => <li key={l.k}><a className={"vk-a vk-" + l.k} href={l.href} {...ext(l.ext)}><span className="vk-ic">{l.ic}</span><span><b>{l.t}</b><em>{l.s}</em></span><i aria-hidden="true">↗</i></a></li>)}
        </ul>
        <div className="vk4-foot">
          <Qr className="vk4-qr" />
          <div><span className="vk-mono">Telegram-канал</span><p>Новые подборы из Кореи каждый день — наведите камеру телефона</p></div>
        </div>
      </div>
    </div>
  );
}

