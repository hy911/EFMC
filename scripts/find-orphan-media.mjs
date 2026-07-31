#!/usr/bin/env node
/**
 * 找出媒体库里没有任何文档引用的图片（孤儿），可选择删除。
 *
 * 用法：
 *   node scripts/find-orphan-media.mjs                # 只列清单，什么都不删
 *   node scripts/find-orphan-media.mjs --delete       # 确认清单后再加这个才真删
 *   node scripts/find-orphan-media.mjs --include-recent  # 连最近 24 小时上传的一起算
 *
 * 为什么会有孤儿：导入器每次 --replace 都重新上传全部图片，上一轮的那批
 * 就此没人引用。反复导几轮，媒体库里四分之三是废图，运营选图时根本认不出
 * 哪张是在用的。
 *
 * 怎么判断「被引用」：把每个 collection / global 的文档按 depth=1 取回来，
 * 关联字段会被展开成完整文档；凡是带 filename + mimeType 的对象就是一张
 * 媒体，收集它的 id。这样不用知道哪些字段是上传字段，嵌在 blocks、数组、
 * 富文本里的引用照样能扫到。
 *
 * 两个已知边界，别忽略：
 * - 只扫「当前已发布版 + 当前草稿」。**只被历史版本引用**的图会被判成孤儿。
 *   删了不影响前台，但翻旧版本时那张图会裂开。
 * - 默认跳过最近 24 小时上传的图 —— 运营刚传完还没插进文档的图不该被删。
 */
import { api, login, requireEnv } from './lib/payload-api.mjs'

const args = process.argv.slice(2)
const DO_DELETE = args.includes('--delete')
const INCLUDE_RECENT = args.includes('--include-recent')

/**
 * 要扫的集合。新增内容 collection 时**必须加进这里**，
 * 漏了的话它引用的图会被当成孤儿删掉。
 * drafts: true 的集合要多扫一遍草稿（草稿在版本表里，正常查询看不到）。
 */
const COLLECTIONS = [
  { slug: 'products' },
  { slug: 'product-categories' },
  { slug: 'application-scenarios' },
  { slug: 'pages' },
  { slug: 'case-studies', drafts: true },
  { slug: 'posts' },
  { slug: 'certificates' },
]
const GLOBALS = ['site-settings']

/** 递归找出对象里所有「看起来是媒体文档」的 id */
function collectMediaIds(node, into) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const v of node) collectMediaIds(v, into)
    return
  }
  // depth=1 展开后的媒体文档长这样：有 id、filename、mimeType
  if (typeof node.id === 'number' && typeof node.filename === 'string' && node.mimeType) {
    into.add(node.id)
  }
  for (const v of Object.values(node)) collectMediaIds(v, into)
}

/** 翻页取完一个集合的全部文档 */
async function fetchAll(path) {
  const out = []
  for (let page = 1; ; page++) {
    const d = await api(`${path}${path.includes('?') ? '&' : '?'}limit=100&page=${page}`)
    out.push(...(d.docs ?? []))
    if (!d.hasNextPage) break
  }
  return out
}

async function main() {
  const base = requireEnv()
  console.log(`目标站点：${base}`)
  console.log(DO_DELETE ? '模式：删除\n' : '模式：只看不删（要删加 --delete）\n')
  await login()

  // 1. 媒体全集
  const media = await fetchAll('/api/media?depth=0')
  const byId = new Map(media.map((m) => [m.id, m]))
  console.log(`媒体库共 ${media.length} 张`)

  // 2. 扫引用
  const used = new Set()
  for (const { slug, drafts } of COLLECTIONS) {
    // 两种语言都要扫：localized 的上传字段各语种可能指向不同的图
    for (const locale of ['en', 'zh']) {
      collectMediaIds(await fetchAll(`/api/${slug}?depth=1&locale=${locale}`), used)
      if (drafts) {
        collectMediaIds(await fetchAll(`/api/${slug}?depth=1&draft=true&locale=${locale}`), used)
      }
    }
    process.stdout.write(`  扫过 ${slug}　已引用 ${used.size} 张\n`)
  }
  for (const slug of GLOBALS) {
    for (const locale of ['en', 'zh']) {
      collectMediaIds(await api(`/api/globals/${slug}?depth=1&locale=${locale}`), used)
    }
    process.stdout.write(`  扫过 ${slug}（global）　已引用 ${used.size} 张\n`)
  }

  // 3. 差集
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  const orphans = []
  const skippedRecent = []
  for (const m of media) {
    if (used.has(m.id)) continue
    if (!INCLUDE_RECENT && new Date(m.createdAt).getTime() > cutoff) {
      skippedRecent.push(m)
      continue
    }
    orphans.push(m)
  }

  console.log(`\n被引用：${used.size} 张`)
  if (skippedRecent.length) {
    console.log(`最近 24 小时上传、暂不处理：${skippedRecent.length} 张（--include-recent 一并算）`)
  }
  console.log(`没人引用：${orphans.length} 张\n`)

  if (!orphans.length) {
    console.log('媒体库是干净的，无事可做。')
    return
  }

  // 按去掉 -N 后缀的基名分组展示：同一张图被重复上传了几次一眼能看出来
  const groups = new Map()
  for (const m of orphans) {
    const base = m.filename.replace(/-\d+(\.[a-z0-9]+)$/i, '$1')
    if (!groups.has(base)) groups.set(base, [])
    groups.get(base).push(m)
  }
  for (const [name, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${name}　×${list.length}　（id ${list.map((m) => m.id).join(', ')}）`)
  }

  if (!DO_DELETE) {
    console.log(`\n以上 ${orphans.length} 张没有任何文档引用。`)
    console.log('核对无误后加 --delete 重跑才会真的删除。')
    return
  }

  console.log(`\n开始删除 ${orphans.length} 张……`)
  let ok = 0
  const failed = []
  for (const m of orphans) {
    try {
      await api(`/api/media/${m.id}`, { method: 'DELETE' })
      ok++
    } catch (e) {
      // 删不掉通常是还有外键指向它（说明扫描漏了某处引用），记下来别静默跳过
      failed.push(`${m.id} ${m.filename}：${e.message}`)
    }
  }
  console.log(`✓ 已删除 ${ok} 张`)
  if (failed.length) {
    console.error(`\n✗ ${failed.length} 张删除失败（多半是还有引用，说明扫描漏了地方）：`)
    failed.forEach((f) => console.error('  · ' + f))
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})
