---
name: new-collection
description: 新增一个 Payload 内容 collection 的完整流程——复用 slugField/seoField/access、挂 revalidate 钩子、补 sitemap 与 queries、停掉 dev server 后生成迁移与类型、加进孤儿图扫描名单。新增或改动 src/collections/ 下的 collection 时使用。
---

# 新增内容 collection

照 `src/collections/Products.ts` 抄，**别从零写字段**。二期的 `CaseStudies.ts` / `Posts.ts` 也是同一套模板。

## 1. 字段：复用现成的

- **slug** 用 `src/fields/slug.ts` 的 `slugField()`
  - 自带 `beforeValidate` 自动生成
  - **不是 localized**：各语种共用 URL 路径，语言差异只由 `/en` `/zh` 前缀表达。hreflang 互链依赖这一点，改成 localized 会把互链打断
- **SEO** 用 `src/fields/seo.ts` 的 `seoField`
  - 给出 `metaTitle` / `metaDescription` / `ogImage`
  - 前端在 `generateMetadata()` 里消费，配合 `src/lib/seo.ts` 的 `buildMeta` / `localeAlternates`
- 后台 label 一律写 `{ en, zh }` 双语对象
- 图片字段指向 `media`，前端一律经 `MediaImage` 组件渲染（选预生成的 webp 尺寸 card/feature/og）

## 2. access：用现成的具名函数

从 `src/access/index.ts` 取 `anyone` / `authenticated` / `noOne`，**不要在 collection 里内联匿名函数**。

> 询盘（`Inquiries`）是特例：`create: noOne` + `read: authenticated`，唯一写入口是 `src/app/api/inquiries/route.ts`。别照它的模式写内容 collection。

## 3. 接线：四个地方都要补

1. **revalidate 钩子** —— 挂 `src/hooks/revalidate.ts` 的 afterChange，实现「发布即生效」（Payload 与 Next 同进程才可行）
2. **`src/app/sitemap.ts`** —— 补收录，否则新内容进不了 sitemap
3. **`src/lib/queries.ts`** —— 补查询函数，locale 透传
4. **`scripts/find-orphan-media.mjs` 顶部的 `COLLECTIONS`** —— 漏了的话这个 collection 引用的图会被孤儿扫描误判成无人引用

## 4. 如果要开草稿（`versions.drafts`）

开之前先读一遍 `CLAUDE.md` 的「案例的草稿与预览」。三件事必须一起做：

- 每个面向公众的查询自己带 `where: PUBLISHED`（Local API 默认 `overrideAccess`，collection 的 access 拦不住草稿）—— 列表、详情、sitemap、`generateStaticParams` 一个都不能漏
- 迁移里手工补一条把现有行改回 `published` 的 `UPDATE`（`ADD COLUMN … DEFAULT 'draft'` 在 PG 11+ 会**回填现有行**，把已发布内容全变草稿）
- 预览路由 `src/app/api/preview/route.ts` 的 `ALLOWED` 正则要加上新的路由段

## 5. 生成迁移与类型

> **先停掉 dev server。** dev 模式的 Drizzle 会热重载并抢先把新 schema push 进库，之后 `migrate` 撞 `relation … already exists` 整条失败。
> 项目里配了 PreToolUse 守卫（`.claude/hooks/guard-schema-edit.mjs`）会拦这一步，但它只看 3000 端口，别指望它兜住全部情况。

```bash
pnpm payload migrate:create <name>
pnpm generate:types
```

**两个都要跑**，迁移文件必须进 git。

无人值守环境跑 `migrate` 时它会弹 `data loss will occur … (y/N)`，输出被 pipe 时看不到提示符、表现为永久挂起零输出，用：

```bash
yes y | pnpm payload migrate
```

## 6. 自检

```bash
pnpm exec tsc --noEmit
pnpm lint
```

开了草稿的话，让 `draft-leak-reviewer` 子代理过一遍；有新迁移的话让 `migration-reviewer` 过一遍。
