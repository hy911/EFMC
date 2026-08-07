---
name: import-case
description: 导入客户案例 JSON 到线上——先跑零依赖校验器自检，再以草稿导入，出预览链接给人确认，确认后才发布。写生产库，只能由用户手动调用。
disable-model-invocation: true
---

# 导入客户案例

**这个流程会写生产数据库。** 凭据从 `.env.import` 读（已 gitignore，模板见 `.env.import.example`），命令行前缀的环境变量优先于文件。**任何时候都不要把凭据打印出来、写进文件或贴进对话。**

案例内容与代码分离：导入器是通用的，内容放 `scripts/data/cases/*.json`。字段契约见 `docs/CASE_STUDY_JSON.md`——那份文档同时是给外部写手（含客户的 AI 助手）的交付规范。

## 第 0 步：把客户发来的东西放进仓库

客户交付的是一个 `case.json` 加一个 `assets/` 目录（包里的工具文件不用管，用仓库自己的那份——万一对方的 AI 顺手改过工具，用他们那份会出事）。

```bash
SLUG=<案例 slug>          # 就是 case.json 里的 slug 字段
mkdir -p photos-out/cases/$SLUG/assets
cp <客户目录>/assets/* photos-out/cases/$SLUG/assets/
cp <客户目录>/case.json scripts/data/cases/<名字>.json
```

`assets/` 不进 git（`photos-out/` 已 gitignore），JSON 进 git。然后把 JSON 里的 `assets` 字段改成**仓库根的相对路径**：

```json
"assets": "photos-out/cases/<slug>/assets",
```

客户包里那份写的是 `"assets": "assets"`（相对 case.json 自己），在仓库里跑会解析到错的位置。

**先看一眼这是改版还是新案例**——`scripts/data/cases/` 里已有同 slug 的就是改版，第 2 步要加 `--replace`。改版时顺便 `git diff` 看客户到底改了什么，比逐字读两份 JSON 快。

## 第 1 步：校验（不连库，先做这个）

```bash
node scripts/lib/case-schema.mjs scripts/data/cases/<名字>.json
```

`case-schema.mjs` 零依赖、不连库，外部写手也直接跑它。**规则只有这一份**——导入器 import 它，不要在别处另写一套。

它需要同目录的 `case-blocks.json`（字段与可选值目录，由 `pnpm exec tsx scripts/gen-case-blocks.mjs` 从 `src/blocks/case.ts` 生成）。发给外部写手时**两个文件都要给**。改了积木块的 select 选项就重新生成并提交，CI 的 `--check` 步骤会拦住忘记生成的情况。

它会查：必填字段、积木块类型合法性、图片文件是否存在（含**大小写不一致**——Linux 服务器区分大小写，Windows 上看不出来）、以及只有 `en` 没有 `zh` 的漏翻字段。

校验不过就别往下走。

想在导之前先看排版对不对，用客户那套预览工具（不连库、不写任何数据）：

```bash
node scripts/lib/case-preview.mjs scripts/data/cases/<名字>.json
```

在 JSON 旁边生成 `preview-en.html` / `preview-zh.html`（两个都已 gitignore），浏览器打开。渲染用的是官网真实组件，跟线上四处差异：没有导航栏页脚、没有末尾的产品推荐、没有入场动画、图片未压缩。

## 第 2 步：空跑，再以草稿导入

```bash
node scripts/import-case-study.mjs scripts/data/cases/<名字>.json --dry-run
node scripts/import-case-study.mjs scripts/data/cases/<名字>.json --draft            # 新案例
node scripts/import-case-study.mjs scripts/data/cases/<名字>.json --replace --draft  # 改版
```

`--draft` 的意义：Payload 存草稿**只写版本表，不动主表**，所以这一步不会碰线上已发布的那一版。同一个案例可以反复导，线上始终是旧版本，直到你显式发布。

线上已存在同 slug 的案例时不加 `--replace` 会直接报错退出——这是防止误覆盖，不是 bug。

图片走**内容指纹去重**（原始字节的 sha256），同一张图第二次导入直接复用已有 media，反复 `--replace` 不会在库里堆副本。输出里的 `↺ xxx.jpg 已在库里（media N），复用` 就是命中了。

`--prune` 只删「旧引用里新版本不再用的」那部分。改版时换掉的图确实会被删——那些图如果别处还在用就别加这个参数，多几张孤儿图不碍事（想清理用 `node scripts/find-orphan-media.mjs`）。

## 第 3 步：出预览链接

后台运营点文档里的「预览」按钮即可（走登录态 cookie，链接里不带令牌）。

要发给**没有后台账号**的人（客户、外部写手），在服务器上生成带令牌的链接——`PREVIEW_SECRET` 只存在于服务器的 `.env`：

```bash
# 在服务器上执行；不要把 PREVIEW_SECRET 的值贴进对话或聊天工具
docker compose exec app node -e "
const s = process.env.PREVIEW_SECRET
const base = process.env.NEXT_PUBLIC_SITE_URL
for (const l of ['en','zh'])
  console.log(\`\${base}/api/preview?path=\${encodeURIComponent('/'+l+'/cases/<slug>')}&secret=\${encodeURIComponent(s)}\`)
"
```

这条链接等于**永久有效的草稿通行证**，只发给该看的人。

## 第 4 步：自检翻译

```bash
curl "$PAYLOAD_URL/api/case-studies?where[slug][equals]=<slug>&locale=zh&fallback-locale=none&draft=true"
```

**`?fallback-locale=none` 不能省**——不加的话 zh 为空会回落成 en 的值，看起来有内容，实际是漏翻。

## 第 5 步：确认后发布

人工确认预览没问题了，再在后台点发布，或去掉 `--draft` 重导一次。

发布后 `src/hooks/revalidate.ts` 的 afterChange 钩子会调 `revalidatePath`，前台立刻生效，不用等 ISR 的 600 秒。

最后把 JSON 提交进 git——那是这条案例的内容源，丢了就只剩数据库里一份。

## 让客户改稿：导出与打包

客户要改一条**线上已有**的案例，别让他从白纸重写，把现有内容导出给他：

```bash
node scripts/export-case-study.mjs <slug>                    # → photos-out/export/<slug>/
node scripts/pack-case-kit.mjs photos-out/export/<slug>/case.json
```

导出器会拿导出的 JSON 跑一遍正向映射跟线上逐字段比对，对不上就拒绝写盘（防止反向映射漏字段）。

一个已知折损：Media 上传时统一转了 WebP，**原图 Payload 没留**，所以导出的素材是转换后的 webp。原始素材还在手上就换回原始的（文件名基名对得上即可，同时改 JSON 里的引用）。

打包脚本会把说明、字段规范、校验器、预览工具、积木块目录、预览产物和素材凑齐，并在包内跑一遍校验和预览——跑不通就不出包。手工拼漏过一次（视频封面没进包，客户照步骤做会卡在「图片缺失」）。

新案例从零写就用 `--empty`：

```bash
node scripts/pack-case-kit.mjs --empty --out photos-out/kit/new-case
```

## localized blocks 的通用套路（改导入器时才需要）

先以 `en` 写入 → 回读拿到 block id 与数组行 id → `mergeLocale()` 把 zh 叶子字段合并进去再 PATCH。

**跳过回读会让数组被重建、en 内容全丢**——Payload 的数组和 blocks 结构本身不是 localized，只有内部叶子字段是。

草稿模式下回读必须带 `&draft=true`：主表里放的是已发布那一版，读错了会把 zh 合并进错误的 block id。
