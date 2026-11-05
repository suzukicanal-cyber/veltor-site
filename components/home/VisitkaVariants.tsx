"use client";
import { useEffect, useRef, useState } from "react";
import { LINKS, PHONE, PHONE_HREF, asset } from "@/lib/site";
import { TEAM } from "@/data/content";
import { drawMini } from "@/lib/cloud";
import { AvitoIcon, IgIcon, PhoneIcon, TgIcon } from "../icons";
import Qr from "../Qr";
import Clock from "../Clock";

/* Five business-card designs for the contact section (preview before choosing one). */

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
  { k: "ig", href: LINKS.instagram, ic: <IgIcon />, t: "Instagram", s: "Видео и сторис", ext: true },
  { k: "av", href: LINKS.avito, ic: <AvitoIcon />, t: "Авито", s: "Отзывы клиентов", ext: true },
];
const ext = (e: boolean) => (e ? { target: "_blank", rel: "noopener" } : {});

/* 1 — boarding pass: route Инчхон → Москва, perforated stub with the QR */
export function VisitkaPass() {
  const t = useTilt();
  return (
    <div className="vk vk1" onPointerMove={t.move} onPointerLeave={t.leave}>
      <div className="vk1-card" ref={t.ref}>
        <div className="vk1-main">
          <div className="vk1-top"><span className="vk-logo">VELTOR</span><span className="vk-mono">Посадочный талон · техника под ключ</span></div>
          <div className="vk1-route">
            <div><b>ICN</b><span>Инчхон</span></div>
            <div className="vk1-line" aria-hidden="true"><i></i></div>
            <div className="vk1-to"><b>MOW</b><span>Москва</span></div>
          </div>
          <dl className="vk1-fields">
            <div><dt>В пути</dt><dd>до 45 дней</dd></div>
            <div><dt>Рекорд</dt><dd>25 дней</dd></div>
            <div><dt>Сеул сейчас</dt><dd><Clock tz="Asia/Seoul" /></dd></div>
            <div><dt>Москва сейчас</dt><dd><Clock tz="Europe/Moscow" /></dd></div>
          </dl>
          <ul className="vk1-links">
            {LINKS4.map((l) => <li key={l.k}><a className={"vk-a vk-" + l.k} href={l.href} {...ext(l.ext)}><span className="vk-ic">{l.ic}</span><b>{l.t}</b></a></li>)}
          </ul>
        </div>
        <div className="vk1-stub">
          <span className="vk-mono">Канал</span>
          <Qr className="vk1-qr" />
          <span className="vk-mono">Наведите камеру</span>
          <div className="vk1-bars" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  );
}

/* 2 — instrument cluster: two analogue dials (Seoul / Moscow) and contacts as cluster keys */
function Dial({ tz, label }: { tz: string; label: string }) {
  const [a, setA] = useState({ h: 0, m: 0 });
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
    const tick = () => { const [h, m] = f.format(new Date()).split(":").map(Number); setA({ h: (h % 12) * 30 + m / 2, m: m * 6 }); };
    tick(); const id = setInterval(tick, 15000); return () => clearInterval(id);
  }, [tz]);
  return (
    <div className="vk2-dial">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="56" className="vk2-rim" />
        {Array.from({ length: 60 }, (_, i) => <line key={i} x1="60" y1={i % 5 ? 8 : 6} x2="60" y2={i % 5 ? 12 : 16} transform={`rotate(${i * 6} 60 60)`} className={i % 5 ? "vk2-tk" : "vk2-tk vk2-tk5"} />)}
        <line x1="60" y1="60" x2="60" y2="30" className="vk2-h" style={{ transform: `rotate(${a.h}deg)` }} />
        <line x1="60" y1="64" x2="60" y2="18" className="vk2-m" style={{ transform: `rotate(${a.m}deg)` }} />
        <circle cx="60" cy="60" r="3.5" className="vk2-pin" />
      </svg>
      <div className="vk2-cap"><span className="vk-mono">{label}</span><Clock tz={tz} /></div>
    </div>
  );
}
export function VisitkaCluster() {
  const t = useTilt();
  return (
    <div className="vk vk2" onPointerMove={t.move} onPointerLeave={t.leave}>
      <div className="vk2-card" ref={t.ref}>
        <div className="vk2-top"><span className="vk-logo">VELTOR</span><span className="vk2-led"><i></i>на связи</span></div>
        <div className="vk2-dials">
          <Dial tz="Asia/Seoul" label="Инчхон" />
          <div className="vk2-mid" aria-hidden="true"><span>до 45 дней</span><i></i></div>
          <Dial tz="Europe/Moscow" label="Москва" />
        </div>
        <div className="vk2-keys">
          {LINKS4.map((l) => <a key={l.k} className={"vk2-key vk-" + l.k} href={l.href} {...ext(l.ext)}><span className="vk-ic">{l.ic}</span><b>{l.t}</b><em>{l.s}</em></a>)}
          <div className="vk2-qr"><Qr className="vk2-qrc" /><span className="vk-mono">Telegram</span></div>
        </div>
      </div>
    </div>
  );
}

/* 3 — scan: the site's point-cloud motorcycle turning inside the card, contacts as tiles */
export function VisitkaScan() {
  const t = useTilt();
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current!; let raf = 0, y = .4, on = true;
    const io = new IntersectionObserver((e) => { on = e[0].isIntersecting; }); io.observe(c);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loop = (now: number) => { if (on) { y = .25 + Math.sin(now * .0004) * .45; drawMini(c, "moto", y); } raf = reduce ? 0 : requestAnimationFrame(loop); };
    drawMini(c, "moto", y); if (!reduce) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);
  return (
    <div className="vk vk3" onPointerMove={t.move} onPointerLeave={t.leave}>
      <div className="vk3-card" ref={t.ref}>
        <div className="vk3-scan">
          <canvas ref={cv} aria-hidden="true"></canvas>
          <i className="vk3-c vk3-c1"></i><i className="vk3-c vk3-c2"></i><i className="vk3-c vk3-c3"></i><i className="vk3-c vk3-c4"></i>
          <span className="vk-logo vk3-logo">VELTOR</span>
          <span className="vk-mono vk3-tl">Скан · Мото и авто из Южной Кореи</span>
          <i className="vk3-sweep" aria-hidden="true"></i>
        </div>
        <div className="vk3-grid">
          {LINKS4.map((l) => <a key={l.k} className={"vk3-tile vk-" + l.k} href={l.href} {...ext(l.ext)}><span className="vk-ic">{l.ic}</span><span><b>{l.t}</b><em>{l.s}</em></span><i aria-hidden="true">↗</i></a>)}
        </div>
      </div>
    </div>
  );
}

/* 4 — the team on call: faces of the three partners, contacts with what you find there */
export function VisitkaTeam() {
  const t = useTilt();
  return (
    <div className="vk vk4" onPointerMove={t.move} onPointerLeave={t.leave}>
      <div className="vk4-card" ref={t.ref}>
        <div className="vk4-head">
          <div className="vk4-faces">
            {TEAM.map((m) => <img key={m.name} src={asset(m.photo)} alt={m.name} width={64} height={64} loading="lazy" />)}
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

/* 5 — black metal card: chip, phone embossed like a card number; flips on hover to the QR */
export function VisitkaMetal() {
  const t = useTilt();
  const [flip, setFlip] = useState(false);
  return (
    <div className="vk vk5" onPointerMove={t.move} onPointerLeave={t.leave}>
      <div className={"vk5-flip" + (flip ? " is-flip" : "")} ref={t.ref}>
        <div className="vk5-face vk5-front">
          <div className="vk5-row"><span className="vk-logo">VELTOR</span><span className="vk-mono">Мото · Авто</span></div>
          <div className="vk5-chip" aria-hidden="true"><i></i><i></i><i></i></div>
          <a className="vk5-num" href={PHONE_HREF}>{PHONE.replace("+7 ", "+7 ").split(" ").map((p, i) => <span key={i}>{p}</span>)}</a>
          <div className="vk5-row vk5-bottom"><div><span className="vk-mono">Маршрут</span><b>ICN → MOW</b></div><div><span className="vk-mono">Срок</span><b>до 45 дней</b></div><button type="button" className="vk5-turn" onClick={() => setFlip(true)}>QR ↻</button></div>
        </div>
        <div className="vk5-face vk5-back">
          <Qr className="vk5-qr" />
          <div><span className="vk-mono">Telegram-канал</span><p>Подборы из Кореи каждый день</p><button type="button" className="vk5-turn" onClick={() => setFlip(false)}>Назад ↺</button></div>
        </div>
      </div>
      <ul className="vk5-links">
        {LINKS4.map((l) => <li key={l.k}><a className={"vk-a vk-" + l.k} href={l.href} {...ext(l.ext)} aria-label={l.t}><span className="vk-ic">{l.ic}</span><b>{l.k === "ph" ? "Позвонить" : l.t}</b></a></li>)}
      </ul>
    </div>
  );
}
