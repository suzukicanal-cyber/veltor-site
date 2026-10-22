const NBSP = " ";

/** 1511000 → "1 511 000" with non-breaking spaces */
export const groups = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
export const money = (n: number) => `${groups(n)}${NBSP}₽`;
export const kmLabel = (km: number | null) => (km ? `${groups(km)}${NBSP}км` : "новый");

/** Russian plural: plural(5, ["день","дня","дней"]) → "дней" */
export function plural(n: number, forms: [string, string, string]) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return forms[0];
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return forms[1];
  return forms[2];
}
export const dayWord = (n: number) => plural(n, ["день", "дня", "дней"]);

/** Date of publication in Moscow time, "21.10.2026" (and "21.10" short) — computed without Intl so build and browser agree. */
function msk(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3 * 3600 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, "0"), mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return { dd, mm, yyyy: String(d.getUTCFullYear()) };
}
export const dateRu = (iso: string) => { const { dd, mm, yyyy } = msk(iso); return `${dd}.${mm}.${yyyy}`; };
export const dateShort = (iso: string) => { const { dd, mm } = msk(iso); return `${dd}.${mm}`; };
const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
export const dateLong = (iso: string) => { const { dd, mm, yyyy } = msk(iso); return `${+dd} ${MONTHS[+mm - 1]} ${yyyy}`; };
export const dateKey = (iso: string) => { const { dd, mm, yyyy } = msk(iso); return `${yyyy}-${mm}-${dd}`; };
