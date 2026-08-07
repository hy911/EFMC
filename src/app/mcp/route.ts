import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

import { buildMcpServer } from '@/lib/mcp/server'

/**
 * MCP 端点（Streamable HTTP）。代理侧填 https://efmc-automation.com/mcp。
 *
 * **无会话模式**（不传 sessionIdGenerator）：每个请求自建 server 与 transport，
 * 用完即弃。有会话的话就得在进程里存会话表 —— 单实例还行，将来多开一个容器
 * 就会出现「请求落到没有这个会话的实例上」，而这几个工具本来就无状态，
 * 没有会话可言。
 *
 * 用 WebStandard 版的 transport 而不是 Node 版：Next 的 route handler 收发的是
 * Web 标准的 Request/Response，Node 版要的是 IncomingMessage/ServerResponse，
 * 中间得架一层桥。
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request): Promise<Response> {
  const server = buildMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    // 无会话模式；JSON 响应而不是 SSE 流，这几个工具都是一问一答
    enableJsonResponse: true,
  })
  await server.connect(transport)
  try {
    return await transport.handleRequest(req)
  } finally {
    // 请求结束就拆掉，别把 server 留在内存里等 GC
    await server.close()
  }
}

/**
 * GET / DELETE 一律 405。
 *
 * transport 收到带 `Accept: text/event-stream` 的 GET 会开一条服务端推送流，
 * 但无会话模式下压根没有东西可推 —— 那条连接会一直挂着白占资源，
 * 爬虫扫到这个地址就够呛（生产机是 2 核 4GB）。DELETE 是用来结束会话的，
 * 同样没有会话可结束。MCP 规范允许不提供这两种时直接回 405。
 */
const notAllowed = () =>
  new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed. This is a stateless MCP endpoint — use POST.',
      },
      id: null,
    }),
    { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } },
  )

export const GET = notAllowed
export const DELETE = notAllowed
