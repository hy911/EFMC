import type { MetadataRoute } from 'next'

import { routing } from '@/i18n/routing'
import { getPayloadClient } from '@/lib/payload'
import { PUBLISHED } from '@/lib/queries'
import { SITE_URL } from '@/lib/seo'

/**
 * ISR：与各页面一致的 10 分钟兜底。
 * 没有这行，sitemap 会在构建时生成后**永不更新**——新增产品永远进不了
 * 收录、已删除的 URL 一直留在里面（生产上出现过：sitemap 里躺着一条
 * 早已 404 的产品 URL，而 11 个新产品一条都没有）。
 * 内容页的「发布即生效」靠 revalidate 钩子，sitemap 走这条兜底即可。
 */
export const revalidate = 600

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
      // 未发布的草稿不能进 sitemap —— 那等于主动请搜索引擎来抓
      where: PUBLISHED,
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
