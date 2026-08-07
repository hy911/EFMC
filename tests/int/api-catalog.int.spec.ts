import { describe, expect, it } from 'vitest'

import { GET as catalog } from '@/app/.well-known/api-catalog/route'
import { GET as openapi } from '@/app/api/openapi.json/route'
import robots from '@/app/robots'
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

  it('robots.txt 放行目录指出去的地址', () => {
    const { rules } = robots()
    const allow = [(Array.isArray(rules) ? rules[0] : rules).allow].flat()

    // 目录里 service-desc / service-doc / status 三个地址都在 /api/ 下，
    // 被 Disallow: /api/ 挡住的话，这份 API 目录就是一张打不开的清单
    for (const p of ['/api/openapi.json', '/api/docs', '/api/health']) {
      expect(allow).toContain(p)
    }
  })
})
