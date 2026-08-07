import { NextResponse } from 'next/server'
import { z } from 'zod'

import { PUBLIC_COLLECTIONS } from '@/lib/api-catalog'
import { inquirySchema } from '@/lib/inquiry-schema'
import { SITE_URL } from '@/lib/seo'

/**
 * 公开接口的 OpenAPI 3.1 规范 —— API 目录（/.well-known/api-catalog）的
 * service-desc 指向这里。
 *
 * 询盘那段的请求体**由真实的 Zod 校验规则生成**（z.toJSONSchema），
 * 不手写：改了校验规则，规范自动跟着变。手抄的规范早晚跟实现对不上，
 * 而一份错的接口文档比没有更糟。
 */
export const dynamic = 'force-static'

/** 内容接口是只读的，写操作全部要登录 —— 规范里如实说明，别让代理去试 */
const readOnlyNote = '匿名只读。写操作需要后台账号，未开放给公开客户端。'

export function GET() {
  const generated = z.toJSONSchema(inquirySchema, { target: 'draft-2020-12' })

  /**
   * 蜜罐字段 `website` 不能出现在公开规范里 —— 把陷阱位置写进接口文档，
   * 机器人照着留空就绕过去了，这个字段的全部价值就是没人知道它在。
   * 自动生成的代价就是这类字段会跟着漏出来，所以在这里显式摘掉。
   */
  const { website: _honeypot, ...properties } = generated.properties as Record<string, unknown>
  const inquiryBody = { ...generated, properties }

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Donglin Controls Public API',
      version: '1.0.0',
      summary: '天津东林众控官网对外开放的接口：询盘提交与只读内容。',
      description: [
        '本站是产品展示与询盘站点，不提供在线交易接口。',
        '',
        `内容接口（\`/api/{collection}\`）${readOnlyNote}`,
        '询盘接口是站点唯一的写入入口，带蜜罐字段与 Cloudflare Turnstile 人机校验；',
        '未通过校验会返回 403。',
      ].join('\n'),
      contact: { url: `${SITE_URL}/en/contact` },
    },
    servers: [{ url: SITE_URL }],
    paths: {
      '/api/inquiries': {
        post: {
          operationId: 'createInquiry',
          summary: '提交询盘',
          description:
            '成功写库并触发邮件通知。命中蜜罐字段 `website` 时同样返回 201，但不落库。',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: inquiryBody } },
          },
          responses: {
            201: {
              description: '已受理',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { ok: { type: 'boolean' } },
                    required: ['ok'],
                  },
                },
              },
            },
            400: { description: '请求体不是合法 JSON' },
            403: { description: '人机校验未通过' },
            422: { description: '字段校验失败，`details` 给出逐字段原因' },
          },
        },
      },
      '/api/{collection}': {
        get: {
          operationId: 'listContent',
          summary: '列出公开内容',
          description: `Payload CMS 的 REST 接口。${readOnlyNote}`,
          parameters: [
            {
              name: 'collection',
              in: 'path',
              required: true,
              schema: { type: 'string', enum: [...PUBLIC_COLLECTIONS] },
            },
            {
              name: 'locale',
              in: 'query',
              description: '内容语种；缺失的中文字段回落英文。',
              schema: { type: 'string', enum: ['en', 'zh'], default: 'en' },
            },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
            {
              name: 'depth',
              in: 'query',
              description: '关联字段展开层数；0 只返回 id。',
              schema: { type: 'integer', minimum: 0, maximum: 2, default: 1 },
            },
          ],
          responses: {
            200: {
              description: '分页结果',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      docs: { type: 'array', items: { type: 'object' } },
                      totalDocs: { type: 'integer' },
                      page: { type: 'integer' },
                      totalPages: { type: 'integer' },
                      hasNextPage: { type: 'boolean' },
                    },
                    required: ['docs', 'totalDocs'],
                  },
                },
              },
            },
            403: { description: '该 collection 不对匿名开放' },
          },
        },
      },
      '/api/health': {
        get: {
          operationId: 'getHealth',
          summary: '健康检查',
          description: '连一次数据库确认服务可用。',
          responses: {
            200: { description: '正常' },
            503: { description: '数据库不可用' },
          },
        },
      },
    },
  }

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/openapi+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
