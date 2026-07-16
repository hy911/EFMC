# 部署文档 — 从零到上线

本文档记录 Donglin Controls 官网（efmc-automation.com）从零搭建到正式上线的**每一具体步骤**。技术栈：Payload CMS 3 + Next.js 16 单体架构 · PostgreSQL 18 · Docker Compose · Cloudflare Tunnel，部署在 Hetzner VPS。

> 首次读者按顺序做即可。已上线后的更新部署，直接看 [`MAINTENANCE.md`](MAINTENANCE.md) 的"更新部署"。

---

## 0. 总览：需要准备的东西

| 项目 | 用途 | 本项目实际值 |
|------|------|------|
| 域名 | 站点地址 | `efmc-automation.com`（在 Cloudflare 注册） |
| VPS | 跑应用 | Hetzner（Ubuntu，2C4G 起步） |
| Cloudflare 账号 | DNS + Tunnel + Turnstile + 缓存/限流 | 域名所在账号 |
| Resend 账号 | 发询盘通知邮件 + 后台系统邮件 | resend.com |

整体架构：

```
访问者 → Cloudflare（CDN/WAF/Turnstile）
            │  Cloudflare Tunnel（加密隧道，VPS 不开公网端口）
            ▼
        VPS 上的 Docker：
          cloudflared ──→ app:3000（Next.js + Payload 同进程）
                                │
                                └──→ postgres:5432（数据库）
                           uploads 卷（媒体文件）· pgdata 卷（数据库数据）
```

---

## 1. 准备密钥（约 15 分钟）

### 1.1 Resend（邮件）

1. 打开 https://resend.com → 注册登录
2. 左侧 **Domains → Add Domain** → 填 `efmc-automation.com`
3. 它给出几条 DNS 记录（SPF/DKIM）→ 到 **Cloudflare DNS 面板**逐条添加 → 回 Resend 点验证，等变绿
4. 左侧 **API Keys → Create API Key** → 复制（`re_` 开头）= 后面的 `RESEND_API_KEY`
5. 验证域名后，发件地址用 `noreply@efmc-automation.com`

> 可选：留空 `RESEND_API_KEY` 也能上线，只是不发邮件通知（询盘仍写库，后台可见）。

### 1.2 Cloudflare Turnstile（防垃圾询盘）

1. Cloudflare 仪表盘（账户主页，非单个域名页）→ 左侧 **Turnstile**
2. **Add widget**：名称随意，Hostname 填 `efmc-automation.com`（可加 `localhost` 便于本地测），Mode 选 **Managed**
3. 拿到 **Site Key**（公开）+ **Secret Key**（保密）

### 1.3 自己生成的两个必填密钥

```bash
openssl rand -hex 32     # 输出作为 PAYLOAD_SECRET
# POSTGRES_PASSWORD 自己定一个强密码
```

---

## 2. VPS 基础环境（约 10 分钟）

SSH 登录 VPS（Hetzner 给 root）：

```bash
# 安装 Docker + compose 插件
curl -fsSL https://get.docker.com | sh

# 防火墙：只放 SSH（Cloudflare Tunnel 是出站连接，无需开 80/443）
ufw allow OpenSSH && ufw enable
```

---

## 3. 拉代码 + 配置环境变量

```bash
git clone https://github.com/hy911/EFMC.git ~/app/EFMC
cd ~/app/EFMC
cp .env.example .env
nano .env
```

`.env` 填写（主机名 `postgres` 是 compose 服务名，别改成 IP）：

```dotenv
# 数据库
DATABASE_URL=postgres://payload:<你的强密码>@postgres:5432/efmc
POSTGRES_PASSWORD=<同一个强密码>

# Payload
PAYLOAD_SECRET=<openssl rand -hex 32 的输出>

# 站点
NEXT_PUBLIC_SITE_URL=https://efmc-automation.com

# Cloudflare Tunnel（见第 5 步拿 token）
CLOUDFLARE_TUNNEL_TOKEN=<第 5 步的 token>

# 邮件（Resend）
RESEND_API_KEY=<第 1.1 步的 key>
INQUIRY_NOTIFY_TO=<收询盘通知的运营邮箱>
INQUIRY_NOTIFY_FROM=noreply@efmc-automation.com

# Turnstile（第 1.2 步）
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<Site Key>
TURNSTILE_SECRET_KEY=<Secret Key>
```

> 密码含特殊字符（如 `!`）没问题。`DATABASE_URL` 用 `postgres:5432` 是运行时的正确写法；构建阶段 compose 会自动换成 `127.0.0.1:5432`，无需你操心。

---

## 4. 先建 Cloudflare Tunnel 拿 token（约 5 分钟）

第 5 步部署前需要 token，所以先建：

1. Cloudflare 仪表盘 → **Zero Trust → Networks → Tunnels → Create a tunnel**
2. 类型选 **Cloudflared** → 命名（如 `efmc`）→ 创建
3. 页面给出安装命令，**里面那串 token 复制出来**填进 `.env` 的 `CLOUDFLARE_TUNNEL_TOKEN`
   （安装命令本身**不用跑**——我们用 compose 里的 cloudflared 容器）
4. Public Hostname 先不配，等应用起来后第 6 步再配

---

## 5. 部署

```bash
cd ~/app/EFMC
./deploy.sh
```

`deploy.sh` 自动做四件事：

1. `docker compose up -d postgres` — 起数据库
2. 轮询 `pg_isready` 等库就绪（首次要跑 initdb）
3. `docker compose build app` — 构建镜像（**构建期跑数据库迁移建表 + 预渲染页面**）
4. `docker compose up -d` — 起 app + postgres + cloudflared（检测到 token 自动带 tunnel）

成功标志：末尾输出

```
完成。健康检查：
  http://127.0.0.1:3000/en -> 200
```

> ⚠️ 生产是**空库**，第一次 `deploy.sh` 会自动迁移建表。**不要在生产跑 `pnpm seed`**（那是演示数据）。

---

## 6. Cloudflare Tunnel 接入公网（约 3 分钟）

回到第 4 步创建的 tunnel → **Public Hostname → Add a public hostname**：

- **Subdomain**：留空
- **Domain**：`efmc-automation.com`
- **Type**：`HTTP`
- **URL**：`app:3000`  ← **一定填 `app`，不是 `localhost`**（cloudflared 与 app 在同一 Docker 网络，靠服务名互通）

保存后 Cloudflare 自动建 DNS 记录（橙云代理）。稍等片刻访问 `https://efmc-automation.com/` 应能打开（会自动跳到 `/en`）。

可选：再加一条 `www` 子域指向同一 `app:3000`。

---

## 7. Cloudflare 安全/缓存规则（约 10 分钟）

进 dash.cloudflare.com → 点域名 `efmc-automation.com`：

### 7.1 Cache Rules（缓存绕过，必配）

**Caching → Cache Rules → Create rule**：
- Name：`bypass-admin-api`
- 表达式（Edit expression）：
  ```
  (starts_with(http.request.uri.path, "/admin")) or (starts_with(http.request.uri.path, "/api/"))
  ```
- Then → Cache eligibility：**Bypass cache** → Deploy

### 7.2 SSL/TLS 模式

**SSL/TLS → Overview** → 设为 **Full**（Tunnel 到源已加密）。

### 7.3 Rate Limiting（限流，免费版仅 1 条）

**Security → Security rules → Create rule → Rate limiting rule**：
- Name：`ratelimit-login`
- 表达式：`(http.request.uri.path eq "/api/users/login")`
- When rate exceeds：`5` requests / `1 minute` / same **IP**
- Then：**Block**

> 免费版通常只允许 1 条规则，优先给后台登录防爆破。询盘接口 `/api/inquiries` 已有 Turnstile 人机验证兜底，不建限流也能防住机器人。

---

## 8. 备份（上线必配）

```bash
# 配 cron，每天凌晨 3 点备份数据库 + 媒体卷
crontab -e
# 加一行：
0 3 * * * cd ~/app/EFMC && ./scripts/backup-db.sh >> /var/backups/efmc/backup.log 2>&1
```

备份内容与恢复方法详见 [`MAINTENANCE.md`](MAINTENANCE.md) 的"备份与恢复"。**强烈建议**再把 `/var/backups/efmc` 用 rclone 同步到异地（本机备份挡不住整机故障）。

---

## 9. 上线内容 + 验收

1. **建管理员**：访问 `https://efmc-automation.com/admin`，第一次会引导创建管理员账号
2. **填站点设置**：后台 SiteSettings 填真实邮箱/电话/WhatsApp（后台操作见 [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md)）
3. **录内容**：产品（中英）、案例、证书、About 页；替换所有占位图
4. **Hero 大图**：如需替换首页大图，改代码库 `public/images/hero-placeholder.png` 后重新 `git pull && ./deploy.sh`
5. **验收询盘链路**：首页提交一条测试询盘 → 确认①表单成功态 ②运营邮箱收到 Resend 通知 ③后台询盘列表可见
6. **SEO**：Google Search Console 验证域名并提交 `https://efmc-automation.com/sitemap.xml`
7. 手机过一遍中英版首页/产品/案例

---

## 附：这套部署踩过的坑（已在代码里修好，供理解）

| 现象 | 根因 | 处理 |
|------|------|------|
| 构建期 `payload migrate` 报 `ECONNREFUSED 127.0.0.1:5432` | postgres 没起来 | 见下两条 |
| postgres 容器拒绝启动 | postgres:18 镜像改了数据目录约定 | 卷挂 `/var/lib/postgresql`（不带 `/data`），已在 `docker-compose.yml` |
| 库刚起还没就绪就 build | 首次 initdb 需要时间 | `deploy.sh` 加了 `pg_isready` 就绪门 |
| `pnpm i` 报 `ERR_PNPM_IGNORED_BUILDS` | corepack 拉到更严格的 pnpm 默认版 | Dockerfile 钉死 pnpm 10.33.0 + `ignoredBuiltDependencies` |
