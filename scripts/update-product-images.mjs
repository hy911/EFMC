#!/usr/bin/env node
/**
 * 用 photos-out/products/<slug>/ 下的成品图替换线上产品的图片。
 *
 * 前置：先跑图片预处理，选图 + 转正 + 压缩
 *   node scripts/prep-product-images.mjs sheet     生成联系表，浏览器里选图
 *   node scripts/prep-product-images.mjs build selection.json
 *
 * 然后：
 *   node scripts/update-product-images.mjs --dry-run     只打印会做什么
 *   node scripts/update-product-images.mjs               替换全部有成品图的产品
 *   node scripts/update-product-images.mjs --only siemens-s7-1200-plc-control-cabinet
 *   node scripts/update-product-images.mjs --prune       同时删除被替换掉的旧图（不可恢复）
 *
 * 文件名顺序即展示顺序，01 是封面（产品卡片和列表页用的就是它）。
 *
 * 说明：images 数组内只有 image 一个 upload 字段、无 localized 叶子字段，
 * 因此只需写 en 一次，不必再按 zh 补写。图片的 alt 在 media 上，中英都写。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { api, login, requireEnv, uploadMedia } from './lib/payload-api.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const PRUNE = args.includes('--prune')
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null

const BUILT_ROOT = path.resolve(process.cwd(), 'photos-out', 'products')

async function listBuilt() {
  let dirs
  try {
    dirs = await fs.readdir(BUILT_ROOT, { withFileTypes: true })
  } catch {
    console.error(`找不到成品图目录：${BUILT_ROOT}

请先选图并生成成品：
  node scripts/prep-product-images.mjs sheet
  （浏览器打开 photos-out/contact-sheet.html 选图，导出 selection.json）
  node scripts/prep-product-images.mjs build selection.json`)
    process.exit(1)
  }
  const out = []
  for (const d of dirs) {
    if (!d.isDirectory()) continue
    if (ONLY && d.name !== ONLY) continue
    const dir = path.join(BUILT_ROOT, d.name)
    const files = (await fs.readdir(dir)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()
    if (files.length) out.push({ slug: d.name, dir, files })
  }
  return out
}

async function main() {
  const base = requireEnv()
  console.log(`目标站点：${base}${DRY ? '　【空跑，不写任何数据】' : ''}\n`)

  const built = await listBuilt()
  if (built.length === 0) {
    console.error(ONLY ? `没有找到 ${ONLY} 的成品图` : '成品图目录里没有任何产品')
    process.exit(1)
  }

  await login()

  let updated = 0
  for (const item of built) {
    const found = await api(
      `/api/products?where[slug][equals]=${encodeURIComponent(item.slug)}&limit=1&locale=en&depth=0`,
    )
    const product = found.docs?.[0]
    if (!product) {
      console.error(`✗ ${item.slug}：线上找不到这个产品，跳过`)
      continue
    }

    const oldMediaIds = (product.images ?? []).map((r) => r.image).filter(Boolean)

    if (DRY) {
      console.log(`~ ${item.slug}
    现有图片：${oldMediaIds.length} 张　→　替换为 ${item.files.length} 张
    ${item.files.join(', ')}（${item.files[0]} 作封面）${PRUNE ? '\n    旧图会被删除（--prune）' : ''}`)
      updated++
      continue
    }

    // 先把中英标题读出来做 alt
    const zhDoc = await api(`/api/products/${product.id}?locale=zh&depth=0`)
    const altEn = product.title
    const altZh = zhDoc.title || product.title

    const mediaIds = []
    for (const [i, f] of item.files.entries()) {
      const suffix = item.files.length > 1 ? ` (${i + 1})` : ''
      const id = await uploadMedia(path.join(item.dir, f), `${altEn}${suffix}`, `${altZh}${suffix}`)
      mediaIds.push(id)
    }

    await api(`/api/products/${product.id}?locale=en`, {
      method: 'PATCH',
      body: { images: mediaIds.map((id) => ({ image: id })) },
    })
    console.log(`✓ ${item.slug}：${mediaIds.length} 张（封面 ${item.files[0]}）`)
    updated++

    if (PRUNE && oldMediaIds.length) {
      for (const id of oldMediaIds) {
        try {
          await api(`/api/media/${id}`, { method: 'DELETE' })
        } catch (e) {
          console.warn(`  旧图 ${id} 删除失败（可能已被别处引用）：${e.message}`)
        }
      }
      console.log(`  已删除 ${oldMediaIds.length} 张旧图`)
    }
  }

  console.log(`\n完成：${updated} 个产品。`)
  if (DRY) {
    console.log('这是空跑，没有写入任何数据。')
  } else if (!PRUNE) {
    console.log('旧图仍留在媒体库（未被产品引用）。确认新图无误后可加 --prune 重跑清理，或在后台手动删。')
  }
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})
