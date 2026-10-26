#!/usr/bin/env bash
# Один раз на сервере: включает автообновление сайта из GitHub каждые 30 минут.
set -euo pipefail
cat > /etc/cron.d/veltor <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
*/30 * * * * root /bin/bash /opt/veltor/deploy/update-docker.sh >> /var/log/veltor-update.log 2>&1
CRON
chmod 644 /etc/cron.d/veltor
echo "Автообновление включено. Журнал: tail -n 20 /var/log/veltor-update.log"
