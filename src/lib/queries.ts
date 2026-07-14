import type { Locale } from '@/i18n/routing'
import type { ApplicationScenario, Product, SiteSetting } from '@/payload-types'

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

/** 首页应用行业（按 displayOrder 取前 5 个） */
export async function getIndustries(locale: Locale, limit = 5): Promise<ApplicationScenario[]> {
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
