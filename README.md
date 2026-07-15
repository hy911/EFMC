# Donglin Controls 官网（EFMC）

天津东林众控自动化科技有限公司官网 —— 面向海外 B2B 客户的展示 + 询盘（Lead Gen）站点。

**技术栈**：Payload CMS 3 + Next.js 16（App Router）单体架构 · PostgreSQL · Tailwind CSS v4 · next-intl · TypeScript。CMS 后台、SEO 前端、询盘 API 同一代码库、一次部署，零 SaaS 订阅。

## 功能一览（一期）

- **首页**：严格按 Claude Design 设计稿 1:1 还原（工业深蓝 `#0B1F3F` + 强调蓝 `#1B63E8`），布局代码固定，产品/行业/联系方式由后台驱动
- **数据模型**：Products（多图/规格/分类/精选，无价格）、ProductCategories、Certificates、ApplicationScenarios、Pages（5 种 block 灵活布局）、Inquiries（仅 API 写入，后台只读 + 改状态）、Media（自动 WebP 多尺寸）、SiteSettings（联系方式/WhatsApp）
- **多语言（两层）**：UI 文案 next-intl（`src/i18n/messages/*.json`，开发维护）；业务内容 Payload Localization（后台切语言编辑）。URL 子目录 `/en` `/zh`，默认 en，zh 未翻译字段自动回落
- **询盘链路**：表单 → `/api/inquiries`（Zod 校验 + 蜜罐 + Cloudflare Turnstile）→ 写库 → Resend 邮件通知（失败不阻塞）；WhatsApp 浮动按钮 + 产品页 wa.me 深链预填产品名
- **SEO**：每页 hreflang（en/zh/x-default）、分语种 sitemap.xml、robots.txt、JSON-LD（Organization/Product/Article）、图片 alt 本地化、SSG + ISR（后台保存即触发 revalidate）

## 本地开发

```bash
# 1. 数据库（本机 Docker 起一个 Postgres 即可）
docker run -d --name efmc-pg -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload \
  -e POSTGRES_DB=efmc -p 5432:5432 postgres:18-alpine

# 2. 环境变量
cp .env.example .env   # 按需修改；本地开发 Resend/Turnstile 留空即可

# 3. 依赖 + 数据库迁移 + 演示数据
pnpm install
pnpm payload migrate
pnpm seed              # 幂等；创建管理员 admin@example.com / changeme-123456

# 4. 启动
pnpm dev               # 前台 http://localhost:3000/en  后台 /admin
```

常用命令：`pnpm generate:types`（改 collection 后重新生成 payload-types.ts）、`pnpm payload migrate:create <name>`（改 schema 后生成迁移，迁移文件必须进 git）、`pnpm lint`、`pnpm build`。

**CI**：`.github/workflows/ci.yml` 在 PR 和 main 推送时自动跑 lint → 类型检查 → 迁移 → 构建 → vitest → Playwright e2e（真实 Postgres service container），e2e 失败会上传现场报告 artifact。

## 生产部署（VPS + Docker Compose + Cloudflare）

```bash
# VPS 上
cp .env.example .env
# 必改：PAYLOAD_SECRET（openssl rand -hex 32）、POSTGRES_PASSWORD、
#       NEXT_PUBLIC_SITE_URL=https://你的域名、
#       DATABASE_URL=postgres://payload:<密码>@postgres:5432/efmc（主机名用服务名）
#       RESEND_API_KEY / INQUIRY_NOTIFY_TO / TURNSTILE 两个 key

./deploy.sh   # = up postgres → build app（host 网络：迁移+预渲染需连库）→ up -d
```

要点：

- **迁移在镜像构建阶段执行**（standalone 运行时不含 Payload CLI），所以 build 必须能连到数据库 —— compose 已配置 `build.network: host` + 仅绑定 `127.0.0.1` 的 5432 端口
- **uploads 卷**：媒体文件在 `uploads` named volume，删容器不丢图
- **应用端口**只绑 `127.0.0.1:3000`，由 Cloudflare Tunnel 或本机 Nginx/Caddy 回源

### Cloudflare 侧配置

1. DNS 橙云代理，SSL/TLS 模式 **Full (strict)**（本机反代配源站证书）或使用 Cloudflare Tunnel
2. Cache Rules：`/admin*` 与 `/api/*` **Bypass cache**（后台与询盘接口绝不能缓存）
3. 询盘接口已优先读取 `CF-Connecting-IP` 获取真实客户端 IP（Turnstile 校验用）
4. Turnstile 在 Cloudflare 控制台创建 widget，把 site key / secret 填入 `.env`
5. **Rate Limiting 规则（上线必配）**——应用层没有做限流，垃圾/滥用防护分两层：
   Turnstile 挡机器人 + Cloudflare 限流挡高频。建议两条规则：
   - 询盘接口：`http.request.uri.path eq "/api/inquiries" and http.request.method eq "POST"`
     → 同 IP **5 次 / 1 分钟**，超出 Block 10 分钟
   - 后台登录：`http.request.uri.path eq "/api/users/login"`
     → 同 IP **5 次 / 5 分钟**，超出 Block 15 分钟（防暴力破解）

### 备份（上线必配）

`scripts/backup-db.sh` 一次备份 **数据库 dump + uploads 媒体卷**，自动清理过期备份。
在 VPS 项目目录配 cron（每天凌晨 3 点）：

```
0 3 * * * cd /opt/efmc && ./scripts/backup-db.sh >> /var/backups/efmc/backup.log 2>&1
```

恢复方法写在脚本头部注释里。本机备份挡不住整机故障——建议再用 rclone 把
`/var/backups/efmc` 同步到异地（对象存储或另一台机器）。

### 系统邮件

配置了 `RESEND_API_KEY` 后，Payload 后台的**忘记密码/用户验证邮件**自动走 Resend
（`@payloadcms/email-resend`，与询盘通知共用同一个 key 和发件地址）；
未配置时邮件内容输出到控制台（仅限本地开发）。

## 目录结构

```
src/
├── app/
│   ├── (frontend)/[locale]/        # /en /zh 前台：首页、products/[slug]、[slug] 固定页
│   ├── (payload)/                  # Payload 后台 /admin 与 REST /api（无语言前缀）
│   ├── api/inquiries/route.ts      # 询盘提交接口（表单唯一写入口）
│   ├── sitemap.ts / robots.ts      # 分语种 sitemap + robots
├── collections/                    # Payload collections（含中文后台标签）
├── globals/SiteSettings.ts         # 联系方式 / WhatsApp（运营后台可改）
├── blocks/                         # Pages 的 block 定义 + 前端渲染器
├── components/{ui,layout,home}/    # 原子组件 / 布局 / 首页区块
├── fields/                         # 可复用 SEO 字段组、slug hook
├── hooks/revalidate.ts             # 发布即刷新（ISR 按需 revalidate）
├── i18n/                           # next-intl 路由与 UI 文案 JSON
├── lib/                            # Local API 查询、SEO/JSON-LD、Turnstile、Resend
├── migrations/                     # 数据库迁移（进 git，构建时执行）
├── payload.config.ts               # Payload 唯一配置入口（含 en/zh localization）
└── proxy.ts                        # next-intl 语言路由（排除 /admin /api）
seed/                               # 演示数据种子（pnpm seed，幂等）
```

## 二期进度

- ✅ CaseStudies（客户案例）：行业/地点/成果指标/关联产品，路由 `/cases` `/cases/[slug]`
- ✅ Posts（技术博客）：路由 `/blog` `/blog/[slug]`，Article JSON-LD

### 已决策暂不做（扩展锚点保留）

- **更多语种**：当前只做中英（已确认）。未来扩展时同步修改 `src/i18n/routing.ts`
  与 `payload.config.ts` 的 localization.locales，并补 `src/i18n/messages/<locale>.json`；
  RTL 语种在 Payload locale 配置加 `rtl: true`，前端 `<html dir>` 按语种输出
- **图片对象存储**：暂用 Payload 本地存储（uploads 卷）。需要时换
  `@payloadcms/storage-s3` 插件，Media collection 无需改动
