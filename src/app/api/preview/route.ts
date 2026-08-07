import config from '@payload-config'
import { draftMode } from 'next/headers.js'
import { NextResponse } from 'next/server.js'
import { getPayload } from 'payload'

import { SITE_URL } from '@/lib/seo'

/**
 * 开启草稿预览。
 *
 * 放行两种人：
 * - 带正确 `secret` 的链接（发给外部写手/客户，他们没有后台账号）
 * - 已登录后台的用户（后台文档里的「预览」按钮就走这条，链接里不带令牌）
 *
 * `path` 必须是本站的语言前缀路由。不校验的话这就是个开放重定向：
 * 别人拿我们的域名做钓鱼跳转，同时还被打开了草稿模式。
 */
const ALLOWED = /^\/(en|zh)\/(cases|blog)\/[a-z0-9-]+$/

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const secret = searchParams.get('secret')

  if (!path || !ALLOWED.test(path)) {
    return new NextResponse('Invalid preview path', { status: 400 })
  }

  const expected = process.env.PREVIEW_SECRET
  let allowed = Boolean(expected && secret === expected)

  if (!allowed) {
    // 没带令牌就看登录态：Payload 的 auth 直接读请求里的 cookie
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    allowed = Boolean(user)
  }

  if (!allowed) {
    return new NextResponse('Not authorized to preview drafts', { status: 401 })
  }

  const draft = await draftMode()
  draft.enable()
  /**
   * 跳转基准用 SITE_URL，不能用 req.url。
   *
   * 容器里 Next 绑的是 0.0.0.0:3000，请求经 cloudflared 转进来时 req.url 是
   * `http://0.0.0.0:3000/...`，照它拼出来的 Location 会把客户的浏览器送去
   * https://0.0.0.0:3000 —— 一个连不上的地址。SITE_URL 是站点对外的规范域名
   * （hreflang / sitemap / OG 都在用它），这里必须一致。
   */
  return NextResponse.redirect(new URL(path, SITE_URL))
}
