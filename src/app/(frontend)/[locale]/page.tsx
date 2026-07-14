import type { Metadata } from 'next'

import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Capabilities } from '@/components/home/Capabilities'
import { ContactCTA } from '@/components/home/ContactCTA'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { Hero } from '@/components/home/Hero'
import { Industries } from '@/components/home/Industries'
import { Trust } from '@/components/home/Trust'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { RevealInit } from '@/components/ui/RevealInit'
import { routing, type Locale } from '@/i18n/routing'
import { getFeaturedProducts, getIndustries, getSiteSettings } from '@/lib/queries'

type Props = {
  params: Promise<{ locale: string }>
}

// ISR：运营改内容后最长 10 分钟自动生效；M5 的 revalidate hook 会做到发布即更新
export const revalidate = 600

/** 首页多语言 metadata（完整 hreflang 在 M5 统一补全） */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta.home' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

/**
 * 首页 —— 按 Claude Design 设计稿 1:1 还原。
 * 区块结构在代码里固定；产品 / 行业 / 联系方式等数据由 Payload 驱动。
 */
export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params
  const locale: Locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  setRequestLocale(locale)

  // 三个查询无依赖，并行取数
  const [settings, products, industries] = await Promise.all([
    getSiteSettings(locale),
    getFeaturedProducts(locale),
    getIndustries(locale),
  ])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Capabilities />
        <FeaturedProducts products={products} />
        <Trust />
        <Industries industries={industries} />
        <ContactCTA settings={settings} />
      </main>
      <Footer settings={settings} products={products} />
      <WhatsAppFloat number={settings.contact.whatsAppNumber} />
      <RevealInit />
    </>
  )
}
