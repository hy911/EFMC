import { getTranslations } from 'next-intl/server'

import { Container } from '@/components/ui/Container'

/**
 * Why Donglin 信任区（设计稿 1:1）：左侧授权说明 + ABB / Schneider 品牌章，
 * 右侧 2×2 数据网格。
 */
export async function Trust() {
  const t = await getTranslations('trust')

  const stats = ['founded', 'engineers', 'divisions', 'partnerships'] as const

  return (
    <section id="about" className="bg-white">
      <Container className="grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-[72px] lg:py-[104px]">
        <div data-reveal>
          <div className="mb-3.5 text-[12.5px] font-semibold tracking-[2.2px] text-accent uppercase">
            {t('eyebrow')}
          </div>
          <h2 className="m-0 mb-5 font-display text-[28px] leading-[1.15] font-bold tracking-[-0.3px] text-navy sm:text-[38px]">
            {t('title')}
          </h2>
          <p className="m-0 mb-9 max-w-[480px] text-[16.5px] leading-[1.7] text-steel">
            {t('body')}
          </p>
          {/* 品牌章：授权品牌名 */}
          <div className="flex flex-wrap gap-5">
            <div className="border border-line px-7 py-5 font-display text-xl font-bold tracking-[1px] text-navy">
              ABB
            </div>
            <div className="border border-line px-7 py-5 font-display text-xl font-bold tracking-[0.5px] text-navy">
              Schneider Electric
            </div>
          </div>
        </div>

        {/* 2×2 数据网格 */}
        <div data-reveal className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
          {stats.map((key) => (
            <div key={key} className="bg-mist px-8 py-10">
              <div className="font-display text-[40px] leading-none font-bold text-navy">
                {t(`stats.${key}.value`)}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.4] text-steel">
                {t(`stats.${key}.label`)}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
