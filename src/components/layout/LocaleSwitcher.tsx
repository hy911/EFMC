'use client'

import { useLocale } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  zh: '中文',
}

/** 语言切换器：保持当前路径，仅替换 /en /zh 前缀 */
export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 text-[13px] font-medium">
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span className="text-line">|</span>}
          {l === locale ? (
            <span className="text-navy">{LOCALE_LABELS[l]}</span>
          ) : (
            <Link href={pathname} locale={l} className="text-steel transition-colors hover:text-accent">
              {LOCALE_LABELS[l]}
            </Link>
          )}
        </span>
      ))}
    </div>
  )
}
