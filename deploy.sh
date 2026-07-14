#!/usr/bin/env sh
# =============================================================================
# VPS 一键部署 / 更新脚本
# 前提：已安装 Docker + Compose 插件，.env 已按 .env.example 配好
# =============================================================================
set -e

echo '[1/3] 启动数据库…'
docker compose up -d postgres

echo '[2/3] 构建应用镜像（含数据库迁移 + 预渲染）…'
docker compose build app

echo '[3/3] 启动应用…'
docker compose up -d

echo '完成。健康检查：'
sleep 3
curl -sf -o /dev/null -w '  http://127.0.0.1:3000/en -> %{http_code}\n' http://127.0.0.1:3000/en || true
