import { getTranslations } from 'next-intl/server'

import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'

/**
 * 四大工程能力（设计稿 1:1）：1px 分隔线网格，编号方块 + 标题 + 描述，
 * hover 换浅灰蓝底。文案属 UI 层固定内容，存 next-intl JSON。
 */
export async function Capabilities() {
  const t = await getTranslations('capabilities')

  const items = [
    { key: 'software', num: '01' },
    { key: 'electrical', num: '02' },
    { key: 'automation', num: '03' },
    { key: 'network', num: '04' },
  ] as const

  return (
    <section id="solutions" className="bg-white">
      <Container className="py-20 lg:py-[104px]">
        <SectionHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          className="mb-16 max-w-[640px]"
        />
        <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ key, num }) => (
            <div
              key={key}
              data-reveal
              className="bg-white px-7 pt-9 pb-10 transition-colors hover:bg-mist"
            >
              <div className="mb-[26px] grid h-11 w-11 place-items-center bg-navy font-display text-[15px] font-bold text-white">
                {num}
              </div>
              <h3 className="m-0 mb-2.5 font-display text-[19px] font-semibold text-navy">
                {t(`items.${key}.title`)}
              </h3>
              <p className="m-0 text-[14.5px] leading-[1.6] text-steel">{t(`items.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
