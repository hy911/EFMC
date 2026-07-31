# 客户案例交付规范（JSON）

官网的案例详情页是**结构化排版**，不是一篇富文本。写手（含 AI 助手）只需要交两样东西：

1. 一个 `case.json`（内容，中英双语）
2. 一个 `assets/` 目录（图片原图）

导入命令一条：

```bash
node scripts/import-case-study.mjs path/to/case.json --dry-run
```

空跑会逐条报出哪个字段不合格（精确到 `sections[3].steps[2].text`），改完去掉 `--dry-run` 就进站了。**不需要为案例单独做网页、写 HTML/CSS 或搭前端项目**——官网已有统一的版式和配色，另做一套只会和站点其它页面对不上。

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

> 我要为公司官网写一个客户案例。官网已有统一的版式，你**不需要做任何网页、HTML、CSS 或前端项目**，只需要产出两样东西：
>
> 1. 一个 `case.json`，严格按我提供的《客户案例交付规范》的字段格式写（把本文件内容一并发给它）
> 2. 把项目照片放进 `assets/` 目录，JSON 里只引用文件名
>
> 硬性要求：
> - 所有面向读者的文字都是 `{"en": "...", "zh": "..."}` 双语对象，中文单独写、不要机器直译
> - 章节只能用这 6 种 `type`：`split` / `figure` / `cards` / `steps` / `compare` / `statement`
> - 不要在文字里写章节序号（01、02），官网自动加
> - 只写我提供的材料里有的数字，没有出处的百分比、认证、品牌授权一律不要写
> - 每张图必须有中英 `imageAlt`
> - 图片里不要有文字
> - **每个章节都写 `intro`**（标题下的一两句铺垫），别只给标题和列表
> - 测试数据要连方法学一起写进 `intro`：测了多久、多大间隔、用什么仪器
> - 关键指标放 `metrics`（≤4 条）和 `steps` 的 `proofValue`/`proofNote`，有对比就写对比（"5 秒，上一版为 5 分钟"）
> - 页头可以放 2–4 个 `highlights` 能力标签
>
> 素材和项目情况：<在这里描述项目背景、附上照片和技术资料>

---

## 已有的两个案例

- `scripts/data/cases/ai-vision-precision-spraying.json` —— 9 个章节，用到全部 6 种块，可以当模板抄
- 精准喷淋降温案例（`scripts/import-case-study-spray-cooling.mjs`）是改成 JSON 之前写的专用脚本

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
