"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV } from "@/data/content";
import { LINKS, PHONE, PHONE_HREF, TG_DEFAULT } from "@/lib/site";
import { TgIcon } from "./icons";

/** Top bar, burger menu (below 1200px) and the sticky Telegram bar on phones. */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [bar, setBar] = useState(false);
  const path = usePathname();
  const home = path === "/" || path === "";

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onResize = () => { if (window.innerWidth >= 1200) setOpen(false); };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("keydown", onKey);
    addEventListener("resize", onResize);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("keydown", onKey); removeEventListener("resize", onResize); };
  }, []);

  useEffect(() => { document.documentElement.classList.toggle("mnav-lock", open); }, [open]);
  useEffect(() => { setOpen(false); }, [path]);

  // sticky CTA on phones: after the first screen, hidden over the contact block; only on the home page
  useEffect(() => {
    setBar(false);
    if (!home) return;
    const hero = document.getElementById("top"), contact = document.getElementById("contact");
    if (!hero || !contact) return;
    let pastHero = false, atEnd = false;
    const upd = () => setBar(pastHero && !atEnd);
    const a = new IntersectionObserver((es) => { pastHero = !es[0].isIntersecting; upd(); }, { threshold: 0 });
    const b = new IntersectionObserver((es) => { atEnd = es.some((e) => e.isIntersecting); upd(); }, { threshold: 0 });
    a.observe(hero); b.observe(contact);
    return () => { a.disconnect(); b.disconnect(); };
  }, [home]);

  const barOn = bar && !open;
  return (
    <>
      <header className={"nav wrap" + (solid ? " is-solid" : "")} id="nav">
        <div className="inner nav-in">
          <Link className="logo" href="/#top" aria-label="VELTOR, на главную"><b>VELTOR</b></Link>
          <ul className="nav-links">
            {NAV.filter((n) => n.top).map((n) => (
              <li key={n.href}><Link href={n.href} className={n.href === "/catalog/" ? "nav-cat" : undefined}>{n.label}</Link></li>
            ))}
          </ul>
          <div className="nav-act">
            <a className="nav-phone" href={PHONE_HREF}>{PHONE}</a>
            <Link className="btn btn-primary btn-s nav-cat-btn" href="/catalog/">Каталог</Link>
            <a className="btn btn-ghost btn-s nav-tg" data-magnetic="" href={LINKS.manager} target="_blank" rel="noopener">Написать в Telegram</a>
            <button className="burger" type="button" id="burger" aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="mnav" onClick={() => setOpen(!open)}><i></i><i></i></button>
          </div>
        </div>
      </header>

      <div className={"mnav" + (open ? " open" : "")} id="mnav">
        <nav className="mnav-in" aria-label="Меню">
          <ol className="mnav-list">
            {NAV.map((n, i) => (
              <li key={n.href}><Link href={n.href} onClick={() => setOpen(false)}><em>{String(i + 1).padStart(2, "0")}</em>{n.label}</Link></li>
            ))}
          </ol>
          <div className="mnav-foot">
            <a className="btn btn-primary mnav-cta" href={TG_DEFAULT} target="_blank" rel="noopener">Написать в Telegram</a>
            <a className="btn btn-ghost mnav-cta mnav-phone" href={PHONE_HREF}>Позвонить {PHONE}</a>
            <div className="mnav-soc">
              <a href={LINKS.channel} target="_blank" rel="noopener">Telegram</a>
              <a href={LINKS.instagram} target="_blank" rel="noopener">Instagram</a>
              <a href={LINKS.avito} target="_blank" rel="noopener">Авито</a>
            </div>
          </div>
        </nav>
      </div>

      <a className={"mbar" + (barOn ? " on" : "")} id="mbar" href={TG_DEFAULT} target="_blank" rel="noopener" aria-hidden={!barOn} tabIndex={barOn ? 0 : -1}>
        <span className="mbar-ic"><TgIcon /></span><span>Подобрать технику</span><em>Написать в Telegram →</em>
      </a>
    </>
  );
}
