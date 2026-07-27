# 阿里国际站海报内容重建 — 设计文档

日期：2026-07-27
状态：已确认，待实施

## 背景与目标

公司在阿里国际站使用的 4 张营销海报（2000px 宽横幅，英文文字已烧进像素）需要迁移到官网。

直接贴整图有三个问题：

1. **中文站失效** —— 文字在像素里，`/zh` 仍显示英文，Payload Localization 无从介入
2. **SEO 归零** —— 信息密度最高的技术规格（MIL-STD-883G、IEC 60529、OPC UA/MQTT 等）不进 DOM，搜索引擎抓不到
3. **移动端不可读** —— 2000×670 的横幅在 375px 视口下文字缩到约 6px

因此采用**内容重建**：文字提取为结构化 CMS 内容，仅保留真实照片资产（产品实拍、团队照、供应商 logo）为图片。

## 素材盘点

| 海报 | 新增价值 | 站内已存在 |
|---|---|---|
| ① COMPANY ADVANTAGE | 全部新增。四栏技术要点，SEO 价值最高 | — |
| ② PROFESSIONAL CUSTOMIZED ELECTRICAL CABINET | 供应商 logo 墙（10 个）+ 8 张柜体实拍 | — |
| ③ 团队（2016 / 30 EXPERTS） | 团队实拍照 + 3 条协作优势 | 四大专业 = `Capabilities.tsx`；2016/30 数据 = `Trust.tsx` |
| ④ COMPANY PROFILE | 公司简介正文、KEY ACHIEVEMENTS、三大业务线 | 5 个应用行业 = `ApplicationScenarios` collection |

海报③ 的四大专业与年份/人数、海报④ 的 5 个行业**不重复录入**，避免站内重复内容稀释 SEO 权重。海报④ 的行业区改为链接到现有行业页。

## 架构决策

### 决策 1：新增 2 种 Pages block，而非全部塞进现有 5 种

现有 `richText` 排不出「四栏 × (小标题 + 要点列表 + 脚注)」版式，会退化成一长串 bullet；`imageGallery` 是 4 列大卡片网格，撑不起 logo 横条。

新增：

- `featureColumns` —— 多栏要点（承载海报① 与海报④ 的三大业务线）
- `logoStrip` —— logo 横条（承载海报② 上半）

### 决策 2：首页优势区数据走 CMS，落在 SiteSettings global

首页四栏布局固定在代码里（遵 CLAUDE.md「首页区块结构在代码里固定」），但栏内文字（含 `160+ patents`、`300+ cases` 等会变动的数字）由运营在后台维护。

落在 `SiteSettings` 而非新建 global：

1. `SiteSettings` 的 afterChange 钩子已挂在 `src/hooks/revalidate.ts`，保存即触发首页 revalidate，无需新接钩子
2. 首页「数据动态」的既有来源就是它（联系方式），符合既定的「结构固定、数据动态」分法
3. 后台不增加顶级菜单项

### 决策 3：字段定义与渲染组件各只写一份

四栏版式在首页（数据源 SiteSettings）和 About 页（数据源 Pages block）两处出现。

```
src/fields/featureColumns.ts              ← 字段定义（columns 数组，全部 localized）
  ├── src/blocks/index.ts                 ← FeatureColumnsBlock 引用
  └── src/globals/SiteSettings.ts         ← homeAdvantage 组引用

src/components/ui/FeatureColumns.tsx      ← 纯展示组件，只吃 props
  ├── src/blocks/renderers.tsx            ← CMS block 数据喂它
  └── src/components/home/CompanyAdvantage.tsx  ← SiteSettings 数据喂它
```

照 `src/fields/{slug,seo}.ts` 的既有复用做法。以后给每栏加图标等字段只改一个文件。

## 数据结构

### 共享字段定义 `src/fields/featureColumns.ts`

```ts
featureColumnsField: ArrayField  // name: 'columns'
{
  minRows: 2, maxRows: 4
  fields: [
    kicker:   text (localized, optional)   // "INTEGRATED SOLUTIONS"；海报④ 三大业务线无 kicker，故可选
    title:    text (localized, required)   // "Software-Hardware Synergy"
    items:    array {
      label:  text (localized, optional)   // 可选加粗前缀，如 "HARDWARE"
      text:   text (localized, required)   // 要点正文
    }
    footnote: text (localized, optional)   // 灰底脚注
  ]
}
```

`items.label` 为可选是刻意设计：海报① 的 OEM/ODM 栏是二级结构（**HARDWARE** → IP66-rated…、**SOFTWARE** → White-label HMI…），其余三栏是平铺 bullet。一个可选字段覆盖两种形态，不引入嵌套数组。

### `featureColumns` block

```ts
{
  slug: 'featureColumns'
  fields: [
    heading?: text (localized)
    ...featureColumnsField
  ]
}
```

### `logoStrip` block

```ts
{
  slug: 'logoStrip'
  fields: [
    heading?: text (localized)             // "COOPERATIVE SUPPLIERS"
    logos: array {
      image: upload → media (required)
      name:  text (required)               // "Siemens"，用于 title 属性
    }
  ]
}
```

### `SiteSettings.homeAdvantage`

```ts
{
  name: 'homeAdvantage'
  type: 'group'
  label: { en: 'Homepage Advantage Section', zh: '首页优势区' }
  fields: [
    eyebrow?: text (localized)             // 区块小标（SectionHeader 需要）
    heading?: text (localized)
    ...featureColumnsField
  ]
}
```

## 渲染约定

- **logo 图不走 `card` 尺寸** —— `card` 是 640×480 居中裁切，logo 会被切掉或塞进错误比例。直接用原图（`MediaImage` 不传 `size`），logo 文件本身仅几 KB。渲染用 `object-contain` + 统一高度
- 四栏在 375px 视口必须堆成单栏 —— 这是不用整图的全部理由，是验收硬指标
- 视觉沿用首页设计体系：1px 分隔线网格、`kicker` 用 `text-accent` 小写字距、脚注用 `bg-mist` 灰底

## 内容落点

**首页**：`CompanyAdvantage` 区块（海报①），插在 `Capabilities` 之后、`FeaturedProducts` 之前。

**About 页**（`Pages` collection 的 about 文档）blocks 顺序：

1. `richText` —— 海报④ 公司简介正文
2. `statsGrid` —— 海报④ KEY ACHIEVEMENTS（15 软件著作权 / 2 行政许可 / 2 中标项目）
3. `featureColumns` —— 海报④ 三大业务线（无 kicker，3 栏）
4. `featureColumns` —— 海报③ 团队协作优势（无 kicker、无 footnote，3 栏）
5. `imageGallery` —— 团队照 + 8 张柜体实拍
6. `logoStrip` —— 海报② 供应商墙
7. `imageGallery`（`fromCertificates: true`）—— 现有证书墙
8. `ctaBanner` + `contactForm` —— 保持现状

## 图片入库

图片走 `/admin` 后台上传，**不进 seed**。`photos-out/` 已在 `.gitignore` 内，真图写进 seed 会让 CI 的 `pnpm seed` 步骤失败。seed 保持现有占位图逻辑不变。

流程：原件放 `photos-out/` → 后台媒体库上传 → **alt 中英各填一遍**（`Media.alt` 是 localized + required，只填英文会让 zh 站回落英文 alt）→ 在 About 页 blocks 中选图。

logo 单独上传，命名前缀 `logo-`（如 `logo-siemens`），便于媒体库检索。

## 文案

英文逐条转录自海报，中文出初稿后由运营在后台校对。技术术语（MIL-STD-883G、IEC 60529、GB/T 2423.1、OPC UA/MQTT、IP66、NVIDIA Jetson）保持原样不译。

### 海报① COMPANY ADVANTAGE（首页，4 栏）

| kicker | title | items | footnote |
|---|---|---|---|
| INTEGRATED SOLUTIONS | Software-Hardware Synergy | PLC/HMI/SCADA programming & commissioning · AI-enabled edge computing (NVIDIA Jetson) · Industrial cloud integration (OPC UA/MQTT) | Achieves 30% communication load reduction via AI optimization |
| OEM/ODM SERVICES | End-to-End Customization | **HARDWARE** IP66-rated control cabinets & modular layouts · **SOFTWARE** White-label HMI interfaces & IIoT expansions | Global logistics supported by 160+ patents |
| MIL-SPEC QC | Rigorous Quality Fortress | Component aging tests (MIL-STD-883G) · Control cabinet IP validation (IEC 60529) · 72hr load simulation (GB/T 2423.1) | ±0.01mm precision machining records |
| 24/7 GLOBAL SUPPORT | Uninterrupted Service Commitment | Remote diagnostics & firmware updates · On-site engineers (APAC/EU/NA) · Air-shipped replacements ≤24hr | Shared fault code database (300+ cases) |

### 海报④ 三大业务线（About 页 `featureColumns`，3 栏）

- **Industrial-grade electrical control equipment** —— PLC control cabinets、high/low-voltage power distribution systems、explosion-proof cabinets、AI-enabled control cabinets、cloud server-integrated cabinets
- **Digital software services** —— PLC programming and cloud platform development、WinCC/HMI human-machine interface design、AI industrial algorithm deployment、customized industrial APP development
- **Integrated innovation solutions** —— Equipment data acquisition and cloud communication systems、remote operation and maintenance platforms、smart factory transformation services

### 海报③ 团队协作优势（About 页 `featureColumns`，3 栏，无 kicker/footnote）

- **Streamlined** —— cross-department coordination with clearly defined roles
- **Industry-leading** —— operational efficiency accelerating response to automation demands
- **Full-spectrum** —— technical solutions from concept design to implementation

海报③ 的四大专业（Software Development / Electrical Engineering / Automation Control / AI & Network Engineering）与 2016 / 30 experts 数据不录入，首页 `Capabilities.tsx`、`Trust.tsx` 已覆盖。

### 海报④ KEY ACHIEVEMENTS（`statsGrid`）

`15` Software Copyrights · `2` Administrative Licenses · `2` Participation in Bidding Projects

### 海报② 供应商（`logoStrip`）

Siemens、Schneider Electric、CHINT、Eaton、Mitsubishi、ABB、Omron、Delixi、Honeywell、Rockwell Automation

> 商标使用风险已向业主提示（未经授权以图形商标展示「合作」关系，官网风险高于第三方平台）。业主确认保留 logo 图形墙，按其决定实施。站内已有 ABB、Schneider 的授权书扫描件（`cert-abb-authorization`、`cert-schneider-authorization`）。

## 实施清单

**新增文件**

- `src/fields/featureColumns.ts`
- `src/components/ui/FeatureColumns.tsx`
- `src/components/ui/LogoStrip.tsx`
- `src/components/home/CompanyAdvantage.tsx`

**修改文件**

- `src/blocks/index.ts` + `src/blocks/renderers.tsx`（CLAUDE.md 记过：这两处必须同步增改）
- `src/globals/SiteSettings.ts`
- `src/app/(frontend)/[locale]/page.tsx`
- `seed/index.ts`（About 页 layout 补演示数据）
- 新迁移文件 + 重新生成的 `src/payload-types.ts`

## 已知陷阱

- **localized 数组的行 id** —— `featureColumns.columns`、`logos` 都是 localized 数组，结构本身不 localized、只有叶子字段是。seed 里写 zh 文案时必须先读回 en 文档、带上原有行 id 再 map，否则数组被重建、en 内容全丢。照 `seed/index.ts` 现有的 `specs` / `layout` 写法
- **schema 变更走迁移** —— `pnpm payload migrate:create <name>` + `pnpm generate:types`，迁移文件进 git。不要依赖 dev 模式的 Drizzle push（无人值守会卡在交互式询问）

## 验收

1. `pnpm lint` → `pnpm exec tsc --noEmit` → `pnpm payload migrate` → `pnpm build` 全绿
2. 集成测试补一条：`SiteSettings.homeAdvantage` 可读可写
3. e2e 补断言：首页出现优势区标题、About 页出现 logo 条
4. 手动验证 375px 视口：四栏堆成单栏、文字可读
5. `/zh` 下所有新增文案显示中文，无英文回落残留
