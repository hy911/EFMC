import { draftMode } from 'next/headers.js'
import { NextResponse } from 'next/server.js'

/** 退出草稿预览，回到正式内容。链接分享出去后忘了关的话点这个 */
export async function GET(req: Request) {
  const draft = await draftMode()
  draft.disable()
  const back = new URL(req.url).searchParams.get('path')
  return NextResponse.redirect(new URL(back && back.startsWith('/') ? back : '/', req.url))
}
