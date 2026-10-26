"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { METRIKA_ID, PHONE, PHONE_HREF, tgText } from "@/lib/site";
import { TgIcon } from "./icons";

/**
 * "Подбор за минуту": a few taps instead of a form. The answers become a ready
 * message to the manager in Telegram (or copied to paste anywhere). Nothing is
 * sent to or stored on the site. Metrika goals: quiz_start, quiz_finish, quiz_send, quiz_copy.
 * `?src=…` in the page address is added to the message (e.g. /podbor/?src=vk).
 */

type Kind = "moto" | "scooter" | "atv" | "car";
type Answers = { kind?: Kind; style?: string; model?: string; budget?: string; year?: string; when?: string; city?: string };
type StepId = "kind" | "style" | "budget" | "year" | "when" | "city";

const KINDS: { v: Kind; label: string; word: string }[] = [
  { v: "moto", label: "Мотоцикл", word: "мотоцикл" },
  { v: "scooter", label: "Скутер", word: "скутер" },
  { v: "atv", label: "Квадроцикл или багги", word: "квадроцикл/багги" },
  { v: "car", label: "Автомобиль", word: "автомобиль" },
];
const HELP = "Подскажите вы";
const STYLES: Record<Kind, string[]> = {
  moto: ["Спорт", "Нейкед", "Турист / эндуро", "Круизер / чоппер", HELP],
  scooter: ["Городской 125–160 куб.", "Макси-скутер 250+", HELP],
  atv: ["Квадроцикл", "Багги", HELP],
  car: ["Седан", "Кроссовер", "Внедорожник", "Минивэн", HELP],
};
const MODEL_HINT: Record<Kind, string> = {
  moto: "Например, Honda CB650R или BMW R 1250 GS",
  scooter: "Например, Honda Forza 350",
  atv: "Например, Yamaha Grizzly",
  car: "Например, Hyundai Palisade",
};
const BUDGETS: Record<Kind, string[]> = {
  moto: ["до 500 тыс. ₽", "500 тыс. – 1 млн ₽", "1–2 млн ₽", "2–3 млн ₽", "больше 3 млн ₽"],
  scooter: ["до 300 тыс. ₽", "300–600 тыс. ₽", "600 тыс. – 1 млн ₽", "больше 1 млн ₽"],
  atv: ["до 1 млн ₽", "1–2 млн ₽", "2–3 млн ₽", "больше 3 млн ₽"],
  car: ["до 3 млн ₽", "3–5 млн ₽", "5–8 млн ₽", "больше 8 млн ₽"],
};
const YEARS = ["2023 и новее", "2020–2022", "2016–2019", "Неважно, главное — состояние"];
const WHEN = ["Как можно скорее", "К сезону, весной", "Через 2–3 месяца", "Пока прицениваюсь"];
const CITIES = ["Москва", "Санкт-Петербург"];

const STEPS: { id: StepId; q: string; note?: string }[] = [
  { id: "kind", q: "Что ищете?" },
  { id: "style", q: "Какой класс?", note: "Если модель уже выбрана — напишите её, остальное подстроим." },
  { id: "budget", q: "Бюджет под ключ", note: "С выкупом, доставкой до Москвы и оформлением ЭПТС." },
  { id: "year", q: "Год выпуска" },
  { id: "when", q: "Когда нужна техника?" },
  { id: "city", q: "Куда везём?", note: "Выдаём в Москве, в другие города отправим перевозчиком." },
];

const goal = (name: string) => {
  if (METRIKA_ID && typeof window !== "undefined" && window.ym) window.ym(METRIKA_ID, "reachGoal", name);
};

const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function quizMessage(a: Answers, src = "") {
  const kind = KINDS.find((k) => k.v === a.kind);
  const style = a.style && a.style !== HELP ? `, ${a.style.toLowerCase()}` : "";
  const model = a.model?.trim() ? ` — ${a.model.trim()}` : a.style === HELP ? " — нужна помощь с выбором" : "";
  return [
    "Здравствуйте! Хочу подобрать из Кореи:",
    `• ${kind ? kind.word[0].toUpperCase() + kind.word.slice(1) : "Технику"}${style}${model}`,
    a.budget && `• Бюджет под ключ: ${a.budget}`,
    a.year && `• Год: ${lc(a.year)}`,
    a.when && `• Когда: ${lc(a.when)}`,
    a.city?.trim() && `• Город: ${a.city.trim()}`,
    `(заявка с сайта${src ? `, ${src}` : ""})`,
  ].filter(Boolean).join("\n");
}

export default function Quiz({ as = "h2", kind }: { as?: "h1" | "h2"; kind?: Kind }) {
  const [a, setA] = useState<Answers>(kind ? { kind } : {});
  const [step, setStep] = useState(kind ? 1 : 0);
  const [copied, setCopied] = useState(false);
  const [src, setSrc] = useState("");
  const started = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const done = step >= STEPS.length;
  const cur = STEPS[Math.min(step, STEPS.length - 1)];
  const k: Kind = a.kind || "moto";
  const msg = useMemo(() => quizMessage(a, src), [a, src]);

  useEffect(() => {
    const s = new URLSearchParams(location.search).get("src");
    if (s) setSrc(s.replace(/[^a-zA-Zа-яА-ЯёЁ0-9 _.-]/g, "").slice(0, 30));
  }, []);
  useEffect(() => { if (done) goal("quiz_finish"); }, [done]);

  const focusBox = () => requestAnimationFrame(() => box.current?.focus({ preventScroll: true }));
  const go = (n: number) => { setStep(n); focusBox(); };
  const pick = (id: keyof Answers, v: string, advance = true) => {
    if (!started.current) { started.current = true; goal("quiz_start"); }
    setA((p) => (id === "kind" && p.kind !== v ? { kind: v as Kind } : { ...p, [id]: v }));
    if (advance) window.setTimeout(() => go(step + 1), 160);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(msg); } catch {
      const t = document.createElement("textarea");
      t.value = msg; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch { /* nothing else to try */ }
      t.remove();
    }
    setCopied(true); goal("quiz_copy");
    window.setTimeout(() => setCopied(false), 2400);
  };

  const H = as;
  const options = (id: keyof Answers, list: string[], advance = true) => (
    <div className="qz-opts">
      {list.map((v) => (
        <button type="button" key={v} className="qz-opt" aria-pressed={a[id] === v} onClick={() => pick(id, v, advance)}>
          {v}
        </button>
      ))}
    </div>
  );

  return (
    <section className={`wrap ${as === "h1" ? "catalog-page qz-page" : "section"}`} id="podbor">
      <div className="inner">
        <div className="sec-head reveal">
          <div>
            <p className="eyebrow">Подбор за минуту</p>
            <H className={as === "h1" ? "cat-h1" : undefined}>Соберите заявку в пару касаний</H>
          </div>
          <p className="lead">Шесть коротких вопросов — и менеджер получит готовую заявку: что ищете, бюджет, сроки и город. Ответим вариантами из Кореи с ценой под ключ.</p>
        </div>

        <div className="qz" ref={box} tabIndex={-1} aria-live="polite">
          <div className="qz-top">
            <span className="qz-count">{done ? "Готово" : `${String(step + 1).padStart(2, "0")} / ${String(STEPS.length).padStart(2, "0")}`}</span>
            <span className="qz-bar" aria-hidden="true"><i style={{ width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%` }} /></span>
            {step > 0 && (
              <button type="button" className="qz-back" onClick={() => go(step - 1)}>← Назад</button>
            )}
          </div>

          {!done && (
            <div className="qz-step" key={cur.id} role="group" aria-labelledby={`qz-${cur.id}`}>
              <h3 className="qz-q" id={`qz-${cur.id}`}>{cur.q}</h3>
              {cur.note && <p className="qz-note">{cur.note}</p>}

              {cur.id === "kind" && (
                <div className="qz-opts">
                  {KINDS.map((o) => (
                    <button type="button" key={o.v} className="qz-opt" aria-pressed={a.kind === o.v} onClick={() => pick("kind", o.v)}>{o.label}</button>
                  ))}
                </div>
              )}
              {cur.id === "style" && (
                <>
                  {options("style", STYLES[k], false)}
                  <div className="qz-row">
                    <input className="qz-input" type="text" maxLength={60} placeholder={MODEL_HINT[k]} aria-label="Модель"
                      value={a.model || ""} onChange={(e) => setA((p) => ({ ...p, model: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter" && (a.style || a.model?.trim())) go(step + 1); }} />
                    <button type="button" className="btn btn-primary arrow" disabled={!a.style && !a.model?.trim()} onClick={() => go(step + 1)}>Дальше</button>
                  </div>
                </>
              )}
              {cur.id === "budget" && options("budget", [...BUDGETS[k], "Пока не знаю"])}
              {cur.id === "year" && options("year", YEARS)}
              {cur.id === "when" && options("when", WHEN)}
              {cur.id === "city" && (
                <>
                  {options("city", CITIES)}
                  <div className="qz-row">
                    <input className="qz-input" type="text" maxLength={40} placeholder="Или напишите свой город" aria-label="Город"
                      value={a.city && !CITIES.includes(a.city) ? a.city : ""} onChange={(e) => setA((p) => ({ ...p, city: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter" && a.city?.trim()) go(step + 1); }} />
                    <button type="button" className="btn btn-primary arrow" disabled={!a.city?.trim()} onClick={() => go(step + 1)}>Готово</button>
                  </div>
                </>
              )}
            </div>
          )}

          {done && (
            <div className="qz-done">
              <div className="qz-msg">
                <p className="qz-msg-h">Ваша заявка</p>
                <pre>{msg}</pre>
                <button type="button" className="qz-edit" onClick={() => go(0)}>Изменить ответы</button>
              </div>
              <div className="qz-send">
                <a className="cta-tg" href={tgText(msg)} target="_blank" rel="noopener" onClick={() => goal("quiz_send")}>
                  <span className="cta-ic"><TgIcon /></span>
                  <span className="cta-t"><b>Отправить в Telegram</b><em>Откроется чат с менеджером, заявка уже написана</em></span>
                  <span className="cta-ar" aria-hidden="true">→</span>
                </a>
                <button type="button" className="btn btn-ghost qz-copy" onClick={copy}>{copied ? "Скопировано ✓" : "Скопировать заявку"}</button>
                <a className="cta-phone" href={PHONE_HREF}><span>или позвоните</span><b>{PHONE}</b></a>
                <p className="cta-note">Сайт ничего не сохраняет: заявка уходит только туда, куда вы её отправите.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
