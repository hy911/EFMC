import type { Metadata } from 'next'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { InquiryForm } from '@/components/home/InquiryForm'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { RevealInit } from '@/components/ui/RevealInit'
import { routing, type Locale } from '@/i18n/routing'
import { jsonLdScript, productJsonLd } from '@/lib/jsonld'
import { getPayloadClient } from '@/lib/payload'
import { getFeaturedProducts, getProductBySlug, getSiteSettings } from '@/lib/queries'
import { buildMeta } from '@/lib/seo'
import { buildWaLink } from '@/lib/whatsapp'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

// ISR：发布后由 afterChange hook 即时刷新，这里是兜底周期
export const revalidate = 600
// 允许渲染 generateStaticParams 之外的新 slug（新品发布无需重新构建）
export const dynamicParams = true

/** 预生成全部产品页（slug × 语种由上层 [locale] 展开） */
export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    limit: 1000,
    select: { slug: true },
  })
  return docs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const product = await getProductBySlug(locale, slug)
  if (!product) return {}

  return buildMeta({
    locale,
    path: `/products/${product.slug}`,
    seo: product.seo,
    fallbackTitle: `${product.title} — Donglin Controls`,
    fallbackDescription: product.excerpt,
    fallbackImage: product.images?.[0]?.image,
  })
}

/** 产品详情页：图集 + 摘要 + 规格表 + 富文本介绍 + 询盘表单（关联来源产品） */
export default async function ProductPage({ params }: Props) {
  const { locale: raw, slug } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  setRequestLocale(locale)

  const [product, settings, footerProducts, tw] = await Promise.all([
    getProductBySlug(locale, slug),
    getSiteSettings(locale),
    getFeaturedProducts(locale, 4),
    getTranslations('whatsapp'),
  ])
  if (!product) notFound()

  const wa = settings.contact.whatsAppNumber
  const specs = product.specs ?? []
  const images = product.images ?? []

  return (
    <>
      {/* Product JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(product, locale)) }}
      />
      <Navbar />
      <main className="bg-white">
        <Container className="grid grid-cols-1 gap-12 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
          {/* 左：图集 */}
          <div>
            <div className="relative h-[320px] border border-line sm:h-[440px]">
              <MediaImage
                media={images[0]?.image}
                size="feature"
                fill
                sizes="(max-width: 1024px) 100vw, 620px"
                priority
              />
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {images.slice(1, 5).map((item, i) => (
                  <div key={i} className="relative h-24 border border-line">
                    <MediaImage media={item.image} size="card" fill sizes="150px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右：信息 + 询盘 */}
          <div>
            <h1 className="m-0 mb-4 font-display text-[32px] leading-[1.15] font-bold tracking-[-0.3px] text-navy sm:text-[40px]">
              {product.title}
            </h1>
            <p className="m-0 mb-8 text-[16.5px] leading-[1.7] text-steel">{product.excerpt}</p>

            {/* 规格参数表 */}
            {specs.length > 0 && (
              <table className="mb-8 w-full border-collapse text-[14.5px]">
                <tbody>
                  {specs.map((spec) => (
                    <tr key={spec.id} className="border-b border-line">
                      <td className="py-2.5 pr-6 font-medium text-navy">{spec.label}</td>
                      <td className="py-2.5 text-steel">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 询盘 CTA：表单（关联本产品）+ WhatsApp 深链（预填产品名） */}
            {wa && (
              <a
                href={buildWaLink(wa, tw('productMessage', { product: product.title }))}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-8 inline-flex items-center gap-3 border border-line px-6 py-3.5 text-[15px] font-semibold text-navy transition-colors hover:border-navy"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-whatsapp" aria-hidden="true" />
                {tw('floatLabel')}
              </a>
            )}
            <div className="border border-line bg-mist p-1">
              <InquiryForm sourceProductId={product.id} />
            </div>
          </div>
        </Container>

        {/* 富文本详细介绍 */}
        {product.description && (
          <Container className="pb-20">
            <div className="prose max-w-[760px] text-ink prose-headings:font-display prose-headings:text-navy">
              <RichText data={product.description} />
            </div>
          </Container>
        )}
      </main>
      <Footer settings={settings} products={footerProducts} />
      <WhatsAppFloat contact={settings.contact} />
      <RevealInit />
    </>
  )
}
