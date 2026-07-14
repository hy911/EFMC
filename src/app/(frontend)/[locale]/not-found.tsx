import { getTranslations } from 'next-intl/server'

import { Navbar } from '@/components/layout/Navbar'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'

/** 本地化 404 页（[locale] 段内所有 notFound() 都落到这里） */
export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <>
      <Navbar />
      <main className="bg-navy text-white">
        <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
          <div className="mb-4 font-display text-[72px] leading-none font-bold text-sky">404</div>
          <h1 className="m-0 mb-3 font-display text-[32px] font-bold tracking-[-0.3px]">
            {t('title')}
          </h1>
          <p className="m-0 mb-9 max-w-[460px] text-[16.5px] leading-[1.7] text-cloud">
            {t('body')}
          </p>
          <Link
            href="/"
            className="bg-accent px-[30px] py-[15px] text-[15.5px] font-semibold text-white transition-colors hover:bg-accent-soft"
          >
            {t('backHome')}
          </Link>
        </Container>
      </main>
    </>
  )
}
