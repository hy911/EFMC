---
name: leadgen-site
description: Playbook for building and extending a B2B lead-generation marketing site on Payload CMS 3 + Next.js (App Router) monolith — bilingual content, inquiry funnel, SEO, VPS/Docker/Cloudflare deploy. Use when scaffolding a similar showcase+inquiry site from a design spec, or when extending this repo (adding a content collection, a locale, or debugging the Docker deploy). Complements CLAUDE.md (which is the auto-loaded repo reference) with step-by-step recipes.
---

# B2B 询盘型官网 Playbook（Payload 3 + Next.js 单体）

这个 skill 把"东林众控官网"这类**展示 + 询盘（Lead Gen）站点**的建站方法论、常见扩展配方、部署踩坑固化下来。仓库级参考约定见 `CLAUDE.md`；本文是**分步操作手册**。

## 技术选型（已验证，别重新选型）

- **Payload CMS 3 + Next.js 16（App Router）单体**：后台 `/admin`、SEO 前端、API 同一代码库同一进程一次部署。用 `create-payload-app` blank 模板起
- **PostgreSQL 18** + `@payloadcms/db-postgres`（Drizzle，生产走 migrations）
- **两层多语言**：UI 文案用 next-intl（JSON，开发维护）；业务内容用 Payload Localization（后台切语言编辑，`fallback: true`）
- **Tailwind v4 CSS-first**（设计 token 进 `globals.css` 的 `@theme`，无 tailwind.config）
- **询盘链路**：Route Handler + Zod + 蜜罐 + Cloudflare Turnstile + Resend
- **部署**：VPS + Docker Compose + Cloudflare Tunnel，零 SaaS，图片本地存储

## 建站里程碑顺序（从零起项目时）

按此序做，每步可独立验收：

1. **M1 骨架**：create-payload-app（postgres+blank）→ Tailwind v4 设计 token → next-intl 双语路由（`proxy.ts` matcher 排除 `/admin` `/api`）→ 自托管字体（@fontsource，别用 next/font/google，Docker 离线构建要不了网）
2. **M2 数据建模**：先地基（access 辅助 anyone/authenticated/noOne、SEO 字段组、slug hook、Media 图片管线）→ 按依赖序建 collection → globals → 开 localization → `generate:types` + `migrate:create`
3. **M3 首页 1:1 还原**：区块结构代码写死（保证还原度），数据从 Payload 取；reveal 动画渐进增强；seed 演示数据
4. **M4 询盘链路**：`/api/inquiries`（Zod→蜜罐→Turnstile→Local API 写库→Resend，通知失败不阻塞）+ WhatsApp wa.me 深链
5. **M5 SEO**：hreflang + 分语种 sitemap + robots + JSON-LD + afterChange 钩子 revalidatePath
6. **M6 部署**：多阶段 Dockerfile（migrate 在 builder 阶段）+ compose + deploy.sh + Cloudflare 文档

## 配方 A：新增一个内容 collection（最常见，8 处要同步）

以加 `case-studies` 为参照。新增 `Foo` collection 时按序改：

1. `src/collections/Foo.ts`：定义字段，关键字段 `localized: true`，嵌 `seoField`，加 `slugField('title')`，挂 revalidate 钩子（见第 6 步）
2. `src/payload.config.ts`：import 并加进 `collections` 数组
3. `pnpm generate:types`：重新生成 `payload-types.ts`
4. `pnpm payload migrate:create add-foo` → `pnpm payload migrate`（迁移文件进 git）
5. `src/lib/queries.ts`：加 `getFoos(locale)` / `getFooBySlug(locale, slug)`（Local API，`depth` 够带出关联）
6. `src/hooks/revalidate.ts`：加 `revalidateFoo` / `revalidateFooDelete`（**从 `next/cache.js` 带扩展名 import**）
7. 路由：`src/app/(frontend)/[locale]/foos/page.tsx`（列表）+ `foos/[slug]/page.tsx`（详情，`generateStaticParams` + `dynamicParams=true` + `generateMetadata` 用 `buildMeta`）。套用 products/cases/blog 的既定模板：深蓝页头 + 卡片网格/正文
8. `src/app/sitemap.ts`：收录 `/foos` 与 `/foos/[slug]`；导航/页脚（Navbar/Footer/MobileMenu）加入口，UI 文案进 `messages/{en,zh}.json`；seed 补双语数据

**localized 数组/blocks 的坑**：更新另一语种时必须带上 en 创建时的行 id / block id（先读回再 map），否则数组重建、原语种值全丢。seed 里有正确写法。

## 配方 B：新增一个语种（如 es）

1. `src/i18n/routing.ts`：`locales` 加 `'es'`
2. `payload.config.ts`：`localization.locales` 加 `{ label: 'Español', code: 'es' }`（**两处必须同步**）
3. `src/i18n/messages/es.json`：翻译 UI 文案
4. RTL 语种（ar/he）：Payload locale 加 `rtl: true`，前端 `<html dir>` 按语种输出
5. 运营在后台把各内容的该语种版本补上（缺的回落默认语种）

## 部署踩坑清单（这些都在代码里修好了，别回退）

- **postgres:18 卷挂 `/var/lib/postgresql`（不带 `/data`）**——18+ 改了约定，挂旧路径容器拒启，表现为构建期迁移 ECONNREFUSED
- **deploy.sh build 前等 `pg_isready`**——首次 initdb 没就绪就 build 会连不上
- **Dockerfile 钉死 pnpm 版本 + `package.json` 的 `ignoredBuiltDependencies`**——否则 corepack 拉到更严格版本把 `ERR_PNPM_IGNORED_BUILDS` 当致命错误
- **migrate 在 Docker builder 阶段跑**（standalone 运行时不含 CLI），compose `build.network: host` + 仅绑 127.0.0.1:5432 让构建期连库
- **Cloudflare Tunnel Public Hostname 的 Service 填 `http://app:3000`**（同网络服务名，非 localhost）
- **Media `staticDir` 锚 `process.cwd()`**（容器内 `/app/uploads` 挂持久卷）
- **Cloudflare 免费版 Rate Limiting 仅 1 条**：优先给 `/api/users/login` 防爆破；询盘接口有 Turnstile 兜底

## 询盘安全模型（别打破）

Inquiries collection `create: noOne` + 字段 `admin.readOnly`（仅 status 可改）；唯一写入口是 `/api/inquiries` 走 Local API（`overrideAccess` 绕过 access）。别给 Inquiries 开公开 access。限流在 Cloudflare 层做，不在应用层。

## 相关文档

- `CLAUDE.md`：仓库架构约定（自动加载）
- `docs/DEPLOYMENT.md`：从零到上线分步
- `docs/MAINTENANCE.md`：运维、备份恢复、故障速查
- `docs/ADMIN_GUIDE.md`：运营后台使用
