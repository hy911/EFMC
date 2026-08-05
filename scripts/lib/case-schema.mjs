#!/usr/bin/env node
/**
 * 客户案例 JSON 的校验规则 —— 单文件、零依赖，两种用法：
 *
 *   1. 官网导入器 import 它（scripts/import-case-study.mjs）
 *   2. 外部写手（含 AI 助手）把这个文件跟 case.json 放一起，直接跑：
 *
 *        node case-schema.mjs case.json
 *
 * 之所以做成一个文件：写手那边没有仓库、没有数据库、装不了依赖，
 * 但他们能跑 node。让他们自己改到通过再交付，比来回截图对比快得多。
 *
 * 改字段契约时**同时更新 docs/CASE_STUDY_JSON.md** —— 那份文档是给
 * 外部写手看的交付规范，两处不同步等于让人照着错的写。
 *
 * 各字段的**可选值清单不在这个文件里手写**，一律查同目录的 case-blocks.json
 * （由 scripts/gen-case-blocks.mjs 从 src/blocks/case.ts 生成）。手抄一份的话，
 * 代码里加了新版式而这里没跟上，校验器就会把合法内容判成非法。
 */
import fs from 'node:fs'
import path from 'node:path'

/** 积木块目录：字段与可选值的权威来源，跟本文件放在同一目录一起交付 */
const CATALOG = JSON.parse(
  fs.readFileSync(new URL('./case-blocks.json', import.meta.url), 'utf8'),
)

/**
 * 取某个字段的可选值。路径按 Payload 的字段名走（跟 JSON 契约的键不一定同名，
 * 例如 JSON 的 panel.imageTags 对应 Payload 的 panelImageTags）。
 * 查不到就抛错 —— 静默返回空数组会让校验器放行一切，比报错危险得多。
 */
function optionsOf(blockSlug, ...segs) {
  let node = CATALOG.blocks[blockSlug]?.fields
  for (const seg of segs.slice(0, -1)) node = node?.[seg]?.fields
  const opts = node?.[segs.at(-1)]?.options
  if (!opts?.length) {
    throw new Error(
      `case-blocks.json 里找不到 ${blockSlug}.${segs.join('.')} 的选项；` +
        `重新生成：pnpm exec tsx scripts/gen-case-blocks.mjs`,
    )
  }
  return opts
}

/** 值必须在可选清单里；错误信息直接用清单本身，永远不会跟代码对不上 */
function checkOption(at, p, value, blockSlug, ...segs) {
  if (value === undefined || value === null || value === '') return
  const opts = optionsOf(blockSlug, ...segs)
  if (!opts.includes(value)) at(p, `只能是 ${opts.join(' / ')}，收到 "${value}"`)
}

export const isText = (v) =>
  v && typeof v === 'object' && typeof v.en === 'string' && v.en.trim() !== ''
export const en = (v) => v?.en
export const zh = (v) => (typeof v?.zh === 'string' && v.zh.trim() !== '' ? v.zh : undefined)

/** block 类型简写 → Payload 的 blockType */
export const BLOCK_TYPE = {
  split: 'caseSplit',
  figure: 'caseFigure',
  cards: 'caseCards',
  steps: 'caseSteps',
  compare: 'caseCompare',
  statement: 'caseStatement',
}

// 有人在 case.ts 里改了 block 的 slug 而这里没跟上，就在启动时炸出来，
// 别等到导入时才发现半个案例写不进去
for (const [short, slug] of Object.entries(BLOCK_TYPE)) {
  if (!CATALOG.blocks[slug]) {
    throw new Error(
      `BLOCK_TYPE.${short} 指向 "${slug}"，但 case-blocks.json 里没有这个块。` +
        `要么 src/blocks/case.ts 改了 slug，要么目录过期了（pnpm exec tsx scripts/gen-case-blocks.mjs）`,
    )
  }
}

/**
 * 校验 JSON，返回错误清单。宁可在这里啰嗦，也别让半截内容进库 ——
 * 外部写手拿到的应该是「第 3 个章节缺 heading.zh」这种能直接改的提示。
 */
export function validate(data) {
  const errs = []
  const at = (p, msg) => errs.push(`${p}：${msg}`)

  if (!data.slug || !/^[a-z0-9-]+$/.test(data.slug))
    at('slug', '必填，只能用小写字母、数字和连字符')
  if (!isText(data.title)) at('title', '必填，需要 { en, zh }')
  if (data.titleAccent !== undefined && !isText(data.titleAccent))
    at('titleAccent', '写了就要 { en, zh }')
  if (!isText(data.excerpt)) at('excerpt', '必填，需要 { en, zh }（列表卡片和页头导语都用它）')
  if (!data.cover) at('cover', '必填，封面图文件名')
  if (!Array.isArray(data.sections) || data.sections.length === 0)
    at('sections', '至少要有一个章节')

  for (const [i, m] of (data.metrics ?? []).entries()) {
    if (!isText(m.value)) at(`metrics[${i}].value`, '需要 { en, zh }')
    if (!isText(m.label)) at(`metrics[${i}].label`, '需要 { en, zh }')
  }
  if ((data.metrics?.length ?? 0) > 4) at('metrics', '最多 4 条（页头数据条一排放 4 个）')

  for (const [i, h] of (data.highlights ?? []).entries()) {
    if (!isText(h)) at(`highlights[${i}]`, '需要 { en, zh }')
  }
  if ((data.highlights?.length ?? 0) > 4) at('highlights', '最多 4 个能力标签')

  for (const [i, s] of (data.sections ?? []).entries()) {
    const p = `sections[${i}]`
    if (!BLOCK_TYPE[s.type]) {
      at(p, `type 只能是 ${Object.keys(BLOCK_TYPE).join(' / ')}，收到 "${s.type}"`)
      continue
    }
    if (!isText(s.kicker))
      at(`${p}.kicker`, '必填，需要 { en, zh }（章节编号前台自动加，别自己写）')
    if (!isText(s.heading)) at(`${p}.heading`, '必填，需要 { en, zh }')
    if (s.intro !== undefined && !isText(s.intro)) at(`${p}.intro`, '写了就要 { en, zh }')
    checkOption(at, `${p}.theme`, s.theme, BLOCK_TYPE[s.type], 'theme')
    if (s.themeImage && s.theme !== 'dark')
      at(`${p}.themeImage`, '只有 theme 为 dark 时才有底纹照片')

    switch (s.type) {
      case 'split':
        for (const k of ['quoteLabel', 'quoteFooter']) {
          if (s[k] !== undefined && !isText(s[k])) at(`${p}.${k}`, '写了就要 { en, zh }')
        }
        if (!Array.isArray(s.points) || s.points.length === 0) at(`${p}.points`, '至少一条')
        for (const [j, pt] of (s.points ?? []).entries()) {
          if (!isText(pt.label)) at(`${p}.points[${j}].label`, '需要 { en, zh }')
          if (!isText(pt.text)) at(`${p}.points[${j}].text`, '需要 { en, zh }')
        }
        break
      case 'figure':
        if (!s.image) at(`${p}.image`, '必填，图片文件名')
        if (!isText(s.imageAlt)) at(`${p}.imageAlt`, '必填，需要 { en, zh }（SEO 与无障碍都靠它）')
        checkOption(at, `${p}.variant`, s.variant, 'caseFigure', 'variant')
        break
      case 'cards':
        checkOption(at, `${p}.layout`, s.layout, 'caseCards', 'layout')
        if (s.layout === 'metrics') {
          for (const [j, c] of (s.cards ?? []).entries()) {
            if (!isText(c.value)) at(`${p}.cards[${j}].value`, 'metrics 版式每张卡都要大号数值')
          }
          if (s.sideImage && !isText(s.sideImageAlt))
            at(`${p}.sideImageAlt`, '有 sideImage 就必须有 alt')
          if (isText(s.sideImageValue) && !s.sideImage)
            at(`${p}.sideImage`, '填了角标数值就要给佐证图')
        }
        if (s.layout === 'bento' && (s.cards ?? []).filter((c) => c.image).length < 4)
          at(`${p}.layout`, 'bento 拼贴要 4 张以上带图卡片，否则会排得参差不齐')
        if (!Array.isArray(s.cards) || s.cards.length === 0) at(`${p}.cards`, '至少一张')
        for (const [j, c] of (s.cards ?? []).entries()) {
          if (!isText(c.title)) at(`${p}.cards[${j}].title`, '需要 { en, zh }')
          if (!isText(c.text)) at(`${p}.cards[${j}].text`, '需要 { en, zh }')
          if (c.image && !isText(c.imageAlt)) at(`${p}.cards[${j}].imageAlt`, '有图就必须有 alt')
        }
        if ((s.facts?.length ?? 0) > 4) at(`${p}.facts`, '最多 4 格（一排放 4 个）')
        for (const [j, f] of (s.facts ?? []).entries()) {
          if (!isText(f.value)) at(`${p}.facts[${j}].value`, '需要 { en, zh }')
          if (!isText(f.label)) at(`${p}.facts[${j}].label`, '需要 { en, zh }')
        }
        if (s.note !== undefined && !isText(s.note)) at(`${p}.note`, '写了就要 { en, zh }')
        break
      case 'steps': {
        checkOption(at, `${p}.style`, s.style, 'caseSteps', 'style')
        for (const [j, st] of (s.steps ?? []).entries()) {
          checkOption(at, `${p}.steps[${j}].tone`, st.tone, 'caseSteps', 'steps', 'tone')
          checkOption(
            at,
            `${p}.steps[${j}].pictogram`,
            st.pictogram,
            'caseSteps',
            'steps',
            'pictogram',
          )
          if (st.focal && (!Array.isArray(st.focal) || st.focal.length !== 2))
            at(`${p}.steps[${j}].focal`, '要写成 [x, y]，两个 0–100 的数')
        }
        if (!Array.isArray(s.steps) || s.steps.length < 2 || s.steps.length > 6)
          at(`${p}.steps`, '2–6 步（桌面端一行最多 6 个）')
        for (const [j, st] of (s.steps ?? []).entries()) {
          if (!isText(st.title)) at(`${p}.steps[${j}].title`, '需要 { en, zh }')
          if (!isText(st.text)) at(`${p}.steps[${j}].text`, '需要 { en, zh }')
          if (st.image && !isText(st.imageAlt)) at(`${p}.steps[${j}].imageAlt`, '有图就必须有 alt')
        }
        // 只给一半步骤配图会排得参差不齐
        const hasVisual = (st) => st.image || (st.pictogram && st.pictogram !== 'none')
        const withImg = (s.steps ?? []).filter(hasVisual).length
        if (withImg > 0 && withImg < (s.steps?.length ?? 0))
          at(
            `${p}.steps`,
            `要配图就每步都配，示意图也算（现在 ${s.steps.length} 步里只有 ${withImg} 步有）`,
          )
        if (s.cellLabel !== undefined && !isText(s.cellLabel))
          at(`${p}.cellLabel`, '写了就要 { en, zh }')
        if (s.proofValue !== undefined && !isText(s.proofValue))
          at(`${p}.proofValue`, '写了就要 { en, zh }')
        if (isText(s.proofValue) && !isText(s.proofNote))
          at(`${p}.proofNote`, '填了 proofValue 就要说明这个数值的出处')
        break
      }
      case 'compare':
        for (const k of ['area', 'before', 'after']) {
          if (!isText(s.labels?.[k])) at(`${p}.labels.${k}`, '需要 { en, zh }（表头）')
        }
        if (!Array.isArray(s.rows) || s.rows.length === 0) at(`${p}.rows`, '至少一行')
        for (const [j, r] of (s.rows ?? []).entries()) {
          for (const k of ['area', 'before', 'after']) {
            if (!isText(r[k])) at(`${p}.rows[${j}].${k}`, '需要 { en, zh }')
          }
        }
        // panel 是可选的图示面板，整块以 panel.image 为开关
        if (s.panel) {
          const q = `${p}.panel`
          if (!s.panel.image) at(`${q}.image`, '必填，右卡的识别画面文件名（不想要图示面板就整个删掉 panel）')
          if (!isText(s.panel.imageAlt)) at(`${q}.imageAlt`, '必填，需要 { en, zh }')
          for (const k of ['beforeLabel', 'beforeTitle', 'afterLabel', 'afterTitle']) {
            if (!isText(s.panel[k])) at(`${q}.${k}`, '必填，需要 { en, zh }')
          }
          if (!Array.isArray(s.panel.beforeRows) || s.panel.beforeRows.length === 0)
            at(`${q}.beforeRows`, '至少一条情形（最多 3 条）')
          if ((s.panel.beforeRows?.length ?? 0) > 3) at(`${q}.beforeRows`, '最多 3 条')
          for (const [j, r] of (s.panel.beforeRows ?? []).entries()) {
            if (!isText(r.symbol)) at(`${q}.beforeRows[${j}].symbol`, '需要 { en, zh }')
            if (!isText(r.text)) at(`${q}.beforeRows[${j}].text`, '需要 { en, zh }')
            if (r.image && !isText(r.imageAlt)) at(`${q}.beforeRows[${j}].imageAlt`, '有图就必须有 alt')
          }
          if ((s.panel.imageTags?.length ?? 0) > 3) at(`${q}.imageTags`, '最多 3 个浮标')
          for (const [j, t] of (s.panel.imageTags ?? []).entries()) {
            if (!isText(t.text)) at(`${q}.imageTags[${j}].text`, '需要 { en, zh }')
            // JSON 的 panel.imageTags 对应 Payload 的 panelImageTags
            checkOption(
              at,
              `${q}.imageTags[${j}].corner`,
              t.corner,
              'caseCompare',
              'panelImageTags',
              'corner',
            )
          }
          if ((s.panel.afterFacts?.length ?? 0) > 3) at(`${q}.afterFacts`, '最多 3 格（一排放 3 个）')
          for (const [j, f] of (s.panel.afterFacts ?? []).entries()) {
            if (!isText(f.label)) at(`${q}.afterFacts[${j}].label`, '需要 { en, zh }')
            if (!isText(f.value)) at(`${q}.afterFacts[${j}].value`, '需要 { en, zh }')
          }
        }
        break
      case 'statement':
        if (!isText(s.statement)) at(`${p}.statement`, '必填，需要 { en, zh }（深色底的那句大字）')
        break
    }
  }
  return errs
}

/** 收集 JSON 里引用的全部图片文件名 */
export function collectImages(data) {
  const files = new Set([data.cover])
  for (const s of data.sections ?? []) {
    if (s.image) files.add(s.image)
    if (s.themeImage) files.add(s.themeImage)
    if (s.sideImage) files.add(s.sideImage)
    for (const c of s.cards ?? []) if (c.image) files.add(c.image)
    for (const st of s.steps ?? []) if (st.image) files.add(st.image)
    if (s.panel?.image) files.add(s.panel.image)
    for (const r of s.panel?.beforeRows ?? []) if (r.image) files.add(r.image)
  }
  return [...files].filter(Boolean)
}

/**
 * 检查引用到的图片在素材目录里是否真的存在。
 * 「JSON 写了 plc-panel.jpg 但目录里叫 PLC-panel.JPG」这种错，
 * 不检查的话要等导入到一半才报，而那时人已经把包发出去了。
 */
export function checkAssets(data, assetsDir) {
  const errs = []
  let names
  try {
    names = fs.readdirSync(assetsDir)
  } catch {
    return [`素材目录不存在：${assetsDir}`]
  }
  const lower = new Map(names.map((n) => [n.toLowerCase(), n]))
  for (const f of collectImages(data)) {
    if (names.includes(f)) continue
    const hit = lower.get(f.toLowerCase())
    errs.push(
      hit
        ? `图片 ${f}：目录里的实际文件名是 ${hit}，大小写不一致（Linux 服务器区分大小写）`
        : `图片 ${f}：素材目录里没有这个文件`,
    )
  }
  return errs
}

/**
 * 找出所有「有英文没中文」的字段。
 *
 * 这些不算错误 —— 官网会自动回落成英文照样能导入。正因为如此才危险：
 * 导完看中文站，一段一段的英文夹在中间，没人会想到是漏翻而不是排版坏了。
 * 所以单独列出来，交付前扫一眼。
 */
export function findUntranslated(node, trail = []) {
  const out = []
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    node.forEach((v, i) => out.push(...findUntranslated(v, [...trail, `[${i}]`])))
    return out
  }
  // { en, zh } 这种双语对象：只认 en 是不是有值
  if (typeof node.en === 'string') {
    if (!(typeof node.zh === 'string' && node.zh.trim())) {
      out.push({ path: trail.join('.').replace(/\.\[/g, '['), en: node.en })
    }
    return out
  }
  for (const [k, v] of Object.entries(node)) out.push(...findUntranslated(v, [...trail, k]))
  return out
}

/* ---------------- 直接运行时的命令行入口 ---------------- */

const isMain = process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href

if (isMain) {
  const file = process.argv[2]
  if (!file) {
    console.error('用法：node case-schema.mjs <case.json 路径> [素材目录，默认同级 assets/]')
    process.exit(1)
  }
  const full = path.resolve(process.cwd(), file)
  let data
  try {
    data = JSON.parse(fs.readFileSync(full, 'utf8'))
  } catch (e) {
    console.error(`✗ ${file} 不是合法的 JSON：${e.message}`)
    process.exit(1)
  }

  const assetsDir = process.argv[3]
    ? path.resolve(process.cwd(), process.argv[3])
    : path.join(path.dirname(full), 'assets')

  const errs = [...validate(data), ...checkAssets(data, assetsDir)]

  if (errs.length) {
    console.error(`✗ 共 ${errs.length} 处需要改：`)
    console.error('')
    for (const e of errs) console.error('  · ' + e)
    console.error('')
    console.error('改完再跑一次，直到这里显示「校验通过」。')
    process.exit(1)
  }

  const n = data.sections?.length ?? 0
  console.log(`✓ 校验通过：${n} 个章节，${collectImages(data).length} 张图片，素材齐全。`)

  const missing = findUntranslated(data)
  if (missing.length) {
    console.log('')
    console.log(`⚠ 有 ${missing.length} 处只写了英文、没写中文。`)
    console.log('  官网会自动用英文顶上，导入不会报错 —— 但中文站会出现一段一段的英文。')
    console.log('')
    for (const m of missing.slice(0, 20)) {
      console.log(`  · ${m.path}：${m.en.slice(0, 50)}${m.en.length > 50 ? '…' : ''}`)
    }
    if (missing.length > 20) console.log(`  · …还有 ${missing.length - 20} 处`)
    console.log('')
    console.log('  补完中文再交付。')
    process.exit(1)
  }

  console.log('可以交付了。')
}
