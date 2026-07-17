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
import { getCaseStudies, getFeaturedProducts, getSiteSettings } from '@/lib/queries'
import { DEFAULT_OG_IMAGE, localeAlternates, SITE_URL } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export const revalidate = 600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const t = await getTranslations({ locale, namespace: 'casesPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(locale, '/cases'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `${SITE_URL}/${locale}/cases`,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
  }
}

/** 案例列表页：深蓝页头 + 2 列大卡（封面 + 行业标签 + 标题 + 摘要） */
export default async function CasesPage({ params }: Props) {
  const { locale: raw } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  setRequestLocale(locale)

  const [cases, settings, footerProducts, t] = await Promise.all([
    getCaseStudies(locale),
    getSiteSettings(locale),
    getFeaturedProducts(locale, 4),
    getTranslations('casesPage'),
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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {cases.map((cs) => {
              const industry = typeof cs.industry === 'object' ? cs.industry : null
              return (
                <Link
                  key={cs.id}
                  href={`/cases/${cs.slug}`}
                  data-reveal
                  className="group block border border-line bg-white transition-[box-shadow,transform] duration-250 hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(11,31,63,0.10)]"
                >
                  <div className="relative h-64 min-w-0">
                    <MediaImage
                      media={cs.coverImage}
                      size="feature"
                      fill
                      sizes="(max-width: 1024px) 100vw, 590px"
                    />
                    {industry && (
                      <div className="absolute bottom-[-1px] left-[-1px] bg-navy px-4 py-2 text-[12px] font-semibold tracking-[1px] text-sky uppercase">
                        {industry.name}
                      </div>
                    )}
                  </div>
                  <div className="px-7 pt-6 pb-7">
                    <h2 className="m-0 mb-2.5 font-display text-[21px] leading-[1.3] font-semibold text-navy transition-colors group-hover:text-accent">
                      {cs.title}
                    </h2>
                    <p className="m-0 text-[14.5px] leading-[1.6] text-steel">{cs.excerpt}</p>
                    <span className="mt-4 inline-block text-[14px] font-semibold text-accent">
                      {t('readCase')}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </Container>
      </main>
      <Footer settings={settings} products={footerProducts} />
      <WhatsAppFloat contact={settings.contact} />
      <RevealInit />
    </>
  )
}
