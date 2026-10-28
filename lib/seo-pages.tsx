import type { Metadata } from "next";
import { LOTS, LotType } from "./lots";
import { asset } from "./site";
import {
  BRAND_NOTES, MODEL_NOTES, TYPE, factsText, brandGroups, brandHref, countLabel, findBrand, findModel, kmLabelShort, modelHref,
  priceRange, stats, typeHref, yearRange,
} from "./seo";
import type { Chip, Crumb, QA } from "@/components/seo/Landing";

const HOME: Crumb = { href: "/", label: "Главная" };
const CATALOG = "/catalog/";

/** Shared facts of the service, worded for a given subject ("мотоцикл BMW", "BMW S 1000 RR"). */
function serviceText(subject: string, type: LotType) {
  const t = TYPE[type];
  return [
    `Мы привозим ${subject} из Кореи под ключ. Подбираем варианты под ваш бюджет и параметры: год, пробег, цвет, комплектацию и тюнинг. Перед покупкой специалист осматривает ${t.one} на месте и снимает подробный фото- и видеоотчёт: состояние ${type === "moto" ? "мотора и пластика" : "кузова и салона"}, расходники, реальный пробег. Решение о покупке принимаете только вы.`,
    `После выкупа ${t.one} упаковывают в порту Инчхон и отправляют по маршруту Инчхон → Китай → Кашгар → Бишкек → Москва. В среднем доставка до Москвы занимает 45 дней с даты отплытия, рекорд — 25 дней. Каждый этап мы подтверждаем фото и видео, а после прибытия помогаем пройти лабораторию и оформить СБКТС и ЭПТС.`,
  ];
}

function faq(subject: string, type: LotType, s: ReturnType<typeof stats>): QA[] {
  return [
    { q: `Сколько стоит ${subject} из Кореи под ключ?`, a: `Сейчас в каталоге ${countLabel(s.count, type)} ${priceRange(s)} под ключ. Цена указана на дату публикации и меняется вместе с курсом валют; точный расчёт под ваш вариант сделаем в Telegram.` },
    { q: `Сколько идёт доставка из Кореи в Москву?`, a: `В среднем 45 дней с даты отплытия, рекорд — 25 дней. Маршрут: Инчхон → Китай → Кашгар → Бишкек → Москва, каждый этап сопровождаем фото- и видеоотчётами.` },
    { q: `Можно ли проверить ${TYPE[type].one} перед покупкой?`, a: `Да. Специалист осматривает технику на месте в Корее и снимает фото и видео: двигатель, ${type === "moto" ? "пластик" : "кузов"}, расходники и пробег. Осмотр стоит 12 500 ₽ — это стоимость найма специалиста, мы на нём не зарабатываем.` },
    { q: `Что, если понравившийся вариант уже продан?`, a: `В каталоге — примеры наших подборов из Telegram-канала. Конкретный экземпляр мог уйти к новому владельцу, но мы найдём аналогичный по году, пробегу и бюджету.` },
  ];
}

function meta(path: string, title: string, description: string, image?: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "ru_RU", siteName: "VELTOR", url: path, title, description, images: [{ url: asset(image || "feed/f0.jpg") }] },
  };
}

/* ---------- /moto/, /auto/ ---------- */

export function typeLanding(type: LotType) {
  const t = TYPE[type];
  const lots = LOTS.filter((l) => l.type === type);
  const s = stats(lots);
  const brands = brandGroups(type);
  const top = brands.slice(0, 4).map((b) => b.brand).join(", ");
  const h1 = `${t.label} из Южной Кореи под ключ`;
  return {
    meta: meta(typeHref(type), `${t.label} из Кореи под ключ — цены и каталог`, `${t.label} из Южной Кореи с доставкой в Москву: ${countLabel(s.count, type)} в каталоге ${priceRange(s)}. Подбор, живой осмотр, выкуп, доставка в среднем 45 дней, СБКТС и ЭПТС.`, lots[0]?.photos[0]),
    props: {
      crumbs: [HOME, { href: typeHref(type), label: `${t.label} из Кореи` }],
      eyebrow: `${t.short} · Южная Корея → Россия`,
      h1,
      text: serviceText(type === "moto" ? "мотоцикл" : "автомобиль", type),
      chipsTitle: "Марки",
      chips: brands.map((b): Chip => ({ href: brandHref(type, b.brand), label: b.brand, n: b.lots.length })),
      lots,
      moreHref: `${CATALOG}?type=${type}`,
      moreLabel: `Все ${countLabel(s.count, type)} в каталоге`,
      faq: faq(type === "moto" ? "мотоцикл" : "автомобиль", type, s),
      ctaTitle: `Ищете ${t.one} из Кореи?`,
    },
  };
}

/* ---------- /moto/<brand>/ ---------- */

export const brandParams = (type: LotType) => brandGroups(type).map((b) => ({ brand: b.slug }));

export function brandLanding(type: LotType, slug: string) {
  const t = TYPE[type];
  const b = findBrand(type, slug);
  if (!b) return null;
  const s = stats(b.lots);
  const subject = `${t.one} ${b.brand}`;
  const models = b.models.slice(0, 5).map((m) => m.model).join(", ");
  return {
    meta: meta(brandHref(type, b.brand), `${t.label} ${b.brand} из Кореи под ключ — цены`, `${t.label} ${b.brand} из Южной Кореи с доставкой в Москву: ${countLabel(s.count, type)} ${yearRange(s)} годов ${priceRange(s)}. Осмотр перед покупкой, доставка в среднем 45 дней.`, b.lots[0]?.photos[0]),
    props: {
      crumbs: [HOME, { href: typeHref(type), label: `${t.label} из Кореи` }, { href: brandHref(type, b.brand), label: b.brand }],
      eyebrow: `${b.brand} · Южная Корея → Россия`,
      h1: `${t.label} ${b.brand} из Кореи`,
      text: [...(BRAND_NOTES[b.brand] ? [BRAND_NOTES[b.brand]] : []), ...(factsText(b.brand, b.lots, type) ? [factsText(b.brand, b.lots, type)!] : []), ...serviceText(subject, type)],
      chipsTitle: b.models.length ? "Модели" : undefined,
      chips: b.models.map((m): Chip => ({ href: modelHref(type, b.brand, m.model), label: m.model, n: m.lots.length })),
      lots: b.lots,
      moreHref: `${CATALOG}?type=${type}&brand=${encodeURIComponent(b.brand)}`,
      moreLabel: `Все ${b.brand} в каталоге`,
      faq: faq(subject, type, s),
      ctaTitle: `Ищете ${b.brand} из Кореи?`,
    },
  };
}

/* ---------- /moto/<brand>/<model>/ ---------- */

export const modelParams = (type: LotType) => brandGroups(type).flatMap((b) => b.models.map((m) => ({ brand: b.slug, model: m.slug })));

export function modelLanding(type: LotType, brandSlug: string, modelSlug: string) {
  const t = TYPE[type];
  const b = findBrand(type, brandSlug);
  const m = findModel(type, brandSlug, modelSlug);
  if (!b || !m) return null;
  const s = stats(m.lots);
  const name = `${b.brand} ${m.model}`;
  const others = b.models.filter((x) => x.slug !== m.slug).slice(0, 8);
  const note = MODEL_NOTES[`${b.brand}|${m.model}`];
  const facts = factsText(name, m.lots, type);
  const extraFaq: QA[] = [
    ...(note ? [{ q: `На что вы смотрите при осмотре ${name}?`, a: note.check }] : []),
    { q: `Каких годов ${name} можно привезти из Кореи?`, a: `Мы уже подбирали ${name} ${[...new Set(m.lots.map((l) => l.year))].sort((a, z) => a - z).join(", ")} годов. Если нужного года нет среди примеров, найдём экземпляр под ваш бюджет и осмотрим его на месте.` },
  ];
  return {
    meta: meta(modelHref(type, b.brand, m.model), `${name} из Кореи под ключ — цена`, `${name} из Южной Кореи: ${countLabel(s.count, type)} ${yearRange(s)} годов ${priceRange(s)} под ключ. Живой осмотр перед покупкой, доставка в Москву в среднем 45 дней, СБКТС и ЭПТС.`, m.lots[0]?.photos[0]),
    props: {
      crumbs: [HOME, { href: typeHref(type), label: `${t.label} из Кореи` }, { href: brandHref(type, b.brand), label: b.brand }, { href: modelHref(type, b.brand, m.model), label: m.model }],
      eyebrow: `${t.short} · ${b.brand}`,
      h1: `${name} из Кореи`,
      text: [...(note ? [note.text] : []), ...(facts ? [facts] : []), ...serviceText(name, type)],
      chipsTitle: others.length ? `Другие модели ${b.brand}` : undefined,
      chips: others.map((x): Chip => ({ href: modelHref(type, b.brand, x.model), label: x.model, n: x.lots.length })),
      lots: m.lots,
      moreHref: `${CATALOG}?type=${type}&brand=${encodeURIComponent(b.brand)}&model=${encodeURIComponent(m.model)}`,
      moreLabel: `Все ${name} в каталоге`,
      faq: [...faq(name, type, s), ...extraFaq],
      ctaTitle: `Ищете ${name}?`,
    },
  };
}

/** For the sitemap and footer. */
export function landingPaths() {
  const out: { path: string; date: string }[] = [];
  for (const type of ["moto", "car"] as LotType[]) {
    const ls = LOTS.filter((l) => l.type === type);
    if (!ls.length) continue;
    out.push({ path: typeHref(type), date: ls[0].date });
    for (const b of brandGroups(type)) {
      out.push({ path: brandHref(type, b.brand), date: b.lots[0].date });
      for (const m of b.models) out.push({ path: modelHref(type, b.brand, m.model), date: m.lots[0].date });
    }
  }
  return out;
}
