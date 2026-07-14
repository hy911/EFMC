import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

// 自托管字体（设计稿：Archivo 标题 500/600/700 + IBM Plex Sans 正文 400/500/600）。
// 用 @fontsource 而非 next/font/google，保证 VPS/Docker 离线构建不依赖 Google 网络
import '@fontsource/archivo/500.css'
import '@fontsource/archivo/600.css'
import '@fontsource/archivo/700.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'

import { routing } from '@/i18n/routing'

import '../globals.css'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

/** 为 en / zh 预生成静态路由（SSG 的前提） */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  // 页面级 metadata（含多语言 title/description/hreflang）由各 page 的
  // generateMetadata 提供，这里只放全站兜底
  title: 'Donglin Controls',
}

export default async function LocaleLayout({ children, params }: Props) {
  // Next.js 16：params 必须 await
  const { locale } = await params
  // 未知语种直接 404（正常流量会被 proxy 重定向，到这里的是手输的非法前缀）
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  // 声明静态渲染的语种，启用 SSG
  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body>
        {/* UI 文案 Provider：客户端组件（表单等）通过 useTranslations 取文案 */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
