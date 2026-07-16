# 维护文档 — 日常运维

面向运维/开发人员。首次部署见 [`DEPLOYMENT.md`](DEPLOYMENT.md)，运营后台见 [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md)。

项目在 VPS 上的路径：`~/app/EFMC`（下文命令都在此目录执行）。

---

## 1. 更新部署（改了代码后上线）

代码合并进 `main` 后：

```bash
cd ~/app/EFMC
git checkout main
git pull
./deploy.sh
```

`deploy.sh` 会重新构建镜像（含增量迁移）并滚动重启容器。Docker 层缓存让没变的部分秒过，通常 1–2 分钟完成。数据库数据（`pgdata` 卷）和媒体文件（`uploads` 卷）不受影响。

**只改了内容、没改代码**：不用重新部署——运营在后台保存即通过 ISR 自动生效（见下"内容不更新"排查）。

---

## 2. 数据库迁移（改了 schema）

改了 collection/字段结构时，**在开发机**生成迁移文件并提交：

```bash
pnpm generate:types              # 重新生成 payload-types.ts
pnpm payload migrate:create <描述性名字>   # 生成 migrations/ 下的迁移文件
# 迁移文件必须 git 提交
```

生产端 `./deploy.sh` 会在构建阶段自动应用未执行的迁移。**不要手改迁移文件或数据库结构**。

> ⚠️ 别在生产用 dev 模式（`pnpm dev`）——它的 Drizzle push 会交互式询问 schema 变更，无人值守会卡住。schema 变更一律走 `migrate:create` + `migrate`。

---

## 3. 备份与恢复

### 备份

`scripts/backup-db.sh` 一次备份两样：**PostgreSQL 全量 dump（gzip）** + **uploads 媒体卷（tar.gz）**，并自动清理 14 天前的旧备份。

已配 cron（每天 3:00）。手动备份：

```bash
./scripts/backup-db.sh
ls -lh /var/backups/efmc/     # db-<时间戳>.sql.gz + uploads-<时间戳>.tar.gz
```

可用环境变量覆盖：`BACKUP_DIR`（默认 `/var/backups/efmc`）、`KEEP_DAYS`（默认 14）。

**异地备份（强烈建议）**：本机备份挡不住整机故障。用 rclone 同步到对象存储或另一台机器：

```bash
rclone sync /var/backups/efmc remote:efmc-backups
```

### 恢复数据库

```bash
gunzip -c /var/backups/efmc/db-<时间戳>.sql.gz \
  | docker compose exec -T postgres psql -U payload -d efmc
```

### 恢复媒体文件

```bash
docker run --rm -v efmc_uploads:/data -v /var/backups/efmc:/backup alpine \
  sh -c 'cd /data && tar xzf /backup/uploads-<时间戳>.tar.gz'
```

---

## 4. 日志与排查

```bash
docker compose ps                      # 看容器状态（Up/Healthy）
docker compose logs -f app             # 应用日志（询盘、revalidate、报错）
docker compose logs -f postgres        # 数据库日志
docker compose logs -f cloudflared     # 隧道连接状态
docker compose logs --tail 100 app     # 最近 100 行
```

健康自查：

```bash
curl -I http://127.0.0.1:3000/en       # 应 200
docker compose exec postgres pg_isready -U payload -d efmc   # accepting connections
```

---

## 5. 常见故障速查

| 现象 | 排查 / 处理 |
|------|------|
| 站点打不开（Cloudflare 5xx/1033） | `docker compose logs cloudflared` 看隧道是否连上；`docker compose ps` 看 app 是否 Up；Public Hostname 的 Service 必须是 `http://app:3000` |
| 本机 `curl :3000` 不通 | `docker compose logs app` 看启动报错；多半是 `.env` 的 `DATABASE_URL`/`PAYLOAD_SECRET` 有误 |
| 构建期 `ECONNREFUSED 127.0.0.1:5432` | postgres 没起来：`docker compose logs postgres`。若报"数据目录约定"错，确认卷挂 `/var/lib/postgresql`（不带 `/data`） |
| `pnpm ERR_PNPM_IGNORED_BUILDS` | Dockerfile 应钉 pnpm 10.33.0 + package.json 有 `ignoredBuiltDependencies`（已在 main） |
| 内容改了不更新 | 后台 afterChange 钩子触发 `revalidatePath`；仍不更新则等 ISR 兜底（≤10 分钟），或 `./deploy.sh` 强制重建 |
| 收不到询盘邮件 | ①`.env` 的 `RESEND_API_KEY`/`INQUIRY_NOTIFY_TO` 是否填；②Resend 后台看发送日志；③域名是否验证通过；④询盘仍在后台可见（邮件失败不阻塞写库） |
| 表单提交老失败 | Turnstile 配置：`.env` 两个 key 与 Cloudflare widget 是否匹配、widget 的 hostname 是否含正式域名 |
| 磁盘满 | `docker system prune -af` 清理旧镜像/构建缓存；`du -sh /var/backups/efmc` 看备份占用 |

---

## 6. 依赖与运行时升级

- **应用依赖**：在开发机 `pnpm update`（或改 package.json 版本）→ `pnpm install` 更新 lockfile → 本地 `pnpm build` + 测试通过 → 提交 → 生产 `./deploy.sh`。lockfile 必须提交
- **Node 运行时**：Dockerfile 基础镜像 `node:24-alpine` 与 CI 的 `node-version: 24` 保持一致，一起改
- **pnpm 版本**：Dockerfile `corepack prepare pnpm@X` 与本地/CI 保持一致
- **PostgreSQL 大版本升级**（如 18→19）：**不能直接换镜像 tag**——18+ 数据目录版本化，跨大版本要 `pg_upgrade` 或 dump/restore。做法：先备份 → 起新版空库 → 恢复 dump。小版本（18.x）可直接换 tag
- **Payload / Next 升级**：跨 minor 先读 changelog，本地验证 `pnpm build` + e2e 全过再上

CI（`.github/workflows/ci.yml`）会在每个 PR 上跑 lint → 类型检查 → 迁移 → 构建 → vitest → e2e，合并前务必绿。

---

## 7. TLS / 证书

用 Cloudflare Tunnel 时**无需在 VPS 管证书**——Cloudflare 边缘自动签发/续期，隧道到源加密。SSL/TLS 模式保持 **Full**。改用源站 443 + Caddy 反代的话，Caddy 自动 Let's Encrypt。

---

## 8. 监控建议（可选）

零 SaaS 约束下的轻量选择：

- **可用性**：Cloudflare 自带 Health Checks（付费）或用免费的 UptimeRobot 拨测 `https://efmc-automation.com/en`
- **流量分析**：Cloudflare Web Analytics（免费、无 cookie，仪表盘开启即可）
- **资源**：`docker stats` 看容器 CPU/内存；Hetzner 控制台看主机负载
