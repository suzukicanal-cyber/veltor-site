import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import LotGallery from "@/components/catalog/LotGallery";
import LotCard from "@/components/catalog/LotCard";
import { BodyLine, LOTS, likeLink, lotBySlug, lotHref, similar, typeLabel, yawFor } from "@/lib/lots";
import { dateLong, dateRu, kmLabel, money } from "@/lib/format";
import { SITE_URL, asset } from "@/lib/site";
import { lotLanding } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return LOTS.map((l) => ({ slug: l.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = lotBySlug((await params).slug);
  if (!l) return {};
  const what = l.type === "moto" ? "Мотоцикл" : "Автомобиль";
  const title = `${l.name} ${l.year} из Южной Кореи — цена и характеристики`;
  const description = `${what} ${l.name}, ${l.year} год, пробег ${kmLabel(l.km)}${l.volume ? ", " + l.volume : ""}. Цена ${money(l.price)} ${l.priceLabel} на ${dateRu(l.date)}. Подбор, осмотр и доставка из Кореи — VELTOR.`;
  return {
    title,
    description,
    alternates: { canonical: lotHref(l) },
    openGraph: { type: "article", locale: "ru_RU", siteName: "VELTOR", url: lotHref(l), title, description, images: [{ url: asset(l.photos[0] || "feed/f0.jpg") }] },
  };
}

/** Groups the post text into sections: heading + list; warnings go separately. */
function sections(body: BodyLine[]) {
  const out: { h: string; items: string[] }[] = [];
  const warn: string[] = [];
  const about: string[] = [];
  for (const b of body) {
    if (b.k === "warn") warn.push(b.t);
    else if (b.k === "p") about.push(b.t);
    else if (b.k === "h") out.push({ h: b.t, items: [] });
    else { if (!out.length) out.push({ h: "Комплектация", items: [] }); out[out.length - 1].items.push(b.t); }
  }
  return { out: out.filter((s) => s.items.length), warn, about };
}

export default async function LotPage({ params }: Props) {
  const l = lotBySlug((await params).slug);
  if (!l) notFound();
  const { out, warn, about } = sections(l.body);
  const rows: [string, string][] = [
    ["Год", String(l.year)],
    ["Пробег", kmLabel(l.km)],
    ...(l.volume ? [["Объём двигателя", l.volume] as [string, string]] : []),
    ...(l.power ? [["Мощность", l.power] as [string, string]] : []),
    ...(l.drive ? [["Привод", l.drive] as [string, string]] : []),
    ...(l.gearbox ? [["Коробка", l.gearbox] as [string, string]] : []),
    ["Марка", l.brand],
    ["Модель", l.model],
  ];
  const url = `${SITE_URL}${lotHref(l)}`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Каталог", item: `${SITE_URL}/catalog/` },
        { "@type": "ListItem", position: 3, name: l.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${l.name} ${l.year}`,
      brand: { "@type": "Brand", name: l.brand },
      model: l.model,
      category: l.type === "moto" ? "Мотоциклы" : "Автомобили",
      image: l.photos.slice(0, 4).map((p) => (/^https?:/.test(p) ? p : `${SITE_URL}${asset(p)}`)),
      description: l.features.join(", "),
      url,
    },
  ];

  return (
    <section className="catalog-page lp wrap" id="top">
      <JsonLd data={ld} />
      <div className="inner">
        <nav className="lp-crumbs" aria-label="Навигация">
          <Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href="/catalog/">Каталог</Link><span aria-hidden="true">/</span><span>{l.name}</span>
        </nav>

        <div className="lp-top">
          <LotGallery photos={l.photos} name={l.name} shape={l.type} />
          <div className="lp-info">
            <span className="lp-kind">{typeLabel(l.type)} · {l.year}</span>
            <h1 className="lp-h1">{l.name}</h1>
            <Link className="link link-q lp-all" href={lotLanding(l).href}>{lotLanding(l).label} →</Link>
            <dl className="lp-specs">
              {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <div className="lp-price">
              <b>{money(l.price)}</b>
              <span>{l.priceLabel} · актуально на <em>{dateRu(l.date)}</em></span>
            </div>
            <div className="lp-cta">
              <a className="btn btn-primary" data-magnetic="" href={likeLink(l)} target="_blank" rel="noopener">Подобрать похожий</a>
              <a className="btn btn-ghost" href={l.post} target="_blank" rel="noopener">Пост в Telegram ↗</a>
            </div>
            <p className="lp-note">Вариант опубликован в нашем Telegram-канале {dateLong(l.date)}. Конкретный экземпляр мог уже уйти к новому владельцу — мы найдём аналогичный, осмотрим его в Корее и привезём под ключ. Цена меняется вместе с курсом валют.</p>
          </div>
        </div>

        {(out.length > 0 || warn.length > 0 || about.length > 0) && (
          <div className="lp-body">
            <h2 className="lp-h2">Описание и комплектация</h2>
            {warn.length > 0 && (
              <div className="lp-warn" role="note"><b>Важно знать</b>{warn.map((w) => <p key={w}>{w}</p>)}</div>
            )}
            {about.length > 0 && <div className="lp-about">{about.map((t) => <p key={t}>{t}</p>)}</div>}
            <div className="lp-secs">
              {out.map((s) => (
                <div className="lp-sec" key={s.h}>
                  <h3>{s.h}</h3>
                  <ul>{s.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="lp-more">
          <div className="cat-head lp-more-h">
            <div><h2>Похожие варианты</h2></div>
            <Link className="link arrow" href="/catalog/">Весь каталог</Link>
          </div>
          <div className="lots">
            {similar(l).map((x, i) => <LotCard key={x.id} lot={x} yaw={yawFor(i)} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
