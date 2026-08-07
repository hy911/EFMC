import { NextResponse } from 'next/server'

import { PUBLIC_APIS } from '@/lib/api-catalog'
import { SITE_URL } from '@/lib/seo'

/**
 * API 目录（RFC 9727）：把站点对外开放的接口列成一份机器可读的清单，
 * 放在约定位置 /.well-known/api-catalog，让 AI 代理和爬虫能自动发现。
 *
 * 格式是 RFC 9264 的 linkset（application/linkset+json）：一个 anchor
 * 配若干链接关系 —— service-desc 指 OpenAPI 规范，service-doc 指人看的文档，
 * status 指健康检查。
 *
 * 注意两件事，改动时别踩：
 * - 这条路径**不能被 proxy 加语言前缀**。src/proxy.ts 的 matcher 里
 *   `.*\..*` 那段（带点的路径）正好把 `.well-known/...` 排除掉了，是碰巧生效
 *   的，不是专门写的 —— 有人收紧 matcher 时要顺手确认这里还通
 * - robots.txt 要放行 /api/openapi.json、/api/docs、/api/health，
 *   否则目录里指出去的三个地址全被 Disallow: /api/ 挡着，等于列了张打不开的清单
 */
export const dynamic = 'force-static'

export function GET() {
  const linkset = PUBLIC_APIS.map((api) => ({
    anchor: `${SITE_URL}${api.anchor}`,
    'service-desc': [{ href: `${SITE_URL}${api.desc.href}`, type: api.desc.type }],
    'service-doc': [{ href: `${SITE_URL}/api/docs`, type: 'text/html' }],
    status: [{ href: `${SITE_URL}/api/health`, type: 'application/json' }],
  }))

  return NextResponse.json(
    { linkset },
    {
      headers: {
        'Content-Type': 'application/linkset+json',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  )
}
