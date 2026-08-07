import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

/**
 * 健康检查 —— API 目录（RFC 9727）的 status 链接指向这里。
 *
 * 真去连一次库：这是个 Payload + Next 同进程的单体，进程活着但连不上库时
 * 页面全是 500，只回一句 ok 的探针看不出来。查询挑最便宜的（limit 1、
 * depth 0、只要计数），被频繁探测也不至于压到数据库。
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'products' })
    return NextResponse.json(
      { status: 'ok', time: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    // 不回显错误内容：连接串和内部路径会顺着异常消息漏出去
    return NextResponse.json(
      { status: 'error', time: new Date().toISOString() },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
