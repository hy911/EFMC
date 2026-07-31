import type { Locale } from '@/i18n/routing'
import type { ApplicationScenario, CaseStudy, Post, Product, SiteSetting } from '@/payload-types'

import { getPayloadClient } from './payload'

/**
 * 首页与全站布局的数据查询层（Local API，SSG/ISR 时执行）。
 * locale 透传给 Payload 的内容级 localization，未翻译字段自动 fallback 到 en。
 */

/** 站点设置（联系方式、WhatsApp 号码等） */
export async function getSiteSettings(locale: Locale): Promise<SiteSetting> {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', locale, depth: 1 })
}

/** 首页精选产品（featured=true，按更新时间取前 6 个） */
export async function getFeaturedProducts(locale: Locale, limit = 6): Promise<Product[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { featured: { equals: true } },
    sort: '-updatedAt',
    limit,
    locale,
    depth: 1, // 带出 images 里的 media 文档
  })
  return docs
}

/** 首页应用行业（按 displayOrder 取前 6 个） */
export async function getIndustries(locale: Locale, limit = 6): Promise<ApplicationScenario[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'application-scenarios',
    sort: 'displayOrder',
    limit,
    locale,
    depth: 1,
  })
  return docs
}

/**
 * 已发布筛选条件。
 *
 * 开了草稿之后，未发布的文档在主表里也有一行 —— Local API 默认
 * overrideAccess，collection 的 access 规则拦不住它，所以每个面向公众的
 * 查询都必须自己带上这个条件。漏一个就等于把草稿挂到线上。
 */
export const PUBLISHED = { _status: { equals: 'published' } } as const

/** 客户案例列表（按交付时间倒序） */
export async function getCaseStudies(locale: Locale, limit = 100): Promise<CaseStudy[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: PUBLISHED,
    sort: '-completedAt',
    limit,
    locale,
    depth: 1, // 带出封面图与行业
  })
  return docs
}

/** 按 slug 查询单个案例（含关联产品，供详情页内链） */
/**
 * 案例详情。draft=true 时返回最新草稿（后台预览/外部预览链接用）。
 * 默认 false —— 前台正式页面永远只拿已发布的那一版。
 */
export async function getCaseStudyBySlug(
  locale: Locale,
  slug: string,
  draft = false,
): Promise<CaseStudy | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'case-studies',
    // 预览时不筛已发布，否则草稿永远查不出来
    where: draft ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, PUBLISHED] },
    limit: 1,
    locale,
    depth: 2, // relatedProducts 里还要带出产品封面图
    draft,
  })
  return docs[0] ?? null
}

/** 博客文章列表（按发布时间倒序） */
export async function getPosts(locale: Locale, limit = 100): Promise<Post[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    sort: '-publishedAt',
    limit,
    locale,
    depth: 1,
  })
  return docs
}

/** 按 slug 查询单篇文章 */
export async function getPostBySlug(locale: Locale, slug: string): Promise<Post | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    locale,
    depth: 1,
  })
  return docs[0] ?? null
}

/** 按 slug 查询单个产品（产品详情页用） */
export async function getProductBySlug(locale: Locale, slug: string): Promise<Product | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    locale,
    depth: 1,
  })
  return docs[0] ?? null
}
