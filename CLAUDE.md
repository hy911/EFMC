# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

天津东林众控（Donglin Controls）官网：面向海外 B2B 客户的展示 + 询盘（Lead Gen）站点，不做在线交易。Payload CMS 3 + Next.js 16（App Router）**单体架构**——CMS 后台（`/admin`）、SEO 前端（`/en` `/zh`）、询盘 API 在同一代码库、同一进程、一次部署。数据库 PostgreSQL，部署为 VPS + Docker Compose + Cloudflare，零 SaaS 依赖（图片走 Payload 本地存储）。

前台路由（均带 `/en` `/zh` 前缀）：首页、`/products`（按分类分组）+ `/products/[slug]`、`/cases` + `/cases/[slug]`（客户案例，二期）、`/blog` + `/blog/[slug]`（技术博客，二期）、`/[slug]`（Pages collection 的固定页，如 about）。

**已定的范围决策**（不要当成待办重新提起）：语种只做中英；图片用本地存储不上对象存储（扩展锚点见 README 二期进度）。

首页视觉以 Claude Design 设计稿为准（工业深蓝 `#0B1F3F`、强调蓝 `#1B63E8`、Archivo + IBM Plex Sans、直角无圆角）；设计 token 全部在 `src/app/(frontend)/globals.css` 的 `@theme` 块中（Tailwind v4 CSS-first，没有 tailwind.config）。

## 常用命令

```bash
# 前置：本地 Postgres（docker run … postgres:18-alpine，端口 5432，见 README）
pnpm install
pnpm payload migrate            # 应用数据库迁移
pnpm seed                       # 演示数据（幂等）；创建管理员 admin@example.com / changeme-123456
pnpm dev                        # http://localhost:3000/en，后台 /admin

pnpm build                      # 生产构建（SSG 预渲染会连库，Postgres 必须在跑）
pnpm lint                       # ESLint 9 flat config
pnpm exec tsc --noEmit          # 类型检查

pnpm generate:types             # 改 collection/global 后必须重新生成 payload-types.ts
pnpm payload migrate:create <name>  # 改 schema 后生成迁移（迁移文件必须进 git）

pnpm test:int                   # vitest 集成测试；单个测试：pnpm exec vitest run tests/int/api.int.spec.ts
pnpm test:e2e                   # Playwright；e2e 依赖已 seed 的数据库
```

e2e 的 `webServer` 会自己 `pnpm dev` 起服务（`reuseExistingServer: true`，本地已开着 dev 就复用），但**不会**自己 seed——库里得先有 `pnpm seed` 的数据和管理员账号（`tests/helpers/login.ts`、`seedUser.ts` 依赖它）。

沙箱/CI 环境禁止 `playwright install` 时，用环境变量指向系统 Chromium：
`CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium pnpm exec playwright test --reporter=list`

注意：dev 模式 Drizzle 会交互式询问 schema 变更（列改名 vs 新建），无人值守环境下会卡住——schema 变更一律走 `migrate:create` + `migrate`，别依赖 dev push。已被 dev push 污染过的库还有第二道坎：`payload migrate` 自己也会弹一次 `data loss will occur … (y/N)` 确认，而输出被 pipe 时看不到提示符，表现为**命令永久挂起、零输出**。无人值守用 `yes y | pnpm payload migrate`（确认接受丢数据，跑完补 `pnpm seed`）。

**改 collection / block 定义之前先停掉 dev server。** dev server 一直在跑的话，改完文件它会立刻热重载并把新 schema push 进库；随后 `migrate` 就会撞 `relation … already exists` / `type … already exists` 而整条迁移失败（迁移是一个事务里的多条语句，前面几条建过的表不会回滚）。这个坑在本项目连踩三次（`case_studies_highlights` 表、章节 `intro` 列、`enum_..._case_cards_layout` 枚举）。

已经撞上了就得手工回滚 dev push 建的东西，再重跑迁移。先读迁移文件确认它到底建了什么：

```bash
grep -o 'CREATE TABLE "[a-z_]*"' src/migrations/<name>.ts
grep -o 'ADD COLUMN "[a-z_]*"' src/migrations/<name>.ts
```

然后写个临时 tsx 脚本，用 `payload.db.pool.query()` 执行 `DROP TABLE IF EXISTS`（删之前先 `select count(*)` 确认是空表）/ `ALTER TABLE … DROP COLUMN IF EXISTS` / `DROP TYPE IF EXISTS`，最后 `yes y | pnpm payload migrate`。注意 `pg` 不是直接依赖，脚本里连库要走 `getPayload({ config })` 拿 `payload.db.pool`，不能 `import pg`。

## 架构要点（跨文件才能看懂的部分）

### 两层多语言，别混淆

- **UI 文案**（导航/按钮/表单标签）：next-intl，JSON 在 `src/i18n/messages/{en,zh}.json`，开发维护
- **业务内容**（产品/页面正文/图片 alt）：Payload Localization，配置在 `payload.config.ts`（`fallback: true`，zh 缺失回落 en），运营在后台切语言编辑
- 两处 locale 列表必须**同步维护**：`src/i18n/routing.ts` 与 `payload.config.ts` 的 `localization.locales`。二期扩语种改这两处（RTL 语种加 `rtl: true`）
- URL 恒带语言前缀（`/en` `/zh`，`localePrefix: 'always'`）；`src/proxy.ts`（Next 16 的 middleware）的 matcher **必须排除 `/admin` 和 `/api`**，否则 Payload 后台 404
- 页面组件里用 `@/i18n/navigation` 导出的 `Link/redirect/usePathname`，不要用 next/link、next/navigation 的原始版本（会丢语言前缀）
- slug **不做** localized：各语种共用 URL 路径，语言差异只由前缀表达（hreflang 互链依赖这一点）

### 询盘（Inquiries）的安全模型

写入唯一入口是 `src/app/api/inquiries/route.ts`（Zod 校验 → 蜜罐 `website` 字段 → Turnstile → Local API 写库 → Resend 通知）。collection 本身 `create: noOne`、`read: authenticated`——Local API 默认 `overrideAccess` 所以服务端能写，公开 REST/GraphQL 完全关死。后台字段全部 `admin.readOnly`，只有 `status` 可改。改这条链路时不要打破这个模型（例如不要给 Inquiries 开公开 access）。Turnstile/Resend 环境变量留空 = 功能自动关闭（本地开发态）。

限流不在应用层做：靠 Cloudflare Rate Limiting 规则（README Cloudflare 小节有具体规则），不要在 route handler 里加内存限流（多实例/重启即失效，且与既定架构重复）。

邮件分两路：询盘通知走 `src/lib/notify.ts` 直发；Payload 系统邮件（后台忘记密码等）走 `payload.config.ts` 里按 `RESEND_API_KEY` 条件挂载的 `resendAdapter`，共用同一 key。

### 数据流与 ISR

前端页面（RSC）通过 `src/lib/queries.ts` 的 Local API 查数（无 HTTP），locale 透传。页面 SSG + `revalidate = 600` 兜底；真正的"发布即生效"靠 `src/hooks/revalidate.ts`——collection/global 的 afterChange 钩子调 `revalidatePath`（Payload 与 Next 同进程才可行）。钩子内部 try/catch：seed 等非 Next 运行时会抛错，安全降级。新增内容 collection 时照 Products（或二期 CaseStudies/Posts）的模式挂 revalidate 钩子，并在 `src/app/sitemap.ts` 补收录。

注意 import 写法：`revalidatePath` 必须从 **`next/cache.js`**（带扩展名）导入——next 包没有 exports map，裸子路径 `next/cache` 在纯 Node/tsx 环境（seed、Playwright 加载 payload 配置）解析不了。

### 新增内容 collection 的固定清单

照 `src/collections/Products.ts` 抄，别从零写字段：
1. slug 用 `src/fields/slug.ts` 的 `slugField()`（自带 beforeValidate 自动生成、非 localized）；SEO 用 `src/fields/seo.ts` 的 `seoField`（metaTitle/metaDescription/ogImage，前端在 `generateMetadata()` 消费）
2. access 用 `src/access/index.ts` 的 `anyone`/`authenticated`/`noOne`，不要在 collection 里内联匿名函数
3. 挂 `src/hooks/revalidate.ts` 的 afterChange 钩子 → 补 `src/app/sitemap.ts` → 补 `src/lib/queries.ts` 查询函数
4. **先停 dev server**，再 `pnpm payload migrate:create <name>` + `pnpm generate:types`（两个都要，迁移文件进 git）

### Payload localized 数组/blocks 的一个坑

数组（`specs`、`images`）和 blocks（`Pages.layout`）**结构本身不是 localized**，只有内部叶子字段是。用 Local API 更新另一语种时必须带上原有的行 id / block id（先读回 en 文档再 map），否则数组被重建、原语种的值全丢。`seed/index.ts` 里有正确写法示例（产品 specs 和 about 页 layout）。

### 部署的特殊约束

`next build` 预渲染要连库，且 standalone 运行时**不含 Payload CLI**，所以 **`payload migrate` 在 Docker builder 阶段执行**（Dockerfile 里 `pnpm payload migrate && pnpm build`），compose 用 `build.network: host` + 仅绑 127.0.0.1 的 5432 让构建期能连上 postgres 容器。部署顺序固定：先 `up -d postgres`，等 `pg_isready` 就绪，再 `build app`，再 `up -d`（`deploy.sh` 封装了这四步；不等就绪直接 build 会 ECONNREFUSED）。Media 的 `staticDir` 锚定 `process.cwd()`（容器内 `/app/uploads` 挂持久卷），不要改成相对路径或 import.meta 推导。

两个部署踩过的坑（别回退）：
- **postgres:18 卷挂载点是 `/var/lib/postgresql`（不带 `/data`）**——18+ 镜像改了约定，挂旧的 `/var/lib/postgresql/data` 容器直接拒绝启动，表现为构建期迁移 ECONNREFUSED（其实是库没起来）。见 `docker-compose.yml` 注释
- **Docker 的 pnpm 版本钉死 10.33.0**（Dockerfile base 层 `corepack prepare`，CI 的 `pnpm/action-setup` 也钉 10）+ `package.json` 的 `pnpm.ignoredBuiltDependencies` 声明 `@parcel/watcher`/`@swc/core`——否则 corepack 拉到更严格的默认版本会把 `ERR_PNPM_IGNORED_BUILDS` 当致命错误
- **构建脚本白名单要在两处各写一遍，别删任何一处**：pnpm 11（本地开发）**完全不读 `package.json` 的 `pnpm` 字段**了（会 WARN `no longer read by pnpm`），改读 `pnpm-workspace.yaml` 的 `allowBuilds`；而 Docker/CI 钉的 pnpm 10 不认 `allowBuilds`、只认 `package.json`。所以 `sharp`/`esbuild`/`unrs-resolver` 放行、`@parcel/watcher`/`@swc/core` 拒绝这套声明在两个文件里冗余存在，是刻意的——删掉 `package.json` 那份会让 Docker 构建挂，删掉 yaml 那份会让本地 `pnpm install` 不编译 sharp
- **`NEXT_PUBLIC_*` 变量必须进 Dockerfile ARG + compose build.args**（不能只放运行时 `env_file`）——Next.js 构建期把它们编进前端 bundle。漏了 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 会让前端 widget 不渲染、表单无 token，而服务端有 secret 要校验 → 403 `Turnstile verification failed`

Cloudflare Tunnel（cloudflared）内建在 compose 的 `tunnel` profile：`.env` 设了 `CLOUDFLARE_TUNNEL_TOKEN` 则 `deploy.sh` 自动带起；Tunnel 的 Public Hostname 里 Service 填 `http://app:3000`（同 Docker 网络的服务名，不是 localhost）。限流靠 Cloudflare Rate Limiting（免费版仅 1 条规则，优先给后台登录防爆破；询盘接口有 Turnstile 兜底）。

### 前端约定

- 首页区块结构在代码里**固定**（`src/components/home/`，保证设计还原度），数据动态：精选产品 = `featured: true` 前 6、行业 = ApplicationScenarios 按 `displayOrder` 前 5、联系方式 = SiteSettings global。Hero 等固定文案在 next-intl JSON，不在 CMS
- 固定页走 `Pages` collection 的 blocks（5 种，定义在 `src/blocks/index.ts`，渲染器在 `src/blocks/renderers.tsx`，两处要同步增改）
- 列表/详情页有既定模板：深蓝页头（h1 + intro）+ 卡片网格 / 正文区，参照 `products/`、`cases/`、`blog/` 三组路由的写法保持一致；产品卡统一用 `src/components/ui/ProductCard`（首页、列表页、案例详情的关联产品都在复用）
- reveal 入场动画是渐进增强：`[data-reveal]` 默认可见，`RevealInit` 挂载后才在 `<html>` 加 `.reveal-ready` 启用隐藏初始态——不要写无 JS 时不可见的样式
- Payload 图片一律经 `MediaImage` 组件（选预生成的 webp 尺寸 card/feature/og）；新的本地静态图路径要加进 `next.config.ts` 的 `images.localPatterns`
- SEO：新页面用 `src/lib/seo.ts` 的 `buildMeta`/`localeAlternates` 输出 hreflang，JSON-LD 用 `src/lib/jsonld.ts`（文章形内容直接用 `simpleArticleJsonLd`）；新内容类型记得加进 `src/app/sitemap.ts`
- 日期展示用 `src/lib/format.ts` 的 `formatDate(locale, iso)`，按语种输出（en-US / zh-CN），不要手写 toLocaleDateString

### 其他

- 代码注释用中文；后台 label 用 `{ en, zh }` 双语对象
- `src/payload-types.ts` 是生成物（已在 eslint ignore），改 schema 后跑 `pnpm generate:types`，不要手改
- eslint.config.mjs 用 eslint-config-next 16 的原生 flat 导出，不要退回 FlatCompat 写法（会崩）
- CI（`.github/workflows/ci.yml`）跑真实 postgres:18 service，顺序与生产一致：lint → tsc → migrate → build → test:int → test:e2e。本地想复现 CI 失败就按这个顺序跑
- 深入文档在 `docs/`：`DEPLOYMENT.md`（VPS/Docker/Cloudflare 全流程）、`MAINTENANCE.md`（备份/升级/排障）、`ADMIN_GUIDE.md`（给运营的后台使用说明）；`README.md` 有本地起步与二期进度

### 案例的草稿与预览

CaseStudies 开了 `versions.drafts`。三件事必须一起记住：

- **草稿不写主表**（Payload 存草稿只写版本表），所以 `--draft` 导入不会动线上已发布的那一版
- **Local API 默认 `overrideAccess`，collection 的 access 拦不住草稿** —— 每个面向公众的查询都必须自己带 `where: PUBLISHED`（`src/lib/queries.ts` 导出）。列表、详情、sitemap、`generateStaticParams` 现在都带了，**新增面向公众的案例查询时别漏**，漏一个就是把草稿挂上线
- 预览入口是 `src/app/api/preview/route.ts`：认 `PREVIEW_SECRET` 或后台登录态，且 `path` 必须匹配 `/(en|zh)/(cases|blog)/slug`。不校验 path 就是个开放重定向
- 开草稿时 `ADD COLUMN "_status" DEFAULT 'draft'` 会**把现有行全部变成草稿**（PG 11+ 的 ADD COLUMN DEFAULT 会回填），迁移里手工补了一条 `UPDATE … SET _status='published'`。以后给别的 collection 开草稿要照做

### 内容导入脚本（scripts/）

生产内容不靠手工录入，走 REST API 脚本导入。凭据从 `.env.import` 读（模板 `.env.import.example`，实际文件已 gitignore），命令行前缀的环境变量优先于文件。公共封装在 `scripts/lib/payload-api.mjs`。

字段契约与校验规则集中在 `scripts/lib/case-schema.mjs` —— 这个文件外部写手也会直接跑（`node case-schema.mjs case.json`），所以它零依赖、不连库。**规则只能有这一份**，导入器 import 它，别在导入器里另写一套。

客户案例是**内容与代码分离**的：`scripts/import-case-study.mjs <case.json>` 是通用导入器，内容放 `scripts/data/cases/*.json`。字段契约见 `docs/CASE_STUDY_JSON.md` —— 那份文档同时是给外部写手（含客户的 AI 助手）的交付规范，改积木块字段时要同步更新它，否则外部产出的 JSON 会缺字段。新案例不要再写专用脚本。

导入 localized blocks 的通用套路：先以 en 写入 → 回读拿到 block id 与数组行 id → `mergeLocale()` 把 zh 叶子字段合并进去再 PATCH。跳过回读会让数组被重建、en 内容全丢。写完自检要用 `?fallback-locale=none` 回读，否则 zh 为空时会回落成 en 的值，看不出漏翻。
