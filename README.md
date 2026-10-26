# VELTOR — сайт на Next.js

Мотоциклы и автомобили из Южной Кореи под ключ. Статический сайт (Next.js 15, App Router, `output: "export"`) на своём сервере под nginx: каталог сам пополняется из Telegram-группы каждые 2 часа.

## Что внутри

| Путь | Что это |
| --- | --- |
| `app/page.tsx` | Главная: все блоки по порядку |
| `app/catalog/page.tsx` | Каталог с фильтрами (`/catalog/`, `/catalog/?type=moto`) |
| `app/catalog/[slug]/page.tsx` | Страница каждого варианта: галерея, характеристики, описание, похожие |
| `app/sitemap.ts`, `app/robots.ts` | sitemap.xml и robots.txt для Яндекса и Google |
| `components/home/*` | Блоки главной: 3D-скан, осмотр, оплата, доставка, услуги, отзывы, контакты |
| `components/catalog/*` | Карточка, галерея, фильтры |
| `data/lots.json` | Каталог (заполняется скриптом, тексты можно править руками) |
| `data/content.ts` | Отзывы, вопросы, команда, ролики, меню |
| `lib/site.ts` | Ссылки (Telegram, Instagram, Авито), адрес сайта |
| `scripts/sync-telegram.mjs` | Забирает новые посты из t.me/koreamotocycles_veltor |
| `deploy/` | Сервер: `update-docker.sh`, `install-cron.sh`, nginx и Caddy для Docker |
| `public/` | Фото команды, ролики, фото каталога (`public/catalog/<id>/`) |

## Как это работает

```
Telegram-группа ──(каждые 2 ч, GitHub Actions)──► репозиторий veltor-site: data/lots.json + public/catalog/
                                                         │
                         сервер 213.159.209.117 ◄──(cron каждые 30 мин: git pull + docker build)
                         Docker: web (nginx со статикой) + caddy (HTTPS) → https://veltormotokorea.ru
```
С российского сервера Telegram недоступен, поэтому посты и фото собирает GitHub Actions
(`.github/workflows/sync-catalog.yml`, ручной запуск — Actions → «Sync catalog from Telegram» → Run workflow).

### Сервер
| Что | Где |
| --- | --- |
| проект | `/opt/veltor` (клон этого репозитория), настройки — `/opt/veltor/.env` |
| сборка и запуск | `compose.yaml` + `compose.ssl.yaml`, `Dockerfile`, `deploy/docker-nginx.conf`, `deploy/Caddyfile` |
| автообновление | `/etc/cron.d/veltor` → `deploy/update-docker.sh`, журнал `/var/log/veltor-update.log` |

Включить автообновление (один раз): `bash /opt/veltor/deploy/install-cron.sh`
Обновить сейчас: `FORCE=1 bash /opt/veltor/deploy/update-docker.sh`

### Правки
Всё меняется через репозиторий: правки кода, текстов (`data/content.ts`) и вариантов (`data/lots.json`) коммитятся в `main`, сервер подхватывает их в течение 30 минут. Правки прямо на сервере затрутся при следующем обновлении.

Варианты, добавленные скриптом, разбираются заново, когда улучшается разбор постов (`PARSER` в `scripts/sync-telegram.mjs`). Если вы поправили вариант вручную, добавьте ему `"manual": true` — тогда скрипт его не тронет. Первые 50 вариантов (id ≤ 7713) защищены всегда.

## Локально

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # статический сайт в папке out/
```

## SEO, уже заложено
- H1 и заголовки с «из Кореи», мета-описания для каждой страницы, canonical;
- отдельная страница у каждого варианта (`/catalog/bmw-s-1000-rr-race-package-2022-7713/`) с BreadcrumbList и Product;
- Organization, FAQPage (15 вопросов), ItemList каталога;
- sitemap.xml с датами публикации, robots.txt с директивой Host.

Адрес сайта для sitemap и canonical берётся из `/opt/veltor/.env.production` (`NEXT_PUBLIC_SITE_URL`), его пишет `setup.sh`.
После запуска: добавьте сайт в Яндекс.Вебмастер и вставьте код подтверждения в `app/layout.tsx` (`verification: { yandex: "…" }`).
