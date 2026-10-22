#!/usr/bin/env bash
# Новые посты из Telegram → сборка → выкладка. Запускается таймером каждые 2 часа и вручную.
# Если сборка упала, работающий сайт не трогается.
set -euo pipefail
APP=/opt/veltor
WEB=/var/www/veltor
exec 9>/tmp/veltor-update.lock
flock -n 9 || { echo "Обновление уже идёт"; exit 0; }

cd "$APP"
# новый код из GitHub (если проект склонирован из репозитория)
if [ -d .git ]; then
  before=$(git rev-parse HEAD)
  if git pull --ff-only -q; then
    if ! git diff --quiet "$before" HEAD -- package.json; then npm install --no-audit --no-fund --silent; fi
  else
    echo "!! git pull не удался — собираю с текущим кодом"
  fi
fi
node scripts/sync-telegram.mjs ${SYNC_ARGS:-} || echo "!! Telegram недоступен — собираю сайт с текущим каталогом"
npm run build --silent
rsync -a --delete out/ "$WEB/"
echo "$(date '+%F %T') сайт обновлён"
