import type { Metadata } from 'next'

import { routing, type Locale } from '@/i18n/routing'
import type { Media } from '@/payload-types'

/** 站点绝对 URL（hreflang / sitemap / OG 必须用绝对地址） */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

/**
 * 生成 hreflang 串联：canonical 指向当前语种，
 * languages 列出全部语种 + x-default（指向默认语种 en）。
 * path 形如 '' | '/products/plc-control-cabinets'（不带语言前缀）。
 */
export function localeAlternates(locale: Locale, path: string): Metadata['alternates'] {
  const languages: Record<string, string> = {}
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}${path}`
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages,
  }
}

/** 内容 collection 内嵌 SEO 字段组的形状（见 src/fields/seo.ts） */
type SeoGroup = {
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: (number | null) | Media
}

/**
 * 从文档拼页面 Metadata：SEO 字段组优先，缺省回落标题/摘要。
 * ogImage 未设置时用 fallbackImage（如产品第一张图）。
 */
export function buildMeta({
  locale,
  path,
  seo,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
}: {
  locale: Locale
  path: string
  seo?: SeoGroup | null
  fallbackTitle: string
  fallbackDescription?: string | null
  fallbackImage?: (number | null) | Media
}): Metadata {
  const title = seo?.metaTitle || fallbackTitle
  const description = seo?.metaDescription || fallbackDescription || undefined

  const og = seo?.ogImage ?? fallbackImage
  const ogUrl =
    og && typeof og === 'object' ? (og.sizes?.og?.url ?? og.url ?? undefined) : undefined

  return {
    title,
    description,
    alternates: localeAlternates(locale, path),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}${path}`,
      ...(ogUrl ? { images: [{ url: `${SITE_URL}${ogUrl}` }] } : {}),
    },
  }
}
