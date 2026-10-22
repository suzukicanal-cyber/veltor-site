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
| `deploy/` | Установка на сервер: `setup.sh`, `update.sh`, nginx, таймер |
| `public/` | Фото команды, ролики, фото каталога (`public/catalog/<id>/`) |

## Публикация на своём сервере

Сайт собирается в обычные HTML-файлы (`out/`), их отдаёт nginx. Node.js на сервере нужен только для сборки и для скрипта каталога — сайт работает без запущенного Node-процесса, быстро и без падений.

**Что нужно:** VPS с Ubuntu 22.04/24.04 или Debian 12, от 1 ГБ памяти (скрипт сам добавит swap), доступ root по SSH, домен с A-записями `@` и `www` на IP сервера.

### Первая установка
Код лежит в репозитории GitHub, сервер забирает его оттуда сам.
```bash
ssh root@IP-сервера
apt-get install -y git
git clone https://github.com/suzukicanal-cyber/veltor-site.git
cd veltor-site && bash deploy/setup.sh veltor-korea.ru you@mail.ru
```
`setup.sh` ставит nginx и Node.js 20, копирует проект в `/opt/veltor`, скачивает фото каталога из Telegram, собирает сайт в `/var/www/veltor`, выпускает HTTPS-сертификат Let's Encrypt и включает обновление каждые 2 часа.

### Как устроено на сервере
| Путь | Что там |
| --- | --- |
| `/opt/veltor` | проект, `data/lots.json`, фото `public/catalog/` |
| `/var/www/veltor` | готовый сайт, который видят посетители |
| `/etc/nginx/sites-available/veltor` | настройки nginx (`deploy/nginx.conf`) |
| `veltor-sync.timer` | запуск `deploy/update.sh` каждые 2 часа |

### Полезные команды
```bash
systemctl start veltor-sync                     # обновить каталог и сайт сейчас
journalctl -u veltor-sync -n 50                 # что было при последних обновлениях
systemctl list-timers veltor-sync.timer         # когда следующее обновление
nano /opt/veltor/data/lots.json && systemctl start veltor-sync   # поправить текст варианта
```
Если сборка завершилась ошибкой, выкладка не происходит — посетители видят прежнюю версию.

### Обновление кода сайта
Изменения, отправленные в репозиторий на GitHub, сервер подтягивает сам при каждом обновлении (раз в 2 часа). Чтобы выложить сразу: `systemctl start veltor-sync`.
Каталог (`data/lots.json`) и фото на сервере при этом не перезаписываются.

## Как обновляется каталог

Каждые 2 часа сервер запускает `deploy/update.sh`:
- подтягивает новый код из GitHub;
- `scripts/sync-telegram.mjs` читает новые сообщения группы (тема 8 — мото, тема 7 — авто), остальные темы пропускает;
- вариантом становится пост, где есть год и цена;
- название приводится к единому виду (`BMW S1000RR` → `BMW S 1000 RR`), объём двигателя берётся у такой же модели из каталога;
- фото скачиваются в `public/catalog/<id>/` (ссылки Telegram со временем перестают работать);
- сайт пересобирается и выкладывается. Если Telegram недоступен, сайт собирается с текущим каталогом.

Тексты уже добавленных вариантов скрипт не трогает — их можно поправить на сервере в `/opt/veltor/data/lots.json` (название, 3 короткие особенности в `features`, описание в `body`) и запустить `systemctl start veltor-sync`.
Чтобы убрать вариант — удалите его объект из `data/lots.json`.

Конкретные посты вручную: `cd /opt/veltor && sudo -u veltor node scripts/sync-telegram.mjs --ids 7713,7714`.

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
