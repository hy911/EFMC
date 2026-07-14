import type { Media, Page, Product } from '@/payload-types'

import { SITE_URL } from './seo'

/**
 * JSON-LD 结构化数据生成（schema.org）。
 * 输出对象由页面用 <script type="application/ld+json"> 注入。
 */

/** media 关联 → 绝对 URL（未 populate 或无 URL 时返回 undefined） */
export const mediaUrl = (m: (number | null | undefined) | Media): string | undefined =>
  m && typeof m === 'object' && m.url ? `${SITE_URL}${m.url}` : undefined

/** 组织信息（首页）：B2B 信任信号 */
export function organizationJsonLd({ name, logoUrl }: { name: string; logoUrl: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: SITE_URL,
    logo: logoUrl,
    address: { '@type': 'PostalAddress', addressLocality: 'Tianjin', addressCountry: 'CN' },
  }
}

/** 产品页 Product schema（无价格：B2B 询盘模式） */
export function productJsonLd(product: Product, locale: string) {
  const images = (product.images ?? [])
    .map((item) => mediaUrl(item.image))
    .filter((u): u is string => Boolean(u))

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.excerpt,
    ...(images.length ? { image: images } : {}),
    url: `${SITE_URL}/${locale}/products/${product.slug}`,
    brand: { '@type': 'Organization', name: 'Donglin Controls' },
  }
}

/** 固定页 Article schema */
export function articleJsonLd(page: Page, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    ...(page.intro ? { description: page.intro } : {}),
    url: `${SITE_URL}/${locale}/${page.slug}`,
    dateModified: page.updatedAt,
    datePublished: page.createdAt,
  }
}

/** 通用 Article schema（案例 / 博客等任何"文章形"内容） */
export function simpleArticleJsonLd({
  headline,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
}: {
  headline: string
  description?: string | null
  url: string
  image?: string
  datePublished?: string | null
  dateModified?: string | null
  author?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    ...(description ? { description } : {}),
    url,
    ...(image ? { image: [image] } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(author ? { author: { '@type': 'Organization', name: author } } : {}),
  }
}

/** 注入用的序列化辅助（防 XSS：转义 < ） */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
