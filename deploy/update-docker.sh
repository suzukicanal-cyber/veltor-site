#!/usr/bin/env bash
# Обновление сайта на сервере. Запускается cron каждые 30 минут (/etc/cron.d/veltor); если в GitHub ничего нового, сразу выходит.
#
# Как устроено (с 16.11.2026):
#   * Docker-образ сайта больше НЕ собирается. Сайт — статические файлы, их отдаёт обычный nginx:stable-alpine,
#     папка /opt/veltor/www/html подключена в контейнер как volume (compose.static.yaml).
#   * При новом коммите сайт собирается одноразовым контейнером node:22-alpine прямо в /opt/veltor/out
#     (`docker run --rm`, без `docker build`: слои и кэш сборки не копятся), затем rsync переносит
#     только изменившиеся файлы в www/html. Фото каталога (~850 МБ) не копируются заново при каждом обновлении.
#   * Контейнеры перезапускаются без --build. Базовые образы (nginx, caddy, node) обновляются раз в неделю.
#
# Раньше каждый новый коммит (каталог из Telegram и кадрирование фото — до 5 раз в сутки) запускал
# `docker compose build --pull`: COPY всего проекта с фото + папка out + слой nginx ≈ 2,5 ГБ на сборку,
# а кэш сборки хранился 48 часов — отсюда +13 ГБ в сутки.
#
#   Вручную:              bash /opt/veltor/deploy/update-docker.sh
#   Собрать заново всё:   FORCE=1 bash /opt/veltor/deploy/update-docker.sh
set -euo pipefail

# всё тело в функции: bash прочитает скрипт целиком до того, как git reset заменит этот файл новой версией
main() {
  cd /opt/veltor
  exec 9>/tmp/veltor-update.lock
  flock -n 9 || { echo "Обновление уже идёт"; exit 0; }

  local DC="docker compose -f compose.yaml -f compose.ssl.yaml -f compose.static.yaml"
  local WWW=/opt/veltor/www/html
  local MIGRATE=""
  # первый запуск новой схемы: сайт ещё отдаётся из старого собранного образа
  [ -f "$WWW/index.html" ] || MIGRATE=1

  git fetch -q origin main
  local TARGET PREV
  TARGET=$(git rev-parse origin/main)
  # .deployed — последний коммит, который удалось собрать и выложить; если сборка упала, следующий запуск попробует снова
  if [ "$TARGET" = "$(cat .deployed 2>/dev/null)" ] && [ "${FORCE:-}" != "1" ] && [ -z "$MIGRATE" ]; then
    exit 0
  fi
  PREV=$(cat .deployed 2>/dev/null || true)
  git reset -q --hard "$TARGET"

  # базовые образы раз в неделю (исправления безопасности), а не при каждом обновлении
  if [ -n "$MIGRATE" ] || [ -z "$(find .images-pulled -mtime -7 2>/dev/null)" ]; then
    docker pull -q node:22-alpine >/dev/null && $DC pull -q web caddy >/dev/null 2>&1 && touch .images-pulled || true
  fi

  # адрес сайта и коды подтверждения для Яндекса/Google (раньше передавались в docker build)
  local ENVS=()
  for f in .env .env.production; do
    [ -f "$f" ] || continue
    while IFS='=' read -r k v; do
      [[ "$k" =~ ^NEXT_PUBLIC_[A-Z_]+$ ]] || continue
      v=${v%$'\r'}; v=${v%\"}; v=${v#\"}
      ENVS+=(-e "$k=$v")
    done < "$f"
  done

  # сборка во временном контейнере: npm ci только если изменились зависимости
  local LOCK_HASH
  LOCK_HASH=$(sha256sum package-lock.json | cut -c1-16)
  if docker run --rm -v /opt/veltor:/app -v veltor_npm_cache:/root/.npm -w /app \
      -e NEXT_TELEMETRY_DISABLED=1 -e NEXT_PUBLIC_BASE_PATH= -e LOCK_HASH="$LOCK_HASH" "${ENVS[@]}" \
      node:22-alpine sh -c '
        set -e
        if [ "$(cat node_modules/.lock-hash 2>/dev/null)" != "$LOCK_HASH" ]; then
          npm ci --no-audit --no-fund --loglevel=error && echo "$LOCK_HASH" > node_modules/.lock-hash
        fi
        rm -rf out
        node scripts/build-feed.mjs && npm run build --silent >/tmp/build.log 2>&1 || { tail -n 40 /tmp/build.log; exit 1; }
      '; then
    :
  else
    echo "$(date '+%F %T') !! сборка ${TARGET:0:7} не удалась — сайт работает на прошлой версии"
    exit 1
  fi
  [ -f out/index.html ] || { echo "$(date '+%F %T') !! в out нет index.html — выкладка отменена"; exit 1; }

  # выкладка: только изменённые файлы; --delay-updates подменяет их в самом конце, почти одновременно
  command -v rsync >/dev/null || apt-get install -y -qq rsync >/dev/null
  mkdir -p "$WWW"
  rsync -a --delete --delay-updates out/ "$WWW/"

  # nginx без пересборки; --no-build на случай, если в compose.yaml остался build
  $DC up -d --no-build web caddy
  # изменились настройки nginx или Caddy — применяем без остановки сайта
  if [ -n "$PREV" ] && ! git diff --quiet "$PREV" "$TARGET" -- deploy/docker-nginx.conf 2>/dev/null; then
    $DC exec -T web nginx -s reload >/dev/null 2>&1 || $DC restart web
  fi
  if [ -n "$PREV" ] && ! git diff --quiet "$PREV" "$TARGET" -- deploy/Caddyfile 2>/dev/null; then
    $DC exec -T caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 || $DC restart caddy
    echo "$(date '+%F %T') настройки Caddy применены"
  fi

  echo "$TARGET" > .deployed
  if [ -n "$MIGRATE" ]; then
    # старый собранный образ сайта и его кэш больше не нужны
    docker image rm veltor-web >/dev/null 2>&1 || true
    docker builder prune -af >/dev/null 2>&1 || true
    echo "$(date '+%F %T') сайт переведён на выкладку без docker build"
  fi
  docker image prune -f >/dev/null 2>&1 || true
  docker builder prune -f --keep-storage 2gb >/dev/null 2>&1 || true
  echo "$(date '+%F %T') сайт обновлён до ${TARGET:0:7}"

  # сообщаем Яндексу о новых страницах (IndexNow); в первый раз — обо всех
  if [ ! -f .indexnow-init ]; then
    python3 scripts/indexnow.py --all && touch .indexnow-init || true
  elif [ -n "$PREV" ] && [ "$PREV" != "$TARGET" ]; then
    python3 scripts/indexnow.py "$PREV" || true
  fi
}

main "$@"
