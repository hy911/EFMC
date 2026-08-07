/**
 * 草稿预览链接。
 *
 * 两类人要看草稿，走同一个入口 `/api/preview`：
 * - 后台运营：点文档里的「预览」按钮，带着 Payload 的登录 cookie，不需要令牌
 * - 外部写手/客户：拿一条带 `secret` 的链接，不用登录也能看
 *
 * 因此 admin.preview 生成的链接里**不能**带 secret —— 那个函数的结果会
 * 出现在后台页面里，等于把令牌印在页面上。后台走 cookie 认证就够了。
 */

/** 前台可预览的路由段（限定白名单，避免拼出站外地址） */
export type PreviewSegment = 'cases' | 'blog'

/**
 * 把用户给的回跳路径收敛成「本站的一个路径」，拿不准就回首页。
 *
 * **判「解析后的 origin」，不判输入长什么样。** 按形状匹配挡不住这类输入：
 * `new URL()` 依 WHATWG 规范会剥掉制表符和换行，所以 `"/\t/evil.com"` 能过
 * 「以单个斜杠开头」的检查，剥完却变成协议相对地址 `//evil.com` 跳去站外。
 * 同理还有 `//evil.com`、`/\evil.com`、`https://evil.com`。
 * 先按站点根解析、再比对 origin，上面这些一次全挡掉。
 *
 * 不挡的话，这就是个开放重定向：别人拿我们的域名做钓鱼跳转。
 */
export function safeBackPath(raw: string | null | undefined, siteUrl: string): string {
  if (!raw) return '/'
  try {
    const url = new URL(raw, siteUrl)
    if (url.origin !== new URL(siteUrl).origin) return '/'
    return `${url.pathname}${url.search}`
  } catch {
    return '/'
  }
}

/** 后台「预览」按钮用：不带令牌，靠登录态放行 */
export function buildPreviewURL(
  segment: PreviewSegment,
  slug: string | undefined,
  locale: string | undefined,
): string | null {
  if (!slug) return null
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const lang = locale === 'zh' ? 'zh' : 'en'
  return `${base}/api/preview?path=${encodeURIComponent(`/${lang}/${segment}/${slug}`)}`
}

/** 发给外部的链接用：带令牌，对方不用登录。只在服务端调用 */
export function buildSharePreviewURL(
  segment: PreviewSegment,
  slug: string,
  locale: string,
  secret: string,
): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const path = encodeURIComponent(`/${locale}/${segment}/${slug}`)
  return `${base}/api/preview?path=${path}&secret=${encodeURIComponent(secret)}`
}
