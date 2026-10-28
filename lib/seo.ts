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

/** Notes about the most requested models: what the model is and what we check before buying (model pages). Key: "Brand|Model". */
export const MODEL_NOTES: Record<string, { text: string; check: string }> = {
  "BMW|S 1000 RR": {
    text: "BMW S 1000 RR — супербайк с рядной «четвёркой» 999 см³ и самый частый запрос наших клиентов. В Корее его покупают и для дороги, и для трека, поэтому на рынке много экземпляров с пакетами M Package и Race Package, коваными дисками и фирменным тюнингом.",
    check: "Следы трековой езды и падений: слайдеры, торцы рычагов и подножек, состояние пластика и рамы. Сверяем пробег по сервисной истории у дилера BMW, проверяем ошибки на диагностике и износ цепи, звёзд и шин.",
  },
  "BMW|S 1000 R": {
    text: "BMW S 1000 R — нейкед на базе S 1000 RR с тем же мотором 999 см³ и более удобной посадкой для города и трассы. В Корее его часто берут как основной мотоцикл на сезон, поэтому хватает свежих экземпляров с небольшим пробегом.",
    check: "Состояние мотора и электроники на диагностике, следы падений на баке, руле и маятнике, износ шин и тормозов. Отдельно смотрим установленный тюнинг: выхлоп, рычаги, ветровое стекло.",
  },
  "BMW|R 1300 GS": {
    text: "BMW R 1300 GS — турэндуро нового поколения с оппозитным мотором 1300 см³, выпускается с 2024 модельного года. Корейские экземпляры обычно свежие, обслужены у дилера и часто идут с кофрами, защитой и туристическими пакетами.",
    check: "Комплектацию и пакеты опций, работу адаптивной подвески и электроники, следы езды по бездорожью: защиту картера, дуги, низ рамы. Проверяем, что кофры и аксессуары оригинальные и входят в цену.",
  },
  "BMW|R 1300 GS Adventure": {
    text: "BMW R 1300 GS Adventure — версия GS для дальних поездок с увеличенным баком и усиленной защитой. В Корее её покупают под путешествия, поэтому многие экземпляры уже доукомплектованы кофрами, фарами и защитными дугами.",
    check: "Следы бездорожья и падений на дугах и защите, состояние подвески, комплектность кофров и креплений, ошибки электроники на диагностике.",
  },
  "BMW|R 1250 GS Adventure": {
    text: "BMW R 1250 GS Adventure — проверенный турэндуро с мотором ShiftCam 1254 см³ и большим баком. Предыдущее поколение GS дешевле нового R 1300 GS и остаётся одним из самых популярных мотоциклов для путешествий.",
    check: "Сервисную историю и пробег, состояние кардана и подвески, следы бездорожья на защите, комплектность кофров и опций.",
  },
  "BMW|R 1250 RT": {
    text: "BMW R 1250 RT — туристический мотоцикл с обтекателем, мотором ShiftCam 1254 см³ и богатой комплектацией для дальних поездок вдвоём. На корейском рынке у RT часто небольшой пробег для своего класса.",
    check: "Работу электроники, подогревов и аудиосистемы, состояние кофров и обтекателя, сервисную историю и состояние кардана.",
  },
  "BMW|M 1000 RR": {
    text: "BMW M 1000 RR — самая мощная серийная версия RR от подразделения BMW M с карбоновыми аэродинамическими элементами. В Корее такие мотоциклы редко ездят много и обычно хорошо обслужены.",
    check: "Целостность карбоновых деталей и винглетов, следы трековой езды, сервисную историю, состояние шин и тормозов. Сверяем комплектацию M Competition и установленный тюнинг.",
  },
  "BMW|M 1000 R": {
    text: "BMW M 1000 R — мощный гипернейкед подразделения BMW M на базе S 1000 R. В Корее его покупают как эмоциональный мотоцикл для выходных, поэтому пробеги обычно небольшие.",
    check: "Следы падений, состояние карбоновых деталей, электронику и ошибки на диагностике, износ шин и тормозов.",
  },
  "Harley-Davidson|Sportster S": {
    text: "Harley-Davidson Sportster S — современный Sportster с жидкостным мотором Revolution Max 1250T, выпускается с 2021 года. В Корее его берут как мотоцикл для города и выходных, поэтому много экземпляров с малым пробегом и оригинальным тюнингом.",
    check: "Состояние мотора и электроники, оригинальность выхлопа и тюнинга, следы падений на баке и подножках, износ задней шины.",
  },
  "Harley-Davidson|Fat Bob 114": {
    text: "Harley-Davidson Fat Bob 114 — агрессивный Softail с мотором Milwaukee-Eight 114. Корейские экземпляры часто уже с тюнингом выхлопа, руля и сидений.",
    check: "Работу мотора и коробки, оригинальность и состав тюнинга, состояние ремня и задней шины, следы падений.",
  },
  "Harley-Davidson|Street Glide Special 114": {
    text: "Harley-Davidson Street Glide Special 114 — туринг-багер с обтекателем «батвинг», мультимедиа и мотором Milwaukee-Eight 114. Это один из главных мотоциклов Harley для дальних поездок.",
    check: "Работу мультимедиа и электроники, состояние кофров и обтекателя, сервисную историю, ремень и тормоза.",
  },
  "Yamaha|YZF-R1": {
    text: "Yamaha YZF-R1 — супербайк с рядной «четвёркой» Crossplane 998 см³. В Корее R1 часто дорабатывают выхлопом и подвеской, поэтому важно понимать, что именно установлено и как мотоцикл использовался.",
    check: "Следы трековой езды и падений, состояние пластика и рамы, установленный тюнинг и наличие стоковых деталей, сервисную историю и пробег.",
  },
  "Honda|Gold Wing": {
    text: "Honda Gold Wing — флагманский туристический мотоцикл с оппозитной «шестёркой» 1833 см³. В Корее Gold Wing популярен у опытных мотоциклистов, экземпляры обычно ухоженные.",
    check: "Работу коробки DCT или механики, мультимедиа и электроники, состояние кофров и пластика, сервисную историю.",
  },
};

/** A paragraph from the catalog's own numbers: years, mileage, typical year, median price — different on every page. */
export function factsText(name: string, ls: Lot[], type: LotType) {
  if (ls.length < 2) return null;
  const s = stats(ls);
  const prices = ls.map((l) => l.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  const byYear = new Map<number, number>();
  for (const l of ls) byYear.set(l.year, (byYear.get(l.year) || 0) + 1);
  const topYear = [...byYear.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  const kms = ls.map((l) => l.km).filter((k): k is number => !!k).sort((a, b) => a - b);
  const max = kms[kms.length - 1];
  const kmPart = kms.length < 2 ? "" : kms[0] < 500 || ls.some((l) => !l.km) ? `, от почти новых до ${kmLabelShort(max)} пробега` : `, пробег от ${kmLabelShort(kms[0])} до ${kmLabelShort(max)}`;
  return `В нашем каталоге — ${countLabel(s.count, type)} ${name} ${yearRange(s)} годов${kmPart}. Чаще всего мы подбирали экземпляры ${topYear} года, средняя цена под ключ — ${money(median)}.`;
}
