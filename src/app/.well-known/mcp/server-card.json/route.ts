import { NextResponse } from 'next/server'

import { MCP_SERVER_INFO } from '@/lib/mcp/server'
import { SITE_URL } from '@/lib/seo'

/**
 * MCP Server Card（SEP-1649）：让代理不用先连上来握手，就知道这个域名有个
 * MCP server、地址在哪、支持什么。
 *
 * serverInfo 从 @/lib/mcp/server 导入，不在这里另写一份 —— 卡片上的名字版本
 * 跟 initialize 实际返回的对不上，代理侧的缓存和版本判断就全乱了。
 * tests/int/mcp.int.spec.ts 里有断言比对这两处。
 *
 * capabilities 如实只报 tools：这个 server 没有 resources 也没有 prompts，
 * 报了代理会去请求，然后拿到空手。
 *
 * 路径带点，proxy 的 matcher（`.*\..*`）会自动排除，不会被加语言前缀。
 */
export const dynamic = 'force-static'

export function GET() {
  return NextResponse.json(
    {
      serverInfo: MCP_SERVER_INFO,
      description:
        'Read-only MCP server for Donglin Controls (天津东林众控): industrial control cabinets and automation system integration. Search products, read delivered case studies, get contact details.',
      endpoint: `${SITE_URL}/mcp`,
      transport: 'streamable-http',
      capabilities: {
        tools: { listChanged: true },
      },
      documentation: `${SITE_URL}/api/docs`,
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
