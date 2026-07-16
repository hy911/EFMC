#!/usr/bin/env sh
# =============================================================================
# VPS 一键部署 / 更新脚本
# 前提：已安装 Docker + Compose 插件，.env 已按 .env.example 配好
# =============================================================================
set -e

# .env 里设了 CLOUDFLARE_TUNNEL_TOKEN 就一并启动 cloudflared（tunnel profile）；
# 没设则按纯 app + postgres 部署（比如改用 Caddy/自建反代的场景）。
if grep -qE '^CLOUDFLARE_TUNNEL_TOKEN=.+' .env 2>/dev/null; then
  export COMPOSE_PROFILES=tunnel
  echo '检测到 CLOUDFLARE_TUNNEL_TOKEN → 将一并启动 Cloudflare Tunnel'
fi

# 读 .env 里的库名/用户（默认 payload/efmc），用于就绪探测
DB_USER=$(grep -E '^POSTGRES_USER=' .env | cut -d= -f2-)
DB_NAME=$(grep -E '^POSTGRES_DB=' .env | cut -d= -f2-)
DB_USER=${DB_USER:-payload}
DB_NAME=${DB_NAME:-efmc}

echo '[1/4] 启动数据库…'
docker compose up -d postgres

echo '[2/4] 等待数据库就绪（构建阶段的迁移需要 DB 已接受连接）…'
# 首次启动 postgres 要跑 initdb，未就绪时 build 里的 payload migrate 会 ECONNREFUSED。
# 轮询容器内 pg_isready，最多等 60 秒。
i=0
until docker compose exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo '  ✗ 数据库 60 秒内未就绪，最近日志：'
    docker compose logs --tail 40 postgres
    exit 1
  fi
  sleep 2
done
echo '  ✓ 数据库已就绪'

echo '[3/4] 构建应用镜像（含数据库迁移 + 预渲染）…'
docker compose build app

echo '[4/4] 启动应用（含 tunnel，若已启用）…'
docker compose up -d

echo '完成。健康检查：'
sleep 3
curl -sf -o /dev/null -w '  http://127.0.0.1:3000/en -> %{http_code}\n' http://127.0.0.1:3000/en || true
