import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import type { CaseStudy } from '@/payload-types'

/** CaseStudies.sections 的 block 联合类型（由 payload-types 自动生成） */
type CaseBlock = NonNullable<CaseStudy['sections']>[number]

/** 章节序号：01 · 客户的要求 */
const num = (i: number) => String(i + 1).padStart(2, '0')

/** 章节头（小标 + 大标题），各块共用 */
function SectionHead({
  index,
  kicker,
  heading,
  dark = false,
}: {
  index: number
  kicker: string
  heading: string
  dark?: boolean
}) {
  return (
    <>
      <div
        className={`text-[12px] font-bold tracking-[2.2px] uppercase ${dark ? 'text-sky' : 'text-accent'}`}
      >
        {num(index)} · {kicker}
      </div>
      <h2
        className={`mt-3.5 mb-0 max-w-[900px] font-display text-[30px] leading-[1.14] font-bold tracking-[-1px] sm:text-[42px] ${
          dark ? 'text-white' : 'text-navy'
        }`}
      >
        {heading}
      </h2>
    </>
  )
}

/**
 * 案例章节渲染器：后台拼什么，前端渲染什么。
 * 底色按序号交替（白 / 浅灰），收尾块固定深蓝 —— 与首页的节奏一致。
 */
export function RenderCaseSections({ blocks }: { blocks: CaseBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        // 深色收尾块不参与交替，避免它前面那块也变灰、连成一片
        const wash = block.blockType !== 'caseStatement' && i % 2 === 1

        switch (block.blockType) {
          /* 问题陈述：左标题 右引语+清单 */
          case 'caseSplit':
            return (
              <section key={block.id} className={wash ? 'bg-mist' : 'bg-white'}>
                <Container className="py-16 lg:py-24">
                  <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
                    <div>
                      <SectionHead index={i} kicker={block.kicker} heading={block.heading} />
                    </div>
                    <div>
                      {block.quote && (
                        <p className="m-0 border-l-4 border-accent pl-7 font-display text-[23px] leading-[1.4] font-bold text-navy sm:text-[26px]">
                          “{block.quote}”
                        </p>
                      )}
                      <div className={block.quote ? 'mt-9' : ''}>
                        {(block.points ?? []).map((point) => (
                          <div key={point.id} className="border-t border-line py-4">
                            <strong className="block text-[15.5px] font-semibold text-navy">
                              {point.label}
                            </strong>
                            <span className="mt-1 block text-[15px] leading-[1.65] text-steel">
                              {point.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Container>
              </section>
            )

          /* 整幅图版 */
          case 'caseFigure':
            return (
              <section key={block.id} className={wash ? 'bg-mist' : 'bg-white'}>
                <Container className="py-16 lg:py-24">
                  <SectionHead index={i} kicker={block.kicker} heading={block.heading} />
                  {block.intro && (
                    <p className="mt-6 mb-0 max-w-[760px] text-[16.5px] leading-[1.75] text-steel">
                      {block.intro}
                    </p>
                  )}
                  {/* 示意图按原始比例展示，不裁切 */}
                  <div className="mt-10 border border-line bg-white p-4 sm:p-6">
                    <MediaImage
                      media={block.image}
                      size="feature"
                      sizes="1180px"
                      className="h-auto w-full"
                    />
                  </div>
                  {block.banner && (
                    <div className="mt-8 bg-navy px-8 py-6 text-center font-display text-[17px] leading-[1.5] font-bold text-white sm:text-[20px]">
                      {block.banner}
                    </div>
                  )}
                </Container>
              </section>
            )

          /* 卡片网格：有图两栏（图在左），无图三栏 */
          case 'caseCards': {
            const cards = block.cards ?? []
            const withImages = cards.some((card) => card.image)
            return (
              <section key={block.id} className={wash ? 'bg-mist' : 'bg-white'}>
                <Container className="py-16 lg:py-24">
                  <SectionHead index={i} kicker={block.kicker} heading={block.heading} />
                  <div
                    className={`mt-12 grid grid-cols-1 gap-x-8 gap-y-10 ${
                      withImages ? 'lg:grid-cols-2' : 'sm:grid-cols-3'
                    }`}
                  >
                    {cards.map((card) => (
                      <article
                        key={card.id}
                        className={
                          withImages
                            ? 'grid grid-cols-1 gap-6 border-t border-line pt-7 sm:grid-cols-[190px_1fr]'
                            : 'border-t-4 border-accent pt-6'
                        }
                      >
                        {card.image && (
                          <div className="relative h-[210px] bg-mist sm:h-[155px]">
                            <MediaImage media={card.image} size="card" fill sizes="190px" />
                          </div>
                        )}
                        <div>
                          {card.tag && (
                            <div className="mb-2 text-[11.5px] font-bold tracking-[1.8px] text-accent uppercase">
                              {card.tag}
                            </div>
                          )}
                          <h3 className="m-0 font-display text-[20px] leading-[1.25] font-bold text-navy">
                            {card.title}
                          </h3>
                          <p className="mt-2.5 mb-0 text-[15px] leading-[1.65] text-steel">
                            {card.text}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </Container>
              </section>
            )
          }

          /* 步骤条 */
          case 'caseSteps':
            return (
              <section key={block.id} className={wash ? 'bg-mist' : 'bg-white'}>
                <Container className="py-16 lg:py-24">
                  <SectionHead index={i} kicker={block.kicker} heading={block.heading} />
                  <div className="mt-12 grid grid-cols-1 border-t-2 border-accent sm:grid-cols-2 lg:grid-cols-6">
                    {(block.steps ?? []).map((step, s) => (
                      <div
                        key={step.id}
                        className="border-b border-line px-0 py-6 sm:px-5 sm:not-last:border-r lg:border-b-0"
                      >
                        <b className="block text-[12px] font-bold tracking-[1.4px] text-accent">
                          {num(s)}
                        </b>
                        <strong className="mt-2 block text-[15.5px] leading-[1.3] font-semibold text-navy">
                          {step.title}
                        </strong>
                        <span className="mt-2 block text-[13.5px] leading-[1.55] text-steel">
                          {step.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </Container>
              </section>
            )

          /* 前后对比表 */
          case 'caseCompare':
            return (
              <section key={block.id} className={wash ? 'bg-mist' : 'bg-white'}>
                <Container className="py-16 lg:py-24">
                  <SectionHead index={i} kicker={block.kicker} heading={block.heading} />
                  {/* 窄屏横向滚动，页面本身不出现横向滚动条 */}
                  <div className="mt-11 overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr>
                          {[block.labelArea, block.labelBefore, block.labelAfter].map((label) => (
                            <th
                              key={label}
                              className="border-b border-line p-4 text-[12px] font-bold tracking-[1.2px] text-accent uppercase"
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(block.rows ?? []).map((row) => (
                          <tr key={row.id}>
                            <td className="w-[22%] border-b border-line p-4 align-top text-[15px] font-semibold text-navy">
                              {row.area}
                            </td>
                            <td className="w-[39%] border-b border-line p-4 align-top text-[15px] text-steel">
                              {row.before}
                            </td>
                            <td className="border-b border-line p-4 align-top text-[15px] font-semibold text-navy">
                              {row.after}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Container>
              </section>
            )

          /* 深蓝收尾 */
          case 'caseStatement':
            return (
              <section key={block.id} className="bg-navy text-white">
                <Container className="py-20 text-center lg:py-28">
                  <div className="mx-auto max-w-[980px]">
                    <SectionHead index={i} kicker={block.kicker} heading={block.heading} dark />
                    {block.body && (
                      <p className="mx-auto mt-6 mb-0 max-w-[740px] text-[17px] leading-[1.7] text-cloud">
                        {block.body}
                      </p>
                    )}
                    <div className="mx-auto mt-12 max-w-[980px] border-t border-white/22 pt-10 font-display text-[24px] leading-[1.3] font-bold sm:text-[34px]">
                      {block.statement}
                    </div>
                  </div>
                </Container>
              </section>
            )

          default:
            return null
        }
      })}
    </>
  )
}
