import type { Metadata } from "next";
import Link from "next/link";
import Catalog from "@/components/catalog/Catalog";
import JsonLd from "@/components/JsonLd";
import { LOTS, lotHref } from "@/lib/lots";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Каталог мотоциклов и автомобилей из Южной Кореи",
  description: `Подборы VELTOR из Telegram-канала: ${LOTS.length} вариантов мотоциклов и автомобилей из Южной Кореи с ценой под ключ, пробегом и фото. Фильтры по марке, модели, году и цене.`,
  alternates: { canonical: "/catalog/" },
  openGraph: {
    type: "website", locale: "ru_RU", siteName: "VELTOR", url: "/catalog/",
    title: "Каталог мото и авто из Южной Кореи — VELTOR",
    description: "Мотоциклы и автомобили из Южной Кореи: примеры подбора, цены на дату публикации, характеристики и фото.",
    images: [{ url: "/feed/f0.jpg", width: 560, height: 420 }],
  },
};

const LIST_LD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: LOTS.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${lotHref(l)}`, name: l.name })),
};

export default function CatalogPage() {
  return (
    <section className="catalog-page wrap" id="top" aria-label="Каталог">
      <JsonLd data={LIST_LD} />
      <div className="inner">
        <Link className="cat-back" href="/">← На главную</Link>
        <div className="cat-head">
          <div><h1 className="cat-h1">Мотоциклы и автомобили из Кореи</h1></div>
          <p className="lead">Это варианты, которые мы подбирали и публиковали в Telegram-канале. Конкретный экземпляр мог уже уйти к новому владельцу, но мы найдём аналогичный. Цены указаны на дату публикации и меняются вместе с курсом валют.</p>
        </div>
        <Catalog />
      </div>
    </section>
  );
}
