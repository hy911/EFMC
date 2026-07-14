import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import { LocaleSwitcher } from './LocaleSwitcher'
import { MobileMenu } from './MobileMenu'

/**
 * 顶部导航（设计稿 1:1）：
 * sticky + 白色磨砂背景 + 底部细线；左 logo + 双行字标，右导航 + CTA。
 * 链接一律 locale 感知（/#anchor 形式在非首页也能跳回首页对应区块）：
 * Products → 产品列表页；About → 固定页；Solutions/Contact → 首页锚点。
 */
export async function Navbar() {
  const t = await getTranslations()

  const items = [
    { href: '/products', label: t('nav.products') },
    { href: '/#solutions', label: t('nav.solutions') },
    { href: '/about', label: t('nav.about') },
    { href: '/#contact', label: t('nav.contact') },
  ]
  const cta = { href: '/#contact', label: t('common.getQuote') }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-(--container-content) items-center justify-between gap-8 px-6 sm:px-8">
        {/* Logo + 字标 */}
        <Link href="/" className="flex items-center gap-3.5 text-navy">
          <Image
            src="/images/logo.png"
            alt={t('common.siteName')}
            width={91}
            height={34}
            className="block h-[34px] w-auto"
            priority
          />
          <span className="flex flex-col border-l border-line pl-3.5 leading-[1.15]">
            <span className="font-display text-[15px] font-bold tracking-[0.2px]">
              {t('common.siteName')}
            </span>
            <span className="text-[10.5px] tracking-[1.6px] text-steel uppercase">
              {t('common.siteTagline')}
            </span>
          </span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden items-center gap-9 text-[15px] font-medium lg:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-nav transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={cta.href}
            className="bg-accent px-[22px] py-[11px] text-[14.5px] font-semibold tracking-[0.2px] whitespace-nowrap text-white transition-colors hover:bg-accent-strong"
          >
            {cta.label}
          </Link>
          <LocaleSwitcher />
        </nav>

        <MobileMenu items={items} cta={cta} />
      </div>
    </header>
  )
}
