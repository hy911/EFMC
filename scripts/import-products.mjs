#!/usr/bin/env node
/**
 * 通过 Payload REST API 批量导入产品（中英双语一次写好）。
 *
 * 凭据只从环境变量读，脚本不打印、不落盘：
 *   PAYLOAD_URL       目标站点，如 http://localhost:3000 或 https://你的域名
 *   PAYLOAD_EMAIL     后台账号
 *   PAYLOAD_PASSWORD  后台密码
 *
 * 用法：
 *   node scripts/import-products.mjs --dry-run    只打印将要做什么，不写任何数据
 *   node scripts/import-products.mjs              实际导入
 *   node scripts/import-products.mjs --only 1,3   只导入指定序号的产品
 *
 * 幂等：slug 已存在的产品会跳过（不会覆盖后台的人工修改）。
 *
 * 注意 localized 内容的写法：先用 en 建文档，再用 ?locale=zh 补中文。
 * images 数组内没有 localized 叶子字段，因此 zh 更新时整体不带 images，
 * 避免触发数组重建（本项目踩过的坑，见 CLAUDE.md）。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { products } from './data/products.mjs'

const SOURCE_ROOT =
  process.env.PRODUCT_ASSETS_ROOT ||
  'D:/国际站店铺装修发品资料收集包 - 副本/1.客户需要准备的素材（需要回传）/2.发品所需资料（最多150条）'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const onlyArg = args[args.indexOf('--only') + 1]
const ONLY = args.includes('--only') ? new Set(onlyArg.split(',').map(Number)) : null

const URL_BASE = (process.env.PAYLOAD_URL || '').replace(/\/$/, '')
const EMAIL = process.env.PAYLOAD_EMAIL
const PASSWORD = process.env.PAYLOAD_PASSWORD

if (!URL_BASE || !EMAIL || !PASSWORD) {
  console.error(`缺少环境变量。请先设置：
  PAYLOAD_URL       目标站点（如 http://localhost:3000）
  PAYLOAD_EMAIL     后台账号
  PAYLOAD_PASSWORD  后台密码`)
  process.exit(1)
}

/** 拼最小 Lexical 富文本（多段落），与 seed/index.ts 的 richTextOf 一致 */
const richTextOf = (paragraphs) => ({
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      version: 1,
      children: [{ type: 'text', version: 1, text }],
    })),
  },
})

let token = ''

async function api(pathname, { method = 'GET', body, headers = {}, raw } = {}) {
  const res = await fetch(`${URL_BASE}${pathname}`, {
    method,
    headers: {
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(raw ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    const msg = json?.errors?.map((e) => e.message).join('; ') || json?.message || text.slice(0, 300)
    throw new Error(`${method} ${pathname} → ${res.status}: ${msg}`)
  }
  return json
}

async function login() {
  const r = await api('/api/users/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD } })
  token = r.token
  console.log(`已登录：${r.user?.email ?? '(未知账号)'}`)
}

/** 分类名归一化：忽略大小写、首尾空格与内部多余空白，容忍手录时的细微差异 */
const normalizeName = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')

/** 取分类：归一化英文名 → id。字段是 name（不是 title） */
async function loadCategories() {
  const r = await api('/api/product-categories?limit=100&locale=en')
  const map = new Map()
  for (const d of r.docs) {
    if (d.name) map.set(normalizeName(d.name), { id: d.id, name: d.name })
  }
  console.log(`已读到 ${map.size} 个分类：${[...map.values()].map((v) => v.name).join(' / ')}`)
  return map
}

/** slug 已存在？ */
async function findBySlug(slug) {
  const r = await api(`/api/products?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&locale=en`)
  return r.docs?.[0]
}

/** 找封面文件：优先 data 里指定的，其次该产品文件夹里第一张图 */
async function resolveCover(p) {
  const dirs = await fs.readdir(SOURCE_ROOT, { withFileTypes: true })
  const dir = dirs.find((d) => d.isDirectory() && d.name.startsWith(`${p.folderIndex}产品`))
  if (!dir) return null
  const full = path.join(SOURCE_ROOT, dir.name)
  const files = (await fs.readdir(full)).filter((f) => /\.(jpe?g|png)$/i.test(f) && f !== '彩页.png')
  const pick = p.cover && files.includes(p.cover) ? p.cover : files.sort()[0]
  return pick ? path.join(full, pick) : null
}

/** 上传一张图到 media，返回 id */
async function uploadMedia(filePath, altEn, altZh) {
  const buf = await fs.readFile(filePath)
  const name = path.basename(filePath)
  const type = /\.png$/i.test(name) ? 'image/png' : 'image/jpeg'
  const form = new FormData()
  form.append('file', new Blob([buf], { type }), name)
  form.append('_payload', JSON.stringify({ alt: altEn }))
  const created = await api('/api/media?locale=en', { method: 'POST', raw: form })
  const id = created.doc.id
  await api(`/api/media/${id}?locale=zh`, { method: 'PATCH', body: { alt: altZh } })
  return id
}

async function main() {
  console.log(`目标站点：${URL_BASE}${DRY ? '　【空跑，不写任何数据】' : ''}\n`)
  await login()
  const categories = await loadCategories()

  const list = products.filter((p) => !ONLY || ONLY.has(p.folderIndex))
  let created = 0
  let skipped = 0

  for (const p of list) {
    const cat = categories.get(normalizeName(p.category))
    if (!cat) {
      console.error(
        `✗ ${p.slug}：后台找不到分类「${p.category}」。后台现有：${[...categories.values()]
          .map((v) => v.name)
          .join(' / ')}`,
      )
      continue
    }
    const catId = cat.id

    const existing = await findBySlug(p.slug)
    if (existing) {
      console.log(`— ${p.slug}：已存在（id ${existing.id}），跳过`)
      skipped++
      continue
    }

    const cover = await resolveCover(p)
    if (!cover) {
      console.error(`✗ ${p.slug}：找不到可用封面图，跳过（产品的图片字段必填）`)
      continue
    }

    if (DRY) {
      console.log(`+ ${p.slug}
    分类：${p.category}
    封面：${path.basename(cover)}
    EN：${p.en.title}
    ZH：${p.zh.title}
    首页精选：${p.featured ? '是' : '否'}`)
      created++
      continue
    }

    const mediaId = await uploadMedia(cover, p.en.title, p.zh.title)

    const doc = await api('/api/products?locale=en', {
      method: 'POST',
      body: {
        title: p.en.title,
        slug: p.slug,
        excerpt: p.en.excerpt,
        description: richTextOf(p.en.body),
        images: [{ image: mediaId }],
        category: catId,
        featured: p.featured,
        seo: { metaTitle: p.en.metaTitle, metaDescription: p.en.metaDescription },
      },
    })

    // 中文：只写 localized 字段，不带 images（数组内无 localized 叶子字段，
    // 带上反而可能触发数组重建）
    await api(`/api/products/${doc.doc.id}?locale=zh`, {
      method: 'PATCH',
      body: {
        title: p.zh.title,
        excerpt: p.zh.excerpt,
        description: richTextOf(p.zh.body),
        seo: { metaTitle: p.zh.metaTitle, metaDescription: p.zh.metaDescription },
      },
    })

    console.log(`✓ ${p.slug}（id ${doc.doc.id}，封面 ${path.basename(cover)}）`)
    created++
  }

  console.log(`\n完成：新建 ${created} 个${skipped ? `，跳过已存在 ${skipped} 个` : ''}。`)
  if (DRY) console.log('这是空跑，没有写入任何数据。去掉 --dry-run 才会真正导入。')
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})
