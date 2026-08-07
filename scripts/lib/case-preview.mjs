#!/usr/bin/env node
/**
 * case.json → 与线上一致的案例页面（静态 HTML）。
 *
 *   node case-preview.mjs case.json
 *
 * 在 case.json 旁边生成 preview-en.html 和 preview-zh.html，浏览器直接打开。
 *
 * **渲染用的是官网真实的组件**（`preview/case-render.mjs` 由官网代码打包而来，
 * 不是另写的一套仿制品），样式是官网真实的 Tailwind 产物（`preview/preview.css`，
 * 字体已内联）。所以看到的排版、字号、留白、配色跟线上一致。
 *
 * 三处必然的差异，改稿时心里有数就行：
 * - 页面上下没有导航栏和页脚（那两块要连数据库取站点设置）
 * - 图片是原图直接显示，线上会转成多尺寸 WebP，实际更快、更清晰
 * - 入场动画没有（线上是滚动到才淡入，静态页里一律直接可见）
 *
 * 改一版重跑一次，刷新浏览器即可。定稿后把 case.json 和 assets/ 打包交付。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { collectImages, collectVideos, en, zh } from './case-schema.mjs'
import { sectionToBlock } from './case-to-payload.mjs'
import { renderCase } from './preview/case-render.mjs'

const LABELS = {
  en: { industry: 'Industry', location: 'Location', completed: 'Completed', draft: 'LOCAL PREVIEW' },
  zh: { industry: '所属行业', location: '项目地点', completed: '交付时间', draft: '本地预览' },
}

/** 中文缺失时回落英文 —— 跟线上 Payload 的 fallback 行为一致 */
const pickZh = (v) => zh(v) ?? en(v)

/**
 * 把文件名映射成渲染器认得的媒体对象。
 * 线上这里是 Payload 文档（带多尺寸 webp）；预览直接指向 assets/ 里的原图，
 * `sizes` 留空，MediaImage 会自动回落到 url。
 */
function mediaMap(data, assetsRel, pick) {
  const map = {}
  const alt = (file) => {
    const find = (o) => (o && typeof o === 'object' ? o : null)
    if (file === data.cover) return pick(data.coverAlt) ?? pick(data.title) ?? ''
    for (const s of data.sections ?? []) {
      if (s.image === file) return pick(s.imageAlt) ?? ''
      if (s.video === file) return pick(s.videoAlt) ?? ''
      if (s.themeImage === file) return pick(s.themeImageAlt) ?? pick(data.title) ?? ''
      if (s.sideImage === file) return pick(s.sideImageAlt) ?? ''
      if (find(s.panel)?.image === file) return pick(s.panel.imageAlt) ?? ''
      for (const c of s.cards ?? []) if (c.image === file) return pick(c.imageAlt) ?? ''
      for (const st of s.steps ?? []) if (st.image === file) return pick(st.imageAlt) ?? ''
      for (const r of s.panel?.beforeRows ?? []) if (r.image === file) return pick(r.imageAlt) ?? ''
    }
    return ''
  }
  const focal = (file) => {
    if (file === data.cover && data.coverFocal) return data.coverFocal
    for (const s of data.sections ?? []) {
      if (s.image === file && s.focal) return s.focal
      for (const st of s.steps ?? []) if (st.image === file && st.focal) return st.focal
    }
    return null
  }
  for (const file of [...collectImages(data), ...collectVideos(data)]) {
    const f = focal(file)
    map[file] = {
      id: file,
      alt: alt(file),
      url: `${assetsRel}/${encodeURI(file)}`,
      sizes: {},
      ...(f ? { focalX: f[0], focalY: f[1] } : {}),
    }
  }
  return map
}

function buildDoc(data, assetsRel, locale) {
  const pick = locale === 'zh' ? pickZh : en
  const media = mediaMap(data, assetsRel, pick)
  return {
    title: pick(data.title),
    titleAccent: pick(data.titleAccent),
    excerpt: pick(data.excerpt),
    coverImage: media[data.cover],
    industryName: data.industry ?? null,
    highlights: (data.highlights ?? []).map((h, i) => ({ id: `h${i}`, label: pick(h) })),
    metrics: (data.metrics ?? []).map((m, i) => ({
      id: `m${i}`,
      value: pick(m.value),
      label: pick(m.label),
    })),
    sections: (data.sections ?? []).map((s, i) => ({
      id: `s${i}`,
      ...sectionToBlock(s, media, pick),
    })),
  }
}

function page(data, assetsRel, locale, cssHref) {
  const L = LABELS[locale]
  const doc = buildDoc(data, assetsRel, locale)
  const facts = [
    data.industry && { label: L.industry, value: data.industry },
    data.location && { label: L.location, value: pickLoc(data.location, locale) },
    data.completedAt && { label: L.completed, value: fmtDate(data.completedAt, locale) },
  ].filter(Boolean)

  const other = locale === 'en' ? 'zh' : 'en'
  return `<!doctype html>
<html lang="${locale}">
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape_(doc.title)} · ${locale === 'en' ? 'Preview' : '本地预览'}</title>
<link rel="stylesheet" href="${cssHref}">
<style>
  .pv-bar{position:sticky;top:0;z-index:50;display:flex;gap:14px;align-items:center;flex-wrap:wrap;
    background:#7C2D12;color:#fff;padding:9px 18px;font:600 13px/1.5 system-ui,sans-serif}
  .pv-bar a{color:#fff;text-decoration:underline}
  .pv-bar span{font-weight:400;opacity:.9}
</style>
<body>
<div class="pv-bar">
  <b>${L.draft}</b>
  <a href="preview-${other}.html">${other === 'zh' ? '看中文版' : 'View English'}</a>
  <span>${
    locale === 'en'
      ? 'Real site components and styles. No navbar/footer, no scroll animations, images unoptimised.'
      : '用的是官网真实组件与样式。没有导航栏页脚、没有入场动画、图片未压缩，其余与线上一致。'
  }</span>
</div>
${renderCase(doc, facts)}
</body></html>`
}

const escape_ = (s) =>
  String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  )

const pickLoc = (v, locale) => (locale === 'zh' ? pickZh(v) : en(v)) ?? ''

/** 跟 src/lib/format.ts 一致：按语种输出年月 */
function fmtDate(iso, locale) {
  const d = new Date(/^\d{4}-\d{2}$/.test(iso) ? `${iso}-01` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
  })
}

/* ---------------------------------------------------------------- 入口 */

const file = process.argv[2]
if (!file) {
  console.error(`用法：node case-preview.mjs case.json [素材目录]

在 case.json 旁边生成 preview-en.html 与 preview-zh.html，浏览器打开即可。`)
  process.exit(1)
}

const full = path.resolve(process.cwd(), file)
const data = JSON.parse(fs.readFileSync(full, 'utf8'))
const dir = path.dirname(full)

// 优先级跟校验器和导入器一致
const assetsDir = path.resolve(
  process.cwd(),
  process.argv[3] || data.assets || path.join(dir, 'assets'),
)
const assetsRel = (path.relative(dir, assetsDir).split(path.sep).join('/') || '.').replace(/\/$/, '')

// 漂移守卫：块类型不认识就硬报错，别渲染出一个缺了章节的页面糊弄过去
const KNOWN = ['split', 'figure', 'cards', 'steps', 'compare', 'statement']
for (const [i, s] of (data.sections ?? []).entries()) {
  if (!KNOWN.includes(s.type)) {
    console.error(
      `✗ 第 ${i + 1} 节的 type「${s.type}」不认识。合法值：${KNOWN.join(' / ')}\n` +
        `  如果这是官网新加的版式，说明这套预览工具该更新了，找维护方要新版。`,
    )
    process.exit(1)
  }
}

/**
 * CSS 在工具旁边（交付包里是 preview/preview.css），算出相对 html 的路径。
 *
 * 必须用 fileURLToPath 而不是 `new URL(...).pathname`：URL 里的非 ASCII 字符是
 * 百分号编码的，pathname 不解码，于是「发给客户」这种中文目录名算出来的路径
 * 跟真实目录对不上，path.relative 会绕出去再绕回来，生成一个加载不到的 href。
 * 中文目录名是常态，别退回去。
 */
const cssPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'preview', 'preview.css')
// href 里的空格与中文交给浏览器按相对 URL 解析，这里只做分隔符归一
const cssHref = path.relative(dir, cssPath).split(path.sep).join('/') || 'preview.css'

for (const locale of ['en', 'zh']) {
  const out = path.join(dir, `preview-${locale}.html`)
  fs.writeFileSync(out, page(data, assetsRel, locale, cssHref))
  console.log(`✓ ${path.basename(out)}`)
}

console.log(`\n用浏览器打开 preview-en.html（右上角可切到中文版）。`)
console.log(`排版与线上一致；没有导航栏页脚、没有入场动画、图片未压缩。`)
