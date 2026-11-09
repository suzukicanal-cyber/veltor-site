import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import LotView from "@/components/catalog/LotView";
import { LOTS, REDIRECTS, hdSrc, lotBySlug, lotHref } from "@/lib/lots";
import { dateRu, kmLabel, money } from "@/lib/format";
import { SITE_URL, asset } from "@/lib/site";


export const dynamicParams = false;
export function generateStaticParams() {
  return [...LOTS.map((l) => ({ slug: l.slug })), ...Object.keys(REDIRECTS).map((slug) => ({ slug }))];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const l = lotBySlug(slug);
  if (!l) return REDIRECTS[slug] ? { title: "Объявление обновлено", robots: { index: false, follow: true }, alternates: { canonical: `/catalog/${REDIRECTS[slug]}/` } } : {};
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

export default async function LotPage({ params }: Props) {
  const slug = (await params).slug;
  const l = lotBySlug(slug);
  if (!l && REDIRECTS[slug]) {
    // the same vehicle was posted again: the old address leads to the newest post
    const to = `/catalog/${REDIRECTS[slug]}/`;
    return (
      <section className="catalog-page wrap" id="top">
        <meta httpEquiv="refresh" content={`0;url=${to}`} />
        <div className="inner lp-404">
          <p className="eyebrow">Объявление обновлено</p>
          <h1 className="cat-h1">Этот вариант опубликован заново</h1>
          <p className="lead">Мы обновили объявление: актуальная цена и фото — на новой странице.</p>
          <div className="ctas"><Link className="btn btn-primary" href={to}>Открыть актуальное объявление</Link></div>
        </div>
      </section>
    );
  }
  if (!l) notFound();
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
      image: l.photos.slice(0, 4).map((p) => (/^https?:/.test(p) ? p : `${SITE_URL}${asset(l.hd ? hdSrc(p) : p)}`)),
      description: l.features.join(", "),
      url,
    },
  ];

  return (
    <>
      <JsonLd data={ld} />
      <LotView l={l} />
    </>
  );
}
