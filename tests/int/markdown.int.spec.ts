import { describe, expect, it } from 'vitest'

import { htmlToMarkdown, prefersMarkdown } from '@/lib/markdown'

describe('给代理的 Markdown', () => {
  describe('内容协商', () => {
    it('浏览器和 curl 默认头拿 HTML', () => {
      // 通配符不能当成想要 Markdown，否则 curl（默认 */*）和一堆抓取工具
      // 会全部收到 Markdown，等于把网站的默认表示换掉了
      expect(prefersMarkdown('text/html,application/xhtml+xml,*/*;q=0.8')).toBe(false)
      expect(prefersMarkdown('*/*')).toBe(false)
      expect(prefersMarkdown(null)).toBe(false)
    })

    it('显式要 Markdown 才给', () => {
      expect(prefersMarkdown('text/markdown')).toBe(true)
      expect(prefersMarkdown('text/markdown, text/html;q=0.9')).toBe(true)
    })

    it('比 q 值：Markdown 排在 HTML 后面时给 HTML', () => {
      expect(prefersMarkdown('text/markdown;q=0.1, text/html')).toBe(false)
      expect(prefersMarkdown('text/markdown;q=0')).toBe(false)
    })
  })

  describe('HTML → Markdown', () => {
    const html = `<html><head><title>标题 &amp; 副题</title>
      <meta name="description" content="一句话描述"></head>
      <body><nav>导航噪音</nav>
      <main><h1>Recognition<span class="block font-normal">before actuation.</span></h1>
      <p>正文一段。</p>
      <img src="/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fa.webp&w=1280&q=75" alt="设备照片">
      <script>console.log('x')</script></main>
      <footer>页脚噪音</footer></body></html>`

    const md = htmlToMarkdown(html, 'zh', 'https://example.com/zh/x')

    it('带 front matter，标题实体已还原', () => {
      expect(md).toContain('title: "标题 & 副题"')
      expect(md).toContain('description: "一句话描述"')
      expect(md).toContain('canonical: https://example.com/zh/x')
      expect(md).toContain('language: zh')
    })

    it('只取 main，丢掉导航页脚和脚本', () => {
      expect(md).toContain('正文一段。')
      expect(md).not.toContain('导航噪音')
      expect(md).not.toContain('页脚噪音')
      expect(md).not.toContain('console.log')
    })

    it('视觉换行的 span 不会跟前文粘成一个词', () => {
      // Tailwind 的 block 让 span 换行显示，但 HTML 上它是 inline，
      // 不处理会得到「# Recognitionbefore actuation.」—— 标题是代理最先读的一行
      expect(md).toContain('# Recognition before actuation.')
    })

    it('图片还原成原始地址，不是 next/image 的优化查询串', () => {
      expect(md).toContain('![设备照片](/api/media/file/a.webp)')
      expect(md).not.toContain('_next/image')
    })
  })
})
