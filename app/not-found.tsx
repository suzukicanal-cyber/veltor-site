import Link from "next/link";

export default function NotFound() {
  return (
    <section className="catalog-page wrap" id="top">
      <div className="inner lp-404">
        <p className="eyebrow">404</p>
        <h1 className="cat-h1">Такой страницы нет</h1>
        <p className="lead">Возможно, вариант уже ушёл к новому владельцу. Посмотрите каталог — или напишите нам, и мы найдём похожий в Корее.</p>
        <div className="ctas"><Link className="btn btn-primary" href="/catalog/">Открыть каталог</Link><Link className="btn btn-ghost" href="/#contact">Написать нам</Link></div>
      </div>
    </section>
  );
}
