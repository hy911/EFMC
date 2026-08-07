import TurndownService from 'turndown'

/**
 * 给 AI 代理的 Markdown 表示（内容协商）。
 *
 * **实现方式是把页面自己渲染出来的 HTML 转成 Markdown**，而不是另写一套
 * 从数据生成 Markdown 的渲染器。理由跟客户端预览那边一样：另写一套就有了
 * 第二处真相，加个案例块、改个字段就得改两处，早晚漂成两个样子 —— 代理拿到
 * 一份缺内容的 Markdown 比拿不到更糟，因为看不出来缺了什么。
 *
 * 只取 <main> 里的部分：导航栏、页脚、面包屑对代理是噪音，每页重复一遍
 * 还会把有用内容挤出上下文窗口。
 */

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
})

// 装饰性元素直接丢掉：转出来只会是一堆空行和孤零零的符号
// 'svg' 不在 turndown 类型用的 HTMLElementTagNameMap 里，但运行时是按标签名比对的
turndown.remove(['script', 'style', 'noscript', 'svg' as 'span'])

/**
 * 图片保留 alt 和地址 —— 产品和案例的配图是内容的一部分，
 * alt 又是双语维护的，对代理理解页面有用。但 next/image 的
 * src 是 /_next/image?url=…&w=…&q=… 这种优化地址，还原成原始文件地址，
 * 免得代理拿到一串没法直接用的查询参数。
 */
turndown.addRule('image', {
  filter: 'img',
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const alt = el.getAttribute('alt') ?? ''
    const raw = el.getAttribute('src') ?? ''
    if (!raw) return ''
    const inner = raw.match(/[?&]url=([^&]+)/)?.[1]
    const src = inner ? decodeURIComponent(inner) : raw
    return `![${alt}](${src})`
  },
})

/**
 * Tailwind 的 `block` 让 span 在视觉上换行（页头标题的第二行就是这么排的），
 * 但 HTML 上它仍是 inline，turndown 会把两行直接粘成
 * 「Recognitionbefore actuation.」。标题是代理最先读的一行，不能糊。
 */
turndown.addRule('cssBlockSpan', {
  filter: (node) =>
    node.nodeName === 'SPAN' && /(^|\s)block(\s|$)/.test(node.getAttribute('class') ?? ''),
  replacement: (content) => ` ${content}`,
})

/** 抽出 <main>；没有就整页转（404 之类的页面没有 main） */
function mainOf(html: string): string {
  return html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html
}

const meta = (html: string, re: RegExp) => html.match(re)?.[1]?.trim()

/** HTML 实体只需还原最常见的几个：正文里的引号、尖括号、&nbsp; */
const unescape_ = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&nbsp;/g, ' ')

/**
 * 页面 HTML → Markdown。开头带一小段 YAML front matter：
 * 标题、描述、规范地址、语种 —— 代理拿到这些才知道自己在看什么、
 * 以及该引用哪个链接。
 */
export function htmlToMarkdown(html: string, locale: string, canonical: string): string {
  const title = meta(html, /<title>([^<]*)<\/title>/i)
  const description =
    meta(html, /<meta name="description" content="([^"]*)"/i) ??
    meta(html, /<meta content="([^"]*)" name="description"/i)

  const front = [
    '---',
    title ? `title: ${JSON.stringify(unescape_(title))}` : null,
    description ? `description: ${JSON.stringify(unescape_(description))}` : null,
    `canonical: ${canonical}`,
    `language: ${locale}`,
    '---',
    '',
  ]
    .filter((l) => l !== null)
    .join('\n')

  const body = turndown.turndown(mainOf(html)).replace(/\n{3,}/g, '\n\n').trim()
  return `${front}${body}\n`
}

/**
 * 请求方是否更想要 Markdown。
 *
 * 只认**显式**写了 text/markdown 的：浏览器发的是
 * `text/html,application/xhtml+xml,…,*\/*;q=0.8`，通配符不能当成想要 Markdown，
 * 否则所有 curl（默认 Accept: *\/*）和一堆抓取工具都会拿到 Markdown。
 * 同时比 q 值，`text/markdown;q=0.1, text/html` 这种要给 HTML。
 */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false
  const q = (type: string) => {
    const hit = accept
      .split(',')
      .map((s) => s.trim())
      .find((s) => s.split(';')[0]?.trim().toLowerCase() === type)
    if (!hit) return 0
    const qv = hit.match(/;\s*q=([\d.]+)/)?.[1]
    return qv === undefined ? 1 : Number(qv)
  }
  const md = q('text/markdown')
  return md > 0 && md >= q('text/html')
}
