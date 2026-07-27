import { Container } from '@/components/ui/Container'
import { FeatureColumns, type FeatureColumn } from '@/components/ui/FeatureColumns'
import { SectionHeader } from '@/components/ui/SectionHeader'
import type { SiteSetting } from '@/payload-types'

/**
 * 首页优势区 —— 区块结构固定在代码里，栏内文字由运营在
 * 站点设置 > 首页优势区 维护（专利数、案例数等会变动的数字归运营）。
 * 数据复用首页已取回的 settings，不额外发查询。
 */
export function CompanyAdvantage({ settings }: { settings: SiteSetting }) {
  const advantage = settings.homeAdvantage
  const columns = (advantage?.columns ?? []) as FeatureColumn[]

  // 后台未填则整区隐藏，避免出现空壳区块
  if (columns.length === 0) return null

  return (
    <section id="advantage" className="bg-white">
      <Container className="py-20 lg:py-[104px]">
        {advantage?.heading && (
          <SectionHeader
            eyebrow={advantage?.eyebrow ?? undefined}
            title={advantage.heading}
            className="mb-16 max-w-[640px]"
          />
        )}
        <FeatureColumns columns={columns} />
      </Container>
    </section>
  )
}
