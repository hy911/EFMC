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
  // 1. 生成预览（写进临时目录，别污染工作区）
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'case-preview-'))
  const json = path.join(tmp, 'case.json')
  fs.copyFileSync(CASE_JSON, json)
  execFileSync('node', ['scripts/lib/case-preview.mjs', json, ASSETS], { stdio: 'pipe' })

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
