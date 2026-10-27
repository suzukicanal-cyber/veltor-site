#!/usr/bin/env bash
# Обновление сайта на сервере: забирает свежий код и каталог из GitHub и пересобирает Docker-контейнер.
# Каталог из Telegram собирает GitHub Actions (с российского сервера Telegram недоступен).
# Запускается cron каждые 30 минут; если в репозитории ничего не изменилось, сразу выходит.
#   Вручную:            bash /opt/veltor/deploy/update-docker.sh
#   Пересобрать всё равно: FORCE=1 bash /opt/veltor/deploy/update-docker.sh
set -euo pipefail
cd /opt/veltor
exec 9>/tmp/veltor-update.lock
flock -n 9 || { echo "Обновление уже идёт"; exit 0; }

git fetch -q origin main
TARGET=$(git rev-parse origin/main)
# .deployed — последний коммит, который удалось собрать и запустить; если сборка упала, следующий запуск попробует снова
if [ "$TARGET" = "$(cat .deployed 2>/dev/null)" ] && [ "${FORCE:-}" != "1" ]; then
  exit 0
fi
git reset -q --hard "$TARGET"
if docker compose -f compose.yaml -f compose.ssl.yaml up -d --build web; then
  echo "$TARGET" > .deployed
  docker image prune -f >/dev/null
  echo "$(date '+%F %T') сайт обновлён до ${TARGET:0:7}"
else
  echo "$(date '+%F %T') !! сборка ${TARGET:0:7} не удалась — сайт работает на прошлой версии"
  exit 1
fi
