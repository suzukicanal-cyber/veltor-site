"use client";
import { useState } from "react";
import { Lot, lotHref } from "@/lib/lot-base";
import { money } from "@/lib/format";
import { SITE_URL, tgText } from "@/lib/site";

const TERMS = [12, 24, 36, 48, 60, 84];
/** Example rate only — the bank sets the real one. */
const RATE = 20;

/** Credit calculator: down payment, term and rate → monthly payment. Nothing is sent anywhere; the button opens Telegram with the numbers. */
export default function CreditCalc({ l }: { l: Lot }) {
  const [down, setDown] = useState(20);
  const [term, setTerm] = useState(36);
  const [rate, setRate] = useState(RATE);
  const first = Math.round(l.price * down / 100 / 1000) * 1000;
  const loan = Math.max(0, l.price - first);
  const r = rate / 1200;
  const pay = loan === 0 ? 0 : r === 0 ? loan / term : loan * r / (1 - Math.pow(1 + r, -term));
  const over = Math.max(0, pay * term - loan);
  const msg = `Здравствуйте! Хочу обсудить кредит на ${l.name} ${l.year} (${money(l.price)}): первый взнос ${money(first)}, срок ${term} мес.\n${SITE_URL}${lotHref(l)}`;
  return (
    <div className="cc">
      <div className="cc-head"><h3>Кредитный калькулятор</h3><span className="cw-mono">Ориентировочный расчёт</span></div>
      <div className="cc-grid">
        <div className="cc-in">
          <label className="cc-f"><span><em>Первый взнос</em><b>{money(first)} · {down}%</b></span>
            <input type="range" min={0} max={90} step={5} value={down} onChange={(e) => setDown(+e.target.value)} style={{ ["--p" as string]: `${down / 90 * 100}%` }} />
          </label>
          <div className="cc-f" role="group" aria-label="Срок кредита"><span><em>Срок</em><b>{term} мес.</b></span>
            <div className="cc-terms">{TERMS.map((t) => <button key={t} type="button" aria-pressed={t === term} onClick={() => setTerm(t)}>{t}</button>)}</div>
          </div>
          <label className="cc-f"><span><em>Ставка, % годовых</em><b>{rate}%</b></span>
            <input type="range" min={0} max={35} step={0.5} value={rate} onChange={(e) => setRate(+e.target.value)} style={{ ["--p" as string]: `${rate / 35 * 100}%` }} />
          </label>
        </div>
        <div className="cc-out">
          <span className="cw-mono">Ежемесячный платёж</span>
          <b className="cc-pay">{money(Math.round(pay))}</b>
          <dl>
            <div><dt>Сумма кредита</dt><dd>{money(loan)}</dd></div>
            <div><dt>Переплата</dt><dd>{money(Math.round(over))}</dd></div>
          </dl>
          <a className="btn btn-primary cc-go" href={tgText(msg)} target="_blank" rel="noopener">Обсудить кредит в Telegram</a>
        </div>
      </div>
      <p className="cc-note">Расчёт ориентировочный и не является предложением банка. Ставка {RATE}% — пример; точные условия подбираем среди 10+ банков-партнёров индивидуально.</p>
    </div>
  );
}
