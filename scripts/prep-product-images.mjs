#!/usr/bin/env node
/**
 * 产品图片预处理：从素材包挑图 → 转正 → 压到网页尺寸 → 规范命名。
 *
 * 两步用法：
 *   1) node scripts/prep-product-images.mjs sheet "<素材包目录>"
 *      生成 photos-out/contact-sheet.html，在浏览器打开：
 *      点图片选中/取消，按 R 或点右下角圆钮旋转，最后复制页面底部的 JSON。
 *
 *   2) node scripts/prep-product-images.mjs build selection.json
 *      按 JSON 输出成品到 photos-out/products/<slug>/01.jpg …
 *
 * 原始素材只读，绝不修改。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OUT_ROOT = path.resolve(process.cwd(), 'photos-out')
const SHEET_THUMBS = path.join(OUT_ROOT, 'thumbs')
const IMG_RE = /\.(jpe?g|png)$/i
/** 每个产品文件夹里都有的同一张流程图，含烧字与图库网图，不进网站 */
const SKIP_FILES = new Set(['彩页.png'])

/** 产品文件夹名 → 网站 slug（与 docs/PRODUCT_CONTENT_DRAFT.md 一致） */
const SLUG_BY_INDEX = {
  1: 'siemens-s7-1200-plc-control-cabinet',
  2: 'siemens-s7-200-smart-plc-cabinet',
  3: 'siemens-et200sp-s7-1500-plc-cabinet',
  4: 'hv-lv-switchgear-power-distribution-cabinet',
  5: 'instrument-enclosure-operator-valve-control-box',
  6: 'multi-brand-plc-control-cabinet',
  7: 'abb-acs510-acs580-vfd-control-cabinet',
  8: 'ro-edi-mbr-water-treatment-control-panel',
  9: 'wincc-hmi-scada-programming-service',
  10: 'plc-programming-commissioning-service',
  11: 'iiot-plc-cloud-monitoring-system',
}

/** 扫描素材包，返回 [{ index, slug, dir, files }] */
async function scanProducts(root) {
  const entries = await fs.readdir(root, { withFileTypes: true })
  const products = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const m = e.name.match(/^(\d+)产品/)
    if (!m) continue
    const index = Number(m[1])
    const dir = path.join(root, e.name)
    const files = (await fs.readdir(dir))
      .filter((f) => IMG_RE.test(f) && !SKIP_FILES.has(f))
      .sort()
    products.push({ index, slug: SLUG_BY_INDEX[index] ?? `product-${index}`, name: e.name, dir, files })
  }
  return products.sort((a, b) => a.index - b.index)
}

async function buildSheet(root) {
  const products = await scanProducts(root)
  await fs.mkdir(SHEET_THUMBS, { recursive: true })

  const sections = []
  for (const p of products) {
    const items = []
    for (const [i, f] of p.files.entries()) {
      const thumbName = `${p.index}-${i}.jpg`
      const src = path.join(p.dir, f)
      try {
        await sharp(src).resize(260, 260, { fit: 'inside' }).jpeg({ quality: 72 }).toFile(path.join(SHEET_THUMBS, thumbName))
      } catch (err) {
        console.warn(`跳过（无法读取）：${src} — ${err.message}`)
        continue
      }
      items.push(
        `<figure class="it" data-p="${p.index}" data-f="${escapeHtml(f)}">
           <img src="thumbs/${thumbName}" loading="lazy">
           <button class="rot" title="旋转 90°">⟳</button>
           <figcaption>${escapeHtml(f)}</figcaption>
         </figure>`,
      )
    }
    sections.push(
      `<section><h2>${p.index}. ${escapeHtml(p.name)}<small>${p.slug}</small></h2>
       <div class="grid">${items.join('')}</div></section>`,
    )
  }

  const html = `<!doctype html><meta charset="utf-8"><title>产品选图</title>
<style>
 body{font:14px/1.5 system-ui,sans-serif;margin:24px;background:#f6f7f9;color:#111}
 h1{font-size:20px} h2{font-size:16px;margin:28px 0 10px;border-bottom:1px solid #ddd;padding-bottom:6px}
 h2 small{font-weight:400;color:#888;margin-left:10px;font-size:12px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
 .it{margin:0;position:relative;background:#fff;border:2px solid #ddd;padding:6px;cursor:pointer;border-radius:2px}
 .it.sel{border-color:#1B63E8;box-shadow:0 0 0 3px rgba(27,99,232,.15)}
 .it img{width:100%;height:130px;object-fit:contain;display:block;transition:transform .15s}
 .it figcaption{font-size:10px;color:#777;word-break:break-all;margin-top:4px;line-height:1.3}
 .it .rot{position:absolute;right:8px;bottom:34px;width:26px;height:26px;border-radius:50%;border:0;
   background:rgba(0,0,0,.6);color:#fff;cursor:pointer;font-size:14px;line-height:26px;padding:0}
 .it .ord{position:absolute;left:8px;top:8px;background:#1B63E8;color:#fff;font-size:11px;
   width:20px;height:20px;line-height:20px;text-align:center;border-radius:50%}
 #bar{position:sticky;top:0;background:#0B1F3F;color:#fff;padding:12px 16px;margin:-24px -24px 20px;z-index:9}
 #bar button{background:#1B63E8;color:#fff;border:0;padding:8px 16px;cursor:pointer;font-size:13px}
 textarea{width:100%;height:180px;font:12px monospace;margin-top:10px}
</style>
<div id="bar"><b>点图片=选中/取消（数字是顺序，第一张作封面） · 点 ⟳ =旋转 90°</b>
  <button onclick="dump()">生成 JSON</button> <span id="cnt"></span></div>
<h1>产品选图</h1>
${sections.join('\n')}
<h2>输出</h2>
<p>把下面的内容存成 <code>selection.json</code>，然后运行：<code>node scripts/prep-product-images.mjs build selection.json</code></p>
<textarea id="out" readonly></textarea>
<script>
 const state = new Map(); // key: p|f -> {order, rot}
 let seq = 0;
 document.querySelectorAll('.it').forEach(el => {
   const key = el.dataset.p + '|' + el.dataset.f;
   el.addEventListener('click', e => {
     if (e.target.classList.contains('rot')) return;
     if (state.has(key)) { state.delete(key); el.classList.remove('sel'); el.querySelector('.ord')?.remove(); }
     else {
       state.set(key, { order: ++seq, rot: state.get(key)?.rot || 0 });
       el.classList.add('sel');
       const b = document.createElement('span'); b.className='ord'; b.textContent = state.get(key).order;
       el.appendChild(b);
     }
     document.getElementById('cnt').textContent = '已选 ' + state.size + ' 张';
   });
   el.querySelector('.rot').addEventListener('click', () => {
     const cur = state.get(key) || { order: 0, rot: 0 };
     cur.rot = (cur.rot + 90) % 360;
     if (!state.has(key)) state.set(key, cur);
     el.querySelector('img').style.transform = 'rotate(' + cur.rot + 'deg)';
   });
 });
 function dump() {
   const out = {};
   [...state.entries()].sort((a,b) => a[1].order - b[1].order).forEach(([k, v]) => {
     if (!v.order) return;             // 只旋转未选中的不输出
     const [p, f] = k.split('|');
     (out[p] ||= []).push({ file: f, rotate: v.rot });
   });
   document.getElementById('out').value = JSON.stringify(out, null, 2);
   document.getElementById('out').select();
 }
</script>`

  const sheetPath = path.join(OUT_ROOT, 'contact-sheet.html')
  await fs.writeFile(sheetPath, html, 'utf8')
  const total = products.reduce((n, p) => n + p.files.length, 0)
  console.log(`联系表已生成：${sheetPath}（${products.length} 个产品，${total} 张图）`)
  console.log('在浏览器打开它选图，然后把导出的 JSON 存成 selection.json')
}

async function build(selectionFile, root) {
  const selection = JSON.parse(await fs.readFile(selectionFile, 'utf8'))
  const products = await scanProducts(root)
  const byIndex = new Map(products.map((p) => [String(p.index), p]))

  for (const [pIndex, picks] of Object.entries(selection)) {
    const p = byIndex.get(pIndex)
    if (!p) {
      console.warn(`selection.json 里的产品 ${pIndex} 在素材包中找不到，跳过`)
      continue
    }
    const outDir = path.join(OUT_ROOT, 'products', p.slug)
    await fs.mkdir(outDir, { recursive: true })
    for (const [i, pick] of picks.entries()) {
      const src = path.join(p.dir, pick.file)
      const out = path.join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`)
      await sharp(src)
        .rotate(pick.rotate || 0)
        // 长边 1600px 足够：Payload 上传后会再生成 card/feature/og 三档
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(out)
      console.log(`${p.slug}/${path.basename(out)}  ←  ${pick.file}${pick.rotate ? ` (转 ${pick.rotate}°)` : ''}`)
    }
  }
  console.log(`\n完成。成品在 ${path.join(OUT_ROOT, 'products')}，按产品分目录，01 是封面。`)
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
}

const [cmd, arg] = process.argv.slice(2)
const DEFAULT_ROOT =
  'D:/国际站店铺装修发品资料收集包 - 副本/1.客户需要准备的素材（需要回传）/2.发品所需资料（最多150条）'

if (cmd === 'sheet') {
  await buildSheet(arg || DEFAULT_ROOT)
} else if (cmd === 'build') {
  if (!arg) {
    console.error('用法：node scripts/prep-product-images.mjs build selection.json')
    process.exit(1)
  }
  await build(arg, DEFAULT_ROOT)
} else {
  console.error(`用法：
  node scripts/prep-product-images.mjs sheet ["素材包目录"]   生成选图联系表
  node scripts/prep-product-images.mjs build selection.json   按选择输出成品`)
  process.exit(1)
}
