---
name: deploy
description: 部署到生产 VPS 的完整流程——先算出线上落后哪些提交、检查这批里有没有迁移、部署、再验证真的上去了。会改生产，只能由用户手动调用。
disable-model-invocation: true
---

# 部署到生产

**这会改生产站。** `deploy.sh` 本身已经把危险的部分处理好了（swap 检查、就绪等待、固定的四步顺序），这份清单管的是它**管不到**的：部署前该看什么、部署后怎么确认真的上去了。

不要重写 `deploy.sh` 的逻辑，直接跑它。

## 1. 线上现在是哪一版

```bash
# 在服务器上
docker compose exec -T app printenv GIT_SHA
```

拿这个短 sha 和本地比：

```bash
git fetch
git log --oneline <线上sha>..origin/main
```

输出就是**这次要上的东西**。空的话不用部署。

> `GIT_SHA` 是 `deploy.sh` 在构建时烧进镜像的。返回 `unknown` 说明那次是手工
> `docker compose build` 上的，只能靠时间戳猜——以后一律走 `deploy.sh`。

## 2. 这批提交里有没有迁移

```bash
git diff --name-only <线上sha>..origin/main -- src/migrations/
```

**有迁移就先审**：迁移在 Docker builder 阶段执行（`Dockerfile` 里 `pnpm payload migrate && pnpm build`），炸了就是构建失败、部署上不去。派 `migration-reviewer` 子代理过一遍，重点是：

- `ADD COLUMN … DEFAULT` 会回填现有行，默认值对既有数据是否正确
- 标识符有没有超 Postgres 的 63 字符（开了草稿的 collection 还有 `_v_` 前缀那份更长）

**有迁移就先备份数据库**，回滚 schema 比回滚代码难得多：

```bash
docker compose exec -T postgres pg_dump -U payload efmc | gzip > ~/efmc-$(date +%F-%H%M).sql.gz
```

## 3. 部署

```bash
cd /path/to/EFMC
git pull
tmux new -s deploy      # 构建 10 分钟上下，SSH 断了会连带杀掉构建
bash deploy.sh
```

`deploy.sh` 的四步顺序（起库 → 等 `pg_isready` → build → up）是固定的，别拆开手工执行——不等就绪直接 build 会 ECONNREFUSED。

## 4. 部署后验证

`deploy.sh` 末尾会打健康检查和新的 `GIT_SHA`。先确认那个 sha 变成了刚才 `git pull` 到的版本；没变说明镜像没重建。

然后按这次改了什么抽查，别只看首页 200：

```bash
BASE=https://efmc-automation.com
for p in /en /zh /en/products /en/cases /zh/cases /en/blog; do
  curl -sf -o /dev/null -w "$p -> %{http_code}\n" "$BASE$p"
done
```

- **改了案例/文章** → 打开那一页，确认新内容真的在（`revalidatePath` 钩子应该已经刷了；没刷就等 ISR 的 600 秒兜底，或去后台重新保存一次触发）
- **改了询盘链路** → 真提交一次表单，确认收到通知邮件。Turnstile 的 site key 漏进构建期会表现为 403 `Turnstile verification failed`
- **改了图片/媒体** → 确认图能加载（`uploads/` 是挂载卷，不随镜像更新）
- **改了后台字段** → 登录 `/admin` 看一眼新字段在不在

## 5. 出问题了

镜像还在，回滚就是重建上一个 commit：

```bash
git log --oneline -5
git checkout <上一个好的 sha>
bash deploy.sh
```

**但迁移不会自动回滚。** 如果这次带了迁移，代码回滚后 schema 仍是新的——多数情况能跑（多出来的列不影响旧代码），但删列/改类型的迁移会让旧代码直接崩。那种情况用第 2 步的备份恢复库。

## 常见坑（都踩过，别回退）

- `postgres:18` 的卷挂载点是 `/var/lib/postgresql`（**不带** `/data`）。挂错容器直接拒绝启动，表现为构建期迁移 ECONNREFUSED
- `NEXT_PUBLIC_*` 必须进 Dockerfile ARG + compose `build.args`，只放运行时 `env_file` 不够
- `--max-old-space-size` 钉在 2048。生产机 2 核 4GB，调大会触发内核 OOM，被杀的往往是 sshd
- Cloudflare Tunnel 的 Public Hostname 里 Service 填 `http://app:3000`（Docker 网络内的服务名，不是 localhost）

完整说明见 `docs/DEPLOYMENT.md`，排障见 `docs/MAINTENANCE.md`。
