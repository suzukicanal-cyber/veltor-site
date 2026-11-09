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
PREV=$(cat .deployed 2>/dev/null || true)
git reset -q --hard "$TARGET"
# старые слои сборки копятся и забивают диск — чистим их до сборки, если места мало
FREE_MB=$(df -Pm / | awk 'NR==2{print $4}')
if [ "${FREE_MB:-0}" -lt 3000 ]; then
  echo "$(date '+%F %T') мало места (${FREE_MB} МБ) — чищу кэш Docker"
  docker builder prune -af >/dev/null 2>&1 || true
  docker image prune -af >/dev/null 2>&1 || true
fi
DC="docker compose -f compose.yaml -f compose.ssl.yaml"
# свежие базовые образы (исправления безопасности nginx/node/caddy подтягиваются сами)
$DC pull -q caddy >/dev/null 2>&1 || true
if $DC build --pull -q web && $DC up -d web caddy; then
  # изменились настройки Caddy (заголовки безопасности, домены) — применяем без остановки сайта
  if [ -n "$PREV" ] && ! git diff --quiet "$PREV" "$TARGET" -- deploy/Caddyfile 2>/dev/null; then
    $DC exec -T caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 || $DC restart caddy
    echo "$(date '+%F %T') настройки Caddy применены"
  fi
  echo "$TARGET" > .deployed
  docker image prune -f >/dev/null
  docker builder prune -f --filter until=48h >/dev/null 2>&1 || true
  echo "$(date '+%F %T') сайт обновлён до ${TARGET:0:7}"
  # сообщаем Яндексу о новых страницах (IndexNow); в первый раз — обо всех
  sleep 5
  if [ ! -f .indexnow-init ]; then
    python3 scripts/indexnow.py --all && touch .indexnow-init || true
  elif [ -n "$PREV" ]; then
    python3 scripts/indexnow.py "$PREV" || true
  fi
else
  echo "$(date '+%F %T') !! сборка ${TARGET:0:7} не удалась — сайт работает на прошлой версии"
  exit 1
fi
