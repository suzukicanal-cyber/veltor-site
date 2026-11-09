// Товарный фид для Яндекса (формат YML): каждое объявление каталога с ценой, фото и характеристиками.
// Собирается при каждой сборке сайта (Dockerfile) → https://veltormotokorea.ru/feed.yml
// Второй файл — товары для группы ВКонтакте (только мото за 14 дней) → https://veltormotokorea.ru/vk-moto.yml
import { readFileSync, writeFileSync } from "node:fs";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://veltormotokorea.ru").replace(/\/$/, "");
const lots = JSON.parse(readFileSync(new URL("../data/lots.json", import.meta.url), "utf8"))
  .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const km = (n) => (n ? `${n.toLocaleString("ru-RU").replace(/ /g, " ")} км` : "новый");

const cats = { moto: [1, "Мотоциклы"], car: [2, "Автомобили"] };
const offers = lots.filter((l) => l.price > 0 && l.photos.length).map((l) => {
  const pics = l.photos.slice(0, 10).map((p) => (/^https?:/.test(p) ? p : `${SITE}/${l.hd ? p.replace(/\.jpg$/, "@2x.jpg") : p}`));
  const text = (l.body || []).map((b) => b.t).join(". ").replace(/\.\.+/g, ".").slice(0, 2900);
  const desc = `${l.name}, ${l.year} год, ${km(l.km)}. Из Южной Кореи под ключ: осмотр перед покупкой, доставка в Москву, СБКТС и ЭПТС. ${text}`.trim();
  const params = [["Год выпуска", l.year], ["Пробег", km(l.km)], ["Объём двигателя", l.volume], ["Мощность", l.power], ["Привод", l.drive], ["Коробка передач", l.gearbox]]
    .filter(([, v]) => v);
  return `<offer id="${l.id}" available="true">
<url>${SITE}/catalog/${esc(l.slug)}/</url>
<price>${l.price}</price>
<currencyId>RUR</currencyId>
<categoryId>${cats[l.type][0]}</categoryId>
${pics.map((p) => `<picture>${esc(p)}</picture>`).join("\n")}
<name>${esc(`${l.name} ${l.year}`)}</name>
<vendor>${esc(l.brand)}</vendor>
<model>${esc(l.model)}</model>
<description>${esc(desc)}</description>
<sales_notes>Цена под ключ, зависит от курса валют</sales_notes>
${params.map(([k, v]) => `<param name="${esc(k)}">${esc(v)}</param>`).join("\n")}
</offer>`;
});

const date = new Date().toISOString().slice(0, 16).replace("T", " ");
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
<shop>
<name>VELTOR</name>
<company>VELTOR — мотоциклы и автомобили из Южной Кореи под ключ</company>
<url>${SITE}/</url>
<currencies><currency id="RUR" rate="1"/></currencies>
<categories>
${Object.values(cats).map(([id, n]) => `<category id="${id}">${n}</category>`).join("\n")}
</categories>
<offers>
${offers.join("\n")}
</offers>
</shop>
</yml_catalog>
`;
writeFileSync(new URL("../public/feed.yml", import.meta.url), xml);
console.log(`feed.yml: ${offers.length} предложений`);

// ---------- ВКонтакте: только мотоциклы за последние VK_DAYS дней ----------
// ВК: до 5 фото, не больше 2 свойств, без HTML. В описании — дата поста в Telegram, на которую актуальна цена.
const VK_DAYS = 14;
const since = new Date(Date.now() - VK_DAYS * 864e5).toISOString();
const msk = (iso) => new Date(new Date(iso).getTime() + 3 * 36e5).toISOString().slice(0, 10).split("-").reverse().join(".");
const seen = new Set();
const vkLots = lots.filter((l) => {            // lots уже отсортированы от новых к старым — у повторов берём свежий пост
  if (l.type !== "moto" || !(l.price > 0) || !l.photos.length || l.date < since) return false;
  const key = `${l.name}|${l.year}|${l.km}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
const vkOffers = vkLots.map((l) => {
  const pics = l.photos.slice(0, 5).map((p) => (/^https?:/.test(p) ? p : `${SITE}/${l.hd ? p.replace(/\.jpg$/, "@2x.jpg") : p}`));
  const body = (l.body || []).map((b) => (b.k === "h" ? `\n${b.t}:` : b.t)).join("\n").trim();
  const desc = [
    `Год: ${l.year}`,
    `Пробег: ${km(l.km)}`,
    `Цена под ключ: ${l.price.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`,
    `Цена актуальна на ${msk(l.date)} и меняется вместе с курсом валют.`,
    "Мотоцикл из Южной Кореи под заказ — наличие уточняйте.",
    body ? `\n${body}` : "",
    `\nПодробнее и все фото: ${SITE}/catalog/${l.slug}/`,
  ].filter(Boolean).join("\n").slice(0, 3800);
  return `<offer id="${l.id}" available="true">
<url>${SITE}/catalog/${esc(l.slug)}/</url>
<price>${l.price}</price>
<currencyId>RUR</currencyId>
<categoryId>1</categoryId>
${pics.map((p) => `<picture>${esc(p)}</picture>`).join("\n")}
<name>${esc(`${l.raw || l.name}, ${l.year}`.slice(0, 100))}</name>
<description>${esc(desc)}</description>
<param name="Год">${l.year}</param>
<param name="Пробег">${esc(km(l.km))}</param>
</offer>`;
});
const vkXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
<shop>
<name>VELTOR</name>
<company>VELTOR</company>
<url>${SITE}/</url>
<currencies><currency id="RUR" rate="1"/></currencies>
<categories>
<category id="1">Мотоциклы</category>
</categories>
<offers>
${vkOffers.join("\n")}
</offers>
</shop>
</yml_catalog>
`;
// .xml — окно выбора файла ВК принимает только это расширение; .yml оставлен для старой ссылки
writeFileSync(new URL("../public/vk-moto.yml", import.meta.url), vkXml);
writeFileSync(new URL("../public/vk-moto.xml", import.meta.url), vkXml);
console.log(`vk-moto.yml: ${vkOffers.length} мотоциклов за ${VK_DAYS} дней`);
