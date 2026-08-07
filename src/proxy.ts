import createProxy from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'

import { routing } from '@/i18n/routing'
import { prefersMarkdown } from '@/lib/markdown'

/**
 * Next.js 16 的 proxy（原 middleware，16 起更名并运行在 Node.js runtime）。
 * 两件事：
 * 1. 语言协商与前缀重定向：/ → /en，/products → /en/products
 * 2. 内容协商：请求方明确要 text/markdown 时，内部改写到 /md/… 出 Markdown
 */

const intl = createProxy(routing)

/** 已经带语言前缀的页面路径 —— 只有这种才谈得上给 Markdown */
const LOCALIZED = new RegExp(`^/(${routing.locales.join('|')})(/.*)?$`)

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  /*
   * 内容协商在语言协商**之后**才有意义：没有语言前缀的地址先让 next-intl
   * 重定向，代理跟随一次重定向就落到带前缀的地址上，再走这里。
   * 在这之前就改写的话，还得在 Markdown 那侧把语言协商重做一遍。
   */
  if (LOCALIZED.test(pathname) && prefersMarkdown(req.headers.get('accept'))) {
    const url = req.nextUrl.clone()
    url.pathname = `/md${pathname}`
    // clone 出来的 URL 与请求同源，不会踩到 standalone 下 req.url 是
    // http://0.0.0.0:3000 的坑
    return NextResponse.rewrite(url)
  }

  /*
   * 这里**不要**再试着给 HTML 响应加 Vary: Accept —— 试过两处（proxy 的
   * NextResponse、next.config 的 headers()），Next 都会用自己那串 Vary 覆盖掉。
   * 防止浏览器拿到 Markdown 靠的是 Markdown 那侧的 no-store，
   * 原因写在 src/app/md/[...path]/route.ts。
   */
  return intl(req)
}

export const config = {
  /**
   * 关键：matcher 必须排除以下路径，否则 Payload 后台会被加上语言前缀导致 404：
   * - /admin  → Payload 管理后台
   * - /api    → Payload REST/GraphQL + 询盘 API
   * - /md     → 内容协商的 Markdown 出口（本身不带语言前缀）
   * - /_next  → Next.js 静态资源
   * - 带扩展名的文件（favicon、图片等）
   *
   * 注意 `.*\..*` 那段顺带把 /.well-known/… 也排除了 —— API 目录
   * （RFC 9727）靠这个才不会被加语言前缀。收紧这个 matcher 时要确认它还通。
   */
  matcher: '/((?!api|admin|md|_next|_vercel|.*\\..*).*)',
}
