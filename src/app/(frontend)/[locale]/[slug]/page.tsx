import type { Metadata } from 'next'

import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/blocks/renderers'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { Container } from '@/components/ui/Container'
import { RevealInit } from '@/components/ui/RevealInit'
import { routing, type Locale } from '@/i18n/routing'
import { articleJsonLd, jsonLdScript } from '@/lib/jsonld'
import { getPayloadClient } from '@/lib/payload'
import { getFeaturedProducts, getSiteSettings } from '@/lib/queries'
import { buildMeta } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export const revalidate = 600
export const dynamicParams = true

async function getPage(locale: Locale, slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    locale,
    depth: 2, // blocks 里的图片关联
  })
  return docs[0] ?? null
}

/** 预生成全部固定页 */
export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'pages', limit: 1000, select: { slug: true } })
  return docs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const page = await getPage(locale, slug)
  if (!page) return {}

  return buildMeta({
    locale,
    path: `/${page.slug}`,
    seo: page.seo,
    fallbackTitle: `${page.title} — Donglin Controls`,
    fallbackDescription: page.intro,
  })
}

/** 固定页（About / 工厂实力 / Contact 等）：标题 + 导语 + blocks 布局 */
export default async function StaticPage({ params }: Props) {
  const { locale: raw, slug } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  setRequestLocale(locale)

  const [page, settings, footerProducts] = await Promise.all([
    getPage(locale, slug),
    getSiteSettings(locale),
    getFeaturedProducts(locale, 4),
  ])
  if (!page) notFound()

  return (
    <>
      {/* Article JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd(page, locale)) }}
      />
      <Navbar />
      <main className="bg-white">
        {/* 页头：深蓝底标题区，与首页视觉体系一致 */}
        <section className="bg-navy text-white">
          <Container className="py-16 lg:py-20">
            <h1 className="m-0 font-display text-[36px] leading-[1.12] font-bold tracking-[-0.4px] sm:text-[48px]">
              {page.title}
            </h1>
            {page.intro && (
              <p className="m-0 mt-5 max-w-[640px] text-[17px] leading-[1.7] text-cloud">
                {page.intro}
              </p>
            )}
          </Container>
        </section>

        <div className="py-8">
          {page.layout && <RenderBlocks blocks={page.layout} locale={locale} />}
        </div>
      </main>
      <Footer settings={settings} products={footerProducts} />
      <WhatsAppFloat contact={settings.contact} />
      <RevealInit />
    </>
  )
}
