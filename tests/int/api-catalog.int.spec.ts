import { describe, expect, it } from 'vitest'

import { GET as catalog } from '@/app/.well-known/api-catalog/route'
import { GET as openapi } from '@/app/api/openapi.json/route'
import { GET as robots } from '@/app/robots.txt/route'
import { PUBLIC_COLLECTIONS } from '@/lib/api-catalog'

/**
 * API 目录（RFC 9727）三件套的契约。
 *
 * 最要紧的是蜜罐那条：询盘的 OpenAPI 请求体是从真实 Zod 规则自动生成的，
 * 生成器不知道 `website` 是陷阱，会连它一起公布 —— 一公布这个字段就废了。
 * 那是自动生成必然带的风险，只能靠断言守住。
 */
describe('API 目录', () => {
  it('linkset 里每个 API 都给全了三种链接关系，且是绝对地址', async () => {
    const res = catalog()
    expect(res.headers.get('Content-Type')).toBe('application/linkset+json')

    const { linkset } = await res.json()
    expect(linkset.length).toBeGreaterThan(0)
    for (const entry of linkset) {
      expect(entry.anchor).toMatch(/^https?:\/\//)
      for (const rel of ['service-desc', 'service-doc', 'status']) {
        expect(entry[rel]?.[0]?.href, `${entry.anchor} 少了 ${rel}`).toMatch(/^https?:\/\//)
      }
    }
  })

  it('OpenAPI 不泄露蜜罐字段', async () => {
    const spec = await openapi().json()
    const body =
      spec.paths['/api/inquiries'].post.requestBody.content['application/json'].schema.properties

    expect(Object.keys(body)).not.toContain('website')
    // 顺带确认生成没整个失效：真实字段还在，约束也带出来了
    expect(Object.keys(body)).toContain('message')
    expect(body.message.maxLength).toBe(5000)
  })

  it('OpenAPI 只列匿名可读的 collection', async () => {
    const spec = await openapi().json()
    const listed = spec.paths['/api/{collection}'].get.parameters[0].schema.enum

    expect(listed).toEqual([...PUBLIC_COLLECTIONS])
    // 这三个对匿名关闭，列进去就是引着代理去撞 403（inquiries 更是只写不读）
    for (const closed of ['users', 'inquiries']) {
      expect(listed).not.toContain(closed)
    }
  })

  it('robots.txt 放行目录指出去的地址', async () => {
    const txt = await robots().text()

    // 目录里 service-desc / service-doc / status 三个地址都在 /api/ 下，
    // 被 Disallow: /api/ 挡住的话，这份 API 目录就是一张打不开的清单
    for (const p of ['/api/openapi.json', '/api/docs', '/api/health']) {
      expect(txt).toContain(`Allow: ${p}`)
    }
    expect(txt).toContain('Disallow: /admin')
  })

  it('robots.txt 声明 Content Signals，且不挡 AI 回答与搜索', async () => {
    const txt = await robots().text()
    const signal = txt.match(/^Content-Signal:\s*(.+)$/m)?.[1]
    expect(signal, '没有 Content-Signal 指令').toBeTruthy()

    /*
     * 站点目标是被 AI 回答引用来获客，所以 search 和 ai-input 必须是 yes。
     * 各种示例和扫描器给的默认值多是 ai-input=no / ai-train=no，照抄一次
     * 就把自己从 ChatGPT、Perplexity 那类带链接的回答里摘出去了 ——
     * 那正是我们要的入口。要改成 no 得是明确的业务决定，不是顺手抄默认值。
     */
    expect(signal).toMatch(/\bsearch=yes\b/)
    expect(signal).toMatch(/\bai-input=yes\b/)
  })
})
