# 阿里国际站海报内容重建 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 4 张阿里国际站海报的烧字内容重建为结构化、双语、可响应式的 CMS 内容，落在首页与 About 页。

**Architecture:** 新增 `featureColumns` / `logoStrip` 两种 Pages block；四栏字段定义抽成 `src/fields/featureColumns.ts` 供 block 与 `SiteSettings.homeAdvantage` 共用；渲染层抽成 `src/components/ui/` 下的纯展示组件，被 CMS block 渲染器与首页组件共用。首页数据经已有的 `getSiteSettings(locale)` 取回，不增加查询。

**Tech Stack:** Payload CMS 3.86 · Next.js 16 App Router · Tailwind v4（CSS-first，token 在 `globals.css` 的 `@theme`）· next-intl · Vitest + @testing-library/react · Playwright

设计文档：[`docs/superpowers/specs/2026-07-27-alibaba-posters-design.md`](../specs/2026-07-27-alibaba-posters-design.md)

## Global Constraints

- 代码注释用中文；Payload 的 label 一律 `{ en, zh }` 双语对象
- 所有面向用户的文字字段必须 `localized: true`
- schema 变更走 `pnpm payload migrate:create <name>` + `pnpm generate:types`，迁移文件进 git；**不要**依赖 dev 模式的 Drizzle push（会交互式卡住）
- `src/payload-types.ts` 是生成物，禁止手改
- `src/blocks/index.ts` 与 `src/blocks/renderers.tsx` 必须同步增改
- 前端 Link/redirect 用 `@/i18n/navigation`，不用 next/link 原始版本
- `revalidatePath` 必须从 `next/cache.js`（带扩展名）导入
- Payload localized 数组的结构本身不 localized：用 Local API 写 zh 时必须带上原有行 id，否则数组重建、en 值全丢
- 四栏在 375px 视口必须堆成单栏（验收硬指标）
- 提交信息用中文，正文换行；结尾带 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

---

## File Structure

**新建**

| 文件 | 职责 |
|---|---|
| `src/fields/featureColumns.ts` | 四栏字段定义（单一事实来源），被 block 与 global 共用 |
| `src/components/ui/FeatureColumns.tsx` | 四栏纯展示组件，只吃 props，不关心数据来源 |
| `src/components/ui/LogoStrip.tsx` | logo 横条纯展示组件 |
| `src/components/home/CompanyAdvantage.tsx` | 首页优势区，把 SiteSettings 数据喂给 `FeatureColumns` |
| `tests/int/blocks.int.spec.ts` | 展示组件渲染测试 + SiteSettings 读写测试 |

**修改**

| 文件 | 改动 |
|---|---|
| `src/blocks/index.ts` | 加 `FeatureColumnsBlock`、`LogoStripBlock`，追加进 `pageBlocks` |
| `src/blocks/renderers.tsx` | 加两个 switch 分支 |
| `src/globals/SiteSettings.ts` | 加 `homeAdvantage` group |
| `src/app/(frontend)/[locale]/page.tsx` | 插入 `<CompanyAdvantage settings={settings} />` |
| `seed/index.ts` | 首页优势区 + About 页新 block 的演示数据（含 zh 行 id 映射） |
| `tests/e2e/frontend.e2e.spec.ts` | 首页优势区 + About 页 logo 条断言 |

---

## Task 1: 共享字段定义 + 两种 block + SiteSettings 字段 + 迁移

**Files:**
- Create: `src/fields/featureColumns.ts`
- Modify: `src/blocks/index.ts`
- Modify: `src/globals/SiteSettings.ts:104-105`（`contact` group 之后追加）
- Test: `tests/int/blocks.int.spec.ts`

**Interfaces:**
- Consumes: 无（本计划第一个任务）
- Produces:
  - `featureColumnsField: ArrayField` —— `name: 'columns'`，供 block 与 global spread
  - `FeatureColumnsBlock: Block` —— `slug: 'featureColumns'`
  - `LogoStripBlock: Block` —— `slug: 'logoStrip'`
  - `SiteSetting['homeAdvantage']` —— `{ eyebrow?, heading?, columns? }`

- [ ] **Step 1: 写共享字段定义**

创建 `src/fields/featureColumns.ts`：

```ts
import type { ArrayField } from 'payload'

/**
 * 可复用的「多栏要点」字段定义 —— 被 Pages 的 featureColumns block 和
 * SiteSettings 的首页优势区共用，保证两处结构一致、加字段只改一处。
 *
 * 注意：数组结构本身不是 localized，只有内部叶子字段是。
 * 用 Local API 写另一语种时必须带上原有行 id（见 seed/index.ts）。
 */
export const featureColumnsField: ArrayField = {
  name: 'columns',
  label: { en: 'Columns', zh: '栏目' },
  type: 'array',
  minRows: 2,
  maxRows: 4,
  required: true,
  admin: {
    description: {
      en: '2–4 columns. Rendered as a 1px-divided grid; stacks to one column on mobile.',
      zh: '2–4 栏；渲染为 1px 分隔线网格，手机上自动堆成单栏。',
    },
  },
  fields: [
    {
      name: 'kicker',
      label: { en: 'Kicker', zh: '栏目小标' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Small uppercase label above the title, e.g. "INTEGRATED SOLUTIONS". Optional.',
          zh: '标题上方的大写小标，如「INTEGRATED SOLUTIONS」；可留空。',
        },
      },
    },
    {
      name: 'title',
      label: { en: 'Title', zh: '栏目标题' },
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'items',
      label: { en: 'Items', zh: '要点' },
      type: 'array',
      fields: [
        {
          name: 'label',
          label: { en: 'Bold Prefix', zh: '加粗前缀' },
          type: 'text',
          localized: true,
          admin: {
            description: {
              en: 'Optional bold prefix for two-level items, e.g. "HARDWARE".',
              zh: '二级要点的加粗前缀，如「HARDWARE」；平铺要点留空即可。',
            },
          },
        },
        {
          name: 'text',
          label: { en: 'Text', zh: '正文' },
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'footnote',
      label: { en: 'Footnote', zh: '脚注' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Grey-background note at the bottom of the column. Optional.',
          zh: '栏目底部的灰底小字；可留空。',
        },
      },
    },
  ],
}
```

- [ ] **Step 2: 加两种 block 定义**

在 `src/blocks/index.ts` 顶部的 import 区加：

```ts
import { featureColumnsField } from '@/fields/featureColumns'
```

在 `ContactFormBlock` 定义之后、`pageBlocks` 之前插入：

```ts
/** 多栏要点块（公司优势 / 业务线等结构化卖点） */
export const FeatureColumnsBlock: Block = {
  slug: 'featureColumns',
  labels: {
    singular: { en: 'Feature Columns', zh: '多栏要点' },
    plural: { en: 'Feature Columns', zh: '多栏要点' },
  },
  fields: [
    {
      name: 'heading',
      label: { en: 'Heading', zh: '标题' },
      type: 'text',
      localized: true,
    },
    featureColumnsField,
  ],
}

/** logo 横条块（合作供应商墙） */
export const LogoStripBlock: Block = {
  slug: 'logoStrip',
  labels: {
    singular: { en: 'Logo Strip', zh: 'Logo 横条' },
    plural: { en: 'Logo Strips', zh: 'Logo 横条' },
  },
  fields: [
    {
      name: 'heading',
      label: { en: 'Heading', zh: '标题' },
      type: 'text',
      localized: true,
    },
    {
      name: 'logos',
      label: { en: 'Logos', zh: 'Logo' },
      type: 'array',
      minRows: 1,
      required: true,
      admin: {
        description: {
          en: 'Logos render at a uniform height with object-contain; upload transparent PNGs.',
          zh: 'Logo 按统一高度等比缩放显示；建议上传透明底 PNG。',
        },
      },
      fields: [
        { name: 'image', label: { en: 'Image', zh: '图片' }, type: 'upload', relationTo: 'media', required: true },
        {
          name: 'name',
          label: { en: 'Brand Name', zh: '品牌名' },
          type: 'text',
          required: true,
          admin: {
            description: { en: 'Used as the title attribute.', zh: '用作 title 属性；品牌名不翻译，故不分语种。' },
          },
        },
      ],
    },
  ],
}
```

把 `pageBlocks` 改为：

```ts
export const pageBlocks: Block[] = [
  RichTextBlock,
  ImageGalleryBlock,
  StatsGridBlock,
  FeatureColumnsBlock,
  LogoStripBlock,
  CtaBannerBlock,
  ContactFormBlock,
]
```

- [ ] **Step 3: SiteSettings 加首页优势区**

在 `src/globals/SiteSettings.ts` 顶部 import 区加：

```ts
import { featureColumnsField } from '@/fields/featureColumns'
```

在 `contact` group（第 104 行 `},` 结束）之后、`fields` 数组收尾 `]` 之前追加：

```ts
    {
      name: 'homeAdvantage',
      label: { en: 'Homepage Advantage Section', zh: '首页优势区' },
      type: 'group',
      admin: {
        description: {
          en: 'The four-column advantage section on the homepage. Leave columns empty to hide the section.',
          zh: '首页的四栏优势区；栏目留空则该区块整体不显示。',
        },
      },
      fields: [
        {
          name: 'eyebrow',
          label: { en: 'Eyebrow', zh: '区块小标' },
          type: 'text',
          localized: true,
        },
        {
          name: 'heading',
          label: { en: 'Heading', zh: '区块标题' },
          type: 'text',
          localized: true,
        },
        { ...featureColumnsField, required: false },
      ],
    },
```

注意 `required: false` 覆盖：首页优势区允许整体留空（留空即隐藏），而 block 里的 columns 是必填。

- [ ] **Step 4: 生成迁移与类型**

```bash
pnpm payload migrate:create add_feature_columns_and_logo_strip
```

预期：`src/migrations/` 下新增一个 `.ts` 迁移文件 + 对应快照 json。

```bash
pnpm payload migrate && pnpm generate:types
```

预期：迁移成功；`src/payload-types.ts` 中出现 `homeAdvantage` 以及 `FeatureColumnsBlock` / `LogoStripBlock` 的类型。

- [ ] **Step 5: 写失败的集成测试**

创建 `tests/int/blocks.int.spec.ts`：

```ts
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload

describe('首页优势区（SiteSettings.homeAdvantage）', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('可写入四栏并按语种回读', async () => {
    const written = await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      data: {
        homeAdvantage: {
          eyebrow: 'Company Advantage',
          heading: 'Why customers specify Donglin',
          columns: [
            {
              kicker: 'INTEGRATED SOLUTIONS',
              title: 'Software-Hardware Synergy',
              items: [{ text: 'PLC/HMI/SCADA programming & commissioning' }],
              footnote: 'Achieves 30% communication load reduction via AI optimization',
            },
            {
              kicker: 'OEM/ODM SERVICES',
              title: 'End-to-End Customization',
              items: [{ label: 'HARDWARE', text: 'IP66-rated control cabinets & modular layouts' }],
            },
          ],
        },
      },
    })

    const columns = written.homeAdvantage?.columns ?? []
    expect(columns).toHaveLength(2)
    expect(columns[0]?.items?.[0]?.text).toBe('PLC/HMI/SCADA programming & commissioning')
    expect(columns[1]?.items?.[0]?.label).toBe('HARDWARE')
  })

  it('写 zh 时带上行 id 不会冲掉 en 内容', async () => {
    const en = await payload.findGlobal({ slug: 'site-settings', locale: 'en' })
    const enColumns = en.homeAdvantage?.columns ?? []
    expect(enColumns.length).toBeGreaterThan(0)

    // 关键：带上原有行 id，否则数组被重建、en 值全丢
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'zh',
      data: {
        homeAdvantage: {
          columns: enColumns.map((col) => ({
            id: col.id,
            title: `中文-${col.title}`,
            items: (col.items ?? []).map((item) => ({ id: item.id, text: `中文-${item.text}` })),
          })),
        },
      },
    })

    const enAfter = await payload.findGlobal({ slug: 'site-settings', locale: 'en' })
    expect(enAfter.homeAdvantage?.columns?.[0]?.title).toBe('Software-Hardware Synergy')

    const zhAfter = await payload.findGlobal({ slug: 'site-settings', locale: 'zh' })
    expect(zhAfter.homeAdvantage?.columns?.[0]?.title).toBe('中文-Software-Hardware Synergy')
  })
})
```

- [ ] **Step 6: 跑测试确认通过**

```bash
pnpm exec vitest run tests/int/blocks.int.spec.ts
```

预期：2 passed。若第二条挂在 `expect(enAfter...).toBe('Software-Hardware Synergy')`，说明行 id 没带上，回头检查 map。

- [ ] **Step 7: 类型检查 + lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

预期：均无输出（通过）。

- [ ] **Step 8: 提交**

```bash
git add src/fields/featureColumns.ts src/blocks/index.ts src/globals/SiteSettings.ts src/migrations src/payload-types.ts tests/int/blocks.int.spec.ts
git commit -m "feat: 多栏要点与 logo 横条的字段定义、block 与首页优势区 schema

featureColumnsField 抽成共享定义，Pages block 与 SiteSettings 首页优势区
共用一份结构。含迁移与重新生成的 payload-types。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: FeatureColumns 展示组件

**Files:**
- Create: `src/components/ui/FeatureColumns.tsx`
- Test: `tests/int/blocks.int.spec.ts`（追加 describe 块）

**Interfaces:**
- Consumes: 无运行时依赖（纯展示组件，刻意不 import payload-types，保持与数据源解耦）
- Produces:
  - `type FeatureColumnItem = { id?: string | null; label?: string | null; text: string }`
  - `type FeatureColumn = { id?: string | null; kicker?: string | null; title: string; items?: FeatureColumnItem[] | null; footnote?: string | null }`
  - `function FeatureColumns({ columns }: { columns: FeatureColumn[] }): JSX.Element | null`

- [ ] **Step 1: 写失败的组件测试**

在 `tests/int/blocks.int.spec.ts` 末尾追加（文件顶部 import 区补 `import { render, screen } from '@testing-library/react'` 和 `import { FeatureColumns } from '@/components/ui/FeatureColumns'`）：

```ts
describe('FeatureColumns 组件', () => {
  const columns = [
    {
      id: 'a',
      kicker: 'INTEGRATED SOLUTIONS',
      title: 'Software-Hardware Synergy',
      items: [{ id: 'a1', text: 'PLC/HMI/SCADA programming & commissioning' }],
      footnote: 'Achieves 30% communication load reduction',
    },
    {
      id: 'b',
      title: 'End-to-End Customization',
      items: [{ id: 'b1', label: 'HARDWARE', text: 'IP66-rated control cabinets' }],
    },
  ]

  it('渲染 kicker、标题、要点与脚注', () => {
    render(<FeatureColumns columns={columns} />)
    expect(screen.getByText('INTEGRATED SOLUTIONS')).toBeDefined()
    expect(screen.getByText('Software-Hardware Synergy')).toBeDefined()
    expect(screen.getByText(/PLC\/HMI\/SCADA/)).toBeDefined()
    expect(screen.getByText(/30% communication load reduction/)).toBeDefined()
  })

  it('要点的加粗前缀渲染为 strong', () => {
    render(<FeatureColumns columns={columns} />)
    const label = screen.getByText('HARDWARE')
    expect(label.tagName).toBe('STRONG')
  })

  it('kicker 与 footnote 缺省时不渲染空节点', () => {
    const { container } = render(<FeatureColumns columns={[columns[1]!]} />)
    expect(container.querySelectorAll('[data-kicker]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-footnote]')).toHaveLength(0)
  })

  it('栏目为空时整体不渲染', () => {
    const { container } = render(<FeatureColumns columns={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
```

测试文件含 JSX，需把文件名改为 `tests/int/blocks.int.spec.tsx`，并把 `vitest.config.mts` 的 include 从 `tests/int/**/*.int.spec.ts` 改为 `tests/int/**/*.int.spec.{ts,tsx}`。

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm exec vitest run tests/int/blocks.int.spec.tsx
```

预期：FAIL，报 `Failed to resolve import "@/components/ui/FeatureColumns"`。

- [ ] **Step 3: 写组件**

创建 `src/components/ui/FeatureColumns.tsx`：

```tsx
export type FeatureColumnItem = {
  id?: string | null
  /** 可选加粗前缀，用于二级要点（如 HARDWARE / SOFTWARE） */
  label?: string | null
  text: string
}

export type FeatureColumn = {
  id?: string | null
  kicker?: string | null
  title: string
  items?: FeatureColumnItem[] | null
  footnote?: string | null
}

/** 栏数 → lg 断点列数；类名写成字面量，保证 Tailwind 扫描得到 */
const gridColsByCount: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

/**
 * 多栏要点（纯展示）—— 首页优势区与 Pages 的 featureColumns block 共用。
 * 刻意不依赖 payload-types：数据来源由调用方适配，组件只吃 props。
 * 视觉沿用设计体系的 1px 分隔线网格；手机上堆成单栏。
 */
export function FeatureColumns({ columns }: { columns: FeatureColumn[] }) {
  if (columns.length === 0) return null

  return (
    <div
      className={`grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 ${
        gridColsByCount[columns.length] ?? 'lg:grid-cols-4'
      }`}
    >
      {columns.map((col, i) => (
        <div key={col.id ?? i} data-reveal className="bg-white px-7 pt-9 pb-10">
          {col.kicker && (
            <div
              data-kicker
              className="mb-2.5 text-[12.5px] font-semibold tracking-[2.2px] text-accent uppercase"
            >
              {col.kicker}
            </div>
          )}
          <h3 className="m-0 mb-5 font-display text-[19px] font-semibold text-navy">{col.title}</h3>
          {(col.items?.length ?? 0) > 0 && (
            <ul className="m-0 list-none space-y-2.5 p-0">
              {(col.items ?? []).map((item, j) => (
                <li key={item.id ?? j} className="text-[14.5px] leading-[1.6] text-steel">
                  <span aria-hidden className="mr-2 text-accent">
                    ●
                  </span>
                  {item.label && <strong className="text-navy">{item.label}</strong>}
                  {item.label && ' '}
                  {item.text}
                </li>
              ))}
            </ul>
          )}
          {col.footnote && (
            <p data-footnote className="mt-6 mb-0 bg-mist px-3 py-2.5 text-[13px] leading-[1.5] text-steel">
              {col.footnote}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm exec vitest run tests/int/blocks.int.spec.tsx
```

预期：6 passed（Task 1 的 2 条 + 本任务 4 条）。

- [ ] **Step 5: 提交**

```bash
git add src/components/ui/FeatureColumns.tsx tests/int vitest.config.mts
git commit -m "feat: 多栏要点展示组件 FeatureColumns

纯展示组件，不依赖 payload-types，首页与 CMS block 共用。
vitest include 放开 .tsx 以支持组件测试。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: LogoStrip 展示组件

**Files:**
- Create: `src/components/ui/LogoStrip.tsx`
- Test: `tests/int/blocks.int.spec.tsx`（追加 describe 块）

**Interfaces:**
- Consumes: `MediaImage` from `@/components/ui/MediaImage`（已存在，props：`media`、`size?`、`fill?`、`className?`、`sizes?`、`priority?`）
- Produces:
  - `type LogoItem = { id?: string | null; name: string; image: Media | number | null | undefined }`
  - `function LogoStrip({ heading, logos }: { heading?: string | null; logos: LogoItem[] }): JSX.Element | null`

- [ ] **Step 1: 写失败的组件测试**

在 `tests/int/blocks.int.spec.tsx` 末尾追加（顶部 import 区补 `import { LogoStrip } from '@/components/ui/LogoStrip'`）：

```tsx
describe('LogoStrip 组件', () => {
  const logos = [
    {
      id: 'l1',
      name: 'Siemens',
      image: { id: 1, alt: 'Siemens logo', url: '/uploads/logo-siemens.webp', width: 200, height: 60 },
    },
    {
      id: 'l2',
      name: 'ABB',
      image: { id: 2, alt: 'ABB logo', url: '/uploads/logo-abb.webp', width: 200, height: 60 },
    },
  ]

  it('渲染标题与全部 logo', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<LogoStrip heading="Cooperative Suppliers" logos={logos as any} />)
    expect(screen.getByText('Cooperative Suppliers')).toBeDefined()
    expect(screen.getByTitle('Siemens')).toBeDefined()
    expect(screen.getByTitle('ABB')).toBeDefined()
  })

  it('logo 用 object-contain，不被裁切', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<LogoStrip logos={logos as any} />)
    const img = container.querySelector('img')
    expect(img?.className).toContain('object-contain')
  })

  it('logos 为空时整体不渲染', () => {
    const { container } = render(<LogoStrip logos={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm exec vitest run tests/int/blocks.int.spec.tsx
```

预期：FAIL，报 `Failed to resolve import "@/components/ui/LogoStrip"`。

- [ ] **Step 3: 写组件**

创建 `src/components/ui/LogoStrip.tsx`：

```tsx
import { MediaImage } from '@/components/ui/MediaImage'
import type { Media } from '@/payload-types'

export type LogoItem = {
  id?: string | null
  name: string
  image: Media | number | null | undefined
}

/**
 * 合作供应商 logo 横条（纯展示）。
 * 刻意不取 card 尺寸 —— card 是 640×480 居中裁切，logo 会被切掉；
 * 直接用原图 + object-contain 等比缩放，logo 文件本身仅几 KB。
 */
export function LogoStrip({ heading, logos }: { heading?: string | null; logos: LogoItem[] }) {
  if (logos.length === 0) return null

  return (
    <div data-reveal className="flex flex-wrap items-stretch border border-line">
      {heading && (
        <div className="flex items-center bg-accent px-6 py-4 text-[13px] leading-[1.3] font-semibold tracking-[1.2px] text-white uppercase">
          {heading}
        </div>
      )}
      <div className="flex flex-1 flex-wrap items-center justify-around gap-x-8 gap-y-6 px-6 py-5">
        {logos.map((logo, i) => (
          <div key={logo.id ?? i} title={logo.name} className="relative h-8 w-28">
            <MediaImage
              media={logo.image}
              fill
              className="object-contain"
              sizes="112px"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm exec vitest run tests/int/blocks.int.spec.tsx
```

预期：9 passed。

- [ ] **Step 5: 提交**

```bash
git add src/components/ui/LogoStrip.tsx tests/int/blocks.int.spec.tsx
git commit -m "feat: logo 横条展示组件 LogoStrip

用原图 + object-contain，避开 card 尺寸的居中裁切。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: block 渲染器接线 + About 页演示数据

**Files:**
- Modify: `src/blocks/renderers.tsx`（在 `contactForm` 分支之后、`default` 之前插入）
- Modify: `seed/index.ts:389-412`（About 页 layout）与 `seed/index.ts:419-445`（zh 回写）
- Test: `tests/e2e/frontend.e2e.spec.ts`

**Interfaces:**
- Consumes: `FeatureColumns`、`FeatureColumn` from `@/components/ui/FeatureColumns`；`LogoStrip`、`LogoItem` from `@/components/ui/LogoStrip`
- Produces: About 页可渲染 `featureColumns` 与 `logoStrip` 两种 block

- [ ] **Step 1: 加渲染分支**

在 `src/blocks/renderers.tsx` 顶部 import 区加：

```tsx
import { FeatureColumns, type FeatureColumn } from '@/components/ui/FeatureColumns'
import { LogoStrip, type LogoItem } from '@/components/ui/LogoStrip'
```

在 `case 'contactForm':` 分支的 `)` 之后、`default:` 之前插入：

```tsx
          /* 多栏要点 */
          case 'featureColumns':
            return (
              <Container key={block.id} className="py-10">
                {block.heading && (
                  <h2 className="m-0 mb-8 font-display text-[28px] font-bold tracking-[-0.3px] text-navy">
                    {block.heading}
                  </h2>
                )}
                <FeatureColumns columns={(block.columns ?? []) as FeatureColumn[]} />
              </Container>
            )

          /* 合作供应商 logo 横条 */
          case 'logoStrip':
            return (
              <Container key={block.id} className="py-10">
                <LogoStrip heading={block.heading} logos={(block.logos ?? []) as LogoItem[]} />
              </Container>
            )
```

- [ ] **Step 2: 类型检查**

```bash
pnpm exec tsc --noEmit
```

预期：无输出。若报 `block.columns` 不存在，说明 Task 1 的 `pnpm generate:types` 没跑或 schema 没落库，回头重跑。

- [ ] **Step 3: seed 补 About 页演示数据**

在 `seed/index.ts` 的 About 页 `layout` 数组里，把 `statsGrid` 与证书墙 `imageGallery` 之间插入两个新 block：

```ts
          {
            blockType: 'featureColumns',
            heading: 'What we deliver',
            columns: [
              {
                title: 'Industrial-grade electrical control equipment',
                items: [
                  { text: 'PLC control cabinets and high/low-voltage power distribution systems' },
                  { text: 'Explosion-proof, AI-enabled and cloud server-integrated cabinets' },
                ],
              },
              {
                title: 'Digital software services',
                items: [
                  { text: 'PLC programming and cloud platform development' },
                  { text: 'WinCC/HMI interface design and customized industrial APP development' },
                ],
              },
              {
                title: 'Integrated innovation solutions',
                items: [
                  { text: 'Equipment data acquisition and cloud communication systems' },
                  { text: 'Remote O&M platforms and smart factory transformation' },
                ],
              },
            ],
          },
          {
            blockType: 'logoStrip',
            heading: 'Cooperative Suppliers',
            logos: [
              { image: await uploadMedia('logo-siemens', 'Siemens logo', '西门子 logo', 200, 60), name: 'Siemens' },
              { image: await uploadMedia('logo-abb', 'ABB logo', 'ABB logo', 200, 60), name: 'ABB' },
            ],
          },
```

seed 只放 2 个 logo 占位，真实的 10 个 logo 走后台上传（见 Task 6）。

- [ ] **Step 4: seed 的 zh 回写补新 block**

在 `seed/index.ts` 约 428 行的 `layout.map((block) => { switch (block.blockType) { ... } })` 里补两个分支。**必须带上 `id`**，否则数组重建、en 内容全丢：

```ts
            case 'featureColumns':
              return {
                ...block,
                heading: '我们交付什么',
                columns: (block.columns ?? []).map((col, i) => ({
                  id: col.id, // 关键：带上原有行 id
                  title: ['工业级电气控制设备', '数字化软件服务', '集成创新解决方案'][i] ?? col.title,
                  items: (col.items ?? []).map((item) => ({ id: item.id, text: item.text })),
                })),
              }

            case 'logoStrip':
              return {
                ...block,
                heading: '合作供应商',
                logos: (block.logos ?? []).map((logo) => ({ id: logo.id, name: logo.name })),
              }
```

- [ ] **Step 5: 重跑 seed 验证不丢数据**

```bash
pnpm seed
```

预期：无报错。随后人工确认 en 未被 zh 覆盖：

```bash
pnpm exec tsx -e "import('./src/lib/payload.js').then(async (m) => { const p = await m.getPayloadClient(); const { docs } = await p.find({ collection: 'pages', where: { slug: { equals: 'about' } }, locale: 'en', depth: 0 }); console.log(JSON.stringify(docs[0]?.layout?.find((b) => b.blockType === 'featureColumns'), null, 2)) })"
```

预期输出里 `heading` 是 `What we deliver`（英文），不是中文。若变成中文，说明行 id 丢了。

- [ ] **Step 6: 加 e2e 断言**

在 `tests/e2e/frontend.e2e.spec.ts` 的 `test.describe('Frontend', ...)` 内追加：

```ts
  test('About 页渲染多栏要点与 logo 横条', async ({ page }) => {
    await page.goto('http://localhost:3000/en/about')
    await expect(page.getByRole('heading', { name: 'What we deliver' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Industrial-grade electrical control equipment' }),
    ).toBeVisible()
    await expect(page.getByTitle('Siemens')).toBeVisible()
  })

  test('About 页中文语种显示中文文案', async ({ page }) => {
    await page.goto('http://localhost:3000/zh/about')
    await expect(page.getByRole('heading', { name: '我们交付什么' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '工业级电气控制设备' })).toBeVisible()
  })
```

- [ ] **Step 7: 跑 e2e**

```bash
pnpm exec playwright test tests/e2e/frontend.e2e.spec.ts --reporter=list
```

预期：新增 2 条 PASS。沙箱环境加 `CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` 前缀。

- [ ] **Step 8: 提交**

```bash
git add src/blocks/renderers.tsx seed/index.ts tests/e2e/frontend.e2e.spec.ts
git commit -m "feat: About 页支持多栏要点与 logo 横条 block

渲染器补两个分支，seed 补演示数据与 zh 回写（带行 id 防数组重建），
e2e 覆盖中英两语种。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: 首页优势区接线

**Files:**
- Create: `src/components/home/CompanyAdvantage.tsx`
- Modify: `src/app/(frontend)/[locale]/page.tsx:6-19`（import）与 `:79-80`（`Capabilities` 与 `FeaturedProducts` 之间）
- Modify: `seed/index.ts`（站点设置写入处，约 65-83 行）
- Test: `tests/e2e/frontend.e2e.spec.ts`

**Interfaces:**
- Consumes: `FeatureColumns`、`FeatureColumn`；`SectionHeader` from `@/components/ui/SectionHeader`（props：`eyebrow`、`title`、`dark?`、`className?`）；`Container` from `@/components/ui/Container`；`SiteSetting` from `@/payload-types`
- Produces: `function CompanyAdvantage({ settings }: { settings: SiteSetting }): JSX.Element | null`

- [ ] **Step 1: 写首页组件**

创建 `src/components/home/CompanyAdvantage.tsx`：

```tsx
import { Container } from '@/components/ui/Container'
import { FeatureColumns, type FeatureColumn } from '@/components/ui/FeatureColumns'
import { SectionHeader } from '@/components/ui/SectionHeader'
import type { SiteSetting } from '@/payload-types'

/**
 * 首页优势区 —— 区块结构固定在代码里，栏内文字由运营在
 * 站点设置 > 首页优势区 维护（专利数、案例数等会变动的数字归运营）。
 * 数据复用首页已取回的 settings，不额外发查询。
 */
export function CompanyAdvantage({ settings }: { settings: SiteSetting }) {
  const advantage = settings.homeAdvantage
  const columns = (advantage?.columns ?? []) as FeatureColumn[]

  // 后台未填则整区隐藏，避免出现空壳区块
  if (columns.length === 0) return null

  return (
    <section id="advantage" className="bg-white">
      <Container className="py-20 lg:py-[104px]">
        {(advantage?.eyebrow || advantage?.heading) && (
          <SectionHeader
            eyebrow={advantage?.eyebrow ?? ''}
            title={advantage?.heading ?? ''}
            className="mb-16 max-w-[640px]"
          />
        )}
        <FeatureColumns columns={columns} />
      </Container>
    </section>
  )
}
```

- [ ] **Step 2: 插进首页**

在 `src/app/(frontend)/[locale]/page.tsx` 的 import 区（`Capabilities` 那行之后）加：

```tsx
import { CompanyAdvantage } from '@/components/home/CompanyAdvantage'
```

把 `<main>` 里的区块顺序改为：

```tsx
        <Hero />
        <Capabilities />
        <CompanyAdvantage settings={settings} />
        <FeaturedProducts products={products} />
```

- [ ] **Step 3: seed 写入首页优势区演示数据**

在 `seed/index.ts` 的 `updateGlobal({ slug: 'site-settings', ..., locale: 'en' })` 的 `data` 里追加 `homeAdvantage`（四栏文案照设计文档转录）：

```ts
      homeAdvantage: {
        eyebrow: 'Company Advantage',
        heading: 'Why customers specify Donglin',
        columns: [
          {
            kicker: 'INTEGRATED SOLUTIONS',
            title: 'Software-Hardware Synergy',
            items: [
              { text: 'PLC/HMI/SCADA programming & commissioning' },
              { text: 'AI-enabled edge computing (NVIDIA Jetson)' },
              { text: 'Industrial cloud integration (OPC UA/MQTT)' },
            ],
            footnote: 'Achieves 30% communication load reduction via AI optimization',
          },
          {
            kicker: 'OEM/ODM SERVICES',
            title: 'End-to-End Customization',
            items: [
              { label: 'HARDWARE', text: 'IP66-rated control cabinets & modular layouts' },
              { label: 'SOFTWARE', text: 'White-label HMI interfaces & IIoT expansions' },
            ],
            footnote: 'Global logistics supported by 160+ patents',
          },
          {
            kicker: 'MIL-SPEC QC',
            title: 'Rigorous Quality Fortress',
            items: [
              { text: 'Component aging tests (MIL-STD-883G)' },
              { text: 'Control cabinet IP validation (IEC 60529)' },
              { text: '72hr load simulation (GB/T 2423.1)' },
            ],
            footnote: '±0.01mm precision machining records',
          },
          {
            kicker: '24/7 GLOBAL SUPPORT',
            title: 'Uninterrupted Service Commitment',
            items: [
              { text: 'Remote diagnostics & firmware updates' },
              { text: 'On-site engineers (APAC/EU/NA)' },
              { text: 'Air-shipped replacements ≤24hr' },
            ],
            footnote: 'Shared fault code database (300+ cases)',
          },
        ],
      },
```

- [ ] **Step 4: seed 写 zh 语种（带行 id）**

紧跟 en 写入之后、现有 zh `updateGlobal` 调用处，改为先读回 en 再 map。技术术语不译：

```ts
  // 先读回 en 拿到数组行 id —— localized 数组不带 id 写入会重建、冲掉 en
  const settingsEn = await payload.findGlobal({ slug: 'site-settings', locale: 'en' })
  const advantageEn = settingsEn.homeAdvantage
  const zhTitles = ['软硬件协同', '端到端定制', '严苛质量管控', '7×24 全球支持']
  const zhKickers = ['一体化解决方案', 'OEM/ODM 服务', '军规级品控', '全球服务支持']

  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'zh',
    data: {
      companyName: '天津东林众控自动化科技有限公司',
      contact: { location: '中国·天津' },
      homeAdvantage: {
        eyebrow: '公司优势',
        heading: '客户为何指定东林众控',
        columns: (advantageEn?.columns ?? []).map((col, i) => ({
          id: col.id, // 关键：带上原有行 id
          kicker: zhKickers[i] ?? col.kicker,
          title: zhTitles[i] ?? col.title,
          // 要点含 MIL-STD-883G / IEC 60529 等术语，保持原文不译
          items: (col.items ?? []).map((item) => ({ id: item.id, label: item.label, text: item.text })),
          footnote: col.footnote,
        })),
      },
    },
  })
```

- [ ] **Step 5: 重跑 seed 并确认 en 未被覆盖**

```bash
pnpm seed
```

预期：无报错。

```bash
pnpm exec tsx -e "import('./src/lib/payload.js').then(async (m) => { const p = await m.getPayloadClient(); const s = await p.findGlobal({ slug: 'site-settings', locale: 'en' }); console.log(s.homeAdvantage?.heading, '|', s.homeAdvantage?.columns?.[0]?.title) })"
```

预期输出：`Why customers specify Donglin | Software-Hardware Synergy`。若是中文，说明行 id 丢了。

- [ ] **Step 6: 加 e2e 断言**

在 `tests/e2e/frontend.e2e.spec.ts` 追加：

```ts
  test('首页优势区渲染四栏与技术要点', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    await expect(
      page.getByRole('heading', { name: 'Why customers specify Donglin' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Software-Hardware Synergy' })).toBeVisible()
    await expect(page.getByText(/MIL-STD-883G/)).toBeVisible()
    await expect(page.getByText(/160\+ patents/)).toBeVisible()
  })

  test('首页优势区中文语种：标题译中文、技术术语保留原文', async ({ page }) => {
    await page.goto('http://localhost:3000/zh')
    await expect(page.getByRole('heading', { name: '软硬件协同' })).toBeVisible()
    await expect(page.getByText(/MIL-STD-883G/)).toBeVisible()
  })

  test('首页优势区在 375px 视口堆成单栏', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('http://localhost:3000/en')
    const first = page.locator('#advantage h3').first()
    const second = page.locator('#advantage h3').nth(1)
    const firstBox = await first.boundingBox()
    const secondBox = await second.boundingBox()
    // 单栏：第二栏标题必须在第一栏下方，而非并排
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height)
  })
```

- [ ] **Step 7: 跑 e2e**

```bash
pnpm exec playwright test tests/e2e/frontend.e2e.spec.ts --reporter=list
```

预期：新增 3 条 PASS。第三条是响应式硬指标，挂了说明 `FeatureColumns` 的 `grid-cols-1` 被覆盖，检查类名顺序。

- [ ] **Step 8: 全量验证**

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

预期：三步全过。`pnpm build` 需要本地 Postgres 在跑。

- [ ] **Step 9: 提交**

```bash
git add src/components/home/CompanyAdvantage.tsx "src/app/(frontend)/[locale]/page.tsx" seed/index.ts tests/e2e/frontend.e2e.spec.ts
git commit -m "feat: 首页优势区（海报①内容重建）

四栏布局固定在代码里，栏内文字由运营在站点设置维护；复用首页已取回的
settings 不额外查询。seed 写入四栏演示数据，zh 语种带行 id 回写、
技术术语保留原文。e2e 覆盖中英两语种与 375px 单栏堆叠。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: 真实素材入库与运营文档

**Files:**
- Modify: `docs/ADMIN_GUIDE.md`
- Test: 人工验收（本任务无自动化测试，产出是运营可执行的操作步骤）

**Interfaces:**
- Consumes: Task 1–5 的全部 schema 与组件
- Produces: 运营可独立完成的图片上传与文案录入流程

- [ ] **Step 1: 确认真实图片就位**

真实原件放进 `photos-out/`（已在 `.gitignore`，不会进仓库）。需要的素材：

- 8 张柜体实拍（海报②下半）
- 1 张团队实拍（海报③右侧）
- 10 个供应商 logo，建议透明底 PNG：Siemens、Schneider Electric、CHINT、Eaton、Mitsubishi、ABB、Omron、Delixi、Honeywell、Rockwell Automation

```bash
ls photos-out
```

预期：能看到上述文件。缺哪张就先补哪张，缺图不阻塞其余步骤。

- [ ] **Step 2: 后台上传并填双语 alt**

启动本地环境后打开 `http://localhost:3000/admin`，进「媒体库」逐张上传。

**每张必须中英各填一遍 alt** —— `Media.alt` 是 `localized` + `required`，只填英文会让 `/zh` 回落英文 alt，白丢一层 SEO。

logo 统一用 `logo-` 前缀命名（`logo-siemens`、`logo-abb`…），媒体库好检索。

- [ ] **Step 3: 录入 About 页真实内容**

后台「页面 → About」，把 Task 4 seed 出的演示数据替换为设计文档里的正式文案，并按设计文档的顺序补齐 blocks：

1. `richText` —— 公司简介（海报④左侧正文）
2. `statsGrid` —— 15 Software Copyrights / 2 Administrative Licenses / 2 Participation in Bidding Projects
3. `featureColumns` —— 三大业务线（3 栏，无 kicker）
4. `featureColumns` —— 团队协作优势（3 栏，无 kicker/footnote）
5. `imageGallery` —— 团队照 + 8 张柜体实拍
6. `logoStrip` —— 10 个供应商 logo
7. `imageGallery`（勾选「自动展示资质证书」）
8. `ctaBanner` + `contactForm`

每个 block 都要切到 zh 语种再填一遍中文。

- [ ] **Step 4: 核对首页优势区数字**

后台「站点设置 → 首页优势区」，核对 `160+ patents`、`300+ cases`、`±0.01mm` 等数字与当前实际情况一致——这些数字以后归运营维护，不再需要改代码。

- [ ] **Step 5: 人工验收**

- 浏览器开 `http://localhost:3000/en` 与 `/zh`，逐条比对海报原文有无遗漏
- DevTools 切 375px 宽：四栏堆成单栏、文字可读、logo 条不溢出
- `/zh` 下不应残留未翻译的英文（技术术语除外）

- [ ] **Step 6: 补运营文档**

在 `docs/ADMIN_GUIDE.md` 里补一节：

```markdown
## 首页优势区与多栏要点

**首页优势区**在「站点设置 → 首页优势区」维护：2–4 栏，每栏含小标、标题、
要点列表和脚注。栏目全部留空则该区块在首页隐藏。

要点支持两级：填了「加粗前缀」就渲染成 **HARDWARE** IP66-rated… 的形式，
留空则是普通要点。

**多栏要点 / Logo 横条**是页面 block，在「页面」里给固定页添加。
Logo 建议上传透明底 PNG，会按统一高度等比缩放，不会被裁切。

⚠️ 每个字段都要切到中文语种再填一遍；只填英文的话中文站会显示英文。
图片的替代文本（Alt）同理。
```

- [ ] **Step 7: 提交**

```bash
git add docs/ADMIN_GUIDE.md
git commit -m "docs: 后台使用说明补首页优势区与多栏要点

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## 自查结果

**Spec 覆盖**：决策 1（两种 block）→ Task 1；决策 2（SiteSettings）→ Task 1 + 5；决策 3（字段与组件各一份）→ Task 1/2/3；渲染约定（logo 不走 card、375px 单栏）→ Task 3 + 5；内容落点 → Task 4 + 5 + 6；图片入库 → Task 6；文案转录 → Task 5（海报①）+ Task 4/6（海报②③④）；已知陷阱（行 id、迁移）→ Task 1/4/5；验收 5 条 → Task 5 Step 8 + Task 6 Step 5。

**未覆盖项**：海报④ 的 5 个应用行业按设计文档决定不录入（`ApplicationScenarios` 已有），About 页改为链接到现有行业页——该链接在 Task 6 Step 3 的 `richText` 里手工加，不需要代码改动。

**类型一致性**：`FeatureColumn` / `FeatureColumnItem` / `LogoItem` 三个类型在 Task 2/3 定义，Task 4/5 引用时名称与字段一致；`featureColumnsField` 的 `name: 'columns'` 与组件的 `columns` prop、CMS 的 `block.columns` 三处对齐。
