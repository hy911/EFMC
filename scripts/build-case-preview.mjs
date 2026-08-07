#!/usr/bin/env node
/**
 * 生成客户端预览用的两件生成物（跟 case-blocks.json 一样，是构建产物、要提交）：
 *
 *   scripts/lib/preview/case-render.mjs   —— 真实渲染器打成的零依赖 SSR bundle
 *   scripts/lib/preview/preview.css       —— 真实的 Tailwind 产物 + 字体
 *
 * 用法：
 *   pnpm exec tsx scripts/build-case-preview.mjs
 *   pnpm exec tsx scripts/build-case-preview.mjs --check   # CI：过期就非零退出
 *
 * **为什么是打包而不是另写一个渲染器：** 客户要看到的是「线上到底长什么样」。
 * 手抄一份 caseRenderers.tsx 意味着从此每改一个案例块都要改两处，早晚漂成两个
 * 样子，而客户照着一个已经不准的预览改稿比没有预览更糟。所以这里直接把线上
 * 那份组件编译进去 —— 改了组件重新生成即可，不存在第二套实现。
 *
 * 两个替身（shim）：
 * - next/image → 普通 <img>：预览是 file:// 打开的静态页，没有 Next 的图片优化服务
 * - 图片 src 直接用 assets/ 下的原始文件名，不走 /api/media/file/
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'scripts', 'lib', 'preview')
const CHECK = process.argv.includes('--check')

const p = (...s) => path.join(ROOT, ...s)
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '')
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12)

fs.mkdirSync(OUT, { recursive: true })

/* ------------------------------------------------------ 1. JS：SSR bundle */

/**
 * 入口：把页头与章节渲染成 HTML 字符串。
 * 写成临时文件而不是常驻源码，是因为它只在打包时存在，
 * 留在 src/ 里会被 tsc / eslint 扫到，还得为它配一堆例外。
 */
const ENTRY = `
import { renderToStaticMarkup } from 'react-dom/server'
import { RenderCaseSections } from '@/blocks/caseRenderers'
import { CaseHero } from '@/components/case/CaseHero'

/** doc 是 Payload 文档形状（已按语种取好值），由 case-to-payload.mjs 适配得到 */
export function renderCase(doc, facts) {
  return renderToStaticMarkup(
    <main className="bg-white">
      <CaseHero cs={doc} industryName={doc.industryName} facts={facts} />
      {(doc.sections?.length ?? 0) > 0 && <RenderCaseSections blocks={doc.sections} />}
    </main>,
  )
}
`

/** next/image 的替身：预览是静态页，直接吐 <img> */
const IMG_SHIM = `
import { createElement } from 'react'
export default function Image({ src, alt, fill, className, style, priority, quality, sizes, width, height, ...rest }) {
  const s = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : { maxWidth: '100%', height: 'auto', ...style }
  return createElement('img', { src, alt: alt ?? '', className, style: s, loading: 'lazy', ...rest })
}
`

const tmp = path.join(OUT, '.build')
fs.mkdirSync(tmp, { recursive: true })
fs.writeFileSync(path.join(tmp, 'entry.jsx'), ENTRY)
fs.writeFileSync(path.join(tmp, 'next-image-shim.js'), IMG_SHIM)

const { build } = await import('esbuild')
const jsOut = path.join(OUT, 'case-render.mjs')
const jsTmp = path.join(tmp, 'case-render.mjs')

try {
  await build({
  entryPoints: [path.join(tmp, 'entry.jsx')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  jsx: 'automatic',
  minify: true,
  // next/image 换成普通 <img>；@ 别名跟 tsconfig 一致
  alias: { 'next/image': path.join(tmp, 'next-image-shim.js') },
  absWorkingDir: ROOT,
  outfile: jsTmp,
  logLevel: 'warning',
  // 用项目自己的 tsconfig 解析 @/* 别名，别在这里另写一份映射
  tsconfig: p('tsconfig.json'),
  // 取 React 的生产版：dev 版体积大三倍，还会往控制台喷开发警告
  define: { 'process.env.NODE_ENV': '"production"' },
  // 打进来的 CJS 依赖内部会 require('util')，ESM 输出里没有 require，得补一个
  banner: {
    js: "import { createRequire as __cr } from 'node:module';const require = __cr(import.meta.url);",
  },
  })
} catch (e) {
  for (const err of e.errors ?? []) {
    const l = err.location
    console.error(`✗ ${err.text}${l ? `
    ${l.file}:${l.line}:${l.column}  ${l.lineText.trim()}` : ''}`)
  }
  process.exit(1)
}

const BANNER = `/* 由 scripts/build-case-preview.mjs 从 src/blocks/caseRenderers.tsx 与
   src/components/case/CaseHero.tsx 打包生成 —— 不要手改，改源码后重新生成。 */\n`
const jsNew = BANNER + read(jsTmp)

/* -------------------------------------------------- 2. CSS：真实 Tailwind */

/**
 * 用项目自己的 @tailwindcss/postcss 处理 globals.css，扫描 src/ 收集用到的工具类。
 * 不能手写一份 CSS —— 那又是一套会漂的东西。
 */
const { default: postcss } = await import('postcss')
const { default: tailwind } = await import('@tailwindcss/postcss')

const globals = p('src', 'app', '(frontend)', 'globals.css')

/**
 * 扫描范围**必须**锁死在 src/。
 * 默认 Tailwind 从项目根自动探测，会把本工具生成的 preview-*.html 也扫进去 ——
 * 那些文件里全是 Tailwind 类名，于是产物随「上次生成了哪些预览」而变，
 * --check 每次结果都不一样。source(none) 关掉自动探测，只认下面这一条 @source。
 */
const SRC_POSIX = p('src').split(path.sep).join('/')
const cssIn = read(globals).replace(
  /@import\s+['"]tailwindcss['"]\s*;/,
  `@import 'tailwindcss' source(none);\n@source '${SRC_POSIX}';`,
)
const processed = await postcss([tailwind({ base: ROOT })]).process(cssIn, { from: globals })

/* 字体：@fontsource 的 woff2 拷进来，用 data URI 内联，客户拿到的就是一个 css 文件 */
function fontFace(pkg, family, weights) {
  const dir = p('node_modules', pkg, 'files')
  if (!fs.existsSync(dir)) return ''
  const files = fs.readdirSync(dir)
  return weights
    .map((w) => {
      // @fontsource 的文件名形如 archivo-latin-700-normal.woff2
      const hit = files.find((f) => f.includes(`-latin-${w}-normal.woff2`))
      if (!hit) return ''
      const b64 = fs.readFileSync(path.join(dir, hit)).toString('base64')
      return `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2')}`
    })
    .join('\n')
}

const fonts = [
  fontFace('@fontsource/archivo', 'Archivo', [400, 700, 800]),
  fontFace('@fontsource/ibm-plex-sans', 'IBM Plex Sans', [400, 600, 700]),
].join('\n')

const cssNew =
  `/* 由 scripts/build-case-preview.mjs 生成：项目真实的 Tailwind 产物 + 内联字体。
   不要手改，改 globals.css 或组件后重新生成。 */\n` +
  fonts +
  '\n' +
  processed.css

/* ------------------------------------------------------------- 3. 写 / 查 */

const targets = [
  [jsOut, jsNew, 'case-render.mjs'],
  [path.join(OUT, 'preview.css'), cssNew, 'preview.css'],
]

fs.rmSync(tmp, { recursive: true, force: true })

if (CHECK) {
  const stale = targets.filter(([f, next]) => sha(read(f)) !== sha(next))
  if (stale.length) {
    console.error(
      `✗ 预览产物已过期：${stale.map(([, , n]) => n).join('、')}\n` +
        `  改了案例块、页头或 globals.css 之后要重新生成并提交：\n` +
        `    pnpm exec tsx scripts/build-case-preview.mjs\n` +
        `  不重新生成的话，客户看到的预览跟线上不一样 —— 他们会照着错的效果改稿。`,
    )
    process.exit(1)
  }
  console.log('✓ 预览产物是最新的')
  process.exit(0)
}

for (const [f, next, name] of targets) {
  fs.writeFileSync(f, next)
  console.log(`✓ ${name}　${(Buffer.byteLength(next) / 1024).toFixed(0)} KB`)
}
console.log(`\n生成在 ${path.relative(ROOT, OUT)}/，随交付包发给客户。`)
