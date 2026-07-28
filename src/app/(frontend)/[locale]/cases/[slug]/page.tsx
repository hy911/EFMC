import type { Metadata } from 'next'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { RenderCaseSections } from '@/blocks/caseRenderers'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { ProductCard } from '@/components/ui/ProductCard'
import { RevealInit } from '@/components/ui/RevealInit'
import { routing, type Locale } from '@/i18n/routing'
import { formatDate } from '@/lib/format'
import { jsonLdScript, mediaUrl, simpleArticleJsonLd } from '@/lib/jsonld'
import { getPayloadClient } from '@/lib/payload'
import { getCaseStudyBySlug, getFeaturedProducts, getSiteSettings } from '@/lib/queries'
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

  const [cs, settings, footerProducts, t] = await Promise.all([
    getCaseStudyBySlug(locale, slug),
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
      <Navbar />
      <main className="bg-white">
        {/* 页头：封面铺满，左侧深色渐变压出文字可读性 */}
        <section className="relative flex min-h-[560px] items-end overflow-hidden bg-navy text-white lg:min-h-[680px]">
          <div className="absolute inset-0">
            <MediaImage media={cs.coverImage} size="feature" fill sizes="100vw" priority />
          </div>
          {/* 渐变自左向右变淡，保证标题区对比度、右侧仍看得见照片 */}
          <div className="absolute inset-0 bg-linear-to-r from-navy/95 via-navy/80 to-navy/10" />
          <Container className="relative pt-32 pb-16 lg:pt-40 lg:pb-24">
            {industry && (
              <div className="text-[12px] font-bold tracking-[2.2px] text-sky uppercase">
                {industry.name}
              </div>
            )}
            <h1 className="mt-5 mb-0 max-w-[820px] font-display text-[40px] leading-[1.04] font-bold tracking-[-1.8px] sm:text-[58px] lg:text-[70px]">
              {cs.title}
            </h1>
            <div className="my-8 h-1 w-[74px] bg-accent" />
            <p className="m-0 max-w-[660px] text-[18px] leading-[1.6] text-cloud sm:text-[20px]">
              {cs.excerpt}
            </p>
            {facts.length > 0 && (
              <div className="mt-9 flex flex-wrap gap-x-12 gap-y-3 text-[13px] tracking-[0.8px] uppercase">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <span className="mr-2.5 font-semibold text-sky">{fact.label}</span>
                    <span className="text-cloud">{fact.value}</span>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </section>

        {/* 成果指标 */}
        {(cs.metrics?.length ?? 0) > 0 && (
          <Container className="pt-10">
            <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
              {cs.metrics!.map((metric) => (
                <div key={metric.id} className="bg-mist px-8 py-8">
                  <div className="font-display text-[34px] leading-none font-bold text-navy">
                    {metric.value}
                  </div>
                  <div className="mt-2 text-[13.5px] leading-[1.4] text-steel">{metric.label}</div>
                </div>
              ))}
            </div>
          </Container>
        )}

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
