#!/usr/bin/env bash
# Первая установка сайта VELTOR на сервер (Ubuntu 22.04/24.04 или Debian 12).
# Запуск от root из папки проекта:   sudo bash deploy/setup.sh veltor-korea.ru you@mail.ru
#   1-й аргумент — домен (DNS-запись A уже должна указывать на этот сервер),
#   2-й — почта для сертификата Let's Encrypt (необязательно).
set -euo pipefail

DOMAIN="${1:?Укажите домен: sudo bash deploy/setup.sh veltor-korea.ru}"
EMAIL="${2:-}"
APP=/opt/veltor          # исходники, данные каталога, сборка
WEB=/var/www/veltor      # готовый сайт, его отдаёт nginx
SRC="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Пакеты"
apt-get update -y
apt-get install -y git nginx rsync curl ca-certificates certbot python3-certbot-nginx
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Swap (сборке Next.js нужно ~1 ГБ памяти)"
if [ "$(free -m | awk '/Mem:/{print $2}')" -lt 1800 ] && ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Пользователь и папки"
id veltor >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin veltor
mkdir -p "$APP" "$WEB"
if [ "$SRC" != "$APP" ]; then rsync -a --exclude node_modules --exclude .next --exclude out "$SRC/" "$APP/"; fi
echo "NEXT_PUBLIC_SITE_URL=https://$DOMAIN" > "$APP/.env.production"
if [ -d "$APP/.git" ]; then
  # каталог на сервере живёт своей жизнью: git pull обновляет код, но не трогает lots.json
  git -C "$APP" update-index --skip-worktree data/lots.json
fi
chown -R veltor:veltor "$APP" "$WEB"

echo "==> Зависимости и первая сборка (скачает фото каталога из Telegram)"
sudo -u veltor -H bash -c "cd $APP && npm install --no-audit --no-fund"
sudo -u veltor -H bash "$APP/deploy/update.sh"

echo "==> nginx"
sed "s/__DOMAIN__/$DOMAIN/g" "$APP/deploy/nginx.conf" > /etc/nginx/sites-available/veltor
ln -sf /etc/nginx/sites-available/veltor /etc/nginx/sites-enabled/veltor
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> HTTPS"
if [ -n "$EMAIL" ]; then
  DOMS=(-d "$DOMAIN"); getent hosts "www.$DOMAIN" >/dev/null && DOMS+=(-d "www.$DOMAIN")
  certbot --nginx "${DOMS[@]}" --non-interactive --agree-tos -m "$EMAIL" --redirect || \
    echo "!! Сертификат не выпущен: проверьте DNS и запустите позже: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
else
  echo "Почта не указана — выпустите сертификат командой: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

echo "==> Автообновление каталога каждые 2 часа"
cp "$APP/deploy/veltor-sync.service" "$APP/deploy/veltor-sync.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now veltor-sync.timer

echo
echo "Готово: https://$DOMAIN"
echo "Ручное обновление каталога:  sudo systemctl start veltor-sync   (лог: journalctl -u veltor-sync -n 50)"
