import type { Metadata } from 'next'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { draftMode } from 'next/headers.js'
import { notFound } from 'next/navigation'

import { RenderCaseSections } from '@/blocks/caseRenderers'
import { CaseHero } from '@/components/case/CaseHero'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { Container } from '@/components/ui/Container'
import { DraftBanner } from '@/components/ui/DraftBanner'
import { ProductCard } from '@/components/ui/ProductCard'
import { RevealInit } from '@/components/ui/RevealInit'
import { routing, type Locale } from '@/i18n/routing'
import { formatDate } from '@/lib/format'
import { jsonLdScript, mediaUrl, simpleArticleJsonLd } from '@/lib/jsonld'
import { getPayloadClient } from '@/lib/payload'
import {
  getCaseStudyBySlug,
  getFeaturedProducts,
  getSiteSettings,
  PUBLISHED,
} from '@/lib/queries'
import { buildMeta, SITE_URL } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export const revalidate = 600
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: PUBLISHED, // 草稿不预渲染，它只经预览链接访问
    limit: 1000,
    select: { slug: true },
  })
  return docs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const cs = await getCaseStudyBySlug(locale, slug)
  if (!cs) return {}

  return buildMeta({
    locale,
    path: `/cases/${cs.slug}`,
    seo: cs.seo,
    fallbackTitle: `${cs.title} — Donglin Controls`,
    fallbackDescription: cs.excerpt,
    fallbackImage: cs.coverImage,
  })
}

/** 案例详情页：页头（行业/地点/时间）+ 成果指标条 + 封面 + 正文 + 关联产品 */
export default async function CaseStudyPage({ params }: Props) {
  const { locale: raw, slug } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  setRequestLocale(locale)

  // 草稿模式由 /api/preview 打开（那里做鉴权）；开着就渲染最新草稿而非已发布版
  const { isEnabled: isDraft } = await draftMode()

  const [cs, settings, footerProducts, t] = await Promise.all([
    getCaseStudyBySlug(locale, slug, isDraft),
    getSiteSettings(locale),
    getFeaturedProducts(locale, 4),
    getTranslations('casesPage'),
  ])
  if (!cs) notFound()

  const industry = typeof cs.industry === 'object' ? cs.industry : null
  const relatedProducts = (cs.relatedProducts ?? []).filter((p) => typeof p === 'object')
  const facts = [
    industry && { label: t('industryLabel'), value: industry.name },
    cs.location && { label: t('locationLabel'), value: cs.location },
    cs.completedAt && { label: t('completedLabel'), value: formatDate(locale, cs.completedAt) },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            simpleArticleJsonLd({
              headline: cs.title,
              description: cs.excerpt,
              url: `${SITE_URL}/${locale}/cases/${cs.slug}`,
              image: mediaUrl(cs.coverImage),
              datePublished: cs.createdAt,
              dateModified: cs.updatedAt,
              author: 'Donglin Controls',
            }),
          ),
        }}
      />
      {isDraft && <DraftBanner locale={locale} path={`/${locale}/cases/${slug}`} />}
      <Navbar />
      <main className="bg-white">
        <CaseHero cs={cs} industryName={industry?.name} facts={facts} />

        {/* 排版化章节 */}
        {(cs.sections?.length ?? 0) > 0 && <RenderCaseSections blocks={cs.sections!} />}

        {/* 简版正文（没做章节排版的案例走这里） */}
        {cs.body && (
          <Container className="py-10">
            <div className="prose max-w-[760px] text-ink prose-headings:font-display prose-headings:text-navy">
              <RichText data={cs.body} />
            </div>
          </Container>
        )}

        {/* 关联产品内链 */}
        {relatedProducts.length > 0 && (
          <section className="bg-mist">
            <Container className="py-14">
              <h2 className="m-0 mb-8 font-display text-[26px] font-bold tracking-[-0.3px] text-navy">
                {t('relatedProducts')}
              </h2>
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Container>
          </section>
        )}
      </main>
      <Footer settings={settings} products={footerProducts} />
      <WhatsAppFloat contact={settings.contact} />
      <RevealInit />
    </>
  )
}
