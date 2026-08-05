#!/usr/bin/env sh
# =============================================================================
# VPS 一键部署 / 更新脚本
# 前提：已安装 Docker + Compose 插件，.env 已按 .env.example 配好
# =============================================================================
set -e

# ---------------------------------------------------------------------------
# 起飞前检查：内存
#
# next build 是这台机器上最吃内存的一步（Turbopack 编译 + SSG 预渲染）。
# 小内存 VPS 上没有 swap 时，峰值会把内存吃光 —— 内核 OOM 杀进程，sshd
# 往往先死，表现为「构建到一半 SSH 断开且再也连不上，只能去服务商控制台
# 强制重启」。有 swap 的话只是变慢，机器还活着。
# ---------------------------------------------------------------------------
if [ "$(free -m 2>/dev/null | awk '/^Swap:/ {print $2}')" = "0" ]; then
  MEM_MB=$(free -m | awk '/^Mem:/ {print $2}')
  echo "✗ 这台机器没有 swap（内存 ${MEM_MB}MB）。构建期很可能把内存吃光、把 sshd 一起杀掉。"
  echo ''
  echo '  先加 4G swap 再部署（一次性操作，重启后仍生效）：'
  echo '    fallocate -l 4G /swapfile && chmod 600 /swapfile'
  echo '    mkswap /swapfile && swapon /swapfile'
  echo "    echo '/swapfile none swap sw 0 0' >> /etc/fstab"
  echo ''
  echo '  另外建议让 sshd 免于被 OOM 杀掉，保证任何情况下还能登进来：'
  echo '    mkdir -p /etc/systemd/system/ssh.service.d'
  echo "    printf '[Service]\\nOOMScoreAdjust=-900\\n' > /etc/systemd/system/ssh.service.d/oom.conf"
  echo '    systemctl daemon-reload && systemctl restart ssh'
  echo ''
  echo '  确认要冒险继续：SKIP_SWAP_CHECK=1 bash deploy.sh'
  [ -z "$SKIP_SWAP_CHECK" ] && exit 1
fi

# 构建很慢（2 核机器十分钟上下）。SSH 断线会连带杀掉构建，用 tmux 兜一下。
if [ -z "$TMUX" ] && [ -z "$SKIP_TMUX_HINT" ] && command -v tmux >/dev/null 2>&1; then
  echo '提示：构建耗时较长，建议在 tmux 里跑，SSH 断了也不会中断：'
  echo '  tmux new -s deploy   然后在里面执行 bash deploy.sh'
  echo '  （断线后用 tmux attach -t deploy 回到现场）'
  echo ''
fi

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
# 把当前 commit 烧进镜像，之后 docker compose exec app printenv GIT_SHA 就能
# 回答「线上跑的是哪一版」—— 不然只能翻 git log 猜。
GIT_SHA=$(git rev-parse --short=12 HEAD 2>/dev/null || echo unknown)
export GIT_SHA
echo "  本次部署 commit：$GIT_SHA"
docker compose build app

echo '[4/4] 启动应用（含 tunnel，若已启用）…'
docker compose up -d

echo '完成。健康检查：'
sleep 3
curl -sf -o /dev/null -w '  http://127.0.0.1:3000/en -> %{http_code}\n' http://127.0.0.1:3000/en || true
echo "  线上版本：$(docker compose exec -T app printenv GIT_SHA 2>/dev/null || echo '读取失败')"
