import type { NextRequest } from 'next/server'

import { htmlToMarkdown } from '@/lib/markdown'
import { SITE_URL } from '@/lib/seo'

/**
 * 内容协商的 Markdown 出口。
 *
 * 不直接对外访问 —— src/proxy.ts 在 `Accept: text/markdown` 时把
 * /en/products/foo 内部改写到 /md/en/products/foo，浏览器看到的地址不变。
 *
 * 这里回头请求一次自己的页面（明确要 text/html，不会绕回本路由造成死循环），
 * 拿到渲染好的 HTML 再转 Markdown。走 127.0.0.1 而不是公开域名：
 * 容器里发到公开域名会绕一圈 Cloudflare 再回来，慢且多一层可能出错的环节。
 */
export const dynamic = 'force-dynamic'

const ORIGIN = `http://127.0.0.1:${process.env.PORT ?? 3000}`

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const pathname = `/${path.join('/')}`
  const locale = path[0] ?? 'en'

  const upstream = await fetch(`${ORIGIN}${pathname}${req.nextUrl.search}`, {
    headers: { Accept: 'text/html' },
  })

  // 上游 404/500 原样透传：给代理一份「一切正常」的 Markdown 骨架比报错更误导
  if (!upstream.ok) {
    return new Response(`# ${upstream.status}\n\n${pathname} 不可用。\n`, {
      status: upstream.status,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8', Vary: 'Accept' },
    })
  }

  const md = htmlToMarkdown(await upstream.text(), locale, `${SITE_URL}${pathname}`)

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      /*
       * 同一个地址按 Accept 给两种表示，规范做法是两边都发 Vary: Accept。
       * 但这里只有 Markdown 这侧发得出去：
       *
       * - HTML 那侧发不出。next.config 的 headers() 确实生效（拿别的 header
       *   探过），可 Next 会用自己那串 Vary（rsc / next-router-* / Accept-Encoding）
       *   把我们设的整个覆盖掉，proxy 里给 NextResponse 设也一样被覆盖。
       * - 就算发得出，Cloudflare 免费版也只认 Vary: Accept-Encoding，其余的忽略 ——
       *   缓存里存下哪个表示，后面所有人就都拿到那个。
       *
       * 所以真正堵住「浏览器收到一堆 Markdown 源码」的是下面这条 no-store：
       * Markdown 永远不进任何缓存，同一 URL 的缓存条目只可能是 HTML。
       * 代价是代理每次都要回源，以及共享缓存后面的代理**可能拿到 HTML** ——
       * 反方向的错，代理自己能解析 HTML，不致命。
       */
      Vary: 'Accept',
      'Cache-Control': 'private, no-store',
    },
  })
}
