import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Quiz from "@/components/Quiz";
import Rich from "@/components/articles/Rich";
import { ARTICLES, articleHref, findArticle, readMinutes, ruDate } from "@/lib/articles";
import { SITE_URL, asset } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.map((a) => ({ slug: a.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = findArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: articleHref(a) },
    openGraph: {
      type: "article", locale: "ru_RU", siteName: "VELTOR", url: articleHref(a), title: a.title, description: a.description,
      publishedTime: a.date, modifiedTime: a.updated || a.date, images: [{ url: asset("feed/f0.jpg"), width: 560, height: 420 }],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const a = findArticle((await params).slug);
  if (!a) notFound();
  const url = `${SITE_URL}${articleHref(a)}`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.h1,
      description: a.description,
      datePublished: a.date,
      dateModified: a.updated || a.date,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "VELTOR", url: SITE_URL },
      publisher: { "@type": "Organization", name: "VELTOR", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Статьи", item: `${SITE_URL}/stati/` },
        { "@type": "ListItem", position: 3, name: a.h1, item: url },
      ],
    },
    ...(a.faq.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: a.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
        }]
      : []),
  ];
  const more = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);

  return (
    <>
      <article className="catalog-page seo-page wrap" id="top">
        <JsonLd data={ld} />
        <div className="inner">
          <nav className="lp-crumbs" aria-label="Навигация">
            <span className="seo-crumb"><Link href="/">Главная</Link></span>
            <span className="seo-crumb"><span aria-hidden="true">/</span><Link href="/stati/">Статьи</Link></span>
            <span className="seo-crumb"><span aria-hidden="true">/</span><span>{a.h1}</span></span>
          </nav>

          <header className="art-head">
            <p className="eyebrow"><time dateTime={a.date}>{ruDate(a.date)}</time> · {readMinutes(a)} мин чтения</p>
            <h1 className="cat-h1 seo-h1">{a.h1}</h1>
            <p className="lead art-lead"><Rich text={a.lead} /></p>
          </header>

          <div className="art-body">
            {a.blocks.map((b, i) => {
              if ("h2" in b) return <h2 key={i} className="lp-h2">{b.h2}</h2>;
              if ("p" in b) return <p key={i}><Rich text={b.p} /></p>;
              if ("list" in b) return <ul key={i}>{b.list.map((t, j) => <li key={j}><Rich text={t} /></li>)}</ul>;
              if ("ol" in b) return <ol key={i}>{b.ol.map((t, j) => <li key={j}><Rich text={t} /></li>)}</ol>;
              return <p key={i} className="art-note"><Rich text={b.note} /></p>;
            })}
          </div>

          {a.faq.length > 0 && (
            <div className="seo-faq">
              <h2 className="lp-h2">Вопросы и ответы</h2>
              <div className="faq">
                {a.faq.map((f, i) => (
                  <details className="faq-i" key={f.q}>
                    <summary><span className="faq-n">{String(i + 1).padStart(2, "0")}</span><h3 className="faq-q">{f.q}</h3><i className="faq-x" aria-hidden="true"></i></summary>
                    <div className="faq-a"><p><Rich text={f.a} /></p></div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {a.sources && a.sources.length > 0 && (
            <div className="art-src">
              <p className="eyebrow">Источники</p>
              <ol>{a.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener nofollow">{s.title}</a></li>)}</ol>
            </div>
          )}
        </div>
      </article>

      <Quiz kind="moto" />

      {more.length > 0 && (
        <section className="wrap art-more">
          <div className="inner">
            <p className="eyebrow">Ещё статьи</p>
            <ul className="art-list">
              {more.map((x) => (
                <li key={x.slug}><Link href={articleHref(x)}><time dateTime={x.date}>{ruDate(x.date)}</time><b>{x.h1}</b><span>{x.lead.replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g, "$1")}</span></Link></li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
