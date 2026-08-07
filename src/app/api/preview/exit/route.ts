import { draftMode } from 'next/headers.js'
import { NextResponse } from 'next/server.js'

import { safeBackPath } from '@/lib/preview'
import { SITE_URL } from '@/lib/seo'

/** 退出草稿预览，回到正式内容。链接分享出去后忘了关的话点这个 */
export async function GET(req: Request) {
  const draft = await draftMode()
  draft.disable()
  const back = safeBackPath(new URL(req.url).searchParams.get('path'), SITE_URL)
  // 基准用 SITE_URL 而不是 req.url：容器里 Next 绑 0.0.0.0，
  // 照 req.url 拼会把浏览器送去 https://0.0.0.0:3000（见 ../route.ts 的注释）
  return NextResponse.redirect(new URL(back, SITE_URL))
}
