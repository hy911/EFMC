import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import type { CaseStudy } from '@/payload-types'

type Props = {
  cs: Pick<
    CaseStudy,
    'title' | 'titleAccent' | 'excerpt' | 'coverImage' | 'highlights' | 'metrics'
  >
  /** 行业名（已按语种取好）；页面从 relationship 取，预览工具直接传字符串 */
  industryName?: string | null
  /** 页头下方那排「行业 / 地点 / 交付时间」，标签文案由调用方按语种给 */
  facts: Array<{ label: string; value: string }>
}

/**
 * 案例页头：封面铺满 + 标题区 + 能力标签 + 事实行，下接成果指标条。
 *
 * 从案例详情页里抽出来，为的是**客户端结构预览能渲染同一份组件**
 * （scripts/build-case-preview.mjs 把它和 caseRenderers 一起打包）。
 * 抽的时候刻意不带数据获取和 next-intl：所有文案由调用方按语种传进来，
 * 这样脱离 Next 运行时也能渲染。改这里等于同时改线上和客户预览，不会漂。
 */
export function CaseHero({ cs, industryName, facts }: Props) {
  return (
    <>
      {/* 页头：封面铺满，左侧深色渐变压出文字可读性 */}
      <section className="relative flex min-h-[620px] items-end overflow-hidden bg-navy text-white lg:min-h-[700px]">
        {/* 用原图而非 feature（1280px 铺满宽屏会糊）；封面本身是唯一的 LCP 元素 */}
        <div className="absolute inset-0">
          <MediaImage
            media={cs.coverImage}
            fill
            sizes="100vw"
            priority
            className="object-cover object-[60%_center]"
          />
        </div>
        {/* 渐变自左向右变淡，保证标题区对比度、右侧仍看得见照片 */}
        <div className="absolute inset-0 bg-linear-to-r from-navy/95 via-navy/[0.82] to-navy/10" />
        <Container className="relative pt-[150px] pb-[70px] lg:pb-[100px]">
          {industryName && (
            <div className="text-[12px] font-bold tracking-[0.18em] text-sky uppercase">
              {industryName}
            </div>
          )}
          {/* 设计稿 clamp(48px, 7vw, 82px)；填了第二行就分两色排 */}
          <h1 className="mt-5 mb-0 max-w-[900px] font-display text-[47px] leading-[1.02] font-bold tracking-[-0.045em] sm:text-[64px] lg:text-[82px]">
            {cs.title}
            {cs.titleAccent && <span className="block font-normal text-sky">{cs.titleAccent}</span>}
          </h1>
          <div className="my-[34px] h-1 w-[74px] bg-accent" />
          <p className="m-0 max-w-[680px] text-[18px] leading-[1.55] text-cloud sm:text-[21px]">
            {cs.excerpt}
          </p>
          {(cs.highlights?.length ?? 0) > 0 && (
            <div className="mt-8 flex flex-wrap gap-2.5">
              {cs.highlights!.map((h) => (
                <span
                  key={h.id}
                  className="border border-white/25 px-3.5 py-2 text-[13px] text-cloud"
                >
                  {h.label}
                </span>
              ))}
            </div>
          )}
          {facts.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-x-9 gap-y-3 text-[13px] tracking-[0.08em] uppercase">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <span className="mr-2.5 font-semibold text-sky">{fact.label}</span>
                  <span className="text-cloud">{fact.value}</span>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* 成果指标 */}
      {(cs.metrics?.length ?? 0) > 0 && (
        <Container className="pt-10">
          <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
            {cs.metrics!.map((metric) => (
              <div key={metric.id} className="bg-mist px-8 py-8">
                <div className="font-display text-[34px] leading-none font-bold text-navy">
                  {metric.value}
                </div>
                <div className="mt-2 text-[13.5px] leading-[1.4] text-steel">{metric.label}</div>
              </div>
            ))}
          </div>
        </Container>
      )}
    </>
  )
}
