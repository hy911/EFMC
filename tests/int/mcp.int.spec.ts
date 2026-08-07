import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { GET as cardGET } from '@/app/.well-known/mcp/server-card.json/route'
import { POST } from '@/app/mcp/route'
import config from '@/payload.config'

/** 往 MCP 端点发一次 JSON-RPC */
async function rpc(method: string, params: unknown = {}) {
  const res = await POST(
    new Request('http://localhost/mcp', {
      method: 'POST',
      // MCP 的 Streamable HTTP 要求客户端两种都接受，只写 application/json 会被 406
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
  )
  return res.json()
}

const callTool = async (name: string, args: Record<string, unknown> = {}) => {
  const j = await rpc('tools/call', { name, arguments: args })
  return (j.result?.content?.[0]?.text ?? '') as string
}

describe('MCP server', () => {
  let payload: Payload
  let draftId: number | null = null
  const DRAFT_SLUG = 'mcp-test-unpublished-case'

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    if (draftId) await payload.delete({ collection: 'case-studies', id: draftId })
  })

  it('server card 与 initialize 报的是同一个身份和能力', async () => {
    // 卡片是代理在连上来之前读的。上面写的名字、版本、能力跟握手实际拿到的
    // 对不上，代理侧的缓存和版本判断就全乱了 —— 而两处各写一份必然漂。
    const card = await (await cardGET()).json()
    const { result } = await rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '1' },
    })

    expect(card.serverInfo).toEqual(result.serverInfo)
    expect(card.endpoint).toMatch(/\/mcp$/)
    // 没有 resources / prompts 就别报，报了代理会去请求然后拿到空手
    expect(Object.keys(card.capabilities)).toEqual(Object.keys(result.capabilities))
  })

  it('只暴露只读工具', async () => {
    const { result } = await rpc('tools/list')
    const names = result.tools.map((t: { name: string }) => t.name).sort()

    expect(names).toEqual([
      'get_case_study',
      'get_contact',
      'get_product',
      'list_case_studies',
      'search_products',
    ])

    /*
     * 别加提交询盘的工具。站点的写入入口只有 /api/inquiries 一条，
     * 靠蜜罐字段加 Turnstile 挡机器人；MCP 这边没有人机校验可做，
     * 开一个匿名可调的写接口就是把那套防护整个绕过去。
     */
    for (const t of result.tools) {
      expect(t.name, `${t.name} 看着像写操作`).not.toMatch(/submit|create|send|inquir/i)
    }
  })

  it('搜索产品能按关键词命中并给出可点的链接', async () => {
    const out = await callTool('search_products', { query: 'PLC', locale: 'en' })
    expect(out).toMatch(/PLC/i)
    expect(out).toMatch(/\/en\/products\//)
  })

  it('未发布的案例不会通过 MCP 泄露', async () => {
    // 草稿只写版本表，但 Local API 默认 overrideAccess —— 查询自己不带
    // 已发布条件的话，草稿会连正文一起吐出来。这条是那个坑的守卫。
    const created = await payload.create({
      collection: 'case-studies',
      draft: true,
      data: {
        title: 'MCP draft leak probe',
        slug: DRAFT_SLUG,
        excerpt: '这条不该被任何公开接口返回',
        coverImage: (await payload.find({ collection: 'media', limit: 1 })).docs[0]!.id,
        _status: 'draft',
      },
    })
    draftId = created.id

    const detail = await callTool('get_case_study', { slug: DRAFT_SLUG, locale: 'en' })
    expect(detail).toContain('没有 slug')
    expect(detail).not.toContain('不该被任何公开接口返回')

    const list = await callTool('list_case_studies', { locale: 'en', limit: 50 })
    expect(list).not.toContain(DRAFT_SLUG)
  })
})
