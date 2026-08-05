# 客户案例交付规范（JSON）

官网的案例详情页是**结构化排版**，不是一篇富文本。写手（含 AI 助手）只需要交两样东西：

1. 一个 `case.json`（内容，中英双语）
2. 一个 `assets/` 目录（图片原图）

导入命令一条：

```bash
node scripts/import-case-study.mjs path/to/case.json --dry-run
```

空跑会逐条报出哪个字段不合格（精确到 `sections[3].steps[2].text`），改完去掉 `--dry-run` 就进站了。

**写手可以自己先校验**，不用等导入：把 `scripts/lib/case-schema.mjs` 跟 `case.json` 放一起，

```bash
node case-schema.mjs case.json
```

这一个文件零依赖、不连数据库，会把字段问题、图片对不上、漏翻的中文一次列全。改到显示「校验通过」再交付。
（同目录的 `case-blocks.json` 要一起带上，校验器从它读可选值。）

**字段与可选值以 `scripts/lib/case-blocks.json` 为准。** 那个文件由代码自动生成（`pnpm exec tsx
scripts/gen-case-blocks.mjs`），列出每种积木块的全部字段和每个选项字段的合法取值。下面的说明是
给人看的「怎么挑块」，遇到不一致时以 JSON 为准 —— 手写文档会漂，生成物不会。AI 助手直接读那个
文件，比读散文准确得多。

**不需要为案例单独做网页、写 HTML/CSS 或搭前端项目**——官网已有统一的版式和配色，另做一套只会和站点其它页面对不上。

---

## 顶层字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `slug` | 是 | URL 用，小写字母/数字/连字符。如 `ai-vision-precision-spraying-dairy` |
| `title` | 是 | `{ en, zh }`，页头大标题。名词短语，别写成一句话 |
| `titleAccent` | 否 | `{ en, zh }`，大标题第二行，用浅蓝显示。按标题本来的断句拆，如「先认出来」/「再动作」 |
| `excerpt` | 是 | `{ en, zh }`，1–2 句。列表卡片和页头导语共用 |
| `cover` | 是 | 封面图文件名（只写文件名，不写路径） |
| `coverAlt` | 否 | `{ en, zh }`，封面 alt；不写则用 title |
| `coverFocal` | 否 | 封面裁切焦点 `[x, y]`，两个 0–100 的数。页头是宽幅裁切，主体不在正中就要给 |
| `assets` | 否 | 素材目录，相对项目根。不写则取 json 同级的 `assets/` |
| `industry` | 否 | 行业 slug：`agriculture-livestock` / `energy` / `water-treatment` / `machinery-machine-tools` / `industrial-automation` / `instrumentation` |
| `relatedProducts` | 否 | 产品 slug 数组，页面底部会出现这些产品的卡片内链 |
| `location` | 否 | `{ en, zh }`，项目地点 |
| `completedAt` | 否 | 交付月份，`"2026-04"` 这种格式 |
| `metrics` | 否 | 最多 4 条，页头下方的数据条。`[{ value: {en,zh}, label: {en,zh} }]` |
| `highlights` | 否 | 最多 4 个能力标签，页头导语下方。`[{ en, zh }]` |
| `sections` | 是 | 章节数组，见下 |

**所有面向读者的文字都是 `{ "en": "...", "zh": "..." }` 双语对象。** 中文缺失会自动回落英文——但那意味着中文站会出现英文段落，别偷懒。

---

## 章节类型

章节按数组顺序渲染，**编号（01 ·、02 ·）和深浅底色交替由官网自动生成**，不要自己在文字里写序号。

**每个章节都有三个通用字段**，六种类型都能用：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `kicker` | 是 | 小标，如「客户的要求」。前面的编号官网自动加 |
| `heading` | 是 | 大标题。写成完整一句话比两个词好看 |
| `intro` | 否 | 标题下方的一两句铺垫。**别省**——设计稿里每节标题下都有这段，缺了会显得空 |
| `theme` | 否 | 底色：`auto`（默认，白/浅蓝交替）/ `white` / `wash` 浅蓝 / `washBlue` 蓝调 / `dark` 深蓝 |
| `themeImage` | 否 | 只在 `theme: "dark"` 时有效，深蓝底后面的照片文件名。配 `themeImageAlt` |
| `accentEdge` | 否 | `true` 时章节左缘加一条 9px 渐变竖条。**整页最多用一次** |

底色别每节都指定。整页的节奏应该是：大部分留 `auto`，只给一两节深蓝（`dark`）让它跳出来。连着两节深蓝会糊成一片。

### 先想清楚每节要说什么，再挑块

**块是按内容形态分的，不是按好看程度分的。** 挑错了不会报错，但读者会觉得别扭。对照着选：

| 这一节要说的事 | 用 | 关键选项 |
| --- | --- | --- |
| 客户提了什么要求、原来卡在哪 | `split` | 有客户原话就填 `quote`（会变成深蓝引语卡） |
| 改造前后到底差在哪 | `compare` | 差别一句话说不清就加 `panel` 图示 |
| 一件事要走几步 / 数据怎么流转 | `steps` | `style: "strip"` |
| 出故障了系统怎么兜底 | `steps` | `style: "flow"` + 每步 `tone` |
| 交付流程、实施清单 | `steps` | `style: "grid"` |
| 系统由哪几块组成 | `cards` | 分层就 `layout: "bento"`，配 `theme: "dark"` 更像一个整体 |
| 测出来的数字 | `cards` | `layout: "metrics"` + 必填 `value` + `facts` 交代口径 |
| 一张能说明问题的实拍 | `figure` | 是上一节的证据就 `variant: "side"` |
| 全文收尾的一句话 | `statement` | 一篇只放一个，放最后 |

两条经验：

- **每节只说一件事。** 一节里既讲系统构成又讲测试结果，读者两样都记不住 —— 拆成两节。
- **6–9 节是舒服的长度。** 少于 6 节撑不起这个版式（字号很大，内容少了会显得空）；多于 9 节读者划不到底。

### `split` — 问题陈述（左标题 / 右引语 + 清单）

```json
{
  "type": "split",
  "kicker": { "en": "Client request", "zh": "客户的要求" },
  "heading": { "en": "...", "zh": "..." },
  "intro": { "en": "可选的铺垫", "zh": "..." },
  "quote": { "en": "客户原话", "zh": "..." },
  "points": [{ "label": { "en": "", "zh": "" }, "text": { "en": "", "zh": "" } }]
}
```

`quote` 填了就渲染成一张深蓝引语卡（左），问题清单排在右侧；可省。引号由页面自动加。`points` 建议 3 条。

引语卡底部可以再加两行落款，都可省：

```json
"quoteLabel": { "en": "The client’s core requirement", "zh": "客户的核心诉求" },
"quoteFooter": { "en": "01 / Classify before spraying", "zh": "01 / 先分类，再喷淋" }
```

### `figure` — 整幅图版

```json
{
  "type": "figure",
  "variant": "full",
  "kicker": {}, "heading": {}, "intro": {},
  "image": "system-architecture.png",
  "imageAlt": { "en": "", "zh": "" },
  "banner": { "en": "A → B → C → D", "zh": "甲 → 乙 → 丙 → 丁" }
}
```

架构图、对比图、现场实拍用这个。`banner` 是图下方深蓝条里的一行字，适合放流程概括，可省。

`variant` 可省，默认 `"full"` 独立章节，自己占一个编号。填 `"side"` 则是**上一节的佐证图**：并进上一节（不占编号，后面章节号不会被顶掉一位），文字放在图片右侧的深蓝面板里。现场实拍、截图这种「用来证明上一节说法」的图用 `side`，别单独立一节——单独立一节会让读者以为换话题了。

### `cards` — 卡片网格

```json
{
  "type": "cards",
  "kicker": {}, "heading": {}, "intro": {},
  "layout": "bento",
  "cards": [{
    "image": "plc-panel.jpg",
    "imageAlt": {},
    "tag": { "en": "01 / Control", "zh": "01 / 控制" },
    "title": {}, "text": {}
  }],
  "facts": [{ "value": { "en": "8 sec", "zh": "8 秒" }, "label": {} }],
  "note": { "en": "Project-specific results…", "zh": "以上为本项目的实测结果……" }
}
```

**有图**：每行 2 张、图在左，适合介绍系统组成部件。
**无图**（省略 `image`）：每行 3 张，适合价值点、测试结果。

`layout` 可省，默认 `"uniform"` 等宽。填 `"bento"` 则首尾两张通栏、中间两张并排（大·中·中·宽），适合介绍系统分层。**bento 要 4 张以上带图卡片**，不够会被导入器拦下——少于 4 张排出来只是参差不齐，不是层次感。

填 `"metrics"` 是测试结果专用版式：左边一列读数卡（左文字、右大号数字），右边一块深蓝区放佐证图 + 口径小格 + 免责小字。这时**每张卡必须有 `value`**（那个大号数字），另外可以给：

```json
"sideImage": "ai-detection.png",
"sideImageAlt": {},
"sideImageLabel": { "en": "Low-light test", "zh": "低照度测试" },
"sideImageValue": { "en": "35–40 lux", "zh": "35–40 lux" }
```

`facts`（最多 4 格）是卡片下方一排「数值 + 说明」，用来交代数据口径：测试窗口、采样间隔、仪器台数这类。`note` 是整块最下方的小字，放免责或适用范围。两者都可省。**凡是给了百分比、耗时这类数字的章节，都该用 `facts` 说清这些数字是怎么测出来的**——读者会先找口径。

### `steps` — 步骤条

```json
{
  "type": "steps",
  "kicker": {}, "heading": {}, "intro": {},
  "cellLabel": { "en": "System signal", "zh": "系统信号" },
  "steps": [{ "title": {}, "text": {}, "image": "plc-panel.jpg", "imageAlt": {} }],
  "proofValue": { "en": "5 sec", "zh": "5 秒" },
  "proofNote": { "en": "这个数值的含义与出处", "zh": "..." }
}
```

2–6 步，自动编号。实施流程、故障降级流程用这个。超过 6 步请合并——一行放不下就散了。

`style` 三选一，可省（默认 `strip`）：

| 值 | 长相 | 适合 |
| --- | --- | --- |
| `strip` | 一条横贯的流程带：上下两根横线、格间竖线、接缝上压 `›` 圆点 | 数据怎么流转 |
| `flow` | 一排彩色圆徽章 + 文字，中间 `›` 分隔 | 故障处理链路——每步要配 `tone` |
| `grid` | 每行三个的网格，顶部一条强调线 | 实施清单 |

`flow` 版式里，每步的 `tone` 表示这一步处在什么状态：`accent` 蓝（正常运行）/ `flag` 红（发现故障）/ `go` 绿（已进入安全态）/ `navy` 深蓝（记录留痕）。**按语义选，不要按好看选**——颜色在这里是信息。

窄屏一律换成每格自带顶线堆叠。

`image` 可选，但**要配就每步都配**——只配一半会排得参差不齐，导入时会直接报错拦下。配了图的格子里，图片右下角会自动压一枚写着步骤名的深色角标。

有的环节没有实物可拍（AI 推理、数据传输），硬塞一张机柜照片会让读者以为这一步发生在那台设备上。这种给 `pictogram` 让官网画个示意图，别放照片：

```json
{ "title": {}, "text": {}, "pictogram": "ai" }      // 或 "network"
```

`pictogram` 也算「配了图」，和照片混用不会被拦。

照片被裁进小格时默认居中，重点不在中间就用 `focal` 指定取景点（两个 0–100 的百分比，左上角是 `[0, 0]`）：

```json
{ "title": {}, "text": {}, "image": "camera-enclosure.jpg", "imageAlt": {}, "focal": [58, 38] }
```

焦点写在图片上，所有引用这张图的地方共用；后台图片编辑里也能拖那个十字改。

`cellLabel` 是每格右上角那行极小的字（参考稿里是 `SYSTEM SIGNAL`），纯版式装饰，可留空。

`proofValue` / `proofNote` 是步骤条下方的深色佐证块，放一个关键数值加出处，例如「5 秒 —— 报告记载升级后的摄像头故障响应，上一版为 5 分钟」。两个要么都填、要么都不填。

### `compare` — 前后对比表

```json
{
  "type": "compare",
  "kicker": {}, "heading": {}, "intro": {},
  "labels": { "area": {}, "before": {}, "after": {} },
  "rows": [{ "area": {}, "before": {}, "after": {} }]
}
```

改造前后、方案 A/B 对比用这个。窄屏内部横向滚动，不会撑破页面。

**可选：表格上方再放一组图示卡**。左卡列出旧逻辑下看起来完全一样的几种情形，右卡放一张识别画面加控制层读数——比纯表格更容易一眼看懂差别在哪。整块以 `panel` 存在与否为开关，不需要就整个删掉 `panel`。

```json
"panel": {
  "image": "ai-detection.png",
  "imageAlt": {},
  "beforeLabel": { "en": "Before", "zh": "改造前" },
  "beforeTitle": { "en": "Sensor-triggered logic", "zh": "传感器触发逻辑" },
  "beforeRows": [{
    "image": "ai-detection.png", "imageAlt": {},
    "symbol": { "en": "COW", "zh": "牛" },
    "text": { "en": "Cow enters position", "zh": "牛进入采食位" },
    "note": { "en": "Presence signal detected", "zh": "检测到在位信号" },
    "tag": { "en": "Trigger", "zh": "触发" }
  }],
  "beforeResultLabel": { "en": "Same input state", "zh": "输入状态完全相同" },
  "beforeResultValue": { "en": "No target classification", "zh": "没有目标分类" },
  "afterLabel": { "en": "After", "zh": "改造后" },
  "afterTitle": { "en": "AI vision decision", "zh": "AI 视觉决策" },
  "imageTags": [{ "text": { "en": "COW · 0.99", "zh": "COW · 0.99" }, "corner": "bottomLeft" }],
  "afterFacts": [{ "label": {}, "value": {}, "highlight": true }]
}
```

- `beforeRows` 最多 3 条。`image` 可省，省了就在方框里显示 `symbol` 那两个字
- `imageTags` 最多 3 个，浮在右卡画面上；`corner` 取 `bottomLeft`（默认）/ `topRight` / `topLeft`
- `afterFacts` 最多 3 格，最终结论那一格加 `"highlight": true`，会变成绿底

### `statement` — 深色收尾

```json
{
  "type": "statement",
  "kicker": { "en": "Project outcome", "zh": "项目成果" },
  "intro": {}, "heading": {}, "body": {},
  "statement": { "en": "希望读者记住的那一句", "zh": "..." }
}
```

一个案例放一个，放在最后。

---

## 图片

- 放进 `assets/`，JSON 里**只写文件名**
- 照片 JPG、界面截图 PNG、矢量图 SVG（自动转 PNG）
- 示意图长边 ≥ 1600px；照片 ≥ 1200px。**不要把文字烧进图片**——图里的字不能翻译、不能被搜索引擎读到、手机上还会糊
- 每张图的 `imageAlt` 必填，中英都要。这是 SEO 和无障碍的硬要求
- 同一张图在多处引用只会上传一次

---

## 写作要求

**只写有来源的数字。** 没有实测报告就不要写百分比、不要写「效率提升 30%」。有报告的照抄并保留出处措辞（"报告记录的漏检率 0.05%"），别四舍五入成整数。

**不要写资质、认证、品牌授权**，除非手里有对应的证书文件。海外 B2B 客户会逐项核对。

**长度参考**（一个案例总计）：6–9 个章节，正文 800–1200 词英文。`heading` 写成完整的一句话比两个词的标题更好看——版式给了很大字号。

**中文不是英文的直译。** 英文面向海外采购方，中文面向国内客户，各写各的语感，信息一致即可。

---

## 给 AI 助手的提示词

把下面这段连同素材一起给它：

> 我要为公司官网写一个客户案例。官网已有统一的版式和配色，你**不需要做任何网页、HTML、CSS，也不要新建前端项目**——那套东西做出来和官网对不上，我用不了。你只需要交两样东西：
>
> 1. 一个 `case.json`，严格按我发你的《客户案例交付规范》写（把那份文档全文一并发给它）
> 2. 把项目照片放进 `assets/` 目录，JSON 里只写文件名
>
> 我还会发你 `case-blocks.json`。**字段名和每个选项字段的合法取值一律以它为准**，不要发明新的
> 版式或字段名——写了不存在的值，导入会被拒。交付前自己跑 `node case-schema.mjs case.json`
> 校验到通过（`case-schema.mjs` 和 `case-blocks.json` 跟 `case.json` 放同一目录）。
>
> **内容要求**
> - 所有面向读者的文字都是 `{"en": "...", "zh": "..."}` 双语对象，中文单独写、不要机器直译
> - 只写我给的材料里有的数字。**没有实测报告就不要写百分比**，认证、资质、品牌授权一律不要写——海外客户会逐项核对
> - 有数字就连口径一起写：测了多长时间、多大间隔、用什么仪器。放在 `intro` 里，或者用 `cards` 的 `facts`
> - **每个章节都要写 `intro`**（标题下的一两句铺垫）。只给标题和列表，页面会显得很空
> - 6–9 个章节，英文正文 800–1200 词。`heading` 写成完整一句话，别写两个词的短标题——版式给了很大字号
>
> **结构要求**
> - 章节只能用这 6 种 `type`：`split` / `figure` / `cards` / `steps` / `compare` / `statement`
> - 先想清楚每节要说什么，再照规范里那张「先想清楚每节要说什么，再挑块」的表挑块和选项。**每节只说一件事**
> - 测试结果用 `cards` + `layout: "metrics"`，每张卡必须有 `value`（那个大号数字）
> - 故障降级/兜底流程用 `steps` + `style: "flow"`，每步的 `tone` 按语义选：`accent` 蓝正常 / `flag` 红故障 / `go` 绿安全态 / `navy` 深蓝留痕。**颜色在这里是信息，不是装饰**
> - 交付流程用 `steps` + `style: "grid"`；数据流转用默认的 `strip`
> - 不要在文字里写章节序号（01、02）、也不要写「第一步」——官网自动编号
>
> **版式克制**
> - `theme` 大部分留空（自动交替），整篇最多给一两节 `dark`；`accentEdge` 整篇最多用一次。这两个是用来突出重点的，每节都用就等于没用
>
> **图片要求**
> - 每张图必须有中英 `imageAlt`
> - **图片里不要有文字**——图里的字不能翻译、搜索引擎读不到、手机上还糊
> - 照片主体不在正中就给 `focal: [x, y]`（0–100 的百分比），否则会被裁掉
> - **没有实物可拍的环节不要硬凑照片**（AI 推理、数据传输、云端），用 `pictogram: "ai"` 或 `"network"` 让官网画示意图。放一张机柜照片会让读者以为那一步发生在那台设备上
>
> 写完先自查一遍：每节的 `intro` 都有吗？每个数字都有出处吗？中文是不是直译？
>
> 素材和项目情况：<在这里描述项目背景、附上照片和技术资料>

---

## 已有的两个案例

- **`scripts/data/cases/ai-vision-precision-spraying.json` —— 抄这个。** 9 个章节，用到全部 6 种块和绝大多数选项（引语卡、对比图示、metrics 数据、三种步骤版式、示意图、焦点、底色分档），是目前唯一跟得上前台版式的完整样本
- `scripts/import-case-study-spray-cooling.mjs` 是精准喷淋降温案例的专用脚本，写在通用导入器之前。**别照它写新案例**——它没有 JSON 契约、每加一个字段都要改代码，留着只是因为那个案例已经进库了

## 先导草稿，看过再发布

内容第一次进站建议走草稿：

```bash
node scripts/import-case-study.mjs case.json --replace --draft
```

草稿只写版本表，**线上已发布的那一版原样不动**。导完拿一条预览链接（带 `PREVIEW_SECRET`）发给写手，页面顶部会有一条红色「草稿预览」横幅，改到满意再去后台点发布。这样反复改不需要重新部署，也不会有半成品出现在线上或 sitemap 里。

## 导入选项

```bash
node scripts/import-case-study.mjs <json> --dry-run            # 只校验，不写数据
node scripts/import-case-study.mjs <json>                      # 导入
node scripts/import-case-study.mjs <json> --replace            # 已存在时覆盖
node scripts/import-case-study.mjs <json> --replace --prune    # 顺带删掉被换下的旧图
node scripts/import-case-study.mjs <json> --assets "D:/某目录"  # 覆盖素材目录
```

凭据从 `.env.import` 读（照 `.env.import.example` 抄一份填好，已 gitignore）：

```bash
cp .env.import.example .env.import
```

临时换目标站点不用改文件，命令前加变量即可（命令行优先于文件）：

```bash
PAYLOAD_URL=http://localhost:3000 node scripts/import-case-study.mjs <json> --dry-run
```
