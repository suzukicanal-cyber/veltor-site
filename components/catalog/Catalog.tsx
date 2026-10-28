"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LOTS, Lot, LotType, yawFor } from "@/lib/lots";
import { plural } from "@/lib/format";
import LotCard from "./LotCard";

type T = "all" | LotType;
const PRICES = [
  { v: "0-1000000", t: "до 1 млн ₽" }, { v: "1000000-1500000", t: "1–1,5 млн ₽" }, { v: "1500000-2000000", t: "1,5–2 млн ₽" },
  { v: "2000000-3000000", t: "2–3 млн ₽" }, { v: "3000000-5000000", t: "3–5 млн ₽" }, { v: "5000000-", t: "от 5 млн ₽" },
];
/** Mileage steps: "N" = up to N km, ">N" = over N km. Motorcycles get fine steps, cars — wider ones. */
const kmSteps = (list: number[], over: number) => [
  { v: "0", t: "Только новые" },
  ...list.map((k) => ({ v: String(k), t: `до ${k.toLocaleString("ru-RU")} км` })),
  { v: ">" + over, t: `свыше ${over.toLocaleString("ru-RU")} км` },
];
const KMS_MOTO = kmSteps([1000, 2000, 3000, 5000, 10000, 15000, 20000, 25000, 30000], 30000);
const KMS_CAR = kmSteps([10000, 20000, 30000, 50000, 70000, 100000], 100000);
const en = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

/** Catalog with filters. Brands, models and years are collected from the lots, so they grow with the Telegram channel. */
export default function Catalog() {
  const [type, setType] = useState<T>("all");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState(""); // "Brand|Model"
  const [yFrom, setYFrom] = useState("");
  const [yTo, setYTo] = useState("");
  const [price, setPrice] = useState("");
  const [km, setKm] = useState("");
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState(false);

  // /catalog/?type=moto|car — links from the home page
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const t = q.get("type"), b = q.get("brand"), m = q.get("model");
    if (t === "moto" || t === "car") setType(t);
    if (b) setBrand(b);
    if (b && m) setModel(b + "|" + m);
    if (b) setOpen(true);
  }, []);

  const ofType = useMemo(() => LOTS.filter((l) => type === "all" || l.type === type), [type]);
  const brands = useMemo(() => [...new Set(ofType.map((l) => l.brand))].sort(en), [ofType]);
  const models = useMemo(() => {
    const by: Record<string, Set<string>> = {};
    ofType.filter((l) => !brand || l.brand === brand).forEach((l) => { (by[l.brand] ||= new Set()).add(l.model); });
    return Object.keys(by).sort(en).map((b) => ({ b, ms: [...by[b]].sort((x, y) => x.localeCompare(y, "ru", { numeric: true })) }));
  }, [ofType, brand]);
  const years = useMemo(() => [...new Set(LOTS.map((l) => l.year))].sort((a, b) => b - a), []);

  // mileage steps differ for motorcycles and cars
  const kms = type === "car" ? KMS_CAR : KMS_MOTO;
  useEffect(() => { if (km && !kms.some((k) => k.v === km)) setKm(""); }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the picked brand / model only if it still exists for the chosen type
  useEffect(() => { if (brand && !brands.includes(brand)) setBrand(""); }, [brands, brand]);
  useEffect(() => { if (model && !models.some((g) => g.ms.some((m) => g.b + "|" + m === model))) setModel(""); }, [models, model]);

  const pass = (l: Lot) => {
    if (brand && l.brand !== brand) return false;
    if (model && l.brand + "|" + l.model !== model) return false;
    if (yFrom && l.year < +yFrom) return false;
    if (yTo && l.year > +yTo) return false;
    if (price) { const [lo, hi] = price.split("-"); if (l.price < +lo || (hi && l.price >= +hi)) return false; }
    if (km.startsWith(">")) { if ((l.km || 0) <= +km.slice(1)) return false; }
    else if (km !== "" && (l.km || 0) > +km) return false;
    return true;
  };
  const list = ofType.filter(pass).sort((a, b) =>
    sort === "new" ? b.date.localeCompare(a.date) || b.id - a.id : sort === "cheap" ? a.price - b.price : b.price - a.price);
  const active = [brand, model, yFrom || yTo, price, km].filter(Boolean).length;
  const reset = () => { setType("all"); setBrand(""); setModel(""); setYFrom(""); setYTo(""); setPrice(""); setKm(""); };
  const pickModel = (v: string) => { setModel(v); if (v && !brand) setBrand(v.split("|")[0]); };

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
        <label className="cat-f"><span>Марка</span>
          <select id="f-brand" value={brand} onChange={(e) => { setBrand(e.target.value); }}>
            <option value="">Все марки</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label className="cat-f"><span>Модель</span>
          <select id="f-model-c" value={model} onChange={(e) => pickModel(e.target.value)}>
            <option value="">Все модели</option>
            {brand
              ? models.flatMap((g) => g.ms.map((m) => <option key={g.b + m} value={g.b + "|" + m}>{m}</option>))
              : models.map((g) => <optgroup key={g.b} label={g.b}>{g.ms.map((m) => <option key={m} value={g.b + "|" + m}>{m}</option>)}</optgroup>)}
          </select>
        </label>
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
        <label className="cat-f"><span>Цена</span>
          <select id="f-price" value={price} onChange={(e) => setPrice(e.target.value)}>
            <option value="">Любая</option>{PRICES.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
          </select>
        </label>
        <label className="cat-f"><span>Пробег</span>
          <select id="f-km" value={km} onChange={(e) => setKm(e.target.value)}>
            <option value="">Любой</option>{kms.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
          </select>
        </label>
        <button type="button" className="cat-reset" id="f-reset" onClick={reset}>Сбросить</button>
      </div>
      <p className="sr" aria-live="polite">Найдено {list.length} {plural(list.length, ["вариант", "варианта", "вариантов"])}</p>
      <div className="cat-empty" id="cat-empty" hidden={list.length > 0}>
        <b>По этим параметрам ничего нет</b>Измените фильтры или оставьте заявку, и мы найдём такой вариант в Корее.
      </div>
      <div className="lots" id="cat-grid">
        {list.map((l, i) => <LotCard key={l.id} lot={l} yaw={yawFor(l.id)} eager={i < 4} />)}
      </div>
      <div className="cat-cta">
        <div><h3>Не нашли нужную модель?</h3><p>Подберём технику под ваш запрос: модель, год, пробег, цвет и бюджет.</p></div>
        <Link className="btn btn-primary arrow" data-magnetic="" href="/#contact">Оставить заявку</Link>
      </div>
    </>
  );
}
