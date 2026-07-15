#!/usr/bin/env sh
# =============================================================================
# 生产备份脚本（在 VPS 的项目目录下运行，配 cron 定时执行）
#
# 备份两样东西：
#   1. PostgreSQL 全量 dump（gzip 压缩）
#   2. uploads 卷（Payload 媒体文件）
#
# 用法：
#   ./scripts/backup-db.sh
# 可用环境变量覆盖：
#   BACKUP_DIR      备份目录（默认 /var/backups/efmc）
#   KEEP_DAYS       保留天数，过期自动清理（默认 14）
#   UPLOADS_VOLUME  uploads 卷名（默认 <目录名>_uploads，用 docker volume ls 确认）
#
# cron 示例（每天凌晨 3 点，日志追加到备份目录）：
#   0 3 * * * cd /opt/efmc && ./scripts/backup-db.sh >> /var/backups/efmc/backup.log 2>&1
#
# 恢复：
#   数据库：gunzip -c /var/backups/efmc/db-<时间戳>.sql.gz \
#           | docker compose exec -T postgres psql -U payload -d efmc
#   媒体： docker run --rm -v <卷名>:/data -v /var/backups/efmc:/backup alpine \
#           sh -c 'cd /data && tar xzf /backup/uploads-<时间戳>.tar.gz'
#
# 强烈建议再把 BACKUP_DIR 同步到异地（rclone 到对象存储 / 另一台机器），
# 本机备份挡不住整机故障。
# =============================================================================
set -eu

BACKUP_DIR="${BACKUP_DIR:-/var/backups/efmc}"
KEEP_DAYS="${KEEP_DAYS:-14}"
# compose 卷全名 = <compose 项目名（默认是目录名）>_uploads
UPLOADS_VOLUME="${UPLOADS_VOLUME:-$(basename "$(pwd)")_uploads}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "[$STAMP] 备份数据库…"
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-payload}" -d "${POSTGRES_DB:-efmc}" \
  | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

echo "[$STAMP] 备份 uploads 卷（$UPLOADS_VOLUME）…"
docker run --rm \
  -v "$UPLOADS_VOLUME":/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .

echo "[$STAMP] 清理 $KEEP_DAYS 天前的备份…"
find "$BACKUP_DIR" -name '*.gz' -mtime +"$KEEP_DAYS" -delete

echo "[$STAMP] 完成：$(du -sh "$BACKUP_DIR" | cut -f1) in $BACKUP_DIR"
