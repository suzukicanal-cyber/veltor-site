import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import LotCard from "@/components/catalog/LotCard";
import { Lot, lotHref, yawFor } from "@/lib/lots";
import { SITE_URL, TG_DEFAULT } from "@/lib/site";

export type Crumb = { href: string; label: string };
export type Chip = { href: string; label: string; n: number };
export type QA = { q: string; a: string };

type Props = {
  crumbs: Crumb[];
  eyebrow: string;
  h1: string;
  lead?: string;
  text: string[];
  chipsTitle?: string;
  chips?: Chip[];
  lots: Lot[];
  show?: number;
  moreHref: string;
  moreLabel: string;
  faq: QA[];
  ctaTitle: string;
};

/** Search landing: heading and text under the query, links deeper, real lots from the catalog, FAQ. */
export default function Landing({ crumbs, eyebrow, h1, lead, text, chipsTitle, chips, lots, show = 24, moreHref, moreLabel, faq, ctaTitle }: Props) {
  const here = crumbs[crumbs.length - 1];
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${SITE_URL}${c.href}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h1,
      url: `${SITE_URL}${here.href}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: lots.length,
        itemListElement: lots.slice(0, show).map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${lotHref(l)}`, name: l.name })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
    },
  ];

  return (
    <section className="catalog-page seo-page wrap" id="top">
      <JsonLd data={ld} />
      <div className="inner">
        <nav className="lp-crumbs" aria-label="Навигация">
          {crumbs.map((c, i) => (
            <span key={c.href} className="seo-crumb">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>

        <div className="cat-head">
          <div><p className="eyebrow">{eyebrow}</p><h1 className="cat-h1 seo-h1">{h1}</h1></div>
          {lead && <p className="lead">{lead}</p>}
        </div>

        {chips && chips.length > 0 && (
          <div className="seo-chips-w">
            {chipsTitle && <p className="eyebrow">{chipsTitle}</p>}
            <ul className="seo-chips">
              {chips.map((c) => <li key={c.href}><Link href={c.href}>{c.label}<em>{c.n}</em></Link></li>)}
            </ul>
          </div>
        )}

        <div className="lots seo-lots">
          {lots.slice(0, show).map((l, i) => <LotCard key={l.id} lot={l} yaw={yawFor(i)} eager={i < 4} />)}
        </div>
        {lots.length > show && (
          <div className="seo-more"><Link className="btn btn-ghost arrow" href={moreHref}>{moreLabel}</Link></div>
        )}

        <div className="seo-text">
          {text.map((t, i) => <p key={i}>{t}</p>)}
        </div>

        <div className="seo-faq">
          <h2 className="lp-h2">Вопросы и ответы</h2>
          <div className="faq">
            {faq.map((f, i) => (
              <details className="faq-i" key={f.q}>
                <summary><span className="faq-n">{String(i + 1).padStart(2, "0")}</span><h3 className="faq-q">{f.q}</h3><i className="faq-x" aria-hidden="true"></i></summary>
                <div className="faq-a"><p>{f.a}</p></div>
              </details>
            ))}
          </div>
        </div>

        <div className="cat-cta">
          <div><h3>{ctaTitle}</h3><p>Подберём вариант под ваш бюджет, проверим его на месте в Корее и привезём под ключ.</p></div>
          <a className="btn btn-primary arrow" data-magnetic="" href={TG_DEFAULT} target="_blank" rel="noopener">Написать в Telegram</a>
        </div>
      </div>
    </section>
  );
}
