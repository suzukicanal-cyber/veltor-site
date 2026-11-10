"use client";
import { useEffect, useRef, useState } from "react";
import { PHONE, PHONE_HREF } from "@/lib/site";
import { PhoneIcon, TgIcon } from "../icons";

/** "Подобрать похожий": opens a small choice — write in Telegram (message prepared) or call. */
export default function LikeButton({ tgHref, className, heart }: { tgHref: string; className: string; heart?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div className={"like" + (open ? " open" : "")} ref={ref}>
      <button type="button" className={className} aria-haspopup="menu" aria-expanded={open} aria-label={heart ? "Подобрать похожий" : undefined} onClick={() => setOpen(!open)}>
        {heart
          ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.6-4.6-9.3-9.4C1.6 7.6 3.8 4.3 7.2 4.3c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.3 4.5 6.6-1.7 4.8-9.3 9.4-9.3 9.4z" /></svg>
          : "Подобрать похожий"}
      </button>
      <div className="like-pop" role="menu" hidden={!open}>
        <a role="menuitem" className="like-opt like-tg" href={tgHref} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
          <span className="like-ic"><TgIcon /></span><span><b>Написать в Telegram</b><em>Сообщение с моделью готово</em></span>
        </a>
        <a role="menuitem" className="like-opt like-ph" href={PHONE_HREF} onClick={() => setOpen(false)}>
          <span className="like-ic"><PhoneIcon /></span><span><b>Позвонить</b><em>{PHONE}</em></span>
        </a>
      </div>
    </div>
  );
}
