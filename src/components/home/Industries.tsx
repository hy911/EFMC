import { getTranslations } from 'next-intl/server'

import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { SectionHeader } from '@/components/ui/SectionHeader'
import type { ApplicationScenario } from '@/payload-types'

/**
 * 应用行业（设计稿 1:1）：中间蓝底，5 列图卡（图 + 名称 + 关键词标签），
 * hover 上浮。数据来自 ApplicationScenarios（按 displayOrder 前 5 个）。
 */
export async function Industries({ industries }: { industries: ApplicationScenario[] }) {
  const t = await getTranslations('industries')

  return (
    <section className="bg-navy-mid text-white">
      <Container className="py-20 lg:py-[104px]">
        <SectionHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          dark
          className="mb-14 max-w-[620px]"
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {industries.map((industry) => (
            <a
              key={industry.id}
              href="#contact"
              data-reveal
              className="block bg-navy text-white transition-transform duration-250 hover:-translate-y-1"
            >
              <div className="relative h-40 min-w-0">
                <MediaImage
                  media={industry.image}
                  size="card"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 230px"
                />
              </div>
              <div className="px-[18px] pt-[18px] pb-[22px]">
                <div className="font-display text-[15.5px] leading-[1.3] font-semibold">
                  {industry.name}
                </div>
                {industry.tagline && (
                  <div className="mt-1.5 text-[12.5px] text-fog">{industry.tagline}</div>
                )}
              </div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  )
}
