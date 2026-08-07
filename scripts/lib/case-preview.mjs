#!/usr/bin/env node
/**
 * 案例 JSON → 单页结构线框图（HTML）。跟 case-schema.mjs 一样零依赖、不连库，
 * 外部写手把它跟 case.json 放一起就能跑：
 *
 *   node case-preview.mjs case.json
 *
 * 生成 preview.html 放在 case.json 旁边，双击打开。
 *
 * **这是线框图，不是最终效果。** 官网的案例页有一整套排版（字号、留白、底色、
 * 动效、响应式），这里只画结构：章节顺序与编号、每节用了哪种块和哪些选项、
 * 文案长短、图片放在哪。要看真实渲染效果，仍然以维护方给的草稿预览链接为准。
 *
 * 为什么不做成高保真复刻：那需要把 1000 多行的真实渲染器再抄一遍，
 * 从此每改一次案例块都要改两处，早晚漂成两个样子 —— 客户照着一个
 * 已经不准的预览改稿，比没有预览更糟。这里只画结构，且**遇到 case-blocks.json
 * 里没有的块类型直接报错**，让漂移变成一声硬错误，而不是一张画错的图。
 *
 * 编号与底色的规则跟真实渲染器保持一致（见下面 layout()）：
 * - `figure` 的 `variant: "side"` 是上一节的佐证图，不占编号
 * - `statement` 是收尾块，不占编号、固定深蓝底
 * - 其余没指定 `theme` 的按序号白 / 浅蓝交替
 */
import fs from 'node:fs'
import path from 'node:path'

const CATALOG = JSON.parse(fs.readFileSync(new URL('./case-blocks.json', import.meta.url), 'utf8'))

/** JSON 契约里的短名 → case-blocks.json 里的块 slug */
const BLOCK_SLUG = {
  split: 'caseSplit',
  figure: 'caseFigure',
  cards: 'caseCards',
  steps: 'caseSteps',
  compare: 'caseCompare',
  statement: 'caseStatement',
}

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

/** 双语字段 → 一个带语言开关的 span 对（页面顶部的 EN/中文 按钮控制显示哪个） */
const bi = (v, cls = '') => {
  if (v == null) return ''
  if (typeof v === 'string') return `<span class="${cls}">${esc(v)}</span>`
  const en = esc(v.en ?? '')
  const zh = esc(v.zh ?? v.en ?? '')
  const missing = v.zh == null || v.zh === '' ? ' data-missing="1"' : ''
  return `<span class="${cls} l-en">${en}</span><span class="${cls} l-zh"${missing}>${zh}</span>`
}

const plain = (v) => (typeof v === 'string' ? v : (v?.en ?? ''))

/* ---------------------------------------------------------------- 布局 */

/**
 * 复制真实渲染器的编号与底色逻辑。改这里之前先看 src/blocks/caseRenderers.tsx，
 * 两边必须一致 —— 预览把编号画错，客户就会在文案里手写序号来「修正」它。
 */
function layout(sections) {
  const out = []
  let counter = 0
  let lastTheme = 'white'
  for (const s of sections) {
    const merged = s.type === 'figure' && s.variant === 'side'
    const numbered = !merged && s.type !== 'statement'
    if (numbered) counter += 1
    let theme
    if (s.type === 'statement') theme = 'dark'
    else if (merged) theme = lastTheme
    else if (s.theme && s.theme !== 'auto') theme = s.theme
    else theme = counter % 2 === 0 ? 'wash' : 'white'
    if (!merged) lastTheme = theme
    out.push({ s, merged, number: numbered ? String(counter).padStart(2, '0') : null, theme })
  }
  return out
}

/* -------------------------------------------------------------- 建议项 */

/**
 * 软提醒：这些都能通过校验、导得进站，但读起来别扭。
 * 校验器管「对不对」，这里管「好不好」，别把硬错误抄一遍。
 */
function advise(data) {
  const tips = []
  const secs = data.sections ?? []
  const add = (where, text) => tips.push({ where, text })

  const n = secs.length
  if (n < 6) add('整篇', `只有 ${n} 节。版式字号很大，少于 6 节页面会显得空`)
  if (n > 9) add('整篇', `有 ${n} 节。多于 9 节读者划不到底，考虑合并`)

  const kinds = new Set(secs.map((s) => s.type))
  if (kinds.size < 4)
    add('整篇', `只用了 ${kinds.size} 种版式（共 6 种）。全篇同一种块翻下去很单调`)

  // 连着三节以上同一种块
  let run = 1
  for (let i = 1; i <= secs.length; i++) {
    if (i < secs.length && secs[i].type === secs[i - 1].type) run++
    else {
      if (run >= 3)
        add(`第 ${i - run + 1}–${i} 节`, `连着 ${run} 节都是 ${secs[i - 1].type}，读起来会很平`)
      run = 1
    }
  }

  const explicit = secs.filter((s) => s.theme && s.theme !== 'auto').length
  if (explicit > secs.length / 2)
    add('整篇', `${explicit}/${secs.length} 节手动指定了底色。留 auto 自动交替，只给重点节指定`)
  const darks = secs.filter((s) => s.theme === 'dark').length
  if (darks > 2) add('整篇', `${darks} 节深蓝底。超过两节就不跳了，反而糊成一片`)
  const edges = secs.filter((s) => s.accentEdge).length
  if (edges > 1) add('整篇', `${edges} 节用了 accentEdge。整篇最多一次，多了就不是强调了`)

  for (const [i, s] of secs.entries()) {
    const at = `第 ${i + 1} 节`
    if (!s.intro) add(at, '没写 intro。设计稿里每节标题下都有这段铺垫，缺了显得空')
    if (s.type === 'cards' && s.layout === 'metrics') {
      for (const c of s.cards ?? []) {
        const v = plain(c.value)
        if (v && !/\d/.test(v))
          add(at, `metrics 版式是超大号数字用的，「${v}」不是数字，这一格会撑得很难看`)
      }
      if (!(s.facts ?? []).length)
        add(at, '给了数字却没有 facts。读者会先找口径：测了多久、多大间隔、什么仪器')
    }
    if (s.type === 'statement' && i !== secs.length - 1) add(at, 'statement 是收尾块，应该放最后')
  }
  if (secs.filter((s) => s.type === 'statement').length > 1)
    add('整篇', '有多个 statement。一篇只放一个，放在最后')

  // 页头数据条也是大号数字位，跟 metrics 版式同一个毛病
  for (const m of data.metrics ?? []) {
    const v = plain(m.value)
    if (v && !/\d/.test(v))
      add('顶层字段', `metrics 数据条里的「${v}」不是数字。那一格是超大号字，放词组会撑得很难看`)
  }

  for (const f of ['location', 'completedAt', 'relatedProducts']) {
    if (!data[f])
      add(
        '顶层字段',
        {
          location: '没写 location。海外客户会看项目在哪',
          completedAt: '没写 completedAt。交付时间是信任信号',
          relatedProducts: '没写 relatedProducts。页面底部的产品内链对 SEO 有实际价值',
        }[f],
      )
  }
  return tips
}

/* -------------------------------------------------------------- 块渲染 */

const imgBox = (file, alt, assetsRel, note = '') =>
  file
    ? `<figure class="ph"><img src="${esc(path.posix.join(assetsRel, file))}" alt="${esc(plain(alt))}" loading="lazy">
       <figcaption>${esc(file)}${note ? ` · ${esc(note)}` : ''}${alt ? '' : ' <b class="warn">缺 alt</b>'}</figcaption></figure>`
    : ''

function body(s, assetsRel) {
  const rows = []
  const list = (items, fn) => `<ul class="rows">${(items ?? []).map(fn).join('')}</ul>`

  switch (s.type) {
    case 'split':
      if (s.quote) rows.push(`<blockquote class="quote">${bi(s.quote)}</blockquote>`)
      rows.push(
        list(
          s.points,
          (p) => `<li><b>${bi(p.label)}</b><span>${bi(p.text)}</span></li>`,
        ),
      )
      break

    case 'figure':
      rows.push(imgBox(s.image, s.imageAlt, assetsRel, s.video ? '视频封面帧' : ''))
      if (s.video)
        rows.push(
          `<div class="vid"><video src="${esc(path.posix.join(assetsRel, s.video))}" controls preload="metadata" playsinline></video>
           <span class="tag">${esc(s.video)} · 点击播放，线上也是点击才播</span></div>`,
        )
      if (s.banner) rows.push(`<div class="banner">${bi(s.banner)}</div>`)
      break

    case 'cards':
      rows.push(
        list(
          s.cards,
          (c) => `<li>${c.image ? imgBox(c.image, c.imageAlt, assetsRel) : ''}
            ${c.value ? `<b class="big">${bi(c.value)}</b>` : ''}
            ${c.tag ? `<em>${bi(c.tag)}</em>` : ''}
            <b>${bi(c.title)}</b><span>${bi(c.text)}</span></li>`,
        ),
      )
      if (s.sideImage) rows.push(imgBox(s.sideImage, s.sideImageAlt, assetsRel, '佐证图'))
      if ((s.facts ?? []).length)
        rows.push(
          `<div class="facts">${s.facts.map((f) => `<span><b>${bi(f.value)}</b>${bi(f.label)}</span>`).join('')}</div>`,
        )
      if (s.note) rows.push(`<p class="note">${bi(s.note)}</p>`)
      break

    case 'steps':
      rows.push(
        list(
          s.steps,
          (st, i) => `<li><i>${String(i + 1).padStart(2, '0')}</i>
            ${st.image ? imgBox(st.image, st.imageAlt, assetsRel) : ''}
            ${st.pictogram && st.pictogram !== 'none' ? `<span class="tag">示意图：${esc(st.pictogram)}</span>` : ''}
            ${st.tone ? `<span class="tone t-${esc(st.tone)}">${esc(st.tone)}</span>` : ''}
            <b>${bi(st.title)}</b><span>${bi(st.text)}</span></li>`,
        ),
      )
      if (s.proofValue)
        rows.push(`<div class="banner"><b>${bi(s.proofValue)}</b> ${bi(s.proofNote)}</div>`)
      break

    case 'compare': {
      const L = s.labels ?? {}
      rows.push(`<table><thead><tr><th>${bi(L.area)}</th><th>${bi(L.before)}</th><th>${bi(L.after)}</th></tr></thead>
        <tbody>${(s.rows ?? []).map((r) => `<tr><td>${bi(r.area)}</td><td>${bi(r.before)}</td><td>${bi(r.after)}</td></tr>`).join('')}</tbody></table>`)
      if (s.panel) {
        rows.push(`<div class="tag">panel 图示卡（表格上方）</div>`)
        rows.push(imgBox(s.panel.image, s.panel.imageAlt, assetsRel))
        rows.push(
          list(
            s.panel.beforeRows,
            (r) => `<li><b>${bi(r.symbol)}</b><span>${bi(r.text)}</span></li>`,
          ),
        )
      }
      break
    }

    case 'statement':
      if (s.body) rows.push(`<p>${bi(s.body)}</p>`)
      rows.push(`<p class="big">${bi(s.statement)}</p>`)
      break
  }
  return rows.join('')
}

/* ------------------------------------------------------------------ 页 */

function render(data, assetsRel, tips) {
  const laid = layout(data.sections ?? [])
  const byWhere = new Map()
  for (const t of tips) byWhere.set(t.where, [...(byWhere.get(t.where) ?? []), t.text])

  const sections = laid
    .map(({ s, merged, number, theme }, i) => {
      const slug = BLOCK_SLUG[s.type]
      const opts = [
        `theme:${theme}${s.theme && s.theme !== 'auto' ? '' : ' (自动)'}`,
        s.variant && `variant:${s.variant}`,
        s.layout && `layout:${s.layout}`,
        s.style && `style:${s.style}`,
        s.accentEdge && 'accentEdge',
      ].filter(Boolean)
      const mine = byWhere.get(`第 ${i + 1} 节`) ?? []
      return `<section class="sec th-${esc(theme)}${merged ? ' merged' : ''}">
        <header>
          <span class="num">${number ? esc(number) + ' ·' : merged ? '并入上一节' : '收尾'}</span>
          <span class="kick">${bi(s.kicker)}</span>
          <code>${esc(s.type)} · ${esc(slug)}</code>
          <span class="opts">${opts.map((o) => `<i>${esc(o)}</i>`).join('')}</span>
        </header>
        <h2>${bi(s.heading)}</h2>
        ${s.intro ? `<p class="intro">${bi(s.intro)}</p>` : '<p class="intro warn">（这一节没有 intro）</p>'}
        ${body(s, assetsRel)}
        ${mine.length ? `<ul class="tips">${mine.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      </section>`
    })
    .join('')

  const global = [...byWhere.entries()]
    .filter(([w]) => !/^第 \d+ 节$/.test(w))
    .flatMap(([w, ts]) => ts.map((t) => `<li><b>${esc(w)}</b>${esc(t)}</li>`))
    .join('')

  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>结构预览 · ${esc(plain(data.title))}</title>
<style>
:root{--navy:#0B1F3F;--accent:#1B63E8;--wash:#F2F6FC;--washBlue:#E4EDFB;--line:#D8E0EC;--steel:#5A6B84}
*{box-sizing:border-box}body{margin:0;font:15px/1.65 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif;color:#16233A;background:#fff}
.bar{position:sticky;top:0;z-index:9;background:var(--navy);color:#fff;padding:14px 20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.bar b{font-size:16px}.bar .warnbadge{background:#C2410C;padding:2px 9px;font-size:12px}
button{font:inherit;padding:5px 14px;border:1px solid rgba(255,255,255,.45);background:none;color:#fff;cursor:pointer}
button[aria-pressed=true]{background:#fff;color:var(--navy);font-weight:700}
.note-top{background:#FEF3C7;border-bottom:1px solid #FCD34D;padding:12px 20px;font-size:14px}
main{max-width:960px;margin:0 auto;padding:0 20px 80px}
.meta{border:1px dashed var(--line);padding:18px;margin:24px 0;font-size:14px}
.meta dt{color:var(--steel);font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.meta dd{margin:2px 0 12px}
.sec{border:1px dashed var(--line);border-left:5px solid var(--line);padding:20px;margin:20px 0}
.sec.th-white{border-left-color:#C9D4E4}.sec.th-wash{border-left-color:#9FB6D6;background:var(--wash)}
.sec.th-washBlue{border-left-color:#6E96D2;background:var(--washBlue)}
.sec.th-dark{border-left-color:var(--navy);background:#EAEFF7}
.sec.merged{margin-top:-14px;border-top-style:dotted;opacity:.94}
.sec header{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.num{font-weight:800;color:var(--accent)}
.kick{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--steel)}
code{background:var(--navy);color:#fff;padding:2px 8px;font-size:12px}
.opts i{display:inline-block;border:1px solid var(--line);background:#fff;padding:1px 7px;margin-left:4px;font-style:normal;font-size:11px;color:var(--steel)}
h2{font-size:21px;line-height:1.3;margin:6px 0}
.intro{color:var(--steel);margin:6px 0 14px}
.rows{list-style:none;padding:0;margin:10px 0;display:grid;gap:10px}
.rows li{border:1px dotted var(--line);background:#fff;padding:10px 12px}
.rows b{display:block}.rows em{font-style:normal;font-size:11px;color:var(--accent);letter-spacing:.1em}
.rows i{float:right;color:var(--steel);font-style:normal;font-weight:800}
.big{font-size:26px;font-weight:800;color:var(--navy)}
.quote{border-left:4px solid var(--navy);background:#fff;margin:10px 0;padding:12px 16px;font-size:17px}
.ph{margin:8px 0}.ph img{display:block;width:100%;max-width:420px;border:1px solid var(--line)}
.ph figcaption{font-size:11px;color:var(--steel);margin-top:3px}
.vid video{width:100%;max-width:560px;border:1px solid var(--line);display:block}
.banner{background:var(--navy);color:#fff;padding:11px 14px;margin:10px 0}
.facts{display:flex;flex-wrap:wrap;gap:14px;margin:10px 0}
.facts span{border:1px dotted var(--line);background:#fff;padding:8px 12px;font-size:13px}
.note{font-size:12px;color:var(--steel)}
.tag{display:inline-block;background:var(--wash);border:1px solid var(--line);padding:2px 8px;font-size:11px;color:var(--steel)}
.tone{display:inline-block;padding:1px 8px;font-size:11px;color:#fff}
.t-accent{background:var(--accent)}.t-flag{background:#C2410C}.t-go{background:#15803D}.t-navy{background:var(--navy)}
table{border-collapse:collapse;width:100%;margin:10px 0;font-size:14px;background:#fff}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--wash);font-size:12px}
.tips,.globaltips{list-style:none;padding:10px 12px;margin:14px 0 0;background:#FEF3C7;border-left:4px solid #F59E0B;font-size:13px}
.tips li,.globaltips li{margin:3px 0}.globaltips b{display:inline-block;min-width:78px;color:#92400E}
.warn{color:#C2410C}
[data-missing]{background:#FEE2E2;outline:1px solid #FCA5A5}
body[data-lang=en] .l-zh,body[data-lang=zh] .l-en{display:none}
</style>
<body data-lang="en">
<div class="bar">
  <b>结构预览</b><span>${bi(data.title)}</span>
  <button data-l="en" aria-pressed="true">EN</button><button data-l="zh" aria-pressed="false">中文</button>
  ${tips.length ? `<span class="warnbadge">${tips.length} 条建议</span>` : ''}
</div>
<div class="note-top"><b>这是线框图，不是最终效果。</b>官网的案例页有完整的排版、配色和动效，这里只画结构：章节顺序与编号、每节用了哪种版式、文案长短、图片放在哪。要看真实渲染效果，用维护方给的草稿预览链接。切到「中文」时<span style="background:#FEE2E2;outline:1px solid #FCA5A5">红底</span>的是没写中文、会回落成英文的地方。</div>
<main>
  <dl class="meta">
    <dt>slug</dt><dd>${esc(data.slug)}</dd>
    <dt>摘要</dt><dd>${bi(data.excerpt)}</dd>
    <dt>行业 / 地点 / 交付时间</dt><dd>${esc(data.industry ?? '—')} · ${bi(data.location) || '—'} · ${esc(data.completedAt ?? '—')}</dd>
    <dt>关联产品</dt><dd>${esc((data.relatedProducts ?? []).join('、') || '—')}</dd>
    <dt>成果指标</dt><dd>${(data.metrics ?? []).map((m) => `<b>${bi(m.value)}</b> ${bi(m.label)}`).join(' ／ ') || '—'}</dd>
    <dt>封面</dt><dd>${imgBox(data.cover, data.coverAlt, assetsRel)}</dd>
  </dl>
  ${global ? `<ul class="globaltips">${global}</ul>` : ''}
  ${sections}
</main>
<script>
document.querySelectorAll('.bar button').forEach(b => b.onclick = () => {
  document.body.dataset.lang = b.dataset.l
  document.querySelectorAll('.bar button').forEach(x => x.setAttribute('aria-pressed', x === b))
})
</script>`
}

/* ---------------------------------------------------------------- 入口 */

const file = process.argv[2]
if (!file) {
  console.error(`用法：node case-preview.mjs case.json [素材目录]

生成 preview.html 放在 case.json 旁边，双击打开。`)
  process.exit(1)
}
const full = path.resolve(process.cwd(), file)
const data = JSON.parse(fs.readFileSync(full, 'utf8'))

// 优先级跟校验器和导入器一致
const assetsDir = path.resolve(
  process.cwd(),
  process.argv[3] || data.assets || path.join(path.dirname(full), 'assets'),
)

// 漂移守卫：块类型或选项值不在目录里就硬报错，别画一张错的图糊弄过去
for (const [i, s] of (data.sections ?? []).entries()) {
  const slug = BLOCK_SLUG[s.type]
  if (!slug || !CATALOG.blocks[slug]) {
    console.error(
      `✗ 第 ${i + 1} 节的 type「${s.type}」不认识。合法值：${Object.keys(BLOCK_SLUG).join(' / ')}\n` +
        `  如果这是官网新加的版式，说明这个预览工具该更新了，找维护方要新版。`,
    )
    process.exit(1)
  }
}

const out = path.join(path.dirname(full), 'preview.html')
const tips = advise(data)
const rel = path.posix.normalize(
  path.relative(path.dirname(full), assetsDir).split(path.sep).join('/') || '.',
)
fs.writeFileSync(out, render(data, rel, tips))

console.log(`✓ 已生成 ${out}`)
console.log(`  ${(data.sections ?? []).length} 个章节，素材目录 ${assetsDir}`)
if (tips.length) {
  console.log(`\n  ${tips.length} 条建议（都不影响导入，页面里也标了）：`)
  for (const t of tips.slice(0, 8)) console.log(`  · ${t.where}：${t.text}`)
  if (tips.length > 8) console.log(`  · …还有 ${tips.length - 8} 条，见页面`)
}
console.log('\n用浏览器打开 preview.html。这是线框图，最终效果以草稿预览链接为准。')
