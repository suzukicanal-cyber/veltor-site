#!/usr/bin/env node
/**
 * VELTOR catalog sync: Telegram group → data/lots.json + public/catalog/<id>/*.jpg
 *
 * Reads public post previews (t.me/<group>/<id>?embed=1) — no bot token needed, the group is public.
 *   • topic 8 ("Мото") → type "moto", topic 7 ("Авто") → type "car"; posts from other topics are ignored;
 *   • a post becomes a lot only if it has a year and a price;
 *   • photos are downloaded into public/ (Telegram CDN links expire after a while);
 *   • lots already in lots.json keep their hand-edited texts; only missing local photos are re-downloaded.
 *
 * Usage:
 *   node scripts/sync-telegram.mjs                  # look for new posts after the newest known id
 *   node scripts/sync-telegram.mjs --from 7300      # rescan from a given id
 *   node scripts/sync-telegram.mjs --from 6580 --since 2026-10-01   # backfill a month
 *   node scripts/sync-telegram.mjs --ids 7713,7674  # only these posts
 *   node scripts/sync-telegram.mjs --fixtures dir   # parse saved <id>.html files (offline test), writes nothing
 *   --dry                                           # do not write lots.json / photos
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GROUP = process.env.TG_GROUP || "koreamotocycles_veltor";
const TOPICS = { 8: "moto", 7: "car" };
const LOTS_FILE = path.join(ROOT, "data", "lots.json");
const PHOTO_DIR = path.join(ROOT, "public", "catalog");
const MAX_MISSES = 80; // stop after this many ids in a row that do not exist
const MAX_SCAN = 600;
// Bump when the parser improves: lots made by an older parser are parsed again (hand-curated lots have no "parser" field).
const PARSER = 3;
const CURATED_MAX_ID = 7713;

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const DRY = args.includes("--dry") || !!opt("--fixtures");

/* ---------------- text helpers ---------------- */

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
  if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return ENT[e] ?? m;
});
const stripTags = (s) => decode(s.replace(/<[^>]+>/g, ""));
const WARN = "[\\u2757\\u203C\\u26A0]\\uFE0F?";
const clean = (s) => s.replace(/[\u00A0\s]+/g, " ")
  // a warning sign between two phrases works as a full stop: "…деталей❗️После…" → "…деталей. После…"
  .replace(new RegExp(`([^\\s\\u2757\\u203C\\u26A0\\uFE0F])\\s*(?:${WARN})+\\s*(?=[^\\s\\u2757\\u203C\\u26A0])`, "gu"), (m, a) => (/[.!?]/.test(a) ? a + " " : a + ". "))
  .replace(new RegExp(WARN, "gu"), "").replace(/\uFE0F/g, "").trim();
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Embed HTML → { id, topic, date, lines[{t,bold,warn}], photos[] } or null when the post does not exist */
export function parseEmbed(html, askedId) {
  const post = html.match(/data-post="[^"/]+\/(\d+)"/);
  if (!post || /tgme_widget_message_error/.test(html)) return null;
  const topicM = html.match(/tgme_widget_message_reply[^>]*href="https:\/\/t\.me\/[^/]+\/(\d+)"/);
  const date = (html.match(/<time[^>]*datetime="([^"]+)"/) || [])[1] || null;
  const photos = [...html.matchAll(/tgme_widget_message_photo_wrap[^>]*style="[^"]*background-image:url\('([^']+)'\)/g)].map((m) => m[1]);
  const tm = html.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="tgme_widget_message_footer|<\/div>)/);
  let lines = [];
  if (tm) {
    // keep emoji text, mark bold fragments, split by <br>
    const body = tm[1]
      .replace(/<i class="emoji"[^>]*>(?:<b>)?([^<]*)(?:<\/b>)?<\/i>/g, "$1")
      .replace(/<\/?blockquote[^>]*>/g, "<br/>")
      .replace(/<br\s*\/?>/g, "\n");
    lines = body.split("\n").map((raw) => {
      const text = clean(stripTags(raw));
      const boldOnly = /^\s*<b>[\s\S]*<\/b>\s*$/.test(raw) && !/<\/b>[^<\s]/.test(raw.replace(/^\s*<b>|<\/b>\s*$/g, ""));
      return { t: text, bold: boldOnly, warn: /❗|‼|⚠/.test(raw) };
    }).filter((l) => l.t);
    lines = splitRunOn(lines);
  }
  return { id: +post[1] || askedId, topic: topicM ? +topicM[1] : null, date, lines, photos };
}

/** Posts typed without line breaks: split the header at field labels and long lists at capitalised items. */
const FIELD_RX = /\s+(?=(?:Год выпуска|Год|Пробег|Цена под ключ[^:]{0,20}|Цена|Мощность|Привод|Коробка|Объ[её]м[^:]{0,20}):)/g;
function splitRunOn(lines) {
  const out = [];
  for (const l of lines) {
    let parts = l.t.split(FIELD_RX);
    if (parts.length === 1 && l.t.length > 200 && (l.t.replace(/\([^)]*\)/g, "").match(/[.,;]/g) || []).length < 3) parts = l.t.split(/\s+(?=[А-ЯЁ])(?![^(]*\))/);
    parts.map((t) => t.trim()).filter(Boolean).forEach((t, i) => out.push({ ...l, t, bold: parts.length > 1 ? false : l.bold, warn: l.warn && (i === 0 || parts.length === 1) }));
  }
  return out;
}

/* ---------------- names ---------------- */

const BRANDS = [
  ["MERCEDES-BENZ", "Mercedes-Benz"], ["MERCEDES BENZ", "Mercedes-Benz"], ["MERCEDES", "Mercedes-Benz"],
  ["HARLEY-DAVIDSON", "Harley-Davidson"], ["HARLEY DAVIDSON", "Harley-Davidson"], ["MV AGUSTA", "MV Agusta"],
  ["LAND ROVER", "Land Rover"], ["ROLLS-ROYCE", "Rolls-Royce"], ["ASTON MARTIN", "Aston Martin"], ["ROYAL ENFIELD", "Royal Enfield"],
  ...["BMW", "KTM", "MINI", "BRP", "CF MOTO", "CFMOTO"].map((b) => [b, b === "CF MOTO" ? "CFMOTO" : b]),
  ...["Ducati", "Kawasaki", "Yamaha", "Honda", "Suzuki", "Triumph", "Aprilia", "Indian", "Husqvarna", "Benelli", "Vespa", "Piaggio", "Moto Guzzi",
    "Kia", "Hyundai", "Genesis", "Porsche", "Audi", "Lexus", "Toyota", "Volvo", "Volkswagen", "Lamborghini", "Ferrari", "Bentley", "Maserati",
    "Jeep", "Ford", "Chevrolet", "Cadillac", "Tesla", "Nissan", "Infiniti", "Mazda", "Subaru", "SsangYong", "Renault", "Sea-Doo", "Arch"].map((b) => [b.toUpperCase(), b]),
];

/** Raw post titles that were edited by hand (spelling of the model). */
const ALIASES = {
  "BMW X7 40d": "BMW X7 xDrive40d",
  "BMW S1000RR HP4": "BMW HP4",
  "BMW S1000RR Mpack": "BMW S 1000 RR M Package",
  "BMW X5 G05": "BMW X5 (G05)",
  "Honda CBR650R MT": "Honda CBR650R",
  "Hyundai Venue 1.6": "Hyundai Venue",
};

const ABBR = new Set(["ABS", "DCT", "SE", "SP", "GT", "GTS", "RR", "RS", "ST", "XR", "GS", "RT", "BMW", "KTM", "AMG", "TCS", "HDR", "CVO", "FXR", "LED", "SUV", "MT"]);
function normalizeTitle(raw) {
  let t = clean(raw).replace(/\s+/g, " ");
  if (ALIASES[t]) return ALIASES[t];
  t = t.replace(/^HD\s+/i, "Harley-Davidson ").replace(/^H-D\s+/i, "Harley-Davidson ").replace(/^Range Rover\b/i, "Land Rover Range Rover");
  const up = t.toUpperCase();
  let brand = null, rest = t;
  for (const [k, v] of BRANDS) if (up === k || up.startsWith(k + " ")) { brand = v; rest = t.slice(k.length).trim(); break; }
  if (!brand) return t;
  // ALL CAPS words → Title Case (keep tokens with digits and short abbreviations)
  if (rest === rest.toUpperCase()) rest = rest.split(" ").map((w) => (/\d/.test(w) || w.length <= 2 || ABBR.has(w) ? w : w[0] + w.slice(1).toLowerCase())).join(" ");
  if (brand === "BMW") rest = rest.replace(/\b([A-Z])(\d{3,4})([A-Z]{1,3})?\b/g, (m, a, n, b) => [a, n, b].filter(Boolean).join(" "));
  if (brand === "Yamaha") rest = rest
    .replace(/^(?:YZF[-\s]*)?R(1M|1|3|6|7|9|25)\b/i, (m, n) => `YZF-R${n.toUpperCase()}`)
    .replace(/^MT-?(\d{2})(?:\s*(SP)\b)?/i, (m, n, sp) => `MT-${n}${sp ? " SP" : ""}`)
    .replace(/^XSR-?(\d{3})/i, "XSR$1");
  if (brand === "Suzuki") rest = rest.replace(/^GSX-?([RS])-?(\d{3,4})/i, (m, k, n) => `GSX-${k.toUpperCase()}${n}`);
  if (brand === "Kawasaki") rest = rest.replace(/^(?:Ninja\s+)?ZX-?(\d{1,2})R\b/i, (m, n) => `Ninja ZX-${n}R`);
  if (brand === "Mercedes-Benz") rest = rest.replace(/\b([A-Z]{1,3})(\d{3})([A-Z])\b/g, (m, a, n, b) => `${a} ${n} ${b.toLowerCase()}`);
  return `${brand} ${rest}`.trim();
}

const SLUG = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
export const slugify = (s) => s.toLowerCase().split("").map((c) => SLUG[c] ?? c).join("").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------------- post → lot ---------------- */

const num = (s) => +String(s).replace(/[^\d]/g, "");
const isSignature = (t) => /@veltor_kor/i.test(t);
const HEAD_RX = [/^(Год(?: выпуска)?):/i, /^Пробег:/i, /^Цена/i, /^Мощность:/i, /^Привод:/i, /^Коробка:/i, /^Объ[её]м[^:]*:/i, /^[\d\s ]+₽$/];

/** Three short chips for the card: clauses of the description, skipping header-like and generic ones. */
const SKIP_RX = /^(Год|Пробег|Цена|Мощность|Привод|Коробка|Объ[её]м|Цвет|Выпуск|Производство|Первая регистрация|Дата|Состояние расходных|Один раз|Возможна)/i;
function pickFeatures(body, brand) {
  const clauses = [];
  for (const b of body) {
    if (b.k !== "li" && b.k !== "p") continue;
    for (const sent of b.t.replace(/\s*\([^)]*\)/g, "").split(/(?<=[.!?])\s+/)) {
      for (let c of sent.split(/,\s+|;\s+|\.\s+/)) {
        c = c.replace(/\s*\([^)]*\)/g, "").replace(/[.!…]+$/, "").replace(/^(и|а также)\s+/i, "").trim();
        if (c.length >= 4) clauses.push(cap(c));
      }
    }
  }
  const bad = (c) => SKIP_RX.test(c) || c.toLowerCase().startsWith(brand.toLowerCase()) || /\b(19|20)\d\d\b/.test(c) || /^\d/.test(c);
  const generic = (c) => /^(Мотоцикл|Автомобиль|Машина|Техника)\b/i.test(c);
  const fits = clauses.filter((c) => c.length <= 38 && !bad(c));
  const pick = [...fits.filter((c) => !generic(c)), ...fits.filter(generic)];
  const out = [];
  for (const c of pick) if (!out.some((o) => o.toLowerCase() === c.toLowerCase()) && out.length < 3) out.push(c);
  return out;
}

/** Base model for the catalog filter: trims and packages removed ("S 1000 RR M Package" → "S 1000 RR"). */
const TRIM_RX = /\s+(SP|Option 719|Race Package(?:\s+M)?|M Package|Mpack|Competition|ABS Pro|ABS|SE|Tour|DCT|Airbag|Expedition|E-Clutch|Inspiration|Premium|Prestige|Luxury|Exclusive|Signature)\b.*$/i;
function baseModel(rest, type) {
  rest = rest.split(/\s+\/\s+/)[0].replace(/\s+Lightweight\b.*$/i, "").trim();
  if (type === "car" && /^Range Rover\b/i.test(rest)) return rest.split(/\s+/).slice(0, 3).join(" ");
  if (type === "car") return (rest.replace(/\([^)]*\)/g, " ").trim().split(/\s+/)[0] || rest);
  let m = rest;
  for (let i = 0; i < 3; i++) m = m.replace(TRIM_RX, "").trim();
  return m || rest;
}

/** Name, brand and base model from the post title. The base model is borrowed from a known lot when one fits. */
export function naming(raw, type, known) {
  const name = normalizeTitle(raw);
  const brand = (BRANDS.find(([, v]) => name.startsWith(v + " ")) || [, name.split(" ")[0]])[1];
  const rest = name.slice(brand.length).trim();
  const twin = known.filter((l) => l.brand === brand && l.type === type && (rest === l.model || rest.startsWith(l.model + " ")))
    .sort((a, b) => b.model.length - a.model.length)[0];
  return { name, brand, rest, twin, model: twin ? twin.model : baseModel(rest, type) };
}

export function toLot(p, known) {
  const type = TOPICS[p.topic];
  if (!type || !p.lines.length) return null;
  const all = p.lines.map((l) => l.t);
  const find = (rx) => { for (const t of all) { const m = t.match(rx); if (m) return m; } return null; };
  const year = find(/Год(?: выпуска)?:\s*(\d{4})/i);
  const priceIdx = all.findIndex((t) => /^Цена/i.test(t));
  const PRICE_RX = /(\d{1,3}(?:[\s\u00A0’']\d{3})+|\d{5,9})\s*₽/;
  const priceM = all.slice(priceIdx >= 0 ? priceIdx : 0).map((t) => t.match(PRICE_RX)).find(Boolean);
  if (!year || !priceM) return null;

  const kmM = find(/Пробег:\s*(.+)/i);
  const km = kmM && /\d/.test(kmM[1]) && !/new|нов/i.test(kmM[1]) ? num(kmM[1].replace(/\s*(km|км).*/i, "")) : null;
  const power = find(/Мощность:\s*(\d+)\s*л\.?\s*с/i);
  const drive = find(/Привод:\s*([^\s,.]+)/i);
  const gear = find(/Коробка:\s*([^\s,.]+)/i);
  const volM = find(/Объ[её]м[^:]*:\s*([\d.,]+)\s*(см³|см3|cc|куб|л)/i);

  const raw = p.lines[0].t;
  const { name, brand, model, twin } = naming(raw, type, known);
  let volume = volM ? (/л/.test(volM[2]) ? `${volM[1].replace(",", ".")} л` : `${num(volM[1])} см³`) : null;
  if (!volume) { // "Двигатель 889 см³", "мотором 1000 cc", "1’000 см³"
    const v = find(/(\d[\d’' ]{1,5}\d)\s*(?:см³|см3|cc|куб)/i);
    if (v && num(v[1]) > 49 && num(v[1]) < 3000) volume = `${num(v[1])} см³`;
  }
  if (!volume && type === "car") { const v = name.match(/\b([1-6]\.\d)\b/); if (v) volume = `${v[1]} л`; }
  if (!volume && twin && twin.type === type) volume = twin.volume;

  // description: everything after the header fields, without the signature
  const body = [];
  for (const l of p.lines.slice(1)) {
    const t = l.t;
    if (isSignature(t) || HEAD_RX.some((rx) => rx.test(t))) continue;
    if (l.warn) { body.push({ k: "warn", t: cap(t.replace(/^[^\p{L}\d]+/u, "")) }); continue; }
    const numbered = t.match(/^\d+\.\s+(.+)/);
    if (/:$/.test(t) || numbered || (l.bold && !/\.$/.test(t) && t.length < 48)) body.push({ k: "h", t: (numbered ? numbered[1] : t).replace(/:$/, "") });
    else if (t.length > 100) body.push({ k: "p", t });
    else body.push({ k: "li", t: t.replace(/\.$/, "") });
  }
  const features = pickFeatures(body, brand);

  return {
    id: p.id,
    slug: `${slugify(name)}-${year[1]}-${p.id}`,
    type, brand, model, name, raw: clean(raw),
    year: +year[1], km,
    volume, power: power ? `${power[1]} л.с.` : null,
    drive: drive ? drive[1].toLowerCase() : null, gearbox: gear ? gear[1].toLowerCase() : null,
    price: num(priceM[1]), priceLabel: all[priceIdx] && /Москв/i.test(all[priceIdx]) ? "под ключ в Москве" : "под ключ",
    date: p.date || new Date().toISOString(),
    features, body, photos: p.photos,
    post: `https://t.me/${GROUP}/${p.topic}/${p.id}`,
    parser: PARSER,
  };
}

/* ---------------- network ---------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (VELTOR catalog sync; +https://t.me/veltor_kor)" } });
      if (r.ok) return r;
      if (r.status === 404) return null;
    } catch {}
    await sleep(800 * (i + 1));
  }
  return null;
}
async function fetchPost(id) {
  const r = await get(`https://t.me/${GROUP}/${id}?embed=1&mode=tme`);
  return r ? parseEmbed(await r.text(), id) : null;
}
const isLocal = (p) => !/^https?:/.test(p);
async function exists(f) { try { await fs.access(f); return true; } catch { return false; } }

async function savePhotos(id, urls) {
  const dir = path.join(PHOTO_DIR, String(id));
  await fs.mkdir(dir, { recursive: true });
  const out = [];
  for (let i = 0; i < urls.length; i++) {
    const rel = `catalog/${id}/${i + 1}.jpg`, file = path.join(ROOT, "public", rel);
    if (!(await exists(file))) {
      const r = await get(urls[i]);
      if (!r) continue;
      await fs.writeFile(file, Buffer.from(await r.arrayBuffer()));
    }
    out.push(rel);
  }
  return out;
}

/* ---------------- main ---------------- */

async function main() {
  const lots = JSON.parse(await fs.readFile(LOTS_FILE, "utf8"));
  const byId = new Map(lots.map((l) => [l.id, l]));
  // reposts removed by scripts/dedupe.py must not come back
  let removedIds = new Set();
  try { removedIds = new Set(Object.keys(JSON.parse(await fs.readFile(path.join(ROOT, "data", "redirects.json"), "utf8"))).map((s) => +s.split("-").pop())); } catch {}
  const sig = (l) => `${l.raw || l.name}|${l.price}|${l.year}`;
  const seen = new Set(lots.map(sig));

  // offline test on saved embeds
  const fx = opt("--fixtures");
  if (fx) {
    for (const f of (await fs.readdir(fx)).filter((f) => f.endsWith(".html")).sort()) {
      const p = parseEmbed(await fs.readFile(path.join(fx, f), "utf8"), +f.replace(/\D/g, ""));
      const lot = p && toLot(p, lots);
      console.log(`\n=== ${f}`, lot ? JSON.stringify({ ...lot, photos: lot.photos.length, body: lot.body.slice(0, 6) }, null, 1) : p ? `skipped (topic ${p.topic})` : "missing");
    }
    return;
  }

  // 0) names of script-made lots follow the current naming rules (offline, no Telegram needed)
  const auto = (l) => !l.manual && (l.parser !== undefined || l.id > CURATED_MAX_ID);
  for (const l of lots.filter(auto)) {
    const n = naming(l.raw || l.name, l.type, lots.filter((x) => !auto(x)));
    if (n.name !== l.name || n.brand !== l.brand || n.model !== l.model) {
      console.log(`= ${l.id} ${l.name} → ${n.name} [${n.brand} / ${n.model}]`);
      Object.assign(l, { name: n.name, brand: n.brand, model: n.model, slug: `${slugify(n.name)}-${l.year}-${l.id}` });
    }
  }
  if (args.includes("--offline")) {
    lots.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    if (!DRY) await fs.writeFile(LOTS_FILE, JSON.stringify(lots, null, 1) + "\n");
    console.log("Offline: names updated.");
    return;
  }

  let added = 0, fixed = 0;
  // 1) photos of known lots still pointing to Telegram CDN → download them
  for (const l of lots) {
    if (l.photos.length && l.photos.every(isLocal)) continue;
    const p = await fetchPost(l.id);
    if (!p || !p.photos.length) { console.warn(`! ${l.id}: post unavailable, photos left as is`); continue; }
    if (!DRY) { const ph = await savePhotos(l.id, p.photos); if (ph.length) { l.photos = ph; fixed++; } }
    if (p.date && !l.date) l.date = p.date;
    await sleep(250);
  }

  // 1b) lots parsed by an older version of this script → parse again, keep photos
  for (const l of lots) {
    const stale = !l.manual && (l.parser !== undefined ? l.parser < PARSER : l.id > CURATED_MAX_ID);
    if (!stale) continue;
    const p = await fetchPost(l.id);
    const fresh = p && toLot(p, lots.filter((x) => x.id !== l.id));
    if (!fresh) { console.warn(`! ${l.id}: could not re-parse`); continue; }
    Object.assign(l, { ...fresh, photos: l.photos.length ? l.photos : fresh.photos, date: l.date || fresh.date });
    console.log(`~ ${l.id} ${l.name} — ${l.features.join(" / ")}`);
    await sleep(250);
  }

  // 2) new posts
  const ids = opt("--ids") ? opt("--ids").split(",").map(Number) : null;
  const maxKnown = Math.max(0, ...lots.map((l) => l.id));
  const start = +(opt("--from") || maxKnown + 1);
  // --since 2026-10-01: skip posts published earlier (Moscow time)
  const since = opt("--since") ? new Date(opt("--since") + "T00:00:00+03:00").getTime() : 0;
  let misses = 0;
  const queue = ids || Array.from({ length: Math.max(0, maxKnown - start + 1) + MAX_SCAN }, (_, i) => start + i);
  for (const id of queue) {
    if (byId.has(id) || removedIds.has(id)) continue;
    const p = await fetchPost(id);
    // gaps of deleted messages are normal inside the known range; stop only after the newest known post
    if (!p) { if (!ids && id > maxKnown && ++misses >= MAX_MISSES) break; continue; }
    if (since && p.date && new Date(p.date).getTime() < since) continue;
    misses = 0;
    const lot = toLot(p, lots);
    if (!lot) continue;
    if (seen.has(sig(lot))) continue; // another message of the same album
    seen.add(sig(lot));
    if (!DRY) { const ph = await savePhotos(lot.id, lot.photos); if (ph.length) lot.photos = ph; }
    lots.push(lot); byId.set(lot.id, lot); added++;
    console.log(`+ ${lot.id} ${lot.type} ${lot.name} ${lot.year} — ${lot.price} ₽ (${lot.photos.length} фото)`);
    await sleep(250);
  }

  lots.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  if (!DRY) await fs.writeFile(LOTS_FILE, JSON.stringify(lots, null, 1) + "\n");
  console.log(`Done: ${added} new lots, photos saved for ${fixed} existing lots, ${lots.length} total${DRY ? " (dry run)" : ""}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
