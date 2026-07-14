import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

/**
 * Hero 区（设计稿 1:1）：深蓝底，左侧 eyebrow + 大标题 + 双 CTA + 数据条，
 * 右侧大图 + 左下角强调色角标。
 */
export async function Hero() {
  const t = await getTranslations('hero')

  const stats = ['established', 'engineers', 'industries'] as const

  return (
    <section id="top" className="bg-navy text-white">
      <div className="mx-auto grid max-w-(--container-content) grid-cols-1 items-center gap-16 px-6 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-[104px]">
        <div>
          {/* eyebrow：短横线 + 授权声明 */}
          <div className="mb-7 inline-flex items-center gap-2.5 text-[12.5px] tracking-[2.2px] text-sky uppercase">
            <span className="h-0.5 w-7 bg-accent" aria-hidden="true" />
            {t('eyebrow')}
          </div>

          <h1 className="m-0 mb-[22px] font-display text-4xl leading-[1.1] font-bold tracking-[-0.5px] sm:text-[54px]">
            {t('title')}
          </h1>
          <p className="m-0 mb-10 max-w-[520px] text-lg leading-[1.65] text-cloud">
            {t('subtitle')}
          </p>

          {/* 双 CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="bg-accent px-[30px] py-[15px] text-[15.5px] font-semibold text-white transition-colors hover:bg-accent-soft"
            >
              {t('ctaPrimary')}
            </a>
            <a
              href="#products"
              className="border border-white/28 px-[22px] py-[15px] text-[15.5px] font-semibold text-white transition-colors hover:border-white"
            >
              {t('ctaSecondary')}
            </a>
          </div>

          {/* 数据条 */}
          <div className="mt-14 flex gap-8 border-t border-white/14 pt-8 sm:gap-12">
            {stats.map((key) => (
              <div key={key}>
                <div className="font-display text-[28px] font-bold">{t(`stats.${key}.value`)}</div>
                <div className="text-[13px] tracking-[0.5px] text-fog">{t(`stats.${key}.label`)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧大图 + 角标 */}
        <div className="relative h-[320px] min-w-0 sm:h-[420px] lg:h-[520px]">
          <Image
            src="/images/hero-placeholder.png"
            alt={t('imageBadge')}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 560px"
            priority
          />
          <div className="pointer-events-none absolute bottom-[-1px] left-[-1px] bg-accent px-5 py-3.5 text-[13px] font-semibold tracking-[1px] text-white uppercase">
            {t('imageBadge')}
          </div>
        </div>
      </div>
    </section>
  )
}
