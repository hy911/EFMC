---
name: import-case
description: 导入客户案例 JSON 到线上——先跑零依赖校验器自检，再以草稿导入，出预览链接给人确认，确认后才发布。写生产库，只能由用户手动调用。
disable-model-invocation: true
---

# 导入客户案例

**这个流程会写生产数据库。** 凭据从 `.env.import` 读（已 gitignore，模板见 `.env.import.example`），命令行前缀的环境变量优先于文件。**任何时候都不要把凭据打印出来、写进文件或贴进对话。**

案例内容与代码分离：导入器是通用的，内容放 `scripts/data/cases/*.json`。字段契约见 `docs/CASE_STUDY_JSON.md`——那份文档同时是给外部写手（含客户的 AI 助手）的交付规范。

## 第 1 步：校验（不连库，先做这个）

```bash
node scripts/lib/case-schema.mjs scripts/data/cases/<名字>.json
```

`case-schema.mjs` 零依赖、不连库，外部写手也直接跑它。**规则只有这一份**——导入器 import 它，不要在别处另写一套。

它会查：必填字段、积木块类型合法性、图片文件是否存在（含**大小写不一致**——Linux 服务器区分大小写，Windows 上看不出来）、以及只有 `en` 没有 `zh` 的漏翻字段。

校验不过就别往下走。

## 第 2 步：以草稿导入

```bash
node scripts/import-case-study.mjs scripts/data/cases/<名字>.json --draft
```

`--draft` 的意义：Payload 存草稿**只写版本表，不动主表**，所以这一步不会碰线上已发布的那一版。同一个案例可以反复导，线上始终是旧版本，直到你显式发布。

要替换已有案例的图片素材加 `--replace`。注意每次 `--replace` 都会重新上传全部图片，上一轮那批就此没人引用——攒多了用 `node scripts/find-orphan-media.mjs` 清。

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

## localized blocks 的通用套路（改导入器时才需要）

先以 `en` 写入 → 回读拿到 block id 与数组行 id → `mergeLocale()` 把 zh 叶子字段合并进去再 PATCH。

**跳过回读会让数组被重建、en 内容全丢**——Payload 的数组和 blocks 结构本身不是 localized，只有内部叶子字段是。

草稿模式下回读必须带 `&draft=true`：主表里放的是已发布那一版，读错了会把 zh 合并进错误的 block id。
