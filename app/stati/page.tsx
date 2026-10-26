import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES, articleHref, ruDate } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Статьи: мотоциклы и авто из Южной Кореи",
  description: "Разборы и советы VELTOR: как выбрать и проверить мотоцикл в Корее, сколько идёт доставка, какие документы нужны и на что смотреть перед покупкой.",
  alternates: { canonical: "/stati/" },
};

export default function ArticlesPage() {
  return (
    <section className="catalog-page seo-page wrap" id="top">
      <div className="inner">
        <nav className="lp-crumbs" aria-label="Навигация">
          <span className="seo-crumb"><Link href="/">Главная</Link></span>
          <span className="seo-crumb"><span aria-hidden="true">/</span><span>Статьи</span></span>
        </nav>
        <div className="cat-head">
          <div><p className="eyebrow">Статьи</p><h1 className="cat-h1 seo-h1">Мото и авто из Кореи: разборы и советы</h1></div>
          <p className="lead">Как выбрать и проверить технику в Корее, сколько идёт доставка, что с документами — пишем о том, что спрашивают перед покупкой.</p>
        </div>
        <ul className="art-list">
          {ARTICLES.map((a) => (
            <li key={a.slug}><Link href={articleHref(a)}><time dateTime={a.date}>{ruDate(a.date)}</time><b>{a.h1}</b><span>{a.lead.replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g, "$1")}</span></Link></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
