// Товарный фид для Яндекса (формат YML): каждое объявление каталога с ценой, фото и характеристиками.
// Собирается при каждой сборке сайта (Dockerfile) → https://veltormotokorea.ru/feed.yml
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
