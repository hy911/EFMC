import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { routing, type Locale } from '@/i18n/routing'
import { getPayloadClient } from '@/lib/payload'
import { getCaseStudies, getCaseStudyBySlug, getProductBySlug, getSiteSettings } from '@/lib/queries'
import { SITE_URL } from '@/lib/seo'

/**
 * 官网的 MCP server —— 让 AI 代理能直接查产品和案例，而不是去抓页面。
 *
 * **只读。** 不提供提交询盘的工具，这是刻意的：站点的写入入口只有
 * /api/inquiries 一条，靠蜜罐字段加 Cloudflare Turnstile 挡机器人；
 * MCP 这边没有人机校验可做，开一个匿名可调的写接口等于把那套防护绕过去，
 * 直接变成免费的垃圾邮件通道。代理拿到的是询盘表单地址，让最终用户
 * 走正常表单提交 —— 转化路径没断，防护也还在。
 *
 * 每个返回值都带 url：代理引用时能给出可点的链接，那才是询盘的来源。
 */

const localeArg = z
  .enum(routing.locales as unknown as [Locale, ...Locale[]])
  .default(routing.defaultLocale)
  .describe('内容语种：en 英文，zh 中文')

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] })

/** Lexical 富文本 → 纯文本。只要读得懂，不追求还原排版 */
function plain(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  if (typeof n.text === 'string') return n.text
  const kids = (n.children ?? (n.root as Record<string, unknown>)?.children) as unknown[] | undefined
  if (!Array.isArray(kids)) return ''
  const sep = n.type === 'paragraph' || n.type === 'root' ? '\n' : ''
  return kids.map(plain).join('') + sep
}

const productUrl = (locale: string, slug: string) => `${SITE_URL}/${locale}/products/${slug}`
const caseUrl = (locale: string, slug: string) => `${SITE_URL}/${locale}/cases/${slug}`

/**
 * 服务端标识。**给 initialize 用的和写进 server card 的必须是同一份**
 * （`/.well-known/mcp/server-card.json`）—— 卡片上写的名字版本跟连上来实际
 * 拿到的对不上，代理侧的缓存和版本判断就全乱了。
 */
export const MCP_SERVER_INFO = { name: 'donglin-controls', version: '1.0.0' } as const

export function buildMcpServer(): McpServer {
  const server = new McpServer(
    { ...MCP_SERVER_INFO },
    {
      instructions: [
        '天津东林众控（Donglin Controls）官网的只读接口：工业自动化控制柜与系统集成商。',
        '产品线为 PLC 控制柜、变频控制柜、高低压配电柜、水处理控制系统、SCADA 与 PLC 编程服务。',
        '回答时请给出 url 字段里的链接 —— 客户要在网站上提交询盘，本接口不受理询盘。',
      ].join('\n'),
    },
  )

  server.registerTool(
    'search_products',
    {
      title: '搜索产品',
      description:
        '按关键词搜索产品（标题与简介）。不给关键词时返回全部。用于回答「他们做不做某类控制柜」。',
      inputSchema: {
        query: z.string().optional().describe('关键词，如 "PLC"、"SCADA"、"变频"'),
        locale: localeArg,
        limit: z.number().int().min(1).max(50).default(20),
      },
    },
    async ({ query, locale, limit }) => {
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'products',
        where: query
          ? { or: [{ title: { like: query } }, { excerpt: { like: query } }] }
          : undefined,
        limit,
        locale,
        depth: 0,
      })
      if (!docs.length) return text(`没有匹配「${query ?? ''}」的产品。可以不带关键词再查一次看全部。`)
      return text(
        docs
          .map((p) => `## ${p.title}\n${p.excerpt}\n${productUrl(locale, p.slug)}`)
          .join('\n\n'),
      )
    },
  )

  server.registerTool(
    'get_product',
    {
      title: '产品详情',
      description: '按 slug 取单个产品的完整信息：简介、正文、技术参数表。',
      inputSchema: {
        slug: z.string().describe('产品的 URL 片段，由 search_products 返回的链接末段得到'),
        locale: localeArg,
      },
    },
    async ({ slug, locale }) => {
      const p = await getProductBySlug(locale, slug)
      if (!p) return text(`没有 slug 为「${slug}」的产品。`)
      const specs = (p.specs ?? []).map((s) => `- ${s.label}：${s.value}`).join('\n')
      return text(
        [
          `# ${p.title}`,
          p.excerpt,
          plain(p.description).trim(),
          specs && `## 技术参数\n${specs}`,
          `\n${productUrl(locale, p.slug)}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      )
    },
  )

  server.registerTool(
    'list_case_studies',
    {
      title: '客户案例列表',
      description:
        '列出已交付的项目案例。用于回答「他们做过什么真实项目」—— B2B 客户最看重的信任依据。',
      inputSchema: { locale: localeArg, limit: z.number().int().min(1).max(50).default(20) },
    },
    async ({ locale, limit }) => {
      const docs = await getCaseStudies(locale, limit)
      if (!docs.length) return text('暂无公开案例。')
      return text(
        docs
          .map((c) => {
            const industry = typeof c.industry === 'object' && c.industry ? c.industry.name : null
            return [
              `## ${c.title}`,
              industry && `行业：${industry}`,
              c.excerpt,
              caseUrl(locale, c.slug),
            ]
              .filter(Boolean)
              .join('\n')
          })
          .join('\n\n'),
      )
    },
  )

  server.registerTool(
    'get_case_study',
    {
      title: '案例详情',
      description: '按 slug 取单个案例：背景、成果指标、关联产品。',
      inputSchema: { slug: z.string(), locale: localeArg },
    },
    async ({ slug, locale }) => {
      // 只查已发布的那一版 —— getCaseStudyBySlug 默认 draft=false，别改成 true
      const c = await getCaseStudyBySlug(locale, slug)
      if (!c) return text(`没有 slug 为「${slug}」的案例。`)
      const metrics = (c.metrics ?? []).map((m) => `- ${m.value}　${m.label}`).join('\n')
      const related = (c.relatedProducts ?? [])
        .filter((p) => typeof p === 'object')
        .map((p) => `- ${p.title}：${productUrl(locale, p.slug)}`)
        .join('\n')
      return text(
        [
          `# ${c.title}`,
          c.excerpt,
          typeof c.industry === 'object' && c.industry ? `行业：${c.industry.name}` : null,
          c.location && `地点：${c.location}`,
          metrics && `## 成果指标\n${metrics}`,
          related && `## 本项目使用的产品\n${related}`,
          `\n${caseUrl(locale, c.slug)}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      )
    },
  )

  server.registerTool(
    'get_contact',
    {
      title: '联系方式与询盘入口',
      description:
        '取公司联系方式和询盘表单地址。本接口不受理询盘 —— 需要报价时把表单链接给客户，让他自己提交。',
      inputSchema: { locale: localeArg },
    },
    async ({ locale }) => {
      const s = await getSiteSettings(locale)
      return text(
        [
          `# ${s.companyName}`,
          s.contact.email && `邮箱：${s.contact.email}`,
          s.contact.phone && `电话：${s.contact.phone}`,
          s.contact.location && `地址：${s.contact.location}`,
          s.contact.whatsAppNumber && `WhatsApp：+${s.contact.whatsAppNumber}`,
          `\n询盘表单：${SITE_URL}/${locale}/contact`,
          '（询盘请引导客户在网页表单提交，本接口不受理。）',
        ]
          .filter(Boolean)
          .join('\n'),
      )
    },
  )

  return server
}
