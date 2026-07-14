import type { MetadataRoute } from 'next'

import { routing } from '@/i18n/routing'
import { getPayloadClient } from '@/lib/payload'
import { SITE_URL } from '@/lib/seo'

/**
 * 分语种 sitemap：每个 URL 输出全部语种版本并互相声明 hreflang alternates
 * （Google 推荐的多语言 sitemap 形式）。收录：首页、产品页、固定页。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  // 只取 slug / 更新时间，控制查询开销
  const [products, pages, cases, posts] = await Promise.all([
    payload.find({ collection: 'products', limit: 1000, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'pages', limit: 1000, select: { slug: true, updatedAt: true } }),
    payload.find({
      collection: 'case-studies',
      limit: 1000,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({ collection: 'posts', limit: 1000, select: { slug: true, updatedAt: true } }),
  ])

  /** 为同一路径生成全语种条目 + hreflang 互链 */
  const entries = (path: string, lastModified?: string): MetadataRoute.Sitemap => {
    const languages: Record<string, string> = {}
    for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}${path}`
    languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`

    return routing.locales.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
      alternates: { languages },
    }))
  }

  return [
    ...entries(''),
    ...entries('/products'),
    ...entries('/cases'),
    ...entries('/blog'),
    ...products.docs.flatMap((p) => entries(`/products/${p.slug}`, p.updatedAt)),
    ...cases.docs.flatMap((c) => entries(`/cases/${c.slug}`, c.updatedAt)),
    ...posts.docs.flatMap((p) => entries(`/blog/${p.slug}`, p.updatedAt)),
    ...pages.docs.flatMap((p) => entries(`/${p.slug}`, p.updatedAt)),
  ]
}
