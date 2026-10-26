// Site-wide constants. SITE_URL is the production address — set in .env.production on the server;
// (deploy/setup.sh writes it from the domain).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://veltormotokorea.ru").replace(/\/$/, "");
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const SITE_NAME = "VELTOR";
export const SITE_TITLE = "Мотоциклы и авто из Южной Кореи под ключ — VELTOR";
export const SITE_DESCRIPTION =
  "Мотоциклы и автомобили из Южной Кореи под ключ: подбор, живой осмотр, выкуп, доставка в среднем 45 дней, оформление СБКТС и ЭПТС.";

/** Phone for calls (shown in the header, menu, contacts, business card, footer). */
export const PHONE = "+7 961 174-94-59";
export const PHONE_HREF = "tel:+79611749459";

export const LINKS = {
  manager: "https://t.me/veltor_kor",
  channel: "https://t.me/koreamotocycles_veltor",
  instagram: "https://www.instagram.com/veltor_koreaexport/",
  avito: "https://www.avito.ru/brands/c192bf80c7807a8bbb5deba9830846e7",
};

/** Telegram chat with the manager, message already typed. */
export const tgText = (text: string) => `${LINKS.manager}?text=${encodeURIComponent(text)}`;
export const TG_DEFAULT = tgText("Здравствуйте! Хочу подобрать технику из Кореи");

/** Prefix a file from /public with the base path (needed when the site lives at /<repo>/ on GitHub Pages). */
export const asset = (p: string) => (/^https?:\/\//.test(p) ? p : `${BASE_PATH}/${p.replace(/^\//, "")}`);
