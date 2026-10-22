"use client";
import { useEffect, useState } from "react";
import { TG_DEFAULT, tgText } from "@/lib/site";
import { TgIcon } from "../icons";

const PICK: Record<string, string> = { moto: "мотоцикл", car: "автомобиль", water: "водную технику" };

/** Main Telegram button. Links with data-pick (in "Направления") change the prepared message. */
export default function ContactCta() {
  const [href, setHref] = useState(TG_DEFAULT);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("[data-pick]") as HTMLElement | null;
      const t = a && PICK[a.dataset.pick || ""];
      if (t) setHref(tgText(`Здравствуйте! Хочу подобрать ${t} из Кореи`));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return (
    <a className="cta-tg" id="cta-tg" href={href} target="_blank" rel="noopener" data-magnetic="">
      <span className="cta-ic"><TgIcon /></span>
      <span className="cta-t"><b>Написать в Telegram</b><em>Откроется чат с менеджером и готовым сообщением</em></span>
      <span className="cta-ar" aria-hidden="true">→</span>
    </a>
  );
}
