import type { Locale } from '@/i18n/routing'

/** 语言 → BCP 47 区域映射（日期等本地化格式用） */
const INTL_LOCALES: Record<Locale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
}

/** 按语言格式化日期（默认 2026年7月 / July 2026 这类"年月"粒度） */
export function formatDate(
  locale: Locale,
  iso: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' },
): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], options).format(new Date(iso))
}
