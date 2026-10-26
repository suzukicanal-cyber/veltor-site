#!/usr/bin/env node
// Checks data/articles/*.json before publishing: node scripts/check-articles.mjs
// Exit code 1 and a list of problems if something is wrong. Rules: data/articles/README.md
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "data", "articles");
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")) : [];
const problems = [];
const seen = new Set();
const KINDS = ["h2", "p", "list", "ol", "note"];
const len = (s) => [...(s || "")].length;
const plain = (s) => s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

for (const f of files) {
  const bad = (m) => problems.push(`${f}: ${m}`);
  let a;
  try { a = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")); } catch (e) { bad(`не JSON (${e.message})`); continue; }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug || "")) bad("slug: латиница, цифры и дефисы");
  if (`${a.slug}.json` !== f) bad("slug должен совпадать с именем файла");
  if (seen.has(a.slug)) bad("slug повторяется"); seen.add(a.slug);
  for (const k of ["title", "description", "h1", "lead", "date"]) if (typeof a[k] !== "string" || !a[k].trim()) bad(`нет поля ${k}`);
  if (len(a.title) > 60) bad(`title длиннее 60 знаков (${len(a.title)})`);
  if (len(a.description) < 70 || len(a.description) > 160) bad(`description должен быть 70–160 знаков (${len(a.description)})`);
  for (const k of ["date", "updated"]) if (a[k] && !/^\d{4}-\d{2}-\d{2}$/.test(a[k])) bad(`${k}: формат ГГГГ-ММ-ДД`);
  if (!Array.isArray(a.blocks) || a.blocks.length < 4) { bad("blocks: нужно хотя бы 4 блока"); continue; }
  let chars = 0;
  a.blocks.forEach((b, i) => {
    const keys = Object.keys(b || {});
    if (keys.length !== 1 || !KINDS.includes(keys[0])) return bad(`blocks[${i}]: один из ${KINDS.join(", ")}`);
    const v = b[keys[0]];
    const parts = Array.isArray(v) ? v : [v];
    if ((keys[0] === "list" || keys[0] === "ol") && (!Array.isArray(v) || !v.length)) bad(`blocks[${i}]: список пуст`);
    for (const t of parts) {
      if (typeof t !== "string" || !t.trim()) bad(`blocks[${i}]: пустой текст`);
      else {
        chars += len(plain(t));
        for (const m of t.matchAll(/\]\(([^)]+)\)/g)) if (!/^(\/|https:\/\/)/.test(m[1])) bad(`blocks[${i}]: ссылка ${m[1]} — только /путь или https://`);
        if (/<[a-z/][^>]*>/i.test(t)) bad(`blocks[${i}]: HTML не нужен, только **жирный** и [ссылка](/путь)`);
      }
    }
  });
  if (!a.blocks.some((b) => "h2" in b)) bad("нет ни одного подзаголовка h2");
  if (chars < 2500) bad(`текст короче 2500 знаков (${chars})`);
  if (!Array.isArray(a.faq)) bad("faq: массив вопросов");
  else a.faq.forEach((x, i) => { if (!x?.q?.trim() || !x?.a?.trim()) bad(`faq[${i}]: нужны q и a`); });
  if (a.sources && (!Array.isArray(a.sources) || a.sources.some((s) => !s?.title || !/^https:\/\//.test(s?.url || "")))) bad("sources: title и url (https://)");
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`articles ok: ${files.length}`);
