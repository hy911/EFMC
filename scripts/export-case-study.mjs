#!/usr/bin/env node
/**
 * 把线上已有的案例反导出成 case.json + assets/，交给客户（或其 AI 助手）改稿。
 *
 *   node scripts/export-case-study.mjs <slug> [--out 目录] [--draft] [--no-assets]
 *
 * 为什么要它：早期两个案例的内容一个硬编码在专用脚本里、一个只存在于数据库，
 * 客户想改就得从白纸重写。导出之后它们跟新案例走同一条路
 * （改 json → 校验 → 预览 → --replace --draft 导回）。
 *
 * **反向映射会跟正向漂** —— 所以这里不靠人眼保证：写盘前拿导出的 json 跑一遍
 * 正向的 sectionToBlock()，跟线上真实字段逐项比对，对不上就拒绝写。
 * 正向映射（case-to-payload.mjs）加了字段而这里没跟上，第一次导出就会红。
 *
 * 导出的是**已发布版**；要拿草稿加 --draft。
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import { api, login, requireEnv } from './lib/payload-api.mjs'
import { sectionToBlock } from './lib/case-to-payload.mjs'
import { BLOCK_TYPE, en as pickEn, validate } from './lib/case-schema.mjs'

const args = process.argv.slice(2)
const SLUG = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out')
const OUT_ARG = args.includes('--out') ? args[args.indexOf('--out') + 1] : null
const DRAFT = args.includes('--draft')
const NO_ASSETS = args.includes('--no-assets')

/** blockType → JSON 契约的简写（BLOCK_TYPE 的反表） */
const SHORT = Object.fromEntries(Object.entries(BLOCK_TYPE).map(([k, v]) => [v, k]))

/**
 * 两个语种的同一个字段合成 { en, zh }。
 * zh 是用 fallback-locale=none 读的，所以没翻译就是 undefined，不会混进 en 的值。
 */
const text = (e, z) => {
  if (e === undefined || e === null || e === '') return undefined
  return z === undefined || z === null || z === '' ? { en: e } : { en: e, zh: z }
}

/** 数组字段按下标配对 —— 跟导入器的 mergeLocale 同一套假设（结构不 localized，只有叶子是） */
const rows = (e = [], z = [], fn) => e.map((row, i) => fn(row, z[i] ?? {}))

/* ------------------------------------------------------------------ 媒体 */

/**
 * 媒体 id → { file, alt } 。alt 存在 media 文档上（图片自身的属性），
 * 而 JSON 契约里 alt 是写在**引用处**的，所以导出时要把它搬回各个 *Alt 字段。
 */
function mediaIndex(enDoc, zhDoc) {
  const idx = new Map()
  const walk = (e, z) => {
    if (!e || typeof e !== 'object') return
    if (Array.isArray(e)) return e.forEach((v, i) => walk(v, z?.[i]))
    if (typeof e.id === 'number' && typeof e.filename === 'string') {
      idx.set(e.id, {
        file: e.filename,
        alt: text(e.alt, z?.alt),
        // 50/50 是 Payload 的默认值，等于「没设焦点」，别导成显式的 [50,50]
        focal:
          typeof e.focalX === 'number' &&
          typeof e.focalY === 'number' &&
          !(e.focalX === 50 && e.focalY === 50)
            ? [e.focalX, e.focalY]
            : undefined,
      })
      return
    }
    for (const k of Object.keys(e)) walk(e[k], z?.[k])
  }
  walk(enDoc, zhDoc)
  return idx
}

/** 取媒体的文件名；字段为空返回 undefined，别把 null 写进 json */
const fileOf = (idx, v) => (v && typeof v === 'object' ? idx.get(v.id)?.file : undefined)
const altOf = (idx, v) => (v && typeof v === 'object' ? idx.get(v.id)?.alt : undefined)
const focalOf = (idx, v) => (v && typeof v === 'object' ? idx.get(v.id)?.focal : undefined)

/* ------------------------------------------------------ block → section */

/** 正向映射（case-to-payload.mjs）的逆。加字段两边一起改，round-trip 自检会盯着。 */
function blockToSection(b, z, idx) {
  const t = SHORT[b.blockType]
  const T = (k) => text(b[k], z[k])
  const base = {
    type: t,
    kicker: T('kicker'),
    heading: T('heading'),
    intro: T('intro'),
    // theme/accentEdge 有默认值，等于默认就不写，导出的 json 才干净
    ...(b.theme && b.theme !== 'auto' ? { theme: b.theme } : {}),
    ...(b.themeImage ? { themeImage: fileOf(idx, b.themeImage) } : {}),
    ...(b.themeImage ? { themeImageAlt: altOf(idx, b.themeImage) } : {}),
    ...(b.accentEdge === true ? { accentEdge: true } : {}),
  }
  switch (t) {
    case 'split':
      return {
        ...base,
        quote: T('quote'),
        quoteLabel: T('quoteLabel'),
        quoteFooter: T('quoteFooter'),
        points: rows(b.points, z.points, (p, pz) => ({
          label: text(p.label, pz.label),
          text: text(p.text, pz.text),
        })),
      }
    case 'figure':
      return {
        ...base,
        ...(b.variant && b.variant !== 'full' ? { variant: b.variant } : {}),
        image: fileOf(idx, b.image),
        imageAlt: altOf(idx, b.image),
        focal: focalOf(idx, b.image),
        ...(b.video
          ? { video: fileOf(idx, b.video), videoAlt: altOf(idx, b.video) }
          : {}),
        banner: T('banner'),
      }
    case 'cards':
      return {
        ...base,
        ...(b.layout && b.layout !== 'uniform' ? { layout: b.layout } : {}),
        cards: rows(b.cards, z.cards, (c, cz) => ({
          ...(c.image ? { image: fileOf(idx, c.image), imageAlt: altOf(idx, c.image) } : {}),
          tag: text(c.tag, cz.tag),
          title: text(c.title, cz.title),
          value: text(c.value, cz.value),
          text: text(c.text, cz.text),
        })),
        ...(b.sideImage
          ? { sideImage: fileOf(idx, b.sideImage), sideImageAlt: altOf(idx, b.sideImage) }
          : {}),
        sideImageLabel: T('sideImageLabel'),
        sideImageValue: T('sideImageValue'),
        facts: rows(b.facts, z.facts, (f, fz) => ({
          value: text(f.value, fz.value),
          label: text(f.label, fz.label),
        })),
        note: T('note'),
      }
    case 'steps':
      return {
        ...base,
        ...(b.style && b.style !== 'strip' ? { style: b.style } : {}),
        cellLabel: T('cellLabel'),
        steps: rows(b.steps, z.steps, (s, sz) => ({
          ...(s.image
            ? {
                image: fileOf(idx, s.image),
                imageAlt: altOf(idx, s.image),
                focal: focalOf(idx, s.image),
              }
            : {}),
          title: text(s.title, sz.title),
          ...(s.tone && s.tone !== 'accent' ? { tone: s.tone } : {}),
          ...(s.pictogram && s.pictogram !== 'none' ? { pictogram: s.pictogram } : {}),
          text: text(s.text, sz.text),
        })),
        proofValue: T('proofValue'),
        proofNote: T('proofNote'),
      }
    case 'compare':
      return {
        ...base,
        labels: {
          area: T('labelArea'),
          before: T('labelBefore'),
          after: T('labelAfter'),
        },
        rows: rows(b.rows, z.rows, (r, rz) => ({
          area: text(r.area, rz.area),
          before: text(r.before, rz.before),
          after: text(r.after, rz.after),
        })),
        ...(b.panelImage
          ? {
              panel: {
                image: fileOf(idx, b.panelImage),
                imageAlt: altOf(idx, b.panelImage),
                beforeLabel: T('panelBeforeLabel'),
                beforeTitle: T('panelBeforeTitle'),
                beforeRows: rows(b.panelBeforeRows, z.panelBeforeRows, (r, rz) => ({
                  ...(r.image
                    ? { image: fileOf(idx, r.image), imageAlt: altOf(idx, r.image) }
                    : {}),
                  symbol: text(r.symbol, rz.symbol),
                  text: text(r.text, rz.text),
                  note: text(r.note, rz.note),
                  tag: text(r.tag, rz.tag),
                })),
                beforeResultLabel: T('panelBeforeResultLabel'),
                beforeResultValue: T('panelBeforeResultValue'),
                afterLabel: T('panelAfterLabel'),
                afterTitle: T('panelAfterTitle'),
                imageTags: rows(b.panelImageTags, z.panelImageTags, (t2, tz) => ({
                  text: text(t2.text, tz.text),
                  ...(t2.corner && t2.corner !== 'bottomLeft' ? { corner: t2.corner } : {}),
                })),
                afterFacts: rows(b.panelAfterFacts, z.panelAfterFacts, (f, fz) => ({
                  label: text(f.label, fz.label),
                  value: text(f.value, fz.value),
                  ...(f.highlight === true ? { highlight: true } : {}),
                })),
              },
            }
          : {}),
      }
    case 'statement':
      return { ...base, body: T('body'), statement: T('statement') }
    default:
      throw new Error(`不认识的 blockType「${b.blockType}」—— 官网加了新版式，导出器要跟上`)
  }
}

/* --------------------------------------------------------- round-trip 自检 */

/**
 * 拿导出的 section 跑一遍**正向**映射，跟线上真实 block 逐项比。
 * 反向映射漏一个字段，这里立刻炸 —— 不靠人去比对两份几百行的映射表。
 */
function roundTrip(sections, blocks, idx) {
  const idByFile = new Map()
  for (const [id, m] of idx) if (!idByFile.has(m.file)) idByFile.set(m.file, id)
  // 正向映射吃的 media 是「文件名 → 值」；这里给 id，跟线上 depth=1 的关联字段归一后同形
  const media = Object.fromEntries(idByFile)

  const norm = (v) => {
    if (v === undefined || v === null || v === '') return undefined
    if (Array.isArray(v)) {
      const a = v.map(norm)
      return a.length ? a : undefined
    }
    if (typeof v === 'object') {
      // 关联字段（depth=1 展开成整个 media 文档）只比 id；
      // 数组行自己的 id 是 Payload 生成的，在下面被跳过、不参与比对
      if (typeof v.id === 'number' && v.filename !== undefined) return v.id
      const o = {}
      for (const k of Object.keys(v).sort()) {
        if (k === 'id' || k === 'blockName') continue
        const n = norm(v[k])
        if (n !== undefined) o[k] = n
      }
      return Object.keys(o).length ? o : undefined
    }
    return v
  }

  const bad = []
  sections.forEach((s, i) => {
    const rebuilt = norm(sectionToBlock(s, media, pickEn))
    const original = norm(blocks[i])
    const a = JSON.stringify(rebuilt)
    const b = JSON.stringify(original)
    if (a !== b) bad.push({ i, rebuilt: a, original: b })
  })
  return bad
}

/* ------------------------------------------------------------------- 主流程 */

async function main() {
  if (!SLUG) {
    console.error(`用法：node scripts/export-case-study.mjs <slug> [--out 目录] [--draft] [--no-assets]

把线上案例导出成 case.json + assets/，交给客户改稿。
改完走回程：node scripts/import-case-study.mjs <json> --replace --draft`)
    process.exit(1)
  }

  const base = requireEnv()
  console.log(`来源站点：${base}`)
  await login()

  const q = `where[slug][equals]=${encodeURIComponent(SLUG)}&limit=1${DRAFT ? '&draft=true' : ''}`
  // depth=1：关联的 media 直接带回来（要 filename / alt / 焦点）
  const enRes = await api(`/api/case-studies?${q}&locale=en&depth=1`)
  const doc = enRes.docs?.[0]
  if (!doc) {
    console.error(`✗ 站上没有 slug 为「${SLUG}」的案例`)
    process.exit(1)
  }
  // fallback-locale=none：zh 没翻译就是空，不会回落成 en 的值被当成"翻译过了"
  const zhRes = await api(`/api/case-studies?${q}&locale=zh&fallback-locale=none&depth=1`)
  const zhDoc = zhRes.docs?.[0] ?? {}

  const idx = mediaIndex(doc, zhDoc)
  const blocks = doc.sections ?? []
  const zhBlocks = zhDoc.sections ?? []
  const sections = blocks.map((b, i) => blockToSection(b, zhBlocks[i] ?? {}, idx))

  // 反向映射漂了就在这里停 —— 写出一份缺字段的 json 比不导出危险得多
  const bad = roundTrip(sections, blocks, idx)
  if (bad.length) {
    console.error(`\n✗ round-trip 自检失败：${bad.length} 个章节导出后再正向映射，跟线上对不上。`)
    console.error(`  多半是 case-to-payload.mjs 加了字段而 blockToSection() 没跟上。\n`)
    for (const { i, rebuilt, original } of bad.slice(0, 2)) {
      console.error(`  第 ${i + 1} 节（${blocks[i].blockType}）`)
      console.error(`    线上：${original}`)
      console.error(`    回推：${rebuilt}\n`)
    }
    process.exit(1)
  }
  console.log(`✓ round-trip 自检通过：${sections.length} 个章节字段无损`)

  const outDir = path.resolve(process.cwd(), OUT_ARG || path.join('photos-out', 'export', SLUG))
  const assetsDir = path.join(outDir, 'assets')
  await fs.mkdir(assetsDir, { recursive: true })

  const data = {
    slug: doc.slug,
    assets: 'assets',
    title: text(doc.title, zhDoc.title),
    titleAccent: text(doc.titleAccent, zhDoc.titleAccent),
    excerpt: text(doc.excerpt, zhDoc.excerpt),
    cover: fileOf(idx, doc.coverImage),
    coverAlt: altOf(idx, doc.coverImage),
    coverFocal: focalOf(idx, doc.coverImage),
    industry: doc.industry?.slug ?? doc.industry ?? undefined,
    location: text(doc.location, zhDoc.location),
    // Payload 存的是整日期，JSON 契约只到年月
    completedAt: doc.completedAt ? String(doc.completedAt).slice(0, 7) : undefined,
    metrics: rows(doc.metrics, zhDoc.metrics, (m, mz) => ({
      value: text(m.value, mz.value),
      label: text(m.label, mz.label),
    })),
    highlights: rows(doc.highlights, zhDoc.highlights, (h, hz) => text(h.label, hz.label)),
    relatedProducts: (doc.relatedProducts ?? [])
      .map((p) => (typeof p === 'object' ? p.slug : undefined))
      .filter(Boolean),
    sections,
  }

  // undefined 会被 JSON.stringify 丢掉，空数组要自己清，别留一堆 "metrics": []
  for (const k of ['metrics', 'highlights', 'relatedProducts']) {
    if (!data[k]?.length) delete data[k]
  }

  const errs = validate(data)
  if (errs.length) {
    console.warn(`\n⚠ 导出的 json 有 ${errs.length} 处不满足校验器（线上是历史数据，可能本来就缺）：`)
    errs.slice(0, 10).forEach((e) => console.warn(`  · ${e}`))
    console.warn(`  照常写盘，交给客户补。\n`)
  }

  const jsonPath = path.join(outDir, 'case.json')
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n')
  console.log(`✓ ${path.relative(process.cwd(), jsonPath)}`)

  if (NO_ASSETS) {
    console.log(`（--no-assets：跳过素材下载）`)
    return
  }

  // 下载原图：Payload 保留了上传时的原始文件，再导回去内容指纹能对上、不会堆副本
  let n = 0
  for (const [, m] of idx) {
    const dest = path.join(assetsDir, m.file)
    const res = await fetch(`${base}/api/media/file/${encodeURIComponent(m.file)}`)
    if (!res.ok) {
      console.warn(`  ⚠ ${m.file} 下载失败（${res.status}），要手工补`)
      continue
    }
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()))
    n++
  }
  console.log(`✓ assets/ ${n} 个文件`)

  /**
   * Media 上传时统一转了 WebP，**原始文件没留**（见 src/collections/Media.ts），
   * 所以这里下回来的是转换后的 webp、文件名也带了 Payload 的去重后缀。
   * 再导回去会被当成新图：内容指纹对不上已有那张（那张记的是原始字节的指纹），
   * 于是各多出一份、并且被二次压缩（q80 压在 q80 上）。
   * 原始素材还在手上就优先用原始的；只能用导出的话，回程加 --prune 收走旧的那批。
   */
  if (n) {
    console.log(
      `\n⚠ 素材是线上转换后的 WebP（原图 Payload 没留），再导回去会各多一份并二次压缩。\n` +
        `  原始素材还在就换成原始的；只能用这批的话，回程带 --prune 清掉旧引用。`,
    )
  }
  console.log(`\n下一步：node scripts/lib/case-preview.mjs ${path.relative(process.cwd(), jsonPath)}`)
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`)
  process.exit(1)
})
