import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string }>
}

/**
 * 首页 —— M1 阶段的占位实现，用于验证双语路由与 Tailwind 管线。
 * M3 会替换为按设计稿 1:1 还原的完整首页。
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('hero')

  return (
    <main className="mx-auto flex min-h-screen max-w-(--container-content) items-center px-8">
      <div>
        <p className="text-sm tracking-[2.2px] text-accent uppercase">{t('eyebrow')}</p>
        <h1 className="mt-4 font-display text-5xl font-bold text-navy">{t('title')}</h1>
      </div>
    </main>
  )
}
