import type { Metadata } from 'next'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { RevealInit } from '@/components/ui/RevealInit'
import { routing, type Locale } from '@/i18n/routing'
import { formatDate } from '@/lib/format'
import { jsonLdScript, mediaUrl, simpleArticleJsonLd } from '@/lib/jsonld'
import { getPayloadClient } from '@/lib/payload'
import { getFeaturedProducts, getPostBySlug, getSiteSettings } from '@/lib/queries'
import { buildMeta, SITE_URL } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export const revalidate = 600
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'posts', limit: 1000, select: { slug: true } })
  return docs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const post = await getPostBySlug(locale, slug)
  if (!post) return {}

  return buildMeta({
    locale,
    path: `/blog/${post.slug}`,
    seo: post.seo,
    fallbackTitle: `${post.title} — Donglin Controls`,
    fallbackDescription: post.excerpt,
    fallbackImage: post.coverImage,
  })
}

/** 博客文章页：日期/作者 + 标题 + 封面 + 正文（Article JSON-LD） */
export default async function PostPage({ params }: Props) {
  const { locale: raw, slug } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  setRequestLocale(locale)

  const [post, settings, footerProducts] = await Promise.all([
    getPostBySlug(locale, slug),
    getSiteSettings(locale),
    getFeaturedProducts(locale, 4),
  ])
  if (!post) notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            simpleArticleJsonLd({
              headline: post.title,
              description: post.excerpt,
              url: `${SITE_URL}/${locale}/blog/${post.slug}`,
              image: mediaUrl(post.coverImage),
              datePublished: post.publishedAt,
              dateModified: post.updatedAt,
              author: post.author ?? 'Donglin Controls',
            }),
          ),
        }}
      />
      <Navbar />
      <main className="bg-white">
        <section className="bg-navy text-white">
          <Container className="py-16 lg:py-20">
            <div className="mb-4 text-[13px] tracking-[1px] text-sky uppercase">
              {formatDate(locale, post.publishedAt, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {post.author && <span className="text-cloud"> · {post.author}</span>}
            </div>
            <h1 className="m-0 max-w-[820px] font-display text-[32px] leading-[1.15] font-bold tracking-[-0.4px] sm:text-[44px]">
              {post.title}
            </h1>
          </Container>
        </section>

        <Container className="py-10">
          {post.coverImage && (
            <div className="relative mb-10 h-[280px] border border-line sm:h-[420px]">
              <MediaImage media={post.coverImage} size="feature" fill sizes="1180px" priority />
            </div>
          )}
          <div className="prose max-w-[760px] text-ink prose-headings:font-display prose-headings:text-navy">
            <RichText data={post.body} />
          </div>
        </Container>
      </main>
      <Footer settings={settings} products={footerProducts} />
      <WhatsAppFloat contact={settings.contact} />
      <RevealInit />
    </>
  )
}
