import type { Metadata } from 'next'

import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { RevealInit } from '@/components/ui/RevealInit'
import { Link } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { formatDate } from '@/lib/format'
import { getFeaturedProducts, getPosts, getSiteSettings } from '@/lib/queries'
import { localeAlternates, SITE_URL } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export const revalidate = 600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const t = await getTranslations({ locale, namespace: 'blogPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(locale, '/blog'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `${SITE_URL}/${locale}/blog`,
    },
  }
}

/** 博客列表页：3 列文章卡（封面 + 日期 + 标题 + 摘要） */
export default async function BlogPage({ params }: Props) {
  const { locale: raw } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  setRequestLocale(locale)

  const [posts, settings, footerProducts, t] = await Promise.all([
    getPosts(locale),
    getSiteSettings(locale),
    getFeaturedProducts(locale, 4),
    getTranslations('blogPage'),
  ])

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="bg-navy text-white">
          <Container className="py-16 lg:py-20">
            <h1 className="m-0 font-display text-[36px] leading-[1.12] font-bold tracking-[-0.4px] sm:text-[48px]">
              {t('title')}
            </h1>
            <p className="m-0 mt-5 max-w-[640px] text-[17px] leading-[1.7] text-cloud">
              {t('intro')}
            </p>
          </Container>
        </section>

        <Container className="py-14">
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                data-reveal
                className="group flex flex-col border border-line bg-white transition-[box-shadow,transform] duration-250 hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(11,31,63,0.10)]"
              >
                {post.coverImage && (
                  <div className="relative h-52 min-w-0">
                    <MediaImage
                      media={post.coverImage}
                      size="card"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 390px"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col px-[26px] pt-6 pb-7">
                  <div className="mb-2 text-[12.5px] tracking-[1px] text-steel uppercase">
                    {formatDate(locale, post.publishedAt, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <h2 className="m-0 mb-2 font-display text-[18.5px] leading-[1.35] font-semibold text-navy transition-colors group-hover:text-accent">
                    {post.title}
                  </h2>
                  <p className="m-0 flex-1 text-[14px] leading-[1.55] text-steel">{post.excerpt}</p>
                  <span className="mt-3.5 text-[14px] font-semibold text-accent">
                    {t('readMore')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <Footer settings={settings} products={footerProducts} />
      <WhatsAppFloat number={settings.contact.whatsAppNumber} />
      <RevealInit />
    </>
  )
}
