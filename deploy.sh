#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Hana · one-command deployment
#
#    ./deploy.sh          build and start (creates .env on first run)
#    ./deploy.sh logs     follow container logs
#    ./deploy.sh stop     stop the container
#    ./deploy.sh update   pull nothing, rebuild and restart
#    ./deploy.sh reset    stop and delete the data volume (DANGEROUS)
# ─────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
say() { printf '%s\n' "${BOLD}hana${RESET} ${DIM}·${RESET} $1"; }

if ! command -v docker >/dev/null 2>&1; then
  cat <<'EOF'
Docker 未安装。请先安装 Docker Engine 22+ 与 Compose 插件：
  https://docs.docker.com/engine/install/

若只想本地试跑，也可以直接用 Node：
  npm install && npm run dev
EOF
  exit 1
fi

COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
  else
    say "未找到 docker compose 插件，请安装 Compose v2。"
    exit 1
  fi
fi

case "${1:-start}" in
  logs)  exec $COMPOSE logs -f --tail=120 ;;
  stop)  say "停止服务…"; $COMPOSE down; exit 0 ;;
  update)
    say "重新构建并启动…"
    $COMPOSE up -d --build
    ;;
  reset)
    printf '%s' "这会删除数据库与所有封面，确定吗？输入 yes 继续："
    read -r answer
    [ "$answer" = "yes" ] || { say "已取消。"; exit 0; }
    $COMPOSE down -v
    say "数据卷已删除，下次启动会重新写入示例藏品。"
    exit 0
    ;;
  start)
    if [ ! -f .env ]; then
      cp .env.example .env
      SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
      AUTH_SECRET="$SECRET" node -e "
        const fs=require('fs');
        let s=fs.readFileSync('.env','utf8');
        s=s.replace(/^AUTH_SECRET=.*\$/m,'AUTH_SECRET=$SECRET');
        fs.writeFileSync('.env',s);
      " 2>/dev/null || sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=${SECRET}|" .env
      say "已生成 .env，请修改其中的 ADMIN_PASSWORD 后再运行一次。"
      exit 0
    fi
    say "构建镜像并启动…"
    $COMPOSE up -d --build
    ;;
  *)
    say "用法：./deploy.sh [start|logs|stop|update|reset]"
    exit 1
    ;;
esac

say "等待健康检查…"
for _ in $(seq 1 40); do
  status=$($COMPOSE ps --format '{{.Health}}' 2>/dev/null | head -n1 || true)
  if [ "$status" = "healthy" ]; then break; fi
  sleep 2
done

PORT=$(grep -E '^HANA_PORT=' .env 2>/dev/null | cut -d= -f2 || true)
PORT=${PORT:-3000}

cat <<EOF

  ${BOLD}Hana 已启动${RESET}

  站点      http://localhost:${PORT}
  后台      http://localhost:${PORT}/admin
  健康检查  http://localhost:${PORT}/api/health

  数据保存在 docker 卷 ${BOLD}hana-data${RESET} 中（/app/data）。
  备份：$COMPOSE cp hana:/app/data ./backup-\$(date +%F)
  日志：./deploy.sh logs

EOF
