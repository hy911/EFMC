import type { Metadata } from 'next'

import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/ui/ProductCard'
import { RevealInit } from '@/components/ui/RevealInit'
import { routing, type Locale } from '@/i18n/routing'
import { getPayloadClient } from '@/lib/payload'
import { getFeaturedProducts, getSiteSettings } from '@/lib/queries'
import { DEFAULT_OG_IMAGE, localeAlternates, SITE_URL } from '@/lib/seo'
import type { Product, ProductCategory } from '@/payload-types'

type Props = {
  params: Promise<{ locale: string }>
}

export const revalidate = 600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const t = await getTranslations({ locale, namespace: 'productsPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(locale, '/products'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `${SITE_URL}/${locale}/products`,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
  }
}

/** 全部产品，按分类分组（分类按名称排序，组内按更新时间倒序） */
async function getProductsGrouped(locale: Locale) {
  const payload = await getPayloadClient()
  const [{ docs: categories }, { docs: products }] = await Promise.all([
    payload.find({ collection: 'product-categories', sort: 'name', limit: 100, locale }),
    payload.find({ collection: 'products', sort: '-updatedAt', limit: 500, locale, depth: 1 }),
  ])

  const groups: Array<{ category: ProductCategory; products: Product[] }> = []
  for (const category of categories) {
    const items = products.filter(
      (p) => (typeof p.category === 'object' ? p.category.id : p.category) === category.id,
    )
    if (items.length > 0) groups.push({ category, products: items })
  }
  return groups
}

/** 产品列表页：深蓝页头 + 按分类分组的产品卡网格 */
export default async function ProductsPage({ params }: Props) {
  const { locale: raw } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  setRequestLocale(locale)

  const [groups, settings, footerProducts, t] = await Promise.all([
    getProductsGrouped(locale),
    getSiteSettings(locale),
    getFeaturedProducts(locale, 4),
    getTranslations('productsPage'),
  ])

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* 页头 */}
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

        {/* 分类分组 */}
        {groups.map(({ category, products }) => (
          <section key={category.id} className="border-b border-line last:border-0">
            <Container className="py-14">
              <div className="mb-8">
                <h2 className="m-0 font-display text-[26px] font-bold tracking-[-0.3px] text-navy">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="m-0 mt-2 max-w-[640px] text-[15px] leading-[1.6] text-steel">
                    {category.description}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Container>
          </section>
        ))}
      </main>
      <Footer settings={settings} products={footerProducts} />
      <WhatsAppFloat number={settings.contact.whatsAppNumber} />
      <RevealInit />
    </>
  )
}
