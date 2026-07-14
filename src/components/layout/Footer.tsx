import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import type { Product, SiteSetting } from '@/payload-types'

/**
 * 页脚（设计稿 1:1）：深蓝底 4 列 —— 品牌简介 / Company / Products / Contact，
 * 底栏版权 + 授权声明。产品列动态取精选产品前 4 个。
 */
export async function Footer({
  settings,
  products,
}: {
  settings: SiteSetting
  products: Product[]
}) {
  const t = await getTranslations()
  const year = new Date().getFullYear()

  const companyLinks = [
    { href: '/products', label: t('nav.products') },
    { href: '/cases', label: t('nav.cases') },
    { href: '/blog', label: t('nav.blog') },
    { href: '/about', label: t('nav.about') },
    { href: '/#contact', label: t('nav.contact') },
  ]

  return (
    <footer className="bg-navy-deep text-[14px] text-fog">
      <div className="mx-auto grid max-w-(--container-content) grid-cols-1 gap-12 px-6 pt-16 sm:px-8 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.4fr]">
        {/* 品牌 */}
        <div>
          <div className="mb-[18px] flex items-center gap-3.5 text-white">
            <span className="inline-flex bg-white px-3 py-[7px]">
              <Image
                src="/images/logo.png"
                alt={t('common.siteName')}
                width={59}
                height={22}
                className="block h-[22px] w-auto"
              />
            </span>
            <span className="font-display text-[15px] font-bold tracking-[0.3px]">
              {t('common.siteName')}
            </span>
          </div>
          <p className="m-0 max-w-[320px] leading-[1.7]">{t('footer.blurb')}</p>
        </div>

        {/* Company */}
        <div>
          <div className="mb-4 text-[13px] font-semibold tracking-[1.4px] text-white uppercase">
            {t('footer.company')}
          </div>
          <div className="flex flex-col gap-2.5">
            {companyLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-fog transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Products：动态取精选产品前 4 个 */}
        <div>
          <div className="mb-4 text-[13px] font-semibold tracking-[1.4px] text-white uppercase">
            {t('footer.products')}
          </div>
          <div className="flex flex-col gap-2.5">
            {products.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="text-fog transition-colors hover:text-white"
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact：来自站点设置 */}
        <div>
          <div className="mb-4 text-[13px] font-semibold tracking-[1.4px] text-white uppercase">
            {t('footer.contact')}
          </div>
          <div className="flex flex-col gap-2.5">
            <span>{settings.contact.email}</span>
            <span>{settings.contact.phone}</span>
            <span>{settings.contact.location}</span>
          </div>
        </div>
      </div>

      {/* 底栏 */}
      <div className="mx-auto mt-14 flex max-w-(--container-content) flex-wrap justify-between gap-6 border-t border-white/8 px-6 py-7 text-[13px] sm:px-8">
        <span>{t('footer.copyright', { year })}</span>
        <span>{t('footer.authorized')}</span>
      </div>
    </footer>
  )
}
