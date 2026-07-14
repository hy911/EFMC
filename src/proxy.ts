import createProxy from 'next-intl/middleware'

import { routing } from '@/i18n/routing'

/**
 * Next.js 16 的 proxy（原 middleware，16 起更名并运行在 Node.js runtime）。
 * 负责语言协商与前缀重定向：/ → /en，/products → /en/products 等。
 */
export default createProxy(routing)

export const config = {
  /**
   * 关键：matcher 必须排除以下路径，否则 Payload 后台会被加上语言前缀导致 404：
   * - /admin  → Payload 管理后台
   * - /api    → Payload REST/GraphQL + 询盘 API
   * - /_next  → Next.js 静态资源
   * - 带扩展名的文件（favicon、图片等）
   */
  matcher: '/((?!api|admin|_next|_vercel|.*\\..*).*)',
}
