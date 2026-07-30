#!/usr/bin/env node
/**
 * 通用客户案例导入器：吃一份 JSON 内容文件，写进 CaseStudies（中英双语 + 章节排版）。
 *
 * 用法：
 *   node scripts/import-case-study.mjs scripts/data/cases/<name>.json --dry-run
 *   node scripts/import-case-study.mjs scripts/data/cases/<name>.json
 *   node scripts/import-case-study.mjs scripts/data/cases/<name>.json --replace        已存在时覆盖
 *   node scripts/import-case-study.mjs scripts/data/cases/<name>.json --replace --prune 顺带删掉被换下的旧图
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

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const REPLACE = args.includes('--replace')
const PRUNE = args.includes('--prune')
const JSON_PATH = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--assets')
const ASSETS_ARG = args.includes('--assets') ? args[args.indexOf('--assets') + 1] : null

/** block 类型简写 → Payload 的 blockType */
const BLOCK_TYPE = {
  split: 'caseSplit',
  figure: 'caseFigure',
  cards: 'caseCards',
  steps: 'caseSteps',
  compare: 'caseCompare',
  statement: 'caseStatement',
}

const isText = (v) => v && typeof v === 'object' && typeof v.en === 'string' && v.en.trim() !== ''
const en = (v) => v?.en
const zh = (v) => (typeof v?.zh === 'string' && v.zh.trim() !== '' ? v.zh : undefined)

/**
 * 校验 JSON，返回错误清单。宁可在这里啰嗦，也别让半截内容进库 ——
 * 外部写手拿到的应该是「第 3 个章节缺 heading.zh」这种能直接改的提示。
 */
function validate(data) {
  const errs = []
  const at = (p, msg) => errs.push(`${p}：${msg}`)

  if (!data.slug || !/^[a-z0-9-]+$/.test(data.slug)) at('slug', '必填，只能用小写字母、数字和连字符')
  if (!isText(data.title)) at('title', '必填，需要 { en, zh }')
  if (!isText(data.excerpt)) at('excerpt', '必填，需要 { en, zh }（列表卡片和页头导语都用它）')
  if (!data.cover) at('cover', '必填，封面图文件名')
  if (!Array.isArray(data.sections) || data.sections.length === 0) at('sections', '至少要有一个章节')

  for (const [i, m] of (data.metrics ?? []).entries()) {
    if (!isText(m.value)) at(`metrics[${i}].value`, '需要 { en, zh }')
    if (!isText(m.label)) at(`metrics[${i}].label`, '需要 { en, zh }')
  }
  if ((data.metrics?.length ?? 0) > 4) at('metrics', '最多 4 条（页头数据条一排放 4 个）')

  for (const [i, s] of (data.sections ?? []).entries()) {
    const p = `sections[${i}]`
    if (!BLOCK_TYPE[s.type]) {
      at(p, `type 只能是 ${Object.keys(BLOCK_TYPE).join(' / ')}，收到 "${s.type}"`)
      continue
    }
    if (!isText(s.kicker)) at(`${p}.kicker`, '必填，需要 { en, zh }（章节编号前台自动加，别自己写）')
    if (!isText(s.heading)) at(`${p}.heading`, '必填，需要 { en, zh }')

    switch (s.type) {
      case 'split':
        if (!Array.isArray(s.points) || s.points.length === 0) at(`${p}.points`, '至少一条')
        for (const [j, pt] of (s.points ?? []).entries()) {
          if (!isText(pt.label)) at(`${p}.points[${j}].label`, '需要 { en, zh }')
          if (!isText(pt.text)) at(`${p}.points[${j}].text`, '需要 { en, zh }')
        }
        break
      case 'figure':
        if (!s.image) at(`${p}.image`, '必填，图片文件名')
        if (!isText(s.imageAlt)) at(`${p}.imageAlt`, '必填，需要 { en, zh }（SEO 与无障碍都靠它）')
        break
      case 'cards':
        if (!Array.isArray(s.cards) || s.cards.length === 0) at(`${p}.cards`, '至少一张')
        for (const [j, c] of (s.cards ?? []).entries()) {
          if (!isText(c.title)) at(`${p}.cards[${j}].title`, '需要 { en, zh }')
          if (!isText(c.text)) at(`${p}.cards[${j}].text`, '需要 { en, zh }')
          if (c.image && !isText(c.imageAlt)) at(`${p}.cards[${j}].imageAlt`, '有图就必须有 alt')
        }
        break
      case 'steps':
        if (!Array.isArray(s.steps) || s.steps.length < 2 || s.steps.length > 6)
          at(`${p}.steps`, '2–6 步（桌面端一行最多 6 个）')
        for (const [j, st] of (s.steps ?? []).entries()) {
          if (!isText(st.title)) at(`${p}.steps[${j}].title`, '需要 { en, zh }')
          if (!isText(st.text)) at(`${p}.steps[${j}].text`, '需要 { en, zh }')
        }
        break
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
        break
      case 'statement':
        if (!isText(s.statement)) at(`${p}.statement`, '必填，需要 { en, zh }（深色底的那句大字）')
        break
    }
  }
  return errs
}

/** 收集 JSON 里引用的全部图片文件名 */
function collectImages(data) {
  const files = new Set([data.cover])
  for (const s of data.sections ?? []) {
    if (s.image) files.add(s.image)
    for (const c of s.cards ?? []) if (c.image) files.add(c.image)
  }
  return [...files]
}

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
  const base = { blockType: BLOCK_TYPE[s.type], kicker: en(s.kicker), heading: en(s.heading) }
  switch (s.type) {
    case 'split':
      return {
        ...base,
        quote: en(s.quote),
        points: s.points.map((p) => ({ label: en(p.label), text: en(p.text) })),
      }
    case 'figure':
      return { ...base, intro: en(s.intro), image: media[s.image], banner: en(s.banner) }
    case 'cards':
      return {
        ...base,
        cards: s.cards.map((c) => ({
          image: c.image ? media[c.image] : undefined,
          tag: en(c.tag),
          title: en(c.title),
          text: en(c.text),
        })),
      }
    case 'steps':
      return { ...base, steps: s.steps.map((st) => ({ title: en(st.title), text: en(st.text) })) }
    case 'compare':
      return {
        ...base,
        labelArea: en(s.labels.area),
        labelBefore: en(s.labels.before),
        labelAfter: en(s.labels.after),
        rows: s.rows.map((r) => ({ area: en(r.area), before: en(r.before), after: en(r.after) })),
      }
    case 'statement':
      return { ...base, body: en(s.body), statement: en(s.statement) }
  }
}

/** JSON 章节 → 只含中文叶子字段的对象（结构与 en 一致，供 mergeLocale 合并） */
function sectionToZh(s) {
  const base = { kicker: zh(s.kicker), heading: zh(s.heading) }
  switch (s.type) {
    case 'split':
      return {
        ...base,
        quote: zh(s.quote),
        points: s.points.map((p) => ({ label: zh(p.label), text: zh(p.text) })),
      }
    case 'figure':
      return { ...base, intro: zh(s.intro), banner: zh(s.banner) }
    case 'cards':
      return {
        ...base,
        cards: s.cards.map((c) => ({ tag: zh(c.tag), title: zh(c.title), text: zh(c.text) })),
      }
    case 'steps':
      return { ...base, steps: s.steps.map((st) => ({ title: zh(st.title), text: zh(st.text) })) }
    case 'compare':
      return {
        ...base,
        labelArea: zh(s.labels.area),
        labelBefore: zh(s.labels.before),
        labelAfter: zh(s.labels.after),
        rows: s.rows.map((r) => ({ area: zh(r.area), before: zh(r.before), after: zh(r.after) })),
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

  const errs = validate(data)
  if (errs.length) {
    console.error(`✗ ${path.basename(JSON_PATH)} 有 ${errs.length} 处问题：\n`)
    errs.forEach((e) => console.error(`  · ${e}`))
    console.error(`\n字段说明见 docs/CASE_STUDY_JSON.md`)
    process.exit(1)
  }

  // 素材齐不齐先查，别登录完了才发现少图
  const imageFiles = collectImages(data)
  const missing = []
  for (const f of imageFiles) {
    await fs.access(path.join(assetsDir, f)).catch(() => missing.push(f))
  }
  if (missing.length) {
    console.error(`✗ 素材目录里缺 ${missing.length} 个文件（${assetsDir}）：`)
    missing.forEach((f) => console.error(`  · ${f}`))
    process.exit(1)
  }

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
  if (missingProducts.length) console.warn(`⚠️ 站上没有这些产品，已跳过关联：${missingProducts.join(', ')}`)

  if (DRY) {
    console.log(`将${existing ? '覆盖' : '创建'}案例：${data.slug}`)
    console.log(`  EN：${data.title.en}　|　ZH：${data.title.zh}`)
    console.log(`  图片：${imageFiles.length} 张${imageFiles.some((f) => /\.svg$/i.test(f)) ? '（SVG 会转 PNG）' : ''}`)
    console.log(`  所属行业：${industryId ? data.industry : '（无）'}　|　关联产品：${relatedProducts.length} 个`)
    console.log(`  成果指标：${data.metrics?.length ?? 0} 条`)
    console.log(`\n  ${data.sections.length} 个章节：`)
    data.sections.forEach((s, i) => {
      console.log(`    ${String(i + 1).padStart(2, '0')} · ${s.kicker.en}　[${s.type}]`)
    })
    console.log('\n校验通过。这是空跑，没有写入任何数据。')
    return
  }

  // 覆盖前记下现有引用的图，--prune 时写入成功后删掉
  const oldMediaIds = existing
    ? [
        existing.coverImage,
        ...(existing.sections ?? []).flatMap((b) => [b.image, ...(b.cards ?? []).map((c) => c.image)]),
      ].filter((v) => typeof v === 'number')
    : []

  // 上传图片：同一文件只传一次（多处引用共用一个 media）
  const outDir = path.resolve(process.cwd(), 'photos-out', 'cases', data.slug)
  const media = {}
  for (const file of imageFiles) {
    const alt = altFor(data, file)
    const full = await resolveAsset(assetsDir, outDir, file)
    media[file] = await uploadMedia(full, alt.en, alt.zh)
    console.log(`  ↑ ${file} → media ${media[file]}`)
  }

  const payloadEn = {
    title: data.title.en,
    slug: data.slug,
    excerpt: data.excerpt.en,
    coverImage: media[data.cover],
    industry: industryId,
    relatedProducts,
    location: data.location?.en,
    completedAt: data.completedAt ? `${data.completedAt}-01T00:00:00.000Z` : undefined,
    metrics: (data.metrics ?? []).map((m) => ({ value: m.value.en, label: m.label.en })),
    sections: data.sections.map((s) => sectionToBlockEn(s, media)),
    // 简版正文清空：本案例走章节排版，两者都有会重复渲染一遍。
    // body 是 localized 字段，这里只清 en，zh 在下面的 PATCH 里再清一次
    body: null,
  }

  let id
  if (existing) {
    const r = await api(`/api/case-studies/${existing.id}?locale=en`, { method: 'PATCH', body: payloadEn })
    id = r.doc.id
    console.log(`✓ 已更新 en 内容（id ${id}）`)
  } else {
    const r = await api('/api/case-studies?locale=en', { method: 'POST', body: payloadEn })
    id = r.doc.id
    console.log(`✓ 已创建案例（id ${id}）`)
  }

  // 回读 en 拿到 block id 与数组行 id，再写 zh
  const saved = await api(`/api/case-studies/${id}?locale=en&depth=0`)
  await api(`/api/case-studies/${id}?locale=zh`, {
    method: 'PATCH',
    body: {
      title: data.title.zh,
      excerpt: data.excerpt.zh,
      location: zh(data.location),
      metrics: (saved.metrics ?? []).map((row, i) =>
        mergeLocale(row, {
          value: zh(data.metrics?.[i]?.value),
          label: zh(data.metrics?.[i]?.label),
        }),
      ),
      sections: (saved.sections ?? []).map((block, i) =>
        mergeLocale(block, sectionToZh(data.sections[i])),
      ),
      body: null,
    },
  })
  console.log('✓ 已写入 zh 内容')

  // 自检：en 没被 zh 覆盖，两个语种的旧正文都清干净了
  const checkEn = await api(`/api/case-studies/${id}?locale=en&depth=0`)
  // fallback-locale=none 才能看到 zh 自己的值，否则空字段会回落成 en 的
  const checkZh = await api(`/api/case-studies/${id}?locale=zh&depth=0&fallback-locale=none`)
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
  }
  return { en: en(data.title), zh: zh(data.title) ?? en(data.title) }
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})
