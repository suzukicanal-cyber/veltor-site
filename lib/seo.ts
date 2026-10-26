// Landing pages for search queries: /moto/, /auto/, /moto/<brand>/, /moto/<brand>/<model>/ (and the same for /auto/).
// Everything is computed from the catalog, so new brands and models appear by themselves.
import { LOTS, Lot, LotType } from "./lots";
import { groups, money, plural } from "./format";

const SLUG: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
export const slugify = (s: string) => s.toLowerCase().split("").map((c) => SLUG[c] ?? c).join("").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** A brand page needs at least this many lots, a model page as well — thinner pages would only dilute the site. */
export const MIN_BRAND = 2;
export const MIN_MODEL = 2;

export const TYPE = {
  moto: { path: "moto", label: "Мотоциклы", one: "мотоцикл", gen: "мотоциклов", short: "Мото", forms: ["мотоцикл", "мотоцикла", "мотоциклов"] as [string, string, string] },
  car: { path: "auto", label: "Автомобили", one: "автомобиль", gen: "автомобилей", short: "Авто", forms: ["автомобиль", "автомобиля", "автомобилей"] as [string, string, string] },
} as const;
export const typeByPath = (p: string): LotType => (p === "auto" ? "car" : "moto");

export type ModelGroup = { model: string; slug: string; lots: Lot[] };
export type BrandGroup = { brand: string; slug: string; lots: Lot[]; models: ModelGroup[] };

const byNewest = (a: Lot, b: Lot) => b.date.localeCompare(a.date) || b.id - a.id;

export function brandGroups(type: LotType): BrandGroup[] {
  const map = new Map<string, Lot[]>();
  for (const l of LOTS) if (l.type === type) map.set(l.brand, [...(map.get(l.brand) || []), l]);
  return [...map.entries()]
    .filter(([, ls]) => ls.length >= MIN_BRAND)
    .map(([brand, ls]) => {
      const mm = new Map<string, Lot[]>();
      for (const l of ls) mm.set(l.model, [...(mm.get(l.model) || []), l]);
      const models = [...mm.entries()].filter(([, x]) => x.length >= MIN_MODEL)
        .map(([model, x]) => ({ model, slug: slugify(model), lots: x.sort(byNewest) }))
        .sort((a, b) => b.lots.length - a.lots.length || a.model.localeCompare(b.model));
      return { brand, slug: slugify(brand), lots: ls.sort(byNewest), models };
    })
    .sort((a, b) => b.lots.length - a.lots.length || a.brand.localeCompare(b.brand));
}

export const findBrand = (type: LotType, slug: string) => brandGroups(type).find((b) => b.slug === slug);
export const findModel = (type: LotType, brand: string, model: string) => findBrand(type, brand)?.models.find((m) => m.slug === model);

export const typeHref = (type: LotType) => `/${TYPE[type].path}/`;
export const brandHref = (type: LotType, brand: string) => `/${TYPE[type].path}/${slugify(brand)}/`;
export const modelHref = (type: LotType, brand: string, model: string) => `/${TYPE[type].path}/${slugify(brand)}/${slugify(model)}/`;

/** Link for a lot page: model page if it exists, otherwise the brand page, otherwise the type page. */
export function lotLanding(l: Lot) {
  const b = findBrand(l.type, slugify(l.brand));
  const m = b?.models.find((x) => x.model === l.model);
  if (m) return { href: modelHref(l.type, l.brand, l.model), label: `Все ${l.brand} ${l.model} из Кореи` };
  if (b) return { href: brandHref(l.type, l.brand), label: `Все ${TYPE[l.type].label.toLowerCase()} ${l.brand} из Кореи` };
  return { href: typeHref(l.type), label: `Все ${TYPE[l.type].label.toLowerCase()} из Кореи` };
}

export function stats(ls: Lot[]) {
  const prices = ls.map((l) => l.price).sort((a, b) => a - b);
  const years = ls.map((l) => l.year).sort((a, b) => a - b);
  const kms = ls.map((l) => l.km).filter((k): k is number => !!k).sort((a, b) => a - b);
  return {
    count: ls.length,
    min: prices[0], max: prices[prices.length - 1],
    yMin: years[0], yMax: years[years.length - 1],
    kmMin: kms[0] ?? null,
    fresh: ls.filter((l) => !l.km || l.km < 5000).length,
  };
}

export const priceRange = (s: ReturnType<typeof stats>) => (s.min === s.max ? money(s.min) : `от ${money(s.min)} до ${money(s.max)}`);
export const yearRange = (s: ReturnType<typeof stats>) => (s.yMin === s.yMax ? `${s.yMin}` : `${s.yMin}–${s.yMax}`);
export const countLabel = (n: number, type: LotType) => `${n} ${plural(n, TYPE[type].forms)}`;
export const kmLabelShort = (km: number) => `${groups(km)} км`;

/** Short neutral notes about brands (shown on brand pages). */
export const BRAND_NOTES: Record<string, string> = {
  BMW: "BMW Motorrad — самый частый запрос наших клиентов: спортивные S 1000 RR и M 1000 RR, туристические R 1250/R 1300 GS и RT, роадстеры S 1000 R. В Корее эти модели продаются официально, их часто обслуживают у дилера и бережно хранят.",
  "Harley-Davidson": "Harley-Davidson в Корее покупают как технику для выходных: у многих экземпляров небольшой пробег, оригинальный тюнинг и аккуратная история обслуживания. Привозим Sportster S, Fat Bob, Street Glide, Low Rider и другие модели.",
  Yamaha: "Yamaha — от спортивных YZF-R1 и YZF-R6 до MT-09 и туристических моделей. Корейский рынок даёт выбор свежих экземпляров с понятной историей.",
  Honda: "Honda — от Gold Wing для дальних поездок до спортивных CBR. В Корее Honda традиционно популярна, поэтому выбор хороший в любом бюджете.",
  Kawasaki: "Kawasaki — Ninja ZX-10R, Z H2, Ninja 1000SX и другие модели. Подбираем экземпляры без ДТП и с проверенным состоянием.",
  Ducati: "Ducati — XDiavel, Diavel, Multistrada, Monster и Panigale. Итальянскую технику особенно важно проверить до покупки, поэтому каждый вариант мы осматриваем на месте.",
  Suzuki: "Suzuki — GSX-R1000R, GSX-S1000GT, GSX-8R и другие модели с хорошим соотношением цены и характеристик.",
  KTM: "KTM — Duke, Adventure и Super Adventure для дороги и бездорожья.",
  "MV Agusta": "MV Agusta — редкие итальянские мотоциклы, которые в России сложно найти в хорошем состоянии.",
  "Mercedes-Benz": "Mercedes-Benz — один из самых популярных импортных брендов в Корее: GLB, GLE, E-класс и другие модели с полной историей обслуживания.",
  Hyundai: "Hyundai — корейский бренд, поэтому выбор на родном рынке максимальный, а комплектации часто богаче, чем в России.",
  Kia: "Kia — корейский бренд с огромным выбором на внутреннем рынке: от городских Ray до семейных кроссоверов.",
  Audi: "Audi — Q3, Q5, A6 и другие модели, которые в Корее продаются официально и обслуживаются у дилера.",
  MINI: "MINI — Cooper, Clubman и Countryman в хороших комплектациях и с небольшим пробегом.",
};
