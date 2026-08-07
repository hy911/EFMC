import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { expect, test, type Page } from '@playwright/test'

/**
 * 客户端预览必须跟线上长得一样。
 *
 * `scripts/lib/preview/case-render.mjs` 是从 caseRenderers.tsx + CaseHero.tsx
 * 打包出来的，理论上不可能漂 —— 但 shim（next/image → <img>）、CSS 产物、
 * 媒体对象适配这三处是预览独有的，它们出错就会让客户看到一个跟线上不一样的页面，
 * 照着改稿全是白工。这个测试把两边的结构和关键计算样式逐项对齐。
 *
 * 前提：库里有 seed 的案例（e2e 本来就依赖这一点）。
 */

const SLUG = 'ai-vision-precision-spraying-dairy'
const CASE_JSON = 'scripts/data/cases/ai-vision-precision-spraying.json'
const ASSETS = `photos-out/cases/${SLUG}/assets`

/** 抽出案例内容区的结构与关键计算样式，两边用同一段代码取，避免口径不同 */
async function fingerprint(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector('main')!
    const cs = getComputedStyle
    return {
      sections: root.querySelectorAll('section').length,
      images: root.querySelectorAll('img').length,
      videos: root.querySelectorAll('video').length,
      // 底色序列：章节编号与深浅交替的规则全体现在这里
      backgrounds: [...root.querySelectorAll(':scope > section')].map((s) => cs(s).backgroundColor),
      headings: [...root.querySelectorAll('h1,h2')].map((h) => ({
        tag: h.tagName,
        text: (h as HTMLElement).innerText.replace(/\s+/g, ' ').trim(),
        font: cs(h).fontFamily.split(',')[0],
        size: cs(h).fontSize,
        weight: cs(h).fontWeight,
        letterSpacing: cs(h).letterSpacing,
        lineHeight: cs(h).lineHeight,
        color: cs(h).color,
      })),
    }
  })
}

test('客户端预览与线上案例页逐项一致', async ({ page }) => {
  // 1. 按**交付包的目录布局**生成预览：工具、preview/ 产物、case.json 全在一起，
  //    从那个目录里跑 —— 客户就是这么用的，仓库里的路径布局不能代表它。
  //
  //    目录名**故意带中文**：真实事故是 case-preview.mjs 用 `new URL(...).pathname`
  //    取自身路径，非 ASCII 在 URL 里是百分号编码的、pathname 不解码，于是算出来的
  //    CSS 相对路径绕出去再绕回来，生成一个加载不到的 href，页面变成没有任何样式的
  //    裸 HTML。客户用中文目录名是常态，这里必须覆盖。
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), '案例预览-'))
  for (const f of [
    'case-preview.mjs',
    'case-schema.mjs',
    'case-to-payload.mjs',
    'case-blocks.json',
  ])
    fs.copyFileSync(path.join('scripts/lib', f), path.join(tmp, f))
  fs.mkdirSync(path.join(tmp, 'preview'))
  for (const f of ['case-render.mjs', 'preview.css'])
    fs.copyFileSync(path.join('scripts/lib/preview', f), path.join(tmp, 'preview', f))

  const json = path.join(tmp, 'case.json')
  fs.copyFileSync(CASE_JSON, json)
  execFileSync('node', ['case-preview.mjs', 'case.json', path.resolve(ASSETS)], {
    cwd: tmp,
    stdio: 'pipe',
  })

  /*
   * 样式链接必须是干净的同目录相对路径。
   *
   * 出过一次事：用 `new URL(...).pathname` 取工具自身路径，非 ASCII 目录名在 URL 里
   * 是百分号编码的、pathname 不解码，算出来的 href 变成 `../%E5%8F%91.../preview/preview.css`
   * —— 绕出去再绕回来。原地打开还能解析（浏览器按同样编码的 html URL 还原），
   * 但客户**把文件夹改个名或复制走**，链接立刻失效，页面变成没有样式的裸 HTML。
   * 所以这里断言 href 里不能出现 `..`，而不是只看渲染结果。
   */
  const cssHref = fs
    .readFileSync(path.join(tmp, 'preview-en.html'), 'utf8')
    .match(/<link rel="stylesheet" href="([^"]+)"/)?.[1]
  expect(cssHref, '没找到样式链接').toBeTruthy()
  expect(cssHref, `样式链接绕了路径，文件夹一改名就失效：${cssHref}`).not.toContain('..')

  // 2. 线上（dev server 渲染的真实页面）
  await page.goto(`http://localhost:3000/en/cases/${SLUG}`)
  await page.waitForLoadState('networkidle')
  const live = await fingerprint(page)

  // 3. 预览（静态 HTML）
  await page.goto(`file://${path.join(tmp, 'preview-en.html').replace(/\\/g, '/')}`)
  await page.waitForLoadState('networkidle')
  const preview = await fingerprint(page)

  expect(preview.sections, '章节数量对不上').toBe(live.sections)
  expect(preview.images, '图片数量对不上').toBe(live.images)
  expect(preview.videos, '视频数量对不上').toBe(live.videos)
  expect(preview.backgrounds, '底色交替序列对不上（章节编号规则漂了）').toEqual(live.backgrounds)
  expect(preview.headings, '标题的排版参数对不上（字体/字号/字距/行高/颜色）').toEqual(live.headings)

  fs.rmSync(tmp, { recursive: true, force: true })
})
