#!/usr/bin/env node
/**
 * 打一个交给客户（或其 AI 助手）的案例改稿包。
 *
 *   node scripts/pack-case-kit.mjs <case.json 路径> [--out 目录] [--empty]
 *
 * 客户手上没有这个仓库，包里必须自带：说明、字段规范、校验器、预览工具、
 * 积木块目录、预览产物、素材。少一样他们就跑不起来 —— 手工拼漏过一次
 * （视频封面没进包，客户照步骤做会卡在「图片缺失」），所以改成脚本。
 *
 * --empty：只带工具和空 assets/，不带内容（新案例从零写时用）。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const SRC = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out')
const OUT_ARG = args.includes('--out') ? args[args.indexOf('--out') + 1] : null
const EMPTY = args.includes('--empty')

/** 交付包里客户能用的东西之外的字眼：出现即说明文档里混进了维护方专用内容 */
const LEAKS = ['scripts/', 'pnpm ', '.env.import', 'PREVIEW_SECRET', 'payload migrate', '/admin']

const COPY = [
  ['docs/CASE_STUDY_FOR_CLIENT.md', '01-先读我.md'],
  ['docs/CASE_STUDY_JSON.md', '02-字段规范.md'],
  ['scripts/lib/case-schema.mjs', 'case-schema.mjs'],
  ['scripts/lib/case-preview.mjs', 'case-preview.mjs'],
  ['scripts/lib/case-to-payload.mjs', 'case-to-payload.mjs'],
  ['scripts/lib/case-blocks.json', 'case-blocks.json'],
  ['scripts/lib/preview/case-render.mjs', 'preview/case-render.mjs'],
  ['scripts/lib/preview/preview.css', 'preview/preview.css'],
]

async function main() {
  if (!SRC && !EMPTY) {
    console.error(`用法：node scripts/pack-case-kit.mjs <case.json> [--out 目录] [--empty]`)
    process.exit(1)
  }

  const data = SRC ? JSON.parse(await fs.readFile(path.resolve(SRC), 'utf8')) : null
  const name = data?.slug ?? 'new-case'
  const out = path.resolve(OUT_ARG || path.join('photos-out', 'kit', name))
  await fs.rm(out, { recursive: true, force: true })
  await fs.mkdir(path.join(out, 'preview'), { recursive: true })
  await fs.mkdir(path.join(out, 'assets'), { recursive: true })

  for (const [from, to] of COPY) {
    await fs.copyFile(path.join(ROOT, from), path.join(out, to))
  }

  // 两份 md 是原样发给客户的，混进维护方专用内容就是让客户照着跑不通的命令
  for (const doc of ['01-先读我.md', '02-字段规范.md']) {
    const text = await fs.readFile(path.join(out, doc), 'utf8')
    const hits = LEAKS.filter((k) => text.includes(k))
    if (hits.length) {
      console.error(`✗ ${doc} 里有客户用不了的内容：${hits.join('、')}`)
      console.error(`  这两份是原样交付的，维护方专用的路径和命令要挪回 CLAUDE.md。`)
      process.exit(1)
    }
  }

  if (data) {
    // 包里 assets 就在 case.json 旁边，仓库里的相对路径带不过去
    const assetsDir = path.resolve(ROOT, data.assets ?? 'assets')
    const copy = { ...data, assets: 'assets' }
    await fs.writeFile(path.join(out, 'case.json'), JSON.stringify(copy, null, 2) + '\n')
    let n = 0
    for (const f of await fs.readdir(assetsDir)) {
      await fs.copyFile(path.join(assetsDir, f), path.join(out, 'assets', f))
      n++
    }
    console.log(`✓ ${path.relative(process.cwd(), out)}　case.json + ${n} 个素材`)
  } else {
    console.log(`✓ ${path.relative(process.cwd(), out)}　（空包，只有工具）`)
  }

  // 自己跑一遍客户的第一步，跑不通就别发出去
  const { execFileSync } = await import('node:child_process')
  if (data) {
    execFileSync('node', ['case-schema.mjs', 'case.json'], { cwd: out, stdio: 'inherit' })
    execFileSync('node', ['case-preview.mjs', 'case.json'], { cwd: out, stdio: 'pipe' })
    const html = await fs.readFile(path.join(out, 'preview-en.html'), 'utf8')
    const href = html.match(/<link rel="stylesheet" href="([^"]+)"/)?.[1]
    if (!href || href.includes('..')) {
      console.error(`✗ 预览的样式链接不对（${href}）—— 客户改个文件夹名就会白页`)
      process.exit(1)
    }
    // 预览是客户自己跑出来的，包里不放（免得他们对着旧的那版改）
    for (const f of ['preview-en.html', 'preview-zh.html']) {
      await fs.rm(path.join(out, f), { force: true })
    }
    console.log(`✓ 包内自检通过：校验 + 预览都能跑`)
  }
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`)
  process.exit(1)
})
