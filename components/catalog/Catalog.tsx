"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lot, LotType, yawFor } from "@/lib/lot-base";
import type { Facts } from "@/lib/lot-facts";
import { plural } from "@/lib/format";
import LotCard from "./LotCard";
import { CC_STEPS, MOTO_CLASSES, motoSpec } from "@/lib/moto-specs";
import Combo, { Opt, norm } from "./Combo";

type T = "all" | LotType;
/** Price typed by hand: digits only, shown in groups of three ("1 500 000"). */
const digits = (s: string) => s.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
const groupsOf = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
/** Mileage steps: "N" = up to N km, ">N" = over N km. Motorcycles get fine steps, cars — wider ones. */
const kmSteps = (list: number[], over: number) => [
  { v: "0", t: "Только новые" },
  ...list.map((k) => ({ v: String(k), t: `до ${k.toLocaleString("ru-RU")} км` })),
  { v: ">" + over, t: `свыше ${over.toLocaleString("ru-RU")} км` },
];
const KMS_MOTO = kmSteps([1000, 2000, 3000, 5000, 10000, 15000, 20000, 25000, 30000], 30000);
const KMS_CAR = kmSteps([10000, 20000, 30000, 50000, 70000, 100000], 100000);
const en = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

export type Item = { l: Lot; f: Facts };
/** Cards rendered at first; more are added as the visitor scrolls (rendering all 400+ at once froze the page). */
const STEP = 24;

/** Catalog with filters. Brands, models and years are collected from the lots, so they grow with the Telegram channel.
 *  The lots arrive as props from the server page, so the browser never downloads the full lots.json. */
export default function Catalog({ items }: { items: Item[] }) {
  const LOTS = useMemo(() => items.map((x) => x.l), [items]);
  const factsOf = useMemo(() => new Map(items.map((x) => [x.l.id, x.f])), [items]);
  const [shown, setShown] = useState(STEP);
  const more = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<T>("all");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState(""); // typed or picked model name
  const [yFrom, setYFrom] = useState("");
  const [yTo, setYTo] = useState("");
  const [pFrom, setPFrom] = useState("");
  const [pTo, setPTo] = useState("");
  const [km, setKm] = useState("");
  const [cc, setCc] = useState("");
  const [cls, setCls] = useState("");
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState(false);

  // /catalog/?type=moto|car — links from the home page
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const t = q.get("type"), b = q.get("brand"), m = q.get("model");
    if (t === "moto" || t === "car") setType(t);
    if (b) setBrand(b);
    if (m) setModel(m);
    if (b) setOpen(true);
  }, []);

  const ofType = useMemo(() => LOTS.filter((l) => type === "all" || l.type === type), [LOTS, type]);
  const brandOk = (l: Lot) => !norm(brand) || norm(l.brand).includes(norm(brand));
  const brandOpts = useMemo<Opt[]>(() => [...new Set(ofType.map((l) => l.brand))].sort(en).map((b) => ({ value: b, label: b })), [ofType]);
  const modelOpts = useMemo<Opt[]>(() => {
    const by: Record<string, Set<string>> = {};
    ofType.filter(brandOk).forEach((l) => { (by[l.brand] ||= new Set()).add(l.model); });
    const bs = Object.keys(by).sort(en), one = bs.length === 1;
    return bs.flatMap((b) => [...by[b]].sort((x, y) => x.localeCompare(y, "ru", { numeric: true }))
      .map((m) => ({ value: b + "|" + m, label: m, group: one ? undefined : b, brand: b })));
  }, [ofType, brand]); // eslint-disable-line react-hooks/exhaustive-deps
  const years = useMemo(() => [...new Set(LOTS.map((l) => l.year))].sort((a, b) => b - a), [LOTS]);

  // mileage steps differ for motorcycles and cars
  const kms = type === "car" ? KMS_CAR : KMS_MOTO;
  useEffect(() => { if (km && !kms.some((k) => k.v === km)) setKm(""); if (type === "car") { setCc(""); setCls(""); } }, [type]); // eslint-disable-line react-hooks/exhaustive-deps


  const pass = (l: Lot) => {
    if (!brandOk(l)) return false;
    const nm = norm(model);
    if (nm && !norm(l.model).includes(nm) && !norm(l.name).includes(nm)) return false;
    if (yFrom && l.year < +yFrom) return false;
    if (yTo && l.year > +yTo) return false;
    if (pFrom && l.price < +pFrom) return false;
    if (pTo && l.price > +pTo) return false;
    if ((cc || cls) && l.type !== "moto") return false;
    if (cc || cls) {
      const sp = motoSpec(l);
      if (cls && sp.cls !== cls) return false;
      if (cc) { const [lo, hi] = cc.split("-"); if (!sp.cc || sp.cc < +lo || (hi && sp.cc > +hi)) return false; }
    }
    if (km.startsWith(">")) { if ((l.km || 0) <= +km.slice(1)) return false; }
    else if (km !== "" && (l.km || 0) > +km) return false;
    return true;
  };
  const list = ofType.filter(pass).sort((a, b) =>
    sort === "new" ? b.date.localeCompare(a.date) || b.id - a.id : sort === "cheap" ? a.price - b.price : b.price - a.price);
  const active = [brand, model, yFrom || yTo, pFrom || pTo, km, cc, cls].filter(Boolean).length;
  const clsCount = useMemo(() => { const c: Record<string, number> = {}; for (const l of LOTS) { const k = motoSpec(l).cls; if (k) c[k] = (c[k] || 0) + 1; } return c; }, [LOTS]);
  // a new filter or sort starts from the top of the list again
  const key = [type, brand, model, yFrom, yTo, pFrom, pTo, km, cc, cls, sort].join("|");
  useEffect(() => { setShown(STEP); }, [key]);
  // add the next cards shortly before the visitor reaches the end
  useEffect(() => {
    const el = more.current;
    if (!el || shown >= list.length) return;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) setShown((n) => n + STEP); }, { rootMargin: "1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, list.length]);
  const reset = () => { setType("all"); setBrand(""); setModel(""); setYFrom(""); setYTo(""); setPFrom(""); setPTo(""); setKm(""); setCc(""); setCls(""); };

  return (
    <>
      <div className="cat-bar">
        <div className="seg" role="group" aria-label="Тип техники">
          {(["all", "moto", "car"] as T[]).map((t) => (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}>{t === "all" ? "Все" : t === "moto" ? "Мото" : "Авто"}</button>
          ))}
        </div>
        <div className="cat-tools">
          <label className="cat-sort" htmlFor="cat-sort"><span>Сортировка</span>
            <select id="cat-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Сначала новые</option><option value="cheap">Сначала дешевле</option><option value="exp">Сначала дороже</option>
            </select>
          </label>
          <button type="button" className="cat-ftog" id="cat-ftog" aria-expanded={open} aria-controls="cat-filters" onClick={() => setOpen(!open)}>Фильтры <b id="cat-fcount">{active || ""}</b></button>
        </div>
      </div>
      <div className={"cat-filters" + (open ? " open" : "")} id="cat-filters">
        <Combo id="f-brand" label="Марка" placeholder="Все марки" value={brand} options={brandOpts} onChange={setBrand} />
        <Combo id="f-model-c" label="Модель" placeholder="Все модели" value={model} options={modelOpts} onChange={setModel}
          onPick={(o) => { if (o.brand && !brandOpts.some((b) => b.label === brand)) setBrand(o.brand); }} />
        <div className="cat-f" role="group" aria-label="Год выпуска"><span>Год выпуска</span>
          <div className="cat-range">
            <select id="f-year-from" aria-label="Год выпуска от" value={yFrom} onChange={(e) => { setYFrom(e.target.value); if (yTo && e.target.value && +e.target.value > +yTo) setYTo(""); }}>
              <option value="">от</option>{[...years].reverse().map((y) => <option key={y} value={y}>от {y}</option>)}
            </select>
            <select id="f-year-to" aria-label="Год выпуска до" value={yTo} onChange={(e) => setYTo(e.target.value)}>
              <option value="">до</option>{years.filter((y) => !yFrom || y >= +yFrom).map((y) => <option key={y} value={y}>до {y}</option>)}
            </select>
          </div>
        </div>
        <div className="cat-f" role="group" aria-label="Цена, ₽"><span>Цена, ₽</span>
          <div className="cat-range">
            <input id="f-price-from" className="cat-num" type="text" inputMode="numeric" autoComplete="off" aria-label="Цена от, рублей" placeholder="от"
              value={groupsOf(pFrom)} onChange={(e) => setPFrom(digits(e.target.value))} />
            <input id="f-price-to" className="cat-num" type="text" inputMode="numeric" autoComplete="off" aria-label="Цена до, рублей" placeholder="до"
              value={groupsOf(pTo)} onChange={(e) => setPTo(digits(e.target.value))} />
          </div>
        </div>
        <label className="cat-f"><span>Пробег</span>
          <select id="f-km" value={km} onChange={(e) => setKm(e.target.value)}>
            <option value="">Любой</option>{kms.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
          </select>
        </label>
        {type !== "car" && (
          <>
            <label className="cat-f"><span>Тип мотоцикла</span>
              <select id="f-class" value={cls} onChange={(e) => setCls(e.target.value)}>
                <option value="">Любой</option>{MOTO_CLASSES.filter((c) => clsCount[c]).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="cat-f"><span>Объём двигателя</span>
              <select id="f-cc" value={cc} onChange={(e) => setCc(e.target.value)}>
                <option value="">Любой</option>{CC_STEPS.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
              </select>
            </label>
          </>
        )}
        <button type="button" className="cat-reset" id="f-reset" onClick={reset}>Сбросить</button>
      </div>
      <p className="sr" aria-live="polite">Найдено {list.length} {plural(list.length, ["вариант", "варианта", "вариантов"])}</p>
      <div className="cat-empty" id="cat-empty" hidden={list.length > 0}>
        <b>По этим параметрам ничего нет</b>Измените фильтры или оставьте заявку, и мы найдём такой вариант в Корее.
      </div>
      <div className="lots" id="cat-grid">
        {list.slice(0, shown).map((l, i) => <LotCard key={l.id} lot={l} f={factsOf.get(l.id)!} yaw={yawFor(l.id)} eager={i < 4} />)}
      </div>
      {shown < list.length && (
        <div className="cat-more" ref={more}>
          <button type="button" className="btn btn-ghost" onClick={() => setShown((n) => n + STEP)}>Показать ещё · {list.length - shown}</button>
        </div>
      )}
      <div className="cat-cta">
        <div><h3>Не нашли нужную модель?</h3><p>Подберём технику под ваш запрос: модель, год, пробег, цвет и бюджет.</p></div>
        <Link className="btn btn-primary arrow" data-magnetic="" href="/#contact">Оставить заявку</Link>
      </div>
    </>
  );
}
