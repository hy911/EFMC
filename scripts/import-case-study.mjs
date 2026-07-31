#!/usr/bin/env node
/**
 * 通用客户案例导入器：吃一份 JSON 内容文件，写进 CaseStudies（中英双语 + 章节排版）。
 *
 * 用法：
 *   node scripts/import-case-study.mjs scripts/data/cases/<name>.json --dry-run
 *   node scripts/import-case-study.mjs scripts/data/cases/<name>.json
 *   node scripts/import-case-study.mjs scripts/data/cases/<name>.json --replace        已存在时覆盖
 *   node scripts/import-case-study.mjs scripts/data/cases/<name>.json --replace --prune 顺带删掉被换下的旧图
 *   node scripts/import-case-study.mjs <json> --draft                                  写成草稿，不动线上
 *   node scripts/import-case-study.mjs <json> --assets "D:/某目录"                      覆盖素材目录
 *
 * JSON 的字段格式见 docs/CASE_STUDY_JSON.md —— 那份文档同时是给外部写手
 * （含 AI 助手）的交付规范，照着产出就能直接导入，不用再改脚本。
 *
 * 两个必须守住的点：
 * - 图片文件名只写文件名，不写路径；SVG 自动转 1600px PNG（Media 只做位图处理）
 * - sections 是 localized blocks，写 zh 必须带 en 回读到的 block id 与数组行 id，
 *   否则数组被重建、en 内容全丢（见 CLAUDE.md）
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { api, login, requireEnv, uploadMedia } from './lib/payload-api.mjs'
import {
  BLOCK_TYPE,
  checkAssets,
  collectImages,
  en,
  findUntranslated,
  validate,
  zh,
} from './lib/case-schema.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const REPLACE = args.includes('--replace')
const PRUNE = args.includes('--prune')
/**
 * --draft：写成草稿而不是直接发布。
 * Payload 存草稿时不写主表，所以线上已发布的那一版原样不动 ——
 * 外部写手交来的内容先进草稿，拿预览链接改到满意，最后在后台点发布。
 */
const DRAFT = args.includes('--draft')
/* 草稿态下所有读写都必须带 draft=true：主表里躺的是已发布版，
   回读主表拿到的 block id 与草稿对不上，zh 会合并到错误的行上。 */
const Q = DRAFT ? '&draft=true' : ''
const STATUS = DRAFT ? { _status: 'draft' } : { _status: 'published' }
const JSON_PATH = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--assets')
const ASSETS_ARG = args.includes('--assets') ? args[args.indexOf('--assets') + 1] : null

/* 字段契约（BLOCK_TYPE / 校验规则）统一放 lib/case-schema.mjs：
   那个文件外部写手也在直接跑（node case-schema.mjs case.json），
   规则只能有一份，两处各写一套必然走样。 */


/** SVG 转 1600px 宽 PNG；位图原样返回 */
async function resolveAsset(assetsDir, outDir, file) {
  const src = path.join(assetsDir, file)
  if (!/\.svg$/i.test(file)) return src
  const out = path.join(outDir, file.replace(/\.svg$/i, '.png'))
  await fs.mkdir(outDir, { recursive: true })
  await sharp(src, { density: 200 }).resize({ width: 1600 }).png().toFile(out)
  return out
}

/** JSON 章节 → Payload block（en）。media 是文件名 → media id 的映射 */
function sectionToBlockEn(s, media) {
  const base = {
    blockType: BLOCK_TYPE[s.type],
    kicker: en(s.kicker),
    heading: en(s.heading),
    intro: en(s.intro),
    theme: s.theme ?? 'auto',
    themeImage: s.themeImage ? media[s.themeImage] : undefined,
    accentEdge: s.accentEdge === true,
  }
  switch (s.type) {
    case 'split':
      return {
        ...base,
        quote: en(s.quote),
        quoteLabel: en(s.quoteLabel),
        quoteFooter: en(s.quoteFooter),
        points: s.points.map((p) => ({ label: en(p.label), text: en(p.text) })),
      }
    case 'figure':
      return {
        ...base,
        variant: s.variant ?? 'full',
        image: media[s.image],
        banner: en(s.banner),
      }
    case 'cards':
      return {
        ...base,
        layout: s.layout ?? 'uniform',
        cards: s.cards.map((c) => ({
          image: c.image ? media[c.image] : undefined,
          tag: en(c.tag),
          title: en(c.title),
          value: en(c.value),
          text: en(c.text),
        })),
        sideImage: s.sideImage ? media[s.sideImage] : undefined,
        sideImageLabel: en(s.sideImageLabel),
        sideImageValue: en(s.sideImageValue),
        facts: (s.facts ?? []).map((f) => ({ value: en(f.value), label: en(f.label) })),
        note: en(s.note),
      }
    case 'steps':
      return {
        ...base,
        style: s.style ?? 'strip',
        cellLabel: en(s.cellLabel),
        steps: s.steps.map((st) => ({
          image: st.image ? media[st.image] : undefined,
          title: en(st.title),
          tone: st.tone ?? 'accent',
          pictogram: st.pictogram ?? 'none',
          text: en(st.text),
        })),
        proofValue: en(s.proofValue),
        proofNote: en(s.proofNote),
      }
    case 'compare':
      return {
        ...base,
        labelArea: en(s.labels.area),
        labelBefore: en(s.labels.before),
        labelAfter: en(s.labels.after),
        rows: s.rows.map((r) => ({ area: en(r.area), before: en(r.before), after: en(r.after) })),
        ...(s.panel
          ? {
              panelImage: media[s.panel.image],
              panelBeforeLabel: en(s.panel.beforeLabel),
              panelBeforeTitle: en(s.panel.beforeTitle),
              panelBeforeRows: s.panel.beforeRows.map((r) => ({
                image: r.image ? media[r.image] : undefined,
                symbol: en(r.symbol),
                text: en(r.text),
                note: en(r.note),
                tag: en(r.tag),
              })),
              panelBeforeResultLabel: en(s.panel.beforeResultLabel),
              panelBeforeResultValue: en(s.panel.beforeResultValue),
              panelAfterLabel: en(s.panel.afterLabel),
              panelAfterTitle: en(s.panel.afterTitle),
              panelImageTags: (s.panel.imageTags ?? []).map((t) => ({
                text: en(t.text),
                corner: t.corner ?? 'bottomLeft',
              })),
              panelAfterFacts: (s.panel.afterFacts ?? []).map((f) => ({
                label: en(f.label),
                value: en(f.value),
                highlight: f.highlight === true,
              })),
            }
          : {}),
      }
    case 'statement':
      return { ...base, body: en(s.body), statement: en(s.statement) }
  }
}

/** JSON 章节 → 只含中文叶子字段的对象（结构与 en 一致，供 mergeLocale 合并） */
function sectionToZh(s) {
  const base = { kicker: zh(s.kicker), heading: zh(s.heading), intro: zh(s.intro) }
  switch (s.type) {
    case 'split':
      return {
        ...base,
        quote: zh(s.quote),
        quoteLabel: zh(s.quoteLabel),
        quoteFooter: zh(s.quoteFooter),
        points: s.points.map((p) => ({ label: zh(p.label), text: zh(p.text) })),
      }
    case 'figure':
      return { ...base, banner: zh(s.banner) }
    case 'cards':
      return {
        ...base,
        cards: s.cards.map((c) => ({
          tag: zh(c.tag),
          title: zh(c.title),
          value: zh(c.value),
          text: zh(c.text),
        })),
        sideImageLabel: zh(s.sideImageLabel),
        sideImageValue: zh(s.sideImageValue),
        facts: (s.facts ?? []).map((f) => ({ value: zh(f.value), label: zh(f.label) })),
        note: zh(s.note),
      }
    case 'steps':
      return {
        ...base,
        cellLabel: zh(s.cellLabel),
        steps: s.steps.map((st) => ({ title: zh(st.title), text: zh(st.text) })),
        proofValue: zh(s.proofValue),
        proofNote: zh(s.proofNote),
      }
    case 'compare':
      return {
        ...base,
        labelArea: zh(s.labels.area),
        labelBefore: zh(s.labels.before),
        labelAfter: zh(s.labels.after),
        rows: s.rows.map((r) => ({ area: zh(r.area), before: zh(r.before), after: zh(r.after) })),
        ...(s.panel
          ? {
              panelBeforeLabel: zh(s.panel.beforeLabel),
              panelBeforeTitle: zh(s.panel.beforeTitle),
              panelBeforeRows: s.panel.beforeRows.map((r) => ({
                symbol: zh(r.symbol),
                text: zh(r.text),
                note: zh(r.note),
                tag: zh(r.tag),
              })),
              panelBeforeResultLabel: zh(s.panel.beforeResultLabel),
              panelBeforeResultValue: zh(s.panel.beforeResultValue),
              panelAfterLabel: zh(s.panel.afterLabel),
              panelAfterTitle: zh(s.panel.afterTitle),
              panelImageTags: (s.panel.imageTags ?? []).map((t) => ({ text: zh(t.text) })),
              panelAfterFacts: (s.panel.afterFacts ?? []).map((f) => ({
                label: zh(f.label),
                value: zh(f.value),
              })),
            }
          : {}),
      }
    case 'statement':
      return { ...base, body: zh(s.body), statement: zh(s.statement) }
  }
}

/**
 * 把 zh 的叶子字段合并进 en 回读的节点，保留全部 id（block id / 数组行 id）。
 * 数组按下标一一对应；值为 undefined 的字段沿用 en。
 */
function mergeLocale(enNode, zhNode) {
  const out = { ...enNode }
  for (const [key, zhValue] of Object.entries(zhNode ?? {})) {
    if (zhValue === undefined) continue
    if (Array.isArray(zhValue)) {
      const enRows = Array.isArray(enNode?.[key]) ? enNode[key] : []
      out[key] = zhValue.map((row, i) => mergeLocale(enRows[i] ?? {}, row))
    } else {
      out[key] = zhValue
    }
  }
  return out
}

async function main() {
  if (!JSON_PATH) {
    console.error(`用法：node scripts/import-case-study.mjs <案例 JSON 路径> [--dry-run] [--replace] [--prune] [--assets 目录]

JSON 格式见 docs/CASE_STUDY_JSON.md`)
    process.exit(1)
  }

  const jsonFull = path.resolve(process.cwd(), JSON_PATH)
  const data = JSON.parse(await fs.readFile(jsonFull, 'utf8'))
  const assetsDir = path.resolve(
    ASSETS_ARG || data.assets || path.join(path.dirname(jsonFull), 'assets'),
  )

  // 字段和素材一起查完再报，别让人改一处跑一次
  const errs = [...validate(data), ...checkAssets(data, assetsDir)]
  if (errs.length) {
    console.error(`✗ ${path.basename(JSON_PATH)} 有 ${errs.length} 处问题：\n`)
    errs.forEach((e) => console.error(`  · ${e}`))
    console.error(`\n字段说明见 docs/CASE_STUDY_JSON.md`)
    process.exit(1)
  }

  // 漏翻不算错误（官网会回落英文），但中文站会一段一段冒英文，导之前必须看见
  const untranslated = findUntranslated(data)
  if (untranslated.length) {
    console.warn(`⚠ 有 ${untranslated.length} 处只写了英文、没写中文：`)
    untranslated.slice(0, 10).forEach((m) => console.warn(`  · ${m.path}`))
    if (untranslated.length > 10) console.warn(`  · …还有 ${untranslated.length - 10} 处`)
    console.warn('')
  }

  const imageFiles = collectImages(data)

  const base = requireEnv()
  console.log(`目标站点：${base}${DRY ? '　【空跑，不写任何数据】' : ''}`)
  console.log(`案例文件：${JSON_PATH}`)
  console.log(`素材目录：${assetsDir}\n`)
  await login()

  const found = await api(
    `/api/case-studies?where[slug][equals]=${encodeURIComponent(data.slug)}&limit=1&locale=en&depth=0`,
  )
  const existing = found.docs?.[0]
  if (existing && !REPLACE) {
    console.error(`\n✗ 案例 ${data.slug} 已存在（id ${existing.id}），加 --replace 才会覆盖。`)
    if (!DRY) process.exit(1)
  }

  // 所属行业（slug 找不到就不设，不阻断导入）
  let industryId = null
  if (data.industry) {
    const r = await api(
      `/api/application-scenarios?where[slug][equals]=${encodeURIComponent(data.industry)}&limit=1&locale=en&depth=0`,
    )
    industryId = r.docs?.[0]?.id ?? null
    if (!industryId) console.warn(`⚠️ 没找到行业 ${data.industry}，本次不设所属行业`)
  }

  // 关联产品
  const prods = await api('/api/products?limit=100&locale=en&depth=0')
  const idBySlug = new Map((prods.docs ?? []).map((d) => [d.slug, d.id]))
  const relatedProducts = (data.relatedProducts ?? []).map((s) => idBySlug.get(s)).filter(Boolean)
  const missingProducts = (data.relatedProducts ?? []).filter((s) => !idBySlug.has(s))
  if (missingProducts.length)
    console.warn(`⚠️ 站上没有这些产品，已跳过关联：${missingProducts.join(', ')}`)

  if (DRY) {
    console.log(`将${existing ? '覆盖' : '创建'}案例：${data.slug}`)
    console.log(`  EN：${data.title.en}　|　ZH：${data.title.zh}`)
    console.log(
      `  图片：${imageFiles.length} 张${imageFiles.some((f) => /\.svg$/i.test(f)) ? '（SVG 会转 PNG）' : ''}`,
    )
    console.log(
      `  所属行业：${industryId ? data.industry : '（无）'}　|　关联产品：${relatedProducts.length} 个`,
    )
    console.log(`  成果指标：${data.metrics?.length ?? 0} 条`)
    console.log(`\n  ${data.sections.length} 个章节：`)
    data.sections.forEach((s, i) => {
      console.log(`    ${String(i + 1).padStart(2, '0')} · ${s.kicker.en}　[${s.type}]`)
    })
    console.log('\n校验通过。这是空跑，没有写入任何数据。')
    return
  }

  // 覆盖前记下现有引用的图，--prune 时写入成功后删掉
  // 去重：同一张图可能同时被卡片和步骤引用，重复删第二次会 404
  const oldMediaIds = existing
    ? [
        ...new Set([
          existing.coverImage,
          ...(existing.sections ?? []).flatMap((b) => [
            b.image,
            ...(b.cards ?? []).map((c) => c.image),
            ...(b.steps ?? []).map((s) => s.image),
          ]),
        ]),
      ].filter((v) => typeof v === 'number')
    : []

  // 上传图片：同一文件只传一次（多处引用共用一个 media）
  const outDir = path.resolve(process.cwd(), 'photos-out', 'cases', data.slug)
  const media = {}
  for (const file of imageFiles) {
    const alt = altFor(data, file)
    const focal = focalFor(data, file)
    const full = await resolveAsset(assetsDir, outDir, file)
    media[file] = await uploadMedia(full, alt.en, alt.zh, focal)
    console.log(`  ↑ ${file} → media ${media[file]}`)
  }

  const payloadEn = {
    title: data.title.en,
    titleAccent: en(data.titleAccent),
    slug: data.slug,
    excerpt: data.excerpt.en,
    coverImage: media[data.cover],
    industry: industryId,
    relatedProducts,
    location: data.location?.en,
    completedAt: data.completedAt ? `${data.completedAt}-01T00:00:00.000Z` : undefined,
    metrics: (data.metrics ?? []).map((m) => ({ value: m.value.en, label: m.label.en })),
    highlights: (data.highlights ?? []).map((h) => ({ label: h.en })),
    sections: data.sections.map((s) => sectionToBlockEn(s, media)),
    // 简版正文清空：本案例走章节排版，两者都有会重复渲染一遍。
    // body 是 localized 字段，这里只清 en，zh 在下面的 PATCH 里再清一次
    body: null,
  }

  let id
  if (existing) {
    const r = await api(`/api/case-studies/${existing.id}?locale=en${Q}`, {
      method: 'PATCH',
      body: { ...payloadEn, ...STATUS },
    })
    id = r.doc.id
    console.log(`✓ 已更新 en 内容（id ${id}）`)
  } else {
    const r = await api(`/api/case-studies?locale=en${Q}`, {
      method: 'POST',
      body: { ...payloadEn, ...STATUS },
    })
    id = r.doc.id
    console.log(`✓ 已创建案例（id ${id}）`)
  }

  // 回读 en 拿到 block id 与数组行 id，再写 zh
  const saved = await api(`/api/case-studies/${id}?locale=en&depth=0${Q}`)
  await api(`/api/case-studies/${id}?locale=zh${Q}`, {
    method: 'PATCH',
    body: {
      ...STATUS,
      title: data.title.zh,
      titleAccent: zh(data.titleAccent),
      excerpt: data.excerpt.zh,
      location: zh(data.location),
      metrics: (saved.metrics ?? []).map((row, i) =>
        mergeLocale(row, {
          value: zh(data.metrics?.[i]?.value),
          label: zh(data.metrics?.[i]?.label),
        }),
      ),
      highlights: (saved.highlights ?? []).map((row, i) =>
        mergeLocale(row, { label: zh(data.highlights?.[i]) }),
      ),
      sections: (saved.sections ?? []).map((block, i) =>
        mergeLocale(block, sectionToZh(data.sections[i])),
      ),
      body: null,
    },
  })
  console.log('✓ 已写入 zh 内容')

  // 自检：en 没被 zh 覆盖，两个语种的旧正文都清干净了
  const checkEn = await api(`/api/case-studies/${id}?locale=en&depth=0${Q}`)
  // fallback-locale=none 才能看到 zh 自己的值，否则空字段会回落成 en 的
  const checkZh = await api(`/api/case-studies/${id}?locale=zh&depth=0&fallback-locale=none${Q}`)
  if (checkEn.title !== data.title.en) {
    console.error('⚠️ en 内容被 zh 覆盖了，检查 mergeLocale 是否带上了行 id')
    process.exit(1)
  }
  if (checkZh.title !== data.title.zh) {
    console.error('⚠️ zh 没写进去')
    process.exit(1)
  }
  const leftover = [checkEn.body && 'en', checkZh.body && 'zh'].filter(Boolean)
  if (leftover.length) {
    console.error(`⚠️ ${leftover.join(' / ')} 的旧正文没清掉，前台会在章节下面重复渲染一遍`)
    process.exit(1)
  }
  console.log(
    `自检通过：en「${checkEn.title}」/ zh「${checkZh.title}」，${checkEn.sections.length} 个章节`,
  )

  if (PRUNE && oldMediaIds.length) {
    for (const mediaId of oldMediaIds) {
      await api(`/api/media/${mediaId}`, { method: 'DELETE' }).catch((e) =>
        console.warn(`  旧图 ${mediaId} 删除失败（可能被别处引用）：${e.message}`),
      )
    }
    console.log(`✓ 已删除 ${oldMediaIds.length} 张被换下的旧图`)
  } else if (oldMediaIds.length) {
    console.log(
      `\n注意：${oldMediaIds.length} 张旧图仍留在媒体库（已无人引用）。确认新图无误后加 --prune 重跑清理。`,
    )
  }

  console.log(`\n前台地址：${base}/en/cases/${data.slug}　|　${base}/zh/cases/${data.slug}`)
  if (!data.location) console.log('后台可补：项目地点。')
  if (!data.completedAt) console.log('后台可补：交付时间（月）。')
}

/** 找这张图在 JSON 里声明的裁切焦点 [x, y]；没声明就返回 undefined（居中裁） */
function focalFor(data, file) {
  if (file === data.cover && Array.isArray(data.coverFocal)) return data.coverFocal
  for (const s of data.sections ?? []) {
    for (const st of s.steps ?? []) {
      if (st.image === file && Array.isArray(st.focal)) return st.focal
    }
    for (const c of s.cards ?? []) {
      if (c.image === file && Array.isArray(c.focal)) return c.focal
    }
  }
  return undefined
}

/** 找这张图在 JSON 里对应的 alt（封面用 title 兜底） */
function altFor(data, file) {
  if (file === data.cover) {
    const a = data.coverAlt ?? data.title
    return { en: en(a), zh: zh(a) ?? en(a) }
  }
  for (const s of data.sections) {
    if (s.image === file) return { en: en(s.imageAlt), zh: zh(s.imageAlt) ?? en(s.imageAlt) }
    for (const c of s.cards ?? []) {
      if (c.image === file) return { en: en(c.imageAlt), zh: zh(c.imageAlt) ?? en(c.imageAlt) }
    }
    for (const st of s.steps ?? []) {
      if (st.image === file) return { en: en(st.imageAlt), zh: zh(st.imageAlt) ?? en(st.imageAlt) }
    }
    if (s.themeImage === file) {
      const a = s.themeImageAlt ?? data.title
      return { en: en(a), zh: zh(a) ?? en(a) }
    }
    if (s.sideImage === file) {
      const a = s.sideImageAlt
      return { en: en(a), zh: zh(a) ?? en(a) }
    }
    if (s.panel?.image === file) {
      const a = s.panel.imageAlt
      return { en: en(a), zh: zh(a) ?? en(a) }
    }
    for (const r of s.panel?.beforeRows ?? []) {
      if (r.image === file) return { en: en(r.imageAlt), zh: zh(r.imageAlt) ?? en(r.imageAlt) }
    }
  }
  return { en: en(data.title), zh: zh(data.title) ?? en(data.title) }
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})
