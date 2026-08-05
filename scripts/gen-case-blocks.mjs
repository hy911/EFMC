#!/usr/bin/env node
/**
 * 从 src/blocks/case.ts 生成机器可读的积木块目录 scripts/lib/case-blocks.json。
 *
 * 为什么要它：
 * 客户现在用 AI（Codex 之类）生成案例内容，AI 拿到的"能写哪些字段、每个字段
 * 能填哪些值"如果是手写文档，就一定会跟代码漂移 —— 漂了就产出缺字段/用了不存在
 * 的版式的 JSON，然后是一轮往返返工。所以字段与选项清单一律**从代码生成**。
 *
 * 谁在消费这个文件：
 * - scripts/lib/case-schema.mjs —— 校验器不再手抄选项清单，直接查这里
 * - docs/CASE_STUDY_JSON.md —— 让外部写手/AI 以它为字段权威
 *
 * 用法：
 *   pnpm exec tsx scripts/gen-case-blocks.mjs            # 重新生成
 *   pnpm exec tsx scripts/gen-case-blocks.mjs --check    # 只检查是否过期（CI 用）
 *
 * 注意：要用 tsx 跑（要 import TypeScript）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { caseBlocks } from '../src/blocks/case.ts'

const OUT = path.resolve('scripts/lib/case-blocks.json')

/** select 的 options 可能是 string[] 也可能是 { label, value }[] */
const valuesOf = (options) =>
  (options ?? []).map((o) => (typeof o === 'string' ? o : o.value)).filter(Boolean)

/**
 * 把一层 fields 拍平成 { 字段名: 描述 }。
 * row / collapsible 只是后台的排版容器，本身没有名字，直接把子字段提上来。
 */
function flatten(fields) {
  const out = {}
  for (const f of fields ?? []) {
    if (!f.name) {
      Object.assign(out, flatten(f.fields))
      continue
    }
    const entry = { type: f.type }
    if (f.required) entry.required = true
    if (f.localized) entry.localized = true
    if (f.type === 'select') entry.options = valuesOf(f.options)
    if (f.relationTo) entry.relationTo = f.relationTo
    // 数组和分组把子字段一并带上，JSON 里对应的就是嵌套结构
    if (f.fields?.length) entry.fields = flatten(f.fields)
    if (f.maxRows) entry.maxRows = f.maxRows
    out[f.name] = entry
  }
  return out
}

const catalog = {
  _generated: '由 scripts/gen-case-blocks.mjs 从 src/blocks/case.ts 生成，不要手改',
  _source: 'src/blocks/case.ts',
  blocks: Object.fromEntries(
    caseBlocks.map((b) => [b.slug, { label: b.labels?.singular?.en ?? b.slug, fields: flatten(b.fields) }]),
  ),
}

const text = JSON.stringify(catalog, null, 2) + '\n'

if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''
  if (current !== text) {
    console.error('scripts/lib/case-blocks.json 与 src/blocks/case.ts 不一致。')
    console.error('跑一下重新生成，并把结果一起提交：')
    console.error('  pnpm exec tsx scripts/gen-case-blocks.mjs')
    process.exit(1)
  }
  console.log('✓ case-blocks.json 是最新的')
} else {
  fs.writeFileSync(OUT, text)
  const n = Object.keys(catalog.blocks).length
  const selects = Object.values(catalog.blocks).flatMap((b) => collectSelects(b.fields))
  console.log(`✓ 已写入 ${path.relative(process.cwd(), OUT)}：${n} 种积木块，${selects.length} 个选项字段`)
  for (const [name, opts] of selects) console.log(`    ${name}: ${opts.join(' / ')}`)
}

/** 把所有 select 字段（含嵌套）收集出来，生成时打印一遍便于人工核对 */
function collectSelects(fields, trail = []) {
  const out = []
  for (const [name, f] of Object.entries(fields)) {
    if (f.type === 'select') out.push([[...trail, name].join('.'), f.options])
    if (f.fields) out.push(...collectSelects(f.fields, [...trail, name]))
  }
  return out
}
